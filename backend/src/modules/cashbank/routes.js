// ===========================================================================
// /api/cashbank - the drawer, the bank accounts, and the cheques
// ---------------------------------------------------------------------------
// Three things a shopkeeper checks without being asked to: how much is in the
// drawer, how much is in the bank, and which cheques have not cleared. All
// three are answered from the transactions already stored (see balances.js);
// nothing here keeps a running total of its own.
//
// What this module DOES store is the accounts themselves, and the moves
// between them - a day's takings walked to the bank, a withdrawal for buying
// stock, a bank charge. Those have nowhere else to live, and without them the
// drawer figure climbs all month and the bank figure never moves.
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
const bal = require("./balances");

const router = express.Router();
router.use(requireAuth, requireBusiness("staff"));

const MOVE_KINDS = [
  "cash-to-bank",
  "bank-to-cash",
  "bank-to-bank",
  "bank-charge",
  "bank-interest",
  "cash-increase",
  "cash-decrease",
];

// Which side of a move needs a real bank account. Getting this wrong is how
// you end up with a transfer that moves money out of nowhere.
const SHAPE = {
  "cash-to-bank": { from: "cash", to: "bank" },
  "bank-to-cash": { from: "bank", to: "cash" },
  "bank-to-bank": { from: "bank", to: "bank" },
  "bank-charge": { from: "bank", to: "void" },
  "bank-interest": { from: "void", to: "bank" },
  "cash-increase": { from: "void", to: "cash" },
  "cash-decrease": { from: "cash", to: "void" },
};

const today = () => new Date().toISOString().slice(0, 10);

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

const accountBase = {
  name: z.string().trim().min(1, "Give the account a name").max(120),
  bankName: z.string().trim().max(120),
  accountNumber: z.string().trim().max(40),
  ifsc: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "That is not a valid IFSC code"),
  accountHolder: z.string().trim().max(160),
  branch: z.string().trim().max(120),
  upiId: z.string().trim().max(120),
  openingBalance: z.number(),
  openingDate: z.iso.date(),
  isDefault: z.boolean(),
  printOnInvoice: z.boolean(),
  notes: z.string().trim().max(2000),
};

const createAccount = z.object({
  name: accountBase.name,
  bankName: accountBase.bankName.optional(),
  accountNumber: accountBase.accountNumber.optional(),
  ifsc: accountBase.ifsc.optional(),
  accountHolder: accountBase.accountHolder.optional(),
  branch: accountBase.branch.optional(),
  upiId: accountBase.upiId.optional(),
  openingBalance: accountBase.openingBalance.default(0),
  openingDate: accountBase.openingDate.optional(),
  isDefault: accountBase.isDefault.default(false),
  printOnInvoice: accountBase.printOnInvoice.default(false),
  notes: accountBase.notes.optional(),
});

// Every field optional and genuinely so - a missing one stays as stored,
// rather than being handed a default that overwrites it.
const patchAccount = z.object(
  patchShape(accountBase)
);

function accountRow(b) {
  const row = {};
  if (b.name !== undefined) row.name = b.name;
  if (b.bankName !== undefined) row.bank_name = b.bankName || null;
  if (b.accountNumber !== undefined) row.account_number = b.accountNumber || null;
  if (b.ifsc !== undefined) row.ifsc = b.ifsc || null;
  if (b.accountHolder !== undefined) row.account_holder = b.accountHolder || null;
  if (b.branch !== undefined) row.branch = b.branch || null;
  if (b.upiId !== undefined) row.upi_id = b.upiId || null;
  if (b.openingBalance !== undefined) {
    // An overdraft is a real thing, so a negative opening balance is allowed
    // here where it is refused everywhere else. toPaise rejects negatives, so
    // the sign is taken off and put back.
    const v = Number(b.openingBalance);
    row.opening_balance_paise = (v < 0 ? -1 : 1) * toPaise(Math.abs(v), "openingBalance");
  }
  if (b.openingDate !== undefined) row.opening_date = b.openingDate || null;
  if (b.isDefault !== undefined) row.is_default = b.isDefault;
  if (b.printOnInvoice !== undefined) row.print_on_invoice = b.printOnInvoice;
  if (b.notes !== undefined) row.notes = b.notes || null;
  return row;
}

