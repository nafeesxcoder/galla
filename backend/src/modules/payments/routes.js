// ===========================================================================
// /api/payments - money in and money out
// ---------------------------------------------------------------------------
// A payment is not tied to one invoice. A customer who owes for four bills
// hands over one amount, and the split across those bills is recorded in
// payment_allocations.
//
// Anything not allocated sits as an advance against the party, which is also
// what happens when somebody pays before you have billed them.
// ===========================================================================

const express = require("express");
const { z } = require("zod");

const db = require("../../db");
const validate = require("../../middleware/validate");
const { requireAuth, requireBusiness } = require("../../middleware/auth");
const asyncHandler = require("../../utils/asyncHandler");
const ApiError = require("../../utils/ApiError");
const { toPaise, toRupees } = require("../../utils/money");

const router = express.Router();
router.use(requireAuth, requireBusiness("staff"));

function toPublic(p, allocations = []) {
  return {
    id: p.id,
    direction: p.direction,
    partyId: p.party_id,
    date: p.payment_date,
    amount: toRupees(p.amount_paise),
    unallocated: toRupees(p.unallocated_paise),
    mode: p.mode,
    reference: p.reference,
    notes: p.notes,
    bankAccountId: p.bank_account_id,
    // Sent for every payment, not only cheques, so a screen can use one rule
    // - "is this settled" - without first asking what kind of payment it is.
    chequeStatus: p.cheque_status,
    chequeDueDate: p.cheque_due_date,
    chequeBank: p.cheque_bank,
    settled: p.cheque_status === "cleared",
    cancelledAt: p.cancelled_at,
    createdAt: p.created_at,
    allocations: allocations.map((a) => ({
      invoiceId: a.invoice_id,
      invoiceNumber: a.number,
      amount: toRupees(a.amount_paise),
    })),
  };
}

