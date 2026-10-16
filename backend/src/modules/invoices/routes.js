// ===========================================================================
// /api/invoices
// ===========================================================================

const express = require("express");
const { z } = require("zod");

const db = require("../../db");
const service = require("./service");
const validate = require("../../middleware/validate");
const { requireAuth, requireBusiness } = require("../../middleware/auth");
const { requireActivePlan } = require("../../middleware/plan");
const asyncHandler = require("../../utils/asyncHandler");
const ApiError = require("../../utils/ApiError");
const { toRupees } = require("../../utils/money");

const router = express.Router();
router.use(requireAuth, requireBusiness("staff"));

const line = z
  .object({
    itemId: z.number().int().positive().optional(),
    // For a one-off line that is not a saved item.
    name: z.string().trim().min(1).max(190).optional(),
    hsnSac: z.string().trim().max(10).optional(),
    unit: z.string().trim().max(20).optional(),
    quantity: z.number().positive("Quantity must be more than zero"),
    rate: z.number().min(0).optional(),
    taxRate: z.number().min(0).max(100).optional(),
    priceIncludesTax: z.boolean().optional(),
    discountPercent: z.number().min(0).max(100).optional(),
    discountAmount: z.number().min(0).optional(),
    batchId: z.number().int().positive().optional(),
  })
  .refine((l) => l.itemId || l.name, {
    message: "A line needs either an itemId or a name",
  })
  .refine((l) => !(l.discountPercent && l.discountAmount), {
    message: "Give a discount as a percentage or an amount, not both",
  });

const createBody = z.object({
  docType: z.enum(["sale", "purchase", "estimate", "challan", "credit_note", "debit_note"]),
  issueDate: z.iso.date().optional(),
  dueDate: z.iso.date().optional(),
  partyId: z.number().int().positive().optional(),
  // For a walk-in whose name was taken but who is not a saved customer.
  partyName: z.string().trim().max(160).optional(),
  placeOfSupply: z.string().trim().length(2).optional(),
  lines: z.array(line).min(1, "Add at least one item"),
  notes: z.string().trim().max(2000).optional(),
  terms: z.string().trim().max(2000).optional(),
  // No default on purpose. A default here would mean the service never sees
  // undefined, so "what does this shop prefer?" could never be asked - the
  // Settings toggle would save happily and change nothing. Left out, the
  // service falls back to the shop's own setting.
  roundOff: z.boolean().optional(),
  convertedFromId: z.number().int().positive().optional(),
});

// ---- create -------------------------------------------------------------
// The one place a plan actually bites. Only creation - editing, cancelling,
// printing and reading all carry on after a plan ends, because that data is
// theirs.
router.post(
  "/",
  requireActivePlan,
  validate({ body: createBody }),
  asyncHandler(async (req, res) => {
    const invoice = await service.create({
      business: req.business,
      user: req.user,
      input: req.body,
    });
    res.status(201).json({ ok: true, data: invoice });
  })
);

// ---- list ---------------------------------------------------------------
router.get(
  "/",
  validate({
    query: z.object({
      docType: z.enum(["sale", "purchase", "estimate", "challan", "credit_note", "debit_note"]).optional(),
      status: z.enum(["draft", "issued", "partial", "paid", "cancelled"]).optional(),
      partyId: z.coerce.number().int().positive().optional(),
      from: z.iso.date().optional(),
      to: z.iso.date().optional(),
      // The receivables screen: unpaid, oldest first.
      unpaidOnly: z.coerce.boolean().optional(),
      search: z.string().trim().max(100).optional(),
      limit: z.coerce.number().int().min(1).max(200).default(50),
      offset: z.coerce.number().int().min(0).default(0),
    }),
  }),
  asyncHandler(async (req, res) => {
    const q = req.validatedQuery;

    const base = db("invoices").where({ business_id: req.business.id });

    if (q.docType) base.where({ doc_type: q.docType });
    if (q.status) base.where({ status: q.status });
    if (q.partyId) base.where({ party_id: q.partyId });
    if (q.from) base.where("issue_date", ">=", q.from);
    if (q.to) base.where("issue_date", "<=", q.to);
    if (q.unpaidOnly) base.where("balance_paise", ">", 0).whereNull("cancelled_at");
    if (q.search) {
      base.where((b) =>
        b.where("number", "like", `%${q.search}%`).orWhere("party_name", "like", `%${q.search}%`)
      );
    }

    const [{ total }] = await base.clone().clearSelect().clearOrder().count({ total: "*" });

    // Sum the money too - a list of invoices without a total is half an
    // answer, and the screen always shows one.
    const [sums] = await base
      .clone()
      .clearSelect()
      .clearOrder()
      .sum({ totalPaise: "total_paise", balancePaise: "balance_paise" });

    const rows = await base
      .clone()
      .orderBy([{ column: "issue_date", order: "desc" }, { column: "id", order: "desc" }])
      .limit(q.limit)
      .offset(q.offset);

    res.json({
      ok: true,
      data: rows.map((r) => service.toPublic(r)),
      meta: {
        total: Number(total),
        limit: q.limit,
        offset: q.offset,
        sumTotal: toRupees(sums.totalPaise ?? 0),
        sumOutstanding: toRupees(sums.balancePaise ?? 0),
      },
    });
  })
);