function accountPublic(r, balancePaise) {
  return {
    id: r.id,
    name: r.name,
    bankName: r.bank_name,
    accountNumber: r.account_number,
    ifsc: r.ifsc,
    accountHolder: r.account_holder,
    branch: r.branch,
    upiId: r.upi_id,
    openingBalance: toRupees(r.opening_balance_paise),
    openingDate: r.opening_date,
    isDefault: Boolean(r.is_default),
    printOnInvoice: Boolean(r.print_on_invoice),
    notes: r.notes,
    balance: balancePaise === undefined ? undefined : toRupees(balancePaise),
  };
}

async function liveAccounts(businessId) {
  return db("bank_accounts").where({ business_id: businessId }).whereNull("deleted_at").orderBy([
    { column: "is_default", order: "desc" },
    { column: "name", order: "asc" },
  ]);
}

/** Only one account can be the default, so setting one clears the rest. */
async function clearOtherDefaults(businessId, keepId) {
  const q = db("bank_accounts").where({ business_id: businessId, is_default: true });
  if (keepId) q.whereNot({ id: keepId });
  await q.update({ is_default: false });
}

async function mustOwnAccount(businessId, id, label = "account") {
  const row = await db("bank_accounts")
    .where({ id, business_id: businessId })
    .whereNull("deleted_at")
    .first();
  if (!row) throw ApiError.badRequest(`No such ${label}.`);
  return row;
}

// ---- everything, on one screen -----------------------------------------
router.get(
  "/summary",
  asyncHandler(async (req, res) => {
    const [accounts, bankBy, cash, cheques] = await Promise.all([
      liveAccounts(req.business.id),
      bal.bankBalances(req.business.id),
      bal.cashBalance(req.business),
      bal.chequesPending(req.business.id),
    ]);

    let bankTotal = 0;
    const list = accounts.map((a) => {
      const b = Number(a.opening_balance_paise) + Number(bankBy.get(Number(a.id)) ?? 0);
      bankTotal += b;
      return accountPublic(a, b);
    });

    res.json({
      ok: true,
      data: {
        cash: {
          ...Object.fromEntries(Object.entries(cash).map(([k, v]) => [k, toRupees(v)])),
        },
        accounts: list,
        bankTotal: toRupees(bankTotal),
        // Cheques are listed but NOT added in. Until one clears it is a
        // promise, and a shopkeeper who sees it inside the total will spend
        // money that has not arrived.
        chequesPending: {
          toReceive: toRupees(cheques.toReceive),
          toPay: toRupees(cheques.toPay),
          countToReceive: cheques.countToReceive,
          countToPay: cheques.countToPay,
        },
        total: toRupees(cash.balance + bankTotal),
      },
    });
  })
);

// ---- list accounts ------------------------------------------------------
router.get(
  "/accounts",
  asyncHandler(async (req, res) => {
    const [accounts, bankBy] = await Promise.all([
      liveAccounts(req.business.id),
      bal.bankBalances(req.business.id),
    ]);
    res.json({
      ok: true,
      data: accounts.map((a) =>
        accountPublic(a, Number(a.opening_balance_paise) + Number(bankBy.get(Number(a.id)) ?? 0))
      ),
    });
  })
);

router.post(
  "/accounts",
  requireBusiness("manager"),
  validate({ body: createAccount }),
  asyncHandler(async (req, res) => {
    const row = accountRow(req.body);
    row.business_id = req.business.id;
    row.created_by = req.user.id;

    // The first account a shop adds becomes the default whether it was asked
    // for or not, so that taking a bank payment never has nothing to offer.
    const existing = await liveAccounts(req.business.id);
    if (!existing.length) row.is_default = true;

    const [id] = await db("bank_accounts").insert(row);
    if (row.is_default) await clearOtherDefaults(req.business.id, id);

    const created = await db("bank_accounts").where({ id }).first();
    res.status(201).json({
      ok: true,
      data: accountPublic(created, Number(created.opening_balance_paise)),
    });
  })
);

router.patch(
  "/accounts/:id",
  requireBusiness("manager"),
  validate({ body: patchAccount }),
  asyncHandler(async (req, res) => {
    const existing = await mustOwnAccount(req.business.id, req.params.id);
    const patch = accountRow(req.body);

    if (Object.keys(patch).length) {
      patch.updated_at = db.fn.now();
      await db("bank_accounts").where({ id: existing.id }).update(patch);
    }
    if (patch.is_default) await clearOtherDefaults(req.business.id, existing.id);

    const [row, bankBy] = await Promise.all([
      db("bank_accounts").where({ id: existing.id }).first(),
      bal.bankBalances(req.business.id),
    ]);
    res.json({
      ok: true,
      data: accountPublic(row, Number(row.opening_balance_paise) + Number(bankBy.get(Number(row.id)) ?? 0)),
    });
  })
);

