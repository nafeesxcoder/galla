// ===========================================================================
// /api/expenses - what the business spends
// ---------------------------------------------------------------------------
// Rent, electricity, transport, salaries, repairs, tea for the shop. Anything
// that costs money and does not bring stock in.
//
// Deliberately NOT a purchase. A purchase increases stock and what you owe a
// supplier; an expense does neither. Mixing the two makes the stock count
// wrong and the profit figure wrong at the same time, and the second one is
// worse because nobody notices it.
//
// An expense also does not touch a party's balance. Paying the landlord is
// not the same as settling a supplier's account, and recording it as one
// would quietly corrupt the ledger. If the money went to somebody on the
// books, party_id records who - for the report, not for the balance.
// ===========================================================================

const express = require("express");
const { z } = require("zod");

const db = require("../../db");
const validate = require("../../middleware/validate");
const { requireAuth, requireBusiness } = require("../../middleware/auth");
const asyncHandler = require("../../utils/asyncHandler");
const ApiError = require("../../utils/ApiError");
const { patchShape } = require("../../utils/patchSchema");
const { toPaise, toRupees, percentOf } = require("../../utils/money");

const router = express.Router();
router.use(requireAuth, requireBusiness("staff"));

const MODES = ["cash", "upi", "card", "bank", "cheque", "other"];

// The field types, with no defaults on them. Defaults belong on create only:
// put one here and a PATCH that leaves the field out would be handed the
// default instead of undefined, and quietly overwrite what was stored. That
// is exactly how editing an expense's amount used to wipe its tax rate.
const base = {
  category: z.string().trim().min(1).max(80),
  expenseDate: z.iso.date(),
  amount: z.number().min(0, "Amount cannot be negative"),
  // GST on an expense matters: a registered business can claim it back, so
  // it is kept apart from the amount rather than rolled into it.
  taxRate: z.number().min(0).max(100),
  mode: z.enum(MODES),
  partyId: z.number().int().positive(),
  reference: z.string().trim().max(120),
  notes: z.string().trim().max(2000),
  receiptUrl: z.string().trim().max(255),
};

const createBody = z.object({
  category: base.category,
  expenseDate: base.expenseDate.optional(),
  amount: base.amount,
  taxRate: base.taxRate.default(0),
  mode: base.mode.default("cash"),
  partyId: base.partyId.optional(),
  reference: base.reference.optional(),
  notes: base.notes.optional(),
  receiptUrl: base.receiptUrl.optional(),
});

// Every field optional, and genuinely optional - a missing one stays missing.
const patchBody = z.object(
  patchShape(base)
);

function toPublic(r) {
  return {
    id: r.id,
    partyId: r.party_id,
    partyName: r.party_name ?? null,
    category: r.category,
    expenseDate: r.expense_date,
    amount: toRupees(r.amount_paise),
    taxRate: Number(r.tax_rate),
    tax: toRupees(r.tax_paise),
    total: toRupees(r.total_paise),
    mode: r.mode,
    reference: r.reference,
    notes: r.notes,
    receiptUrl: r.receipt_url,
    createdAt: r.created_at,
  };
}

// The amount, the tax on it, and the two added together. Worked out once and
// stored, rather than computed on the way out, so a report never has to
// repeat the arithmetic and get a different answer.
//
// Both arguments are always passed explicitly. An earlier version defaulted a
// missing rate to zero, which meant editing only the amount of an expense
// silently threw its tax away - the kind of bug that is invisible until the
// quarter's input credit is short.
function amounts(amountRupees, taxRate) {
  const amountPaise = toPaise(amountRupees, "amount");
  const rate = Number(taxRate) || 0;
  const taxPaise = percentOf(amountPaise, rate);
  return {
    amount_paise: amountPaise,
    tax_rate: rate,
    tax_paise: taxPaise,
    total_paise: amountPaise + taxPaise,
  };
}

function toRow(b) {
  const row = {};
  if (b.category !== undefined) row.category = b.category;
  if (b.expenseDate !== undefined) row.expense_date = b.expenseDate;
  if (b.mode !== undefined) row.mode = b.mode;
  if (b.partyId !== undefined) row.party_id = b.partyId ?? null;
  if (b.reference !== undefined) row.reference = b.reference || null;
  if (b.notes !== undefined) row.notes = b.notes || null;
  if (b.receiptUrl !== undefined) row.receipt_url = b.receiptUrl || null;
  return row;
}

// Joined so the list can show who it was paid to without a second request
// per row.
function withParty(query) {
  return query
    .leftJoin("parties as p", "p.id", "expenses.party_id")
    .select("expenses.*", "p.name as party_name");
}

