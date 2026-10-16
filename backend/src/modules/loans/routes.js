// ===========================================================================
// /api/loans - what the shop owes a lender
// ---------------------------------------------------------------------------
// Separate from parties on purpose. A supplier's balance moves when goods
// arrive and settles when you pay; a loan's balance only moves when an
// instalment is paid, and only by the part of it that was principal.
//
// That split is the whole reason this module exists. An instalment of 12,000
// on a vehicle loan might be 9,400 principal and 2,600 interest. The debt
// falls by 9,400. The 2,600 is gone - a cost of having borrowed, and the only
// part of the instalment that belongs anywhere near a profit figure. Record
// the whole 12,000 as either one and the books are wrong by thousands a
// month, in a way nobody notices until the year ends.
// ===========================================================================

const express = require("express");
const { z } = require("zod");

const db = require("../../db");
const validate = require("../../middleware/validate");
const { requireAuth, requireBusiness } = require("../../middleware/auth");
const asyncHandler = require("../../utils/asyncHandler");
const ApiError = require("../../utils/ApiError");
const { patchShape } = require("../../utils/patchSchema");
const { toPaise, toRupees } = require("../../utils/money");
const { loanBalances } = require("../cashbank/balances");

const router = express.Router();
router.use(requireAuth, requireBusiness("staff"));

const KINDS = ["bank", "gold", "vehicle", "personal", "credit-card", "other"];
const MODES = ["cash", "upi", "card", "bank", "cheque", "other"];

const today = () => new Date().toISOString().slice(0, 10);

const base = {
  name: z.string().trim().min(1, "Give the loan a name").max(120),
  lender: z.string().trim().max(160),
  accountNumber: z.string().trim().max(60),
  kind: z.enum(KINDS),
  principal: z.number().min(0),
  openingBalance: z.number().min(0),
  interestRate: z.number().min(0).max(100),
  tenureMonths: z.number().int().min(1).max(600),
  emi: z.number().min(0),
  startDate: z.iso.date(),
  dueDay: z.number().int().min(1).max(31),
  bankAccountId: z.number().int().positive().nullable(),
  notes: z.string().trim().max(2000),
  isClosed: z.boolean(),
};

const createBody = z.object({
  name: base.name,
  lender: base.lender.optional(),
  accountNumber: base.accountNumber.optional(),
  kind: base.kind.default("bank"),
  principal: base.principal.default(0),
  // What is still owed today. Left out, it is taken as the full principal,
  // which is right for a loan taken out this week and wrong for one that is
  // half repaid - so a shop part way through a loan must say.
  openingBalance: base.openingBalance.optional(),
  interestRate: base.interestRate.default(0),
  tenureMonths: base.tenureMonths.optional(),
  emi: base.emi.default(0),
  startDate: base.startDate.optional(),
  dueDay: base.dueDay.optional(),
  bankAccountId: base.bankAccountId.optional(),
  notes: base.notes.optional(),
});

const patchBody = z.object(
  patchShape(base)
);

function toRow(b) {
  const row = {};
  if (b.name !== undefined) row.name = b.name;
  if (b.lender !== undefined) row.lender = b.lender || null;
  if (b.accountNumber !== undefined) row.account_number = b.accountNumber || null;
  if (b.kind !== undefined) row.kind = b.kind;
  if (b.principal !== undefined) row.principal_paise = toPaise(b.principal, "principal");
  if (b.openingBalance !== undefined) row.opening_balance_paise = toPaise(b.openingBalance, "openingBalance");
  if (b.interestRate !== undefined) row.interest_rate = b.interestRate;
  if (b.tenureMonths !== undefined) row.tenure_months = b.tenureMonths ?? null;
  if (b.emi !== undefined) row.emi_paise = toPaise(b.emi, "emi");
  if (b.startDate !== undefined) row.start_date = b.startDate || null;
  if (b.dueDay !== undefined) row.due_day = b.dueDay ?? null;
  if (b.bankAccountId !== undefined) row.bank_account_id = b.bankAccountId;
  if (b.notes !== undefined) row.notes = b.notes || null;
  if (b.isClosed !== undefined) row.is_closed = b.isClosed;
  return row;
}