router.delete(
  "/accounts/:id",
  requireBusiness("manager"),
  asyncHandler(async (req, res) => {
    const existing = await mustOwnAccount(req.business.id, req.params.id);

    // Refused rather than cascaded. Deleting an account that payments point
    // at would silently rewrite history: every one of those payments would
    // fall out of the balances and the day's takings would change for a date
    // that has already been closed.
    const [used] = await db("payments")
      .where({ business_id: req.business.id, bank_account_id: existing.id })
      .whereNull("cancelled_at")
      .count({ n: "*" });

    if (Number(used.n)) {
      throw ApiError.badRequest(
        `${Number(used.n)} payment${Number(used.n) === 1 ? " is" : "s are"} recorded against this account, so it cannot be deleted. ` +
          "Rename it instead if it is no longer in use."
      );
    }

    await db("bank_accounts").where({ id: existing.id }).update({ deleted_at: db.fn.now() });

    // The shop should never be left without a default while it still has an
    // account to be one.
    if (existing.is_default) {
      const next = await liveAccounts(req.business.id);
      if (next.length) await db("bank_accounts").where({ id: next[0].id }).update({ is_default: true });
    }

    res.json({ ok: true, data: { id: existing.id, deleted: true } });
  })
);

// ---------------------------------------------------------------------------
// Moving money between pockets
// ---------------------------------------------------------------------------

const moveBody = z.object({
  kind: z.enum(MOVE_KINDS),
  amount: z.number().positive("The amount has to be more than zero"),
  moveDate: z.iso.date().optional(),
  fromAccountId: z.number().int().positive().optional(),
  toAccountId: z.number().int().positive().optional(),
  reference: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(2000).optional(),
});

function movePublic(r) {
  return {
    id: r.id,
    kind: r.kind,
    fromAccountId: r.from_account_id,
    toAccountId: r.to_account_id,
    fromName: r.from_name ?? (r.from_account_id ? null : "Cash in hand"),
    toName: r.to_name ?? (r.to_account_id ? null : "Cash in hand"),
    moveDate: r.move_date,
    amount: toRupees(r.amount_paise),
    reference: r.reference,
    notes: r.notes,
    createdAt: r.created_at,
  };
}

function withNames(q) {
  return q
    .leftJoin("bank_accounts as fa", "fa.id", "cash_bank_moves.from_account_id")
    .leftJoin("bank_accounts as ta", "ta.id", "cash_bank_moves.to_account_id")
    .select("cash_bank_moves.*", "fa.name as from_name", "ta.name as to_name");
}

router.post(
  "/moves",
  validate({ body: moveBody }),
  asyncHandler(async (req, res) => {
    const b = req.body;
    const shape = SHAPE[b.kind];

    // The shape is checked rather than trusted. A "bank-to-bank" with no
    // from account would take money out of the drawer and put it in a bank,
    // which is a different transaction entirely and would not be visible as
    // a mistake anywhere - the totals would simply be wrong.
    const need = (side, given) => {
      if (shape[side] === "bank" && !given) {
        throw ApiError.badRequest(`Which account is the money ${side === "from" ? "coming from" : "going to"}?`);
      }
      if (shape[side] !== "bank" && given) {
        throw ApiError.badRequest(`A ${b.kind} move has no ${side} account.`);
      }
    };
    need("from", b.fromAccountId);
    need("to", b.toAccountId);

    if (b.kind === "bank-to-bank" && b.fromAccountId === b.toAccountId) {
      throw ApiError.badRequest("Those are the same account.");
    }

    if (b.fromAccountId) await mustOwnAccount(req.business.id, b.fromAccountId, "account to take it from");
    if (b.toAccountId) await mustOwnAccount(req.business.id, b.toAccountId, "account to put it in");

    const [id] = await db("cash_bank_moves").insert({
      business_id: req.business.id,
      kind: b.kind,
      from_account_id: b.fromAccountId ?? null,
      to_account_id: b.toAccountId ?? null,
      move_date: b.moveDate ?? today(),
      amount_paise: toPaise(b.amount, "amount"),
      reference: b.reference || null,
      notes: b.notes || null,
      created_by: req.user.id,
    });

    const created = await withNames(db("cash_bank_moves").where({ "cash_bank_moves.id": id })).first();
    res.status(201).json({ ok: true, data: movePublic(created) });
  })
);