// ---- read one -----------------------------------------------------------
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const invoice = await service.get(null, {
      businessId: req.business.id,
      id: req.params.id,
    });
    res.json({ ok: true, data: invoice });
  })
);

// ---- cancel -------------------------------------------------------------
router.post(
  "/:id/cancel",
  requireBusiness("manager"),
  validate({ body: z.object({ reason: z.string().trim().max(255).optional() }) }),
  asyncHandler(async (req, res) => {
    const invoice = await service.cancel({
      business: req.business,
      user: req.user,
      id: req.params.id,
      reason: req.body.reason,
    });
    res.json({ ok: true, data: invoice });
  })
);

// ---- the day's takings ---------------------------------------------------
router.get(
  "/reports/summary",
  validate({
    query: z.object({
      from: z.iso.date().optional(),
      to: z.iso.date().optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const q = req.validatedQuery;
    const today = new Date().toISOString().slice(0, 10);
    const from = q.from ?? today;
    const to = q.to ?? today;

    const rows = await db("invoices")
      .where({ business_id: req.business.id })
      .whereNull("cancelled_at")
      .whereBetween("issue_date", [from, to])
      .groupBy("doc_type")
      .select("doc_type")
      .count({ count: "*" })
      .sum({ total: "total_paise", balance: "balance_paise", tax: "cgst_paise" });

    const byType = {};
    for (const r of rows) {
      byType[r.doc_type] = {
        count: Number(r.count),
        total: toRupees(r.total ?? 0),
        outstanding: toRupees(r.balance ?? 0),
      };
    }

    res.json({ ok: true, data: { from, to, byType } });
  })
);


// ---- GST, rate by rate ---------------------------------------------------
// What a return actually needs: for each GST rate, the taxable value and the
// tax under it, with sales returns subtracted rather than listed separately -
// which is how the figure is filed.
//
// Cancelled bills are left out entirely. A cancelled bill is not a zero line
// on the return, it is not on the return.
router.get(
  "/reports/gst",
  validate({
    query: z.object({
      from: z.iso.date(),
      to: z.iso.date(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const { from, to } = req.validatedQuery;

    // A sales return moves the other way, so its lines are subtracted. Doing
    // it in SQL keeps the arithmetic in one place: a bill that is half
    // returned nets off correctly without the caller having to know the rule.
    const sign = db.raw("CASE WHEN i.doc_type = 'credit_note' THEN -1 ELSE 1 END");

    const rows = await db({ l: "invoice_lines" })
      .join({ i: "invoices" }, "i.id", "l.invoice_id")
      .where("i.business_id", req.business.id)
      .whereNull("i.cancelled_at")
      .whereIn("i.doc_type", ["sale", "credit_note"])
      .whereBetween("i.issue_date", [from, to])
      .groupBy("l.tax_rate")
      .orderBy("l.tax_rate", "asc")
      .select("l.tax_rate")
      .sum({ taxable: db.raw("l.taxable_paise * (?)", [sign]) })
      .sum({ cgst: db.raw("l.cgst_paise * (?)", [sign]) })
      .sum({ sgst: db.raw("l.sgst_paise * (?)", [sign]) })
      .sum({ igst: db.raw("l.igst_paise * (?)", [sign]) })
      .count({ lines: "l.id" });

    // B2B is filed bill by bill, B2C as one summary line, so the split is
    // worth having here rather than worked out again by every caller.
    const split = await db({ i: "invoices" })
      .where("i.business_id", req.business.id)
      .whereNull("i.cancelled_at")
      .whereIn("i.doc_type", ["sale", "credit_note"])
      .whereBetween("i.issue_date", [from, to])
      .select(db.raw("CASE WHEN i.party_gstin IS NULL OR i.party_gstin = '' THEN 'b2c' ELSE 'b2b' END AS kind"))
      .groupBy("kind")
      .count({ count: "*" })
      // The same sign as above. A sales return has to come off the B2B
      // figure, not be added to it - otherwise returning something makes a
      // customer look like they bought twice as much.
      .sum({ taxable: db.raw("i.taxable_paise * (?)", [sign]) })
      .sum({ total: db.raw("i.total_paise * (?)", [sign]) });

    const p = (v) => toRupees(Number(v || 0));

    res.json({
      ok: true,
      data: {
        from,
        to,
        byRate: rows.map((r) => ({
          taxRate: Number(r.tax_rate),
          lines: Number(r.lines),
          taxable: p(r.taxable),
          cgst: p(r.cgst),
          sgst: p(r.sgst),
          igst: p(r.igst),
          tax: p(Number(r.cgst || 0) + Number(r.sgst || 0) + Number(r.igst || 0)),
        })),
        split: Object.fromEntries(
          split.map((s) => [
            s.kind,
            { count: Number(s.count), taxable: p(s.taxable), total: p(s.total) },
          ])
        ),
      },
    });
  })
);

module.exports = router;