/**
 * The next instalment date, from the day of the month it goes out on.
 *
 * Due day 31 in February does not exist, so it lands on the last day the
 * month actually has - which is what a bank's standing instruction does too.
 */
function nextDue(dueDay) {
  if (!dueDay) return null;
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const clamp = (year, month) => {
    const last = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    return new Date(Date.UTC(year, month, Math.min(dueDay, last)));
  };
  let d = clamp(y, m);
  // Today still counts as due; yesterday has gone, so look at next month.
  if (d.getUTCDate() < now.getUTCDate()) d = clamp(y, m + 1);
  return d.toISOString().slice(0, 10);
}

function toPublic(r, paid, accountName) {
  const opening = Number(r.opening_balance_paise);
  const principalPaid = Number(paid?.principalPaid ?? 0);
  const outstanding = Math.max(0, opening - principalPaid);

  return {
    id: r.id,
    name: r.name,
    lender: r.lender,
    accountNumber: r.account_number,
    kind: r.kind,
    principal: toRupees(r.principal_paise),
    openingBalance: toRupees(opening),
    interestRate: Number(r.interest_rate),
    tenureMonths: r.tenure_months,
    emi: toRupees(r.emi_paise),
    startDate: r.start_date,
    dueDay: r.due_day,
    nextDueDate: r.is_closed ? null : nextDue(r.due_day),
    bankAccountId: r.bank_account_id,
    bankAccountName: accountName ?? null,
    notes: r.notes,
    isClosed: Boolean(r.is_closed),

    principalPaid: toRupees(principalPaid),
    interestPaid: toRupees(paid?.interestPaid ?? 0),
    chargesPaid: toRupees(paid?.chargesPaid ?? 0),
    totalPaid: toRupees(paid?.totalPaid ?? 0),
    outstanding: toRupees(outstanding),
  };
}

async function mustOwn(req) {
  const row = await db("loan_accounts")
    .where({ id: req.params.id, business_id: req.business.id })
    .whereNull("deleted_at")
    .first();
  if (!row) throw ApiError.notFound("No such loan.");
  return row;
}

// ---- list ---------------------------------------------------------------
router.get(
  "/",
  validate({ query: z.object({ includeClosed: z.coerce.boolean().default(false) }) }),
  asyncHandler(async (req, res) => {
    const q = db("loan_accounts")
      .where({ "loan_accounts.business_id": req.business.id })
      .whereNull("loan_accounts.deleted_at")
      .leftJoin("bank_accounts as ba", "ba.id", "loan_accounts.bank_account_id")
      .select("loan_accounts.*", "ba.name as account_name")
      .orderBy([
        { column: "loan_accounts.is_closed", order: "asc" },
        { column: "loan_accounts.name", order: "asc" },
      ]);

    if (!req.validatedQuery.includeClosed) q.where({ "loan_accounts.is_closed": false });

    const [rows, paid] = await Promise.all([q, loanBalances(req.business.id)]);

    let outstanding = 0;
    let monthly = 0;
    const list = rows.map((r) => {
      const pub = toPublic(r, paid.get(Number(r.id)), r.account_name);
      if (!pub.isClosed) {
        outstanding += Math.round(pub.outstanding * 100);
        monthly += Math.round(pub.emi * 100);
      }
      return pub;
    });

    res.json({
      ok: true,
      data: list,
      meta: { totalOutstanding: toRupees(outstanding), monthlyInstalments: toRupees(monthly) },
    });
  })
);

// ---- create -------------------------------------------------------------
router.post(
  "/",
  requireBusiness("manager"),
  validate({ body: createBody }),
  asyncHandler(async (req, res) => {
    if (req.body.bankAccountId) {
      const acc = await db("bank_accounts")
        .where({ id: req.body.bankAccountId, business_id: req.business.id })
        .whereNull("deleted_at")
        .first();
      if (!acc) throw ApiError.badRequest("No such bank account.");
    }

    const row = toRow(req.body);
    row.business_id = req.business.id;
    row.created_by = req.user.id;
    if (req.body.openingBalance === undefined) {
      row.opening_balance_paise = toPaise(req.body.principal ?? 0, "principal");
    }

    const [id] = await db("loan_accounts").insert(row);
    const created = await db("loan_accounts").where({ id }).first();
    res.status(201).json({ ok: true, data: toPublic(created, null, null) });
  })
);