router.get(
  "/moves",
  validate({
    query: z.object({
      accountId: z.coerce.number().int().positive().optional(),
      kind: z.enum(MOVE_KINDS).optional(),
      from: z.iso.date().optional(),
      to: z.iso.date().optional(),
      limit: z.coerce.number().int().min(1).max(200).default(50),
      offset: z.coerce.number().int().min(0).default(0),
    }),
  }),
  asyncHandler(async (req, res) => {
    const q = req.validatedQuery;
    const base = db("cash_bank_moves")
      .where({ "cash_bank_moves.business_id": req.business.id })
      .whereNull("cash_bank_moves.cancelled_at");

    if (q.kind) base.where({ "cash_bank_moves.kind": q.kind });
    if (q.from) base.where("cash_bank_moves.move_date", ">=", q.from);
    if (q.to) base.where("cash_bank_moves.move_date", "<=", q.to);
    if (q.accountId) {
      base.where((w) =>
        w.where("cash_bank_moves.from_account_id", q.accountId).orWhere("cash_bank_moves.to_account_id", q.accountId)
      );
    }

    const [{ total }] = await base.clone().clearSelect().clearOrder().count({ total: "*" });
    const rows = await withNames(base.clone())
      .orderBy([
        { column: "cash_bank_moves.move_date", order: "desc" },
        { column: "cash_bank_moves.id", order: "desc" },
      ])
      .limit(q.limit)
      .offset(q.offset);

    res.json({
      ok: true,
      data: rows.map(movePublic),
      meta: { total: Number(total), limit: q.limit, offset: q.offset },
    });
  })
);

router.delete(
  "/moves/:id",
  asyncHandler(async (req, res) => {
    const row = await db("cash_bank_moves")
      .where({ id: req.params.id, business_id: req.business.id })
      .whereNull("cancelled_at")
      .first();
    if (!row) throw ApiError.notFound("No such entry.");

    // Cancelled, not deleted. A day that has been closed should still show
    // what was reckoned on the day, with the correction visible as a
    // correction.
    await db("cash_bank_moves").where({ id: row.id }).update({ cancelled_at: db.fn.now() });
    res.json({ ok: true, data: { id: row.id, cancelled: true } });
  })
);

// ---------------------------------------------------------------------------
// Cheques
// ---------------------------------------------------------------------------
// Not a table of its own: a cheque IS a payment, with a state and a date on
// it. Giving it its own table would mean a cheque that cleared had to be
// copied into payments, and then the same money would exist twice.