// ---- list ---------------------------------------------------------------
router.get(
  "/",
  validate({
    query: z.object({
      search: z.string().trim().max(100).optional(),
      category: z.string().trim().max(80).optional(),
      mode: z.enum(MODES).optional(),
      partyId: z.coerce.number().int().positive().optional(),
      from: z.iso.date().optional(),
      to: z.iso.date().optional(),
      limit: z.coerce.number().int().min(1).max(200).default(50),
      offset: z.coerce.number().int().min(0).default(0),
    }),
  }),
  asyncHandler(async (req, res) => {
    const q = req.validatedQuery;

    const base = db("expenses")
      .where({ "expenses.business_id": req.business.id })
      .whereNull("expenses.deleted_at");

    if (q.category) base.where({ "expenses.category": q.category });
    if (q.mode) base.where({ "expenses.mode": q.mode });
    if (q.partyId) base.where({ "expenses.party_id": q.partyId });
    if (q.from) base.where("expenses.expense_date", ">=", q.from);
    if (q.to) base.where("expenses.expense_date", "<=", q.to);
    if (q.search) {
      base.where((b) =>
        b
          .where("expenses.category", "like", `%${q.search}%`)
          .orWhere("expenses.notes", "like", `%${q.search}%`)
          .orWhere("expenses.reference", "like", `%${q.search}%`)
      );
    }

    const [{ total }] = await base.clone().clearSelect().clearOrder().count({ total: "*" });
    const [sums] = await base
      .clone()
      .clearSelect()
      .clearOrder()
      .sum({ totalPaise: "expenses.total_paise", taxPaise: "expenses.tax_paise" });

    const rows = await withParty(base.clone())
      .orderBy([
        { column: "expenses.expense_date", order: "desc" },
        { column: "expenses.id", order: "desc" },
      ])
      .limit(q.limit)
      .offset(q.offset);

    res.json({
      ok: true,
      data: rows.map(toPublic),
      meta: {
        total: Number(total),
        limit: q.limit,
        offset: q.offset,
        sumTotal: toRupees(sums.totalPaise ?? 0),
        sumTax: toRupees(sums.taxPaise ?? 0),
      },
    });
  })
);

// ---- what the shop spends on, grouped ------------------------------------
// The question this answers is "where is the money going", which is the only
// reason to record expenses at all.
router.get(
  "/reports/by-category",
  validate({
    query: z.object({
      from: z.iso.date().optional(),
      to: z.iso.date().optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const q = req.validatedQuery;
    const today = new Date().toISOString().slice(0, 10);
    const from = q.from ?? `${today.slice(0, 7)}-01`;
    const to = q.to ?? today;

    const rows = await db("expenses")
      .where({ business_id: req.business.id })
      .whereNull("deleted_at")
      .whereBetween("expense_date", [from, to])
      .groupBy("category")
      .select("category")
      .count({ count: "*" })
      .sum({ total: "total_paise", tax: "tax_paise" })
      .orderBy("total", "desc");

    let grand = 0;
    const categories = rows.map((r) => {
      grand += Number(r.total ?? 0);
      return {
        category: r.category,
        count: Number(r.count),
        total: toRupees(r.total ?? 0),
        tax: toRupees(r.tax ?? 0),
      };
    });

    res.json({ ok: true, data: { from, to, categories, total: toRupees(grand) } });
  })
);

// ---- create -------------------------------------------------------------
router.post(
  "/",
  validate({ body: createBody }),
  asyncHandler(async (req, res) => {
    if (req.body.partyId) {
      const party = await db("parties")
        .where({ id: req.body.partyId, business_id: req.business.id })
        .whereNull("deleted_at")
        .first();
      if (!party) throw ApiError.badRequest("No such customer or supplier.");
    }

    const row = toRow(req.body);
    Object.assign(row, amounts(req.body.amount, req.body.taxRate));
    row.business_id = req.business.id;
    row.expense_date = req.body.expenseDate ?? new Date().toISOString().slice(0, 10);
    row.created_by = req.user.id;

    const [id] = await db("expenses").insert(row);
    const created = await withParty(db("expenses").where({ "expenses.id": id })).first();

    res.status(201).json({ ok: true, data: toPublic(created) });
  })
);

// ---- read one -----------------------------------------------------------
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const row = await withParty(
      db("expenses").where({ "expenses.id": req.params.id, "expenses.business_id": req.business.id })
    )
      .whereNull("expenses.deleted_at")
      .first();

    if (!row) throw ApiError.notFound("No such expense.");
    res.json({ ok: true, data: toPublic(row) });
  })
);

// ---- update -------------------------------------------------------------
router.patch(
  "/:id",
  validate({ body: patchBody }),
  asyncHandler(async (req, res) => {
    const existing = await db("expenses")
      .where({ id: req.params.id, business_id: req.business.id })
      .whereNull("deleted_at")
      .first();

    if (!existing) throw ApiError.notFound("No such expense.");

    const patch = toRow(req.body);

    // Either one moving has to move the tax and the total with it, and
    // whichever was not sent comes from the row as it stands. Recomputing
    // from a half-filled body is how the rate got wiped before.
    if (req.body.amount !== undefined || req.body.taxRate !== undefined) {
      Object.assign(
        patch,
        amounts(
          req.body.amount !== undefined ? req.body.amount : toRupees(existing.amount_paise),
          req.body.taxRate !== undefined ? req.body.taxRate : Number(existing.tax_rate)
        )
      );
    }

    if (Object.keys(patch).length) {
      patch.updated_at = db.fn.now();
      await db("expenses").where({ id: existing.id }).update(patch);
    }

    const row = await withParty(db("expenses").where({ "expenses.id": existing.id })).first();
    res.json({ ok: true, data: toPublic(row) });
  })
);

// ---- delete -------------------------------------------------------------
router.delete(
  "/:id",
  requireBusiness("manager"),
  asyncHandler(async (req, res) => {
    const existing = await db("expenses")
      .where({ id: req.params.id, business_id: req.business.id })
      .whereNull("deleted_at")
      .first();

    if (!existing) throw ApiError.notFound("No such expense.");

    // Soft delete, like everything else here. A month's spending that
    // quietly changes after the fact is not something an accountant can work
    // with, so the row stays and is simply excluded.
    await db("expenses").where({ id: existing.id }).update({ deleted_at: db.fn.now() });
    res.json({ ok: true, data: { id: existing.id, deleted: true } });
  })
);

module.exports = router;