// ---- read one -----------------------------------------------------------
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const row = await mustOwn(req);
    const paid = await loanBalances(req.business.id);
    const acc = row.bank_account_id
      ? await db("bank_accounts").where({ id: row.bank_account_id }).first()
      : null;
    res.json({ ok: true, data: toPublic(row, paid.get(Number(row.id)), acc?.name) });
  })
);

// ---- update -------------------------------------------------------------
router.patch(
  "/:id",
  requireBusiness("manager"),
  validate({ body: patchBody }),
  asyncHandler(async (req, res) => {
    const existing = await mustOwn(req);
    const patch = toRow(req.body);

    if (Object.keys(patch).length) {
      patch.updated_at = db.fn.now();
      await db("loan_accounts").where({ id: existing.id }).update(patch);
    }

    const row = await db("loan_accounts").where({ id: existing.id }).first();
    const paid = await loanBalances(req.business.id);
    res.json({ ok: true, data: toPublic(row, paid.get(Number(row.id)), null) });
  })
);

// ---- delete -------------------------------------------------------------
router.delete(
  "/:id",
  requireBusiness("manager"),
  asyncHandler(async (req, res) => {
    const existing = await mustOwn(req);

    const [{ n }] = await db("loan_payments")
      .where({ loan_id: existing.id })
      .whereNull("cancelled_at")
      .count({ n: "*" });

    // Instalments already paid went out of a real account and are part of
    // those balances. Deleting the loan would take them with it and change
    // the bank figure for a month that is already closed, so a loan with a
    // history is closed instead - which is what the shopkeeper means anyway.
    if (Number(n)) {
      throw ApiError.badRequest(
        `${Number(n)} instalment${Number(n) === 1 ? " has" : "s have"} been recorded against this loan. Mark it closed instead of deleting it.`
      );
    }

    await db("loan_accounts").where({ id: existing.id }).update({ deleted_at: db.fn.now() });
    res.json({ ok: true, data: { id: existing.id, deleted: true } });
  })
);

// ---------------------------------------------------------------------------
// Instalments
// ---------------------------------------------------------------------------

const payBody = z.object({
  amount: z.number().positive("The amount has to be more than zero"),
  // Left out, they are worked out from the interest rate on the balance as
  // it stands, which is how a lender does it.
  principal: z.number().min(0).optional(),
  interest: z.number().min(0).optional(),
  charges: z.number().min(0).default(0),
  paymentDate: z.iso.date().optional(),
  mode: z.enum(MODES).default("bank"),
  bankAccountId: z.number().int().positive().nullable().optional(),
  reference: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(2000).optional(),
});

router.get(
  "/:id/payments",
  validate({
    query: z.object({
      limit: z.coerce.number().int().min(1).max(200).default(100),
      offset: z.coerce.number().int().min(0).default(0),
    }),
  }),
  asyncHandler(async (req, res) => {
    const loan = await mustOwn(req);
    const q = req.validatedQuery;

    const base = db("loan_payments").where({ loan_id: loan.id }).whereNull("cancelled_at");
    const [{ total }] = await base.clone().clearSelect().clearOrder().count({ total: "*" });

    const rows = await base
      .clone()
      .leftJoin("bank_accounts as ba", "ba.id", "loan_payments.bank_account_id")
      .select("loan_payments.*", "ba.name as account_name")
      .orderBy([
        { column: "loan_payments.payment_date", order: "desc" },
        { column: "loan_payments.id", order: "desc" },
      ])
      .limit(q.limit)
      .offset(q.offset);

    res.json({
      ok: true,
      data: rows.map((r) => ({
        id: r.id,
        paymentDate: r.payment_date,
        amount: toRupees(r.amount_paise),
        principal: toRupees(r.principal_paise),
        interest: toRupees(r.interest_paise),
        charges: toRupees(r.charges_paise),
        mode: r.mode,
        bankAccountId: r.bank_account_id,
        bankAccountName: r.account_name,
        reference: r.reference,
        notes: r.notes,
      })),
      meta: { total: Number(total), limit: q.limit, offset: q.offset },
    });
  })
);