router.get(
  "/cheques",
  validate({
    query: z.object({
      status: z.enum(["pending", "cleared", "bounced", "cancelled", "all"]).default("pending"),
      direction: z.enum(["in", "out"]).optional(),
      limit: z.coerce.number().int().min(1).max(200).default(100),
      offset: z.coerce.number().int().min(0).default(0),
    }),
  }),
  asyncHandler(async (req, res) => {
    const q = req.validatedQuery;
    const base = db("payments")
      .where({ "payments.business_id": req.business.id, "payments.mode": "cheque" })
      .whereNull("payments.cancelled_at");

    if (q.status !== "all") base.where({ "payments.cheque_status": q.status });
    if (q.direction) base.where({ "payments.direction": q.direction });

    const [{ total }] = await base.clone().clearSelect().clearOrder().count({ total: "*" });
    const rows = await base
      .clone()
      .leftJoin("parties as p", "p.id", "payments.party_id")
      // A cheque is very often recorded against a bill rather than against a
      // customer - the till has the invoice open, not the ledger - and
      // party_id is then null. Showing "Walk-in customer" next to a ₹40,000
      // cheque is useless: the one thing the shopkeeper needs is whose
      // cheque it is. So when the payment itself does not say, the bill it
      // was set against does.
      .leftJoin("payment_allocations as pa", "pa.payment_id", "payments.id")
      .leftJoin("invoices as inv", "inv.id", "pa.invoice_id")
      .leftJoin("parties as ip", "ip.id", "inv.party_id")
      .groupBy("payments.id")
      .select(
        "payments.*",
        db.raw("COALESCE(MAX(p.name), MAX(ip.name), MAX(inv.party_name)) as party_name"),
        db.raw("COALESCE(MAX(p.id), MAX(ip.id)) as resolved_party_id")
      )
      .orderBy([
        // Due first, and a cheque with no date written on it last rather
        // than first - an undated one is not urgent, it is just incomplete.
        { column: "payments.cheque_due_date", order: "asc" },
        { column: "payments.payment_date", order: "asc" },
        { column: "payments.id", order: "asc" },
      ])
      .limit(q.limit)
      .offset(q.offset);

    const t = today();
    res.json({
      ok: true,
      data: rows.map((r) => ({
        id: r.id,
        direction: r.direction,
        partyId: r.party_id ?? r.resolved_party_id ?? null,
        partyName: r.party_name,
        amount: toRupees(r.amount_paise),
        paymentDate: r.payment_date,
        status: r.cheque_status,
        dueDate: r.cheque_due_date,
        settledDate: r.cheque_settled_date,
        chequeNumber: r.reference,
        chequeBank: r.cheque_bank,
        notes: r.notes,
        // Worked out here rather than on the phone, so that a device with
        // the wrong date set does not colour half the list red.
        overdue: Boolean(r.cheque_status === "pending" && r.cheque_due_date && String(r.cheque_due_date).slice(0, 10) < t),
      })),
      meta: { total: Number(total), limit: q.limit, offset: q.offset },
    });
  })
);