// ---- record a payment ----------------------------------------------------
router.post(
  "/",
  validate({
    body: z.object({
      direction: z.enum(["in", "out"]),
      partyId: z.number().int().positive().optional(),
      amount: z.number().positive("Amount must be more than zero"),
      paymentDate: z.iso.date().optional(),
      mode: z.enum(["cash", "upi", "card", "bank", "cheque", "other"]).default("cash"),
      reference: z.string().trim().max(120).optional(),
      notes: z.string().trim().max(2000).optional(),
      // Which bank account the money went into or out of. Without it a shop
      // with two accounts can see that 40,000 arrived by transfer but not
      // where it is, which makes both balances unusable.
      bankAccountId: z.number().int().positive().nullable().optional(),
      // Only meaningful for a cheque: the date written on it, and which bank
      // it is drawn on.
      chequeDueDate: z.iso.date().optional(),
      chequeBank: z.string().trim().max(120).optional(),
      // Which invoices it settles. Leave it out and the whole amount sits
      // as an advance.
      allocations: z
        .array(
          z.object({
            invoiceId: z.number().int().positive(),
            amount: z.number().positive(),
          })
        )
        .optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const b = req.body;
    const amountPaise = toPaise(b.amount, "amount");
    const paymentDate = b.paymentDate ?? new Date().toISOString().slice(0, 10);

    const result = await db.transaction(async (trx) => {
      let party = null;
      if (b.partyId) {
        party = await trx("parties")
          .where({ id: b.partyId, business_id: req.business.id })
          .whereNull("deleted_at")
          .forUpdate()
          .first();
        if (!party) throw ApiError.badRequest("No such customer or supplier.");
      }

      const allocations = b.allocations ?? [];
      const allocTotal = allocations.reduce(
        (s, a) => s + toPaise(a.amount, "allocation amount"),
        0
      );

      if (allocTotal > amountPaise) {
        throw ApiError.badRequest(
          "The amounts set against invoices add up to more than the payment."
        );
      }

      if (b.bankAccountId) {
        const account = await trx("bank_accounts")
          .where({ id: b.bankAccountId, business_id: req.business.id })
          .whereNull("deleted_at")
          .first();
        if (!account) throw ApiError.badRequest("No such bank account.");
      }

      const [paymentId] = await trx("payments").insert({
        business_id: req.business.id,
        party_id: party?.id ?? null,
        direction: b.direction,
        payment_date: paymentDate,
        amount_paise: amountPaise,
        unallocated_paise: amountPaise - allocTotal,
        mode: b.mode,
        reference: b.reference ?? null,
        notes: b.notes ?? null,
        bank_account_id: b.bankAccountId ?? null,
        // A cheque is money you have been promised; everything else is money
        // you have. So a cheque starts life uncleared and counts towards no
        // balance until somebody says it landed, and cash and UPI are settled
        // the instant they are recorded.
        //
        // The column's own default is 'cleared', which is right for the rows
        // that were already in the table and for every non-cheque payment -
        // but leaving a cheque on that default made it the worst of both:
        // not pending, so it never showed on the cheques screen, and with no
        // bank account against it, so it counted towards nothing either. Five
        // thousand rupees simply vanished.
        cheque_status: b.mode === "cheque" ? "pending" : "cleared",
        cheque_due_date: b.mode === "cheque" ? b.chequeDueDate ?? null : null,
        cheque_bank: b.mode === "cheque" ? b.chequeBank ?? null : null,
        created_by: req.user.id,
      });

      // ---- set it against the invoices ---------------------------------
      for (const a of allocations) {
        const allocPaise = toPaise(a.amount, "allocation amount");

        const inv = await trx("invoices")
          .where({ id: a.invoiceId, business_id: req.business.id })
          .forUpdate()
          .first();

        if (!inv) throw ApiError.badRequest(`Invoice ${a.invoiceId} not found.`);
        if (inv.cancelled_at) {
          throw ApiError.badRequest(`Invoice ${inv.number} is cancelled.`);
        }
        if (allocPaise > Number(inv.balance_paise)) {
          throw ApiError.badRequest(
            `Invoice ${inv.number} only has ${toRupees(inv.balance_paise)} outstanding.`
          );
        }

        await trx("payment_allocations").insert({
          business_id: req.business.id,
          payment_id: paymentId,
          invoice_id: inv.id,
          amount_paise: allocPaise,
        });

        const paid = Number(inv.paid_paise) + allocPaise;
        const balance = Number(inv.total_paise) - paid;

        await trx("invoices")
          .where({ id: inv.id })
          .update({
            paid_paise: paid,
            balance_paise: balance,
            // Partly paid is its own state. A bill with half the money in
            // is not "paid", and it is not "issued" either.
            status: balance === 0 ? "paid" : paid > 0 ? "partial" : inv.status,
            updated_at: trx.fn.now(),
          });
      }

      // ---- the party's balance ------------------------------------------
      // Money in reduces what a customer owes; money out reduces what we
      // owe a supplier.
      if (party) {
        const sign = b.direction === "in" ? -1 : +1;
        await trx("parties")
          .where({ id: party.id })
          .update({
            balance_paise: Number(party.balance_paise) + sign * amountPaise,
            updated_at: trx.fn.now(),
          });
      }

      const payment = await trx("payments").where({ id: paymentId }).first();
      const allocs = await trx("payment_allocations as pa")
        .join("invoices as i", "i.id", "pa.invoice_id")
        .where({ "pa.payment_id": paymentId })
        .select("pa.invoice_id", "pa.amount_paise", "i.number");

      return toPublic(payment, allocs);
    });

    res.status(201).json({ ok: true, data: result });
  })
);

// ---- list ---------------------------------------------------------------
router.get(
  "/",
  validate({
    query: z.object({
      direction: z.enum(["in", "out"]).optional(),
      partyId: z.coerce.number().int().positive().optional(),
      mode: z.enum(["cash", "upi", "card", "bank", "cheque", "other"]).optional(),
      from: z.iso.date().optional(),
      to: z.iso.date().optional(),
      limit: z.coerce.number().int().min(1).max(200).default(50),
      offset: z.coerce.number().int().min(0).default(0),
    }),
  }),
  asyncHandler(async (req, res) => {
    const q = req.validatedQuery;
    const base = db("payments").where({ business_id: req.business.id }).whereNull("cancelled_at");

    if (q.direction) base.where({ direction: q.direction });
    if (q.partyId) base.where({ party_id: q.partyId });
    if (q.mode) base.where({ mode: q.mode });
    if (q.from) base.where("payment_date", ">=", q.from);
    if (q.to) base.where("payment_date", "<=", q.to);

    const [{ total }] = await base.clone().clearSelect().clearOrder().count({ total: "*" });
    const [sums] = await base.clone().clearSelect().clearOrder().sum({ amount: "amount_paise" });

    const rows = await base
      .clone()
      .orderBy([{ column: "payment_date", order: "desc" }, { column: "id", order: "desc" }])
      .limit(q.limit)
      .offset(q.offset);

    res.json({
      ok: true,
      data: rows.map((r) => toPublic(r)),
      meta: {
        total: Number(total),
        limit: q.limit,
        offset: q.offset,
        sumAmount: toRupees(sums.amount ?? 0),
      },
    });
  })
);

// ---- the day's collection, split by how it came in ----------------------
router.get(
  "/reports/day-close",
  validate({ query: z.object({ date: z.iso.date().optional() }) }),
  asyncHandler(async (req, res) => {
    const date = req.validatedQuery.date ?? new Date().toISOString().slice(0, 10);

    const rows = await db("payments")
      .where({ business_id: req.business.id, payment_date: date })
      .whereNull("cancelled_at")
      .groupBy("direction", "mode")
      .select("direction", "mode")
      .count({ count: "*" })
      .sum({ amount: "amount_paise" });

    const out = { date, in: {}, out: {}, totalIn: 0, totalOut: 0 };

    for (const r of rows) {
      const amount = Number(r.amount ?? 0);
      out[r.direction][r.mode] = { count: Number(r.count), amount: toRupees(amount) };
      if (r.direction === "in") out.totalIn += amount;
      else out.totalOut += amount;
    }

    out.totalIn = toRupees(out.totalIn);
    out.totalOut = toRupees(out.totalOut);

    res.json({ ok: true, data: out });
  })
);

module.exports = router;