router.post(
  "/:id/payments",
  validate({ body: payBody }),
  asyncHandler(async (req, res) => {
    const loan = await mustOwn(req);
    const b = req.body;

    if (b.bankAccountId) {
      const acc = await db("bank_accounts")
        .where({ id: b.bankAccountId, business_id: req.business.id })
        .whereNull("deleted_at")
        .first();
      if (!acc) throw ApiError.badRequest("No such bank account.");
    }

    const amount = toPaise(b.amount, "amount");
    const charges = toPaise(b.charges ?? 0, "charges");

    let interest;
    let principal;

    if (b.interest !== undefined || b.principal !== undefined) {
      interest = b.interest !== undefined ? toPaise(b.interest, "interest") : null;
      principal = b.principal !== undefined ? toPaise(b.principal, "principal") : null;

      // Whichever one was left out is the remainder, so the three figures
      // always add up to the amount that actually left the account. They are
      // never both taken on trust: two numbers that do not sum to the third
      // would put the loan balance and the bank balance permanently out of
      // step with each other.
      if (interest === null) interest = Math.max(0, amount - charges - principal);
      else if (principal === null) principal = Math.max(0, amount - charges - interest);
      else if (principal + interest + charges !== amount) {
        throw ApiError.badRequest(
          `Principal, interest and charges come to ₹${toRupees(principal + interest + charges)}, but the instalment is ₹${toRupees(amount)}.`
        );
      }
    } else {
      // Worked out the way a lender does: one month's interest on what is
      // still owed, and everything left over comes off the debt.
      const paidSoFar = await loanBalances(req.business.id);
      const outstanding = Math.max(
        0,
        Number(loan.opening_balance_paise) - Number(paidSoFar.get(Number(loan.id))?.principalPaid ?? 0)
      );
      const monthly = Number(loan.interest_rate) / 12 / 100;
      interest = Math.min(Math.round(outstanding * monthly), Math.max(0, amount - charges));
      principal = Math.max(0, amount - charges - interest);
    }

    const [id] = await db("loan_payments").insert({
      business_id: req.business.id,
      loan_id: loan.id,
      payment_date: b.paymentDate ?? today(),
      amount_paise: amount,
      principal_paise: principal,
      interest_paise: interest,
      charges_paise: charges,
      mode: b.mode,
      bank_account_id: b.bankAccountId ?? null,
      reference: b.reference || null,
      notes: b.notes || null,
      created_by: req.user.id,
    });

    // Paid off in full? Close it, rather than leaving a zero sitting on the
    // screen for the rest of the shop's life.
    const paid = await loanBalances(req.business.id);
    const left = Number(loan.opening_balance_paise) - Number(paid.get(Number(loan.id))?.principalPaid ?? 0);
    if (left <= 0 && !loan.is_closed) {
      await db("loan_accounts").where({ id: loan.id }).update({ is_closed: true, updated_at: db.fn.now() });
    }

    const row = await db("loan_payments").where({ id }).first();
    const fresh = await db("loan_accounts").where({ id: loan.id }).first();

    res.status(201).json({
      ok: true,
      data: {
        payment: {
          id: row.id,
          paymentDate: row.payment_date,
          amount: toRupees(row.amount_paise),
          principal: toRupees(row.principal_paise),
          interest: toRupees(row.interest_paise),
          charges: toRupees(row.charges_paise),
          mode: row.mode,
        },
        loan: toPublic(fresh, paid.get(Number(loan.id)), null),
      },
    });
  })
);

router.delete(
  "/:id/payments/:paymentId",
  requireBusiness("manager"),
  asyncHandler(async (req, res) => {
    const loan = await mustOwn(req);
    const row = await db("loan_payments")
      .where({ id: req.params.paymentId, loan_id: loan.id })
      .whereNull("cancelled_at")
      .first();
    if (!row) throw ApiError.notFound("No such instalment.");

    await db("loan_payments").where({ id: row.id }).update({ cancelled_at: db.fn.now() });

    // Cancelling the instalment that closed the loan has to re-open it, or
    // the loan disappears from the list while still being owed.
    if (loan.is_closed) {
      await db("loan_accounts").where({ id: loan.id }).update({ is_closed: false, updated_at: db.fn.now() });
    }

    res.json({ ok: true, data: { id: row.id, cancelled: true } });
  })
);

module.exports = router;