router.patch(
  "/cheques/:id",
  validate({
    body: z.object({
      status: z.enum(["pending", "cleared", "bounced", "cancelled"]),
      settledDate: z.iso.date().optional(),
      notes: z.string().trim().max(2000).optional(),
      bankAccountId: z.number().int().positive().nullable().optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const row = await db("payments")
      .where({ id: req.params.id, business_id: req.business.id, mode: "cheque" })
      .whereNull("cancelled_at")
      .first();
    if (!row) throw ApiError.notFound("No such cheque.");

    // A bounced cheque does not un-bounce. The bills it was against have
    // already been put back to unpaid and the allocations are gone, so
    // "clearing" it now would mark the money as received without settling
    // anything - the customer's balance would be short by the amount, for
    // good. If they pay again, that is a new payment.
    if (row.cheque_status === "bounced" && req.body.status !== "bounced") {
      throw ApiError.badRequest(
        "This cheque has already bounced and the bills went back to unpaid. Record a fresh payment instead."
      );
    }

    const reversing = req.body.status === "bounced" || req.body.status === "cancelled";

    const result = await db.transaction(async (trx) => {
      const patch = { cheque_status: req.body.status, updated_at: trx.fn.now() };

      if (req.body.status === "cleared" || req.body.status === "bounced") {
        patch.cheque_settled_date = req.body.settledDate ?? today();
      } else {
        patch.cheque_settled_date = null;
      }
      if (req.body.notes !== undefined) patch.notes = req.body.notes || null;
      if (req.body.bankAccountId !== undefined) {
        if (req.body.bankAccountId) await mustOwnAccount(req.business.id, req.body.bankAccountId);
        patch.bank_account_id = req.body.bankAccountId;
      }

      let undone = [];

      if (reversing) {
        // The part that matters. A cheque was written against two bills; it
        // bounces; those bills are NOT paid. Leaving the allocations in
        // place would leave them reading "paid" for ever while the money
        // never arrived - the single most expensive kind of wrong a billing
        // app can be, because the shopkeeper stops asking for it.
        const allocs = await trx("payment_allocations")
          .where({ payment_id: row.id })
          .forUpdate();

        for (const a of allocs) {
          const inv = await trx("invoices").where({ id: a.invoice_id }).forUpdate().first();
          if (!inv) continue;

          const paid = Math.max(0, Number(inv.paid_paise) - Number(a.amount_paise));
          const balance = Number(inv.total_paise) - paid;

          await trx("invoices")
            .where({ id: inv.id })
            .update({
              paid_paise: paid,
              balance_paise: balance,
              // Back to whatever it was before any money came in. "issued"
              // rather than the stored status, because the stored one is
              // "paid" or "partial" - which is exactly what is being undone.
              status: balance === 0 ? "paid" : paid > 0 ? "partial" : "issued",
              updated_at: trx.fn.now(),
            });

          undone.push({ invoiceId: inv.id, invoiceNumber: inv.number, amount: toRupees(a.amount_paise) });
        }

        await trx("payment_allocations").where({ payment_id: row.id }).delete();
        patch.unallocated_paise = Number(row.amount_paise);

        // And the customer owes it again.
        if (row.party_id) {
          const party = await trx("parties").where({ id: row.party_id }).forUpdate().first();
          if (party) {
            const sign = row.direction === "in" ? +1 : -1;
            await trx("parties")
              .where({ id: party.id })
              .update({
                balance_paise: Number(party.balance_paise) + sign * Number(row.amount_paise),
                updated_at: trx.fn.now(),
              });
          }
        }
      }

      await trx("payments").where({ id: row.id }).update(patch);
      const updated = await trx("payments").where({ id: row.id }).first();

      return {
        id: updated.id,
        status: updated.cheque_status,
        settledDate: updated.cheque_settled_date,
        amount: toRupees(updated.amount_paise),
        // Named, so the screen can say WHICH bills are owed again rather
        // than leaving the shopkeeper to find out at the end of the month.
        billsBackToUnpaid: undone,
      };
    });

    res.json({ ok: true, data: result });
  })
);

// ---------------------------------------------------------------------------
// The drawer's own statement
// ---------------------------------------------------------------------------
// Four sources merged by date, which is the only way the figure at the bottom
// can be checked against the notes in the till.

async function ledger(businessId, { accountId = null, from, to, limit }) {
  const dateIn = (q, col) => {
    if (from) q.where(col, ">=", from);
    if (to) q.where(col, "<=", to);
    return q;
  };
  const cashSide = accountId === null;

  const pay = dateIn(
    db("payments")
      .where({ "payments.business_id": businessId, cheque_status: bal.SETTLED })
      .whereNull("payments.cancelled_at")
      // Qualified, every one of them. An unqualified bank_account_id in a
      // query that joins another table carrying the same column name is
      // ambiguous, and MariaDB answers with a 500 rather than a guess.
      .modify((q) =>
        cashSide ? q.where({ "payments.mode": "cash" }) : q.where({ "payments.bank_account_id": accountId })
      )
      .leftJoin("parties as p", "p.id", "payments.party_id")
      .select(
        "payments.id",
        "payments.direction",
        "payments.payment_date as d",
        "payments.amount_paise",
        "payments.mode",
        "payments.reference",
        "p.name as who"
      ),
    "payments.payment_date"
  );

  const exp = dateIn(
    db("expenses")
      .where({ business_id: businessId })
      .whereNull("deleted_at")
      .modify((q) => (cashSide ? q.where({ mode: "cash" }) : q.where({ bank_account_id: accountId })))
      .select("id", "category", "expense_date as d", "total_paise", "notes"),
    "expense_date"
  );

  const mv = dateIn(
    db("cash_bank_moves")
      .where({ business_id: businessId })
      .whereNull("cancelled_at")
      .modify((q) =>
        cashSide
          ? q.whereIn("kind", [...bal.CASH_IN_KINDS, ...bal.CASH_OUT_KINDS])
          : q.where((w) => w.where("from_account_id", accountId).orWhere("to_account_id", accountId))
      )
      .select("id", "kind", "move_date as d", "amount_paise", "from_account_id", "to_account_id", "notes"),
    "move_date"
  );

  const loans = dateIn(
    db("loan_payments")
      .where({ "loan_payments.business_id": businessId })
      .whereNull("loan_payments.cancelled_at")
      // loan_accounts carries a bank_account_id of its own - which account
      // the borrowed money landed in - so this one MUST be qualified.
      .modify((q) =>
        cashSide
          ? q.where({ "loan_payments.mode": "cash" })
          : q.where({ "loan_payments.bank_account_id": accountId })
      )
      .leftJoin("loan_accounts as la", "la.id", "loan_payments.loan_id")
      .select("loan_payments.id", "loan_payments.payment_date as d", "loan_payments.amount_paise", "la.name as who"),
    "loan_payments.payment_date"
  );

  const [payments, expenses, moves, loanPays] = await Promise.all([pay, exp, mv, loans]);

  const rows = [];
  for (const r of payments) {
    rows.push({
      kind: r.direction === "in" ? "received" : "paid",
      id: `payment-${r.id}`,
      date: r.d,
      label: r.who || (r.direction === "in" ? "Cash sale" : "Paid out"),
      detail: r.reference || null,
      in: r.direction === "in" ? Number(r.amount_paise) : 0,
      out: r.direction === "out" ? Number(r.amount_paise) : 0,
    });
  }
  for (const r of expenses) {
    rows.push({
      kind: "expense",
      id: `expense-${r.id}`,
      date: r.d,
      label: r.category,
      detail: r.notes || null,
      in: 0,
      out: Number(r.total_paise),
    });
  }
  for (const r of moves) {
    // For the drawer, the kind says the direction. For a bank account the
    // columns do - see the note at the top of balances.js.
    const isIn = cashSide
      ? bal.CASH_IN_KINDS.includes(r.kind)
      : Number(r.to_account_id) === Number(accountId);
    rows.push({
      kind: r.kind,
      id: `move-${r.id}`,
      date: r.d,
      label: MOVE_LABEL[r.kind] ?? r.kind,
      detail: r.notes || null,
      in: isIn ? Number(r.amount_paise) : 0,
      out: isIn ? 0 : Number(r.amount_paise),
    });
  }
  for (const r of loanPays) {
    rows.push({
      kind: "loan",
      id: `loan-${r.id}`,
      date: r.d,
      label: `Loan instalment${r.who ? ` — ${r.who}` : ""}`,
      detail: null,
      in: 0,
      out: Number(r.amount_paise),
    });
  }

  rows.sort((a, b) => {
    const da = String(a.date).slice(0, 10);
    const dbb = String(b.date).slice(0, 10);
    if (da !== dbb) return da < dbb ? 1 : -1;
    return a.id < b.id ? 1 : -1;
  });

  return rows.slice(0, limit);
}

const MOVE_LABEL = {
  "cash-to-bank": "Deposited in the bank",
  "bank-to-cash": "Withdrawn from the bank",
  "bank-to-bank": "Moved between accounts",
  "bank-charge": "Bank charges",
  "bank-interest": "Bank interest",
  "cash-increase": "Cash adjusted up",
  "cash-decrease": "Cash adjusted down",
};

const statementQuery = z.object({
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(100),
});

router.get(
  "/cash/statement",
  validate({ query: statementQuery }),
  asyncHandler(async (req, res) => {
    const q = req.validatedQuery;
    const [rows, cash] = await Promise.all([
      ledger(req.business.id, { accountId: null, ...q }),
      bal.cashBalance(req.business),
    ]);
    res.json({
      ok: true,
      data: {
        balance: toRupees(cash.balance),
        opening: toRupees(cash.opening),
        rows: rows.map((r) => ({ ...r, in: toRupees(r.in), out: toRupees(r.out) })),
      },
    });
  })
);

router.get(
  "/accounts/:id/statement",
  validate({ query: statementQuery }),
  asyncHandler(async (req, res) => {
    const account = await mustOwnAccount(req.business.id, req.params.id);
    const q = req.validatedQuery;
    const [rows, bankBy] = await Promise.all([
      ledger(req.business.id, { accountId: Number(account.id), ...q }),
      bal.bankBalances(req.business.id),
    ]);
    const balance = Number(account.opening_balance_paise) + Number(bankBy.get(Number(account.id)) ?? 0);
    res.json({
      ok: true,
      data: {
        account: accountPublic(account, balance),
        balance: toRupees(balance),
        opening: toRupees(account.opening_balance_paise),
        rows: rows.map((r) => ({ ...r, in: toRupees(r.in), out: toRupees(r.out) })),
      },
    });
  })
);

// ---- what was in the drawer on day one ----------------------------------
router.patch(
  "/cash/opening",
  requireBusiness("manager"),
  validate({ body: z.object({ openingCash: z.number().min(0) }) }),
  asyncHandler(async (req, res) => {
    await db("businesses")
      .where({ id: req.business.id })
      .update({ opening_cash_paise: toPaise(req.body.openingCash, "openingCash"), updated_at: db.fn.now() });

    const business = await db("businesses").where({ id: req.business.id }).first();
    const cash = await bal.cashBalance(business);
    res.json({ ok: true, data: { opening: toRupees(cash.opening), balance: toRupees(cash.balance) } });
  })
);

module.exports = router;
