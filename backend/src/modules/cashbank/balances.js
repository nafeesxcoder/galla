// ===========================================================================
// WHERE THE MONEY IS
// ---------------------------------------------------------------------------
// Every balance in this system is DERIVED. Nothing stores "the bank has
// 42,000 in it", because the moment a stored figure disagrees with the
// transactions behind it there is no way to tell which one is wrong, and the
// shopkeeper has to choose between two numbers the app is equally confident
// about.
//
// So it is added up, every time, from four sources:
//
//   payments          money in and out through a customer or supplier
//   expenses          money out that was not a purchase
//   loan_payments     instalments going out
//   cash_bank_moves   the same money changing pocket
//
// plus the opening figure, which is the one thing no transaction explains.
//
// THE SIDE THAT IS EASY TO GET WRONG
// ----------------------------------
// For a BANK account, the sign comes from the columns: to_account_id is money
// arriving, from_account_id is money leaving, whatever the kind says.
//
// For CASH it comes from the KIND, and it has to. A bank charge has
// from_account = the bank and to_account = NULL, and NULL normally means the
// drawer - but a bank charge does not put a single rupee in the drawer, it
// vanishes. Reading the drawer's side off the NULL would credit the shop with
// every charge the bank ever levied. Hence two different rules on purpose.
//
// CHEQUES
// -------
// A cheque in hand is a promise. Until cheque_status says 'cleared' it counts
// towards nothing: not the drawer, not the bank, not the day's takings. Every
// non-cheque payment is stored as 'cleared' from the moment it is written, so
// the same filter covers all of them and cash is never held back.
// ===========================================================================

const db = require("../../db");

/** Cash and UPI arrive at once; a cheque only when somebody says it did. */
const SETTLED = "cleared";

const CASH_IN_KINDS = ["bank-to-cash", "cash-increase"];
const CASH_OUT_KINDS = ["cash-to-bank", "cash-decrease"];

const n = (v) => Number(v ?? 0);

async function sum(query, column) {
  const [row] = await query.clone().clearSelect().clearOrder().sum({ s: column });
  return n(row?.s);
}

// ---------------------------------------------------------------------------
// One bank account, or all of them
// ---------------------------------------------------------------------------
// Written as five grouped queries rather than five per account, so a shop
// with six accounts costs the same as a shop with one.
async function bankBalances(businessId) {
  const scope = (table) => db(table).where({ business_id: businessId });

  const [paymentsIn, paymentsOut, expenses, movesIn, movesOut, loanOut] = await Promise.all([
    scope("payments")
      .whereNull("cancelled_at")
      .where({ direction: "in", cheque_status: SETTLED })
      .whereNotNull("bank_account_id")
      .groupBy("bank_account_id")
      .select("bank_account_id")
      .sum({ s: "amount_paise" }),

    scope("payments")
      .whereNull("cancelled_at")
      .where({ direction: "out", cheque_status: SETTLED })
      .whereNotNull("bank_account_id")
      .groupBy("bank_account_id")
      .select("bank_account_id")
      .sum({ s: "amount_paise" }),

    scope("expenses")
      .whereNull("deleted_at")
      .whereNotNull("bank_account_id")
      .groupBy("bank_account_id")
      .select("bank_account_id")
      .sum({ s: "total_paise" }),

    scope("cash_bank_moves")
      .whereNull("cancelled_at")
      .whereNotNull("to_account_id")
      .groupBy("to_account_id")
      .select("to_account_id as bank_account_id")
      .sum({ s: "amount_paise" }),

    scope("cash_bank_moves")
      .whereNull("cancelled_at")
      .whereNotNull("from_account_id")
      .groupBy("from_account_id")
      .select("from_account_id as bank_account_id")
      .sum({ s: "amount_paise" }),

    scope("loan_payments")
      .whereNull("cancelled_at")
      .whereNotNull("bank_account_id")
      .groupBy("bank_account_id")
      .select("bank_account_id")
      // The charges are part of what left the account, and amount_paise
      // already includes them.
      .sum({ s: "amount_paise" }),
  ]);

  const by = new Map();
  const add = (rows, sign) => {
    for (const r of rows) {
      const id = Number(r.bank_account_id);
      by.set(id, n(by.get(id)) + sign * n(r.s));
    }
  };

  add(paymentsIn, +1);
  add(movesIn, +1);
  add(paymentsOut, -1);
  add(expenses, -1);
  add(movesOut, -1);
  add(loanOut, -1);

  return by;
}

// ---------------------------------------------------------------------------
// The drawer
// ---------------------------------------------------------------------------
async function cashBalance(business) {
  const scope = (table) => db(table).where({ business_id: business.id });

  const [inCash, outCash, spentCash, movedIn, movedOut, loanCash] = await Promise.all([
    sum(
      scope("payments").whereNull("cancelled_at").where({ direction: "in", mode: "cash", cheque_status: SETTLED }),
      "amount_paise"
    ),
    sum(
      scope("payments").whereNull("cancelled_at").where({ direction: "out", mode: "cash", cheque_status: SETTLED }),
      "amount_paise"
    ),
    sum(scope("expenses").whereNull("deleted_at").where({ mode: "cash" }), "total_paise"),
    sum(scope("cash_bank_moves").whereNull("cancelled_at").whereIn("kind", CASH_IN_KINDS), "amount_paise"),
    sum(scope("cash_bank_moves").whereNull("cancelled_at").whereIn("kind", CASH_OUT_KINDS), "amount_paise"),
    sum(scope("loan_payments").whereNull("cancelled_at").where({ mode: "cash" }), "amount_paise"),
  ]);

  const opening = n(business.opening_cash_paise);

  return {
    opening,
    received: inCash,
    paidOut: outCash,
    spent: spentCash,
    depositedToBank: movedOut,
    withdrawnFromBank: movedIn,
    loanInstalments: loanCash,
    balance: opening + inCash + movedIn - outCash - spentCash - movedOut - loanCash,
  };
}

// ---------------------------------------------------------------------------
// Cheques that have not landed yet
// ---------------------------------------------------------------------------
// Shown apart from every balance, because that is the point of them: money
// promised, not money held.
async function chequesPending(businessId) {
  const rows = await db("payments")
    .where({ business_id: businessId, mode: "cheque", cheque_status: "pending" })
    .whereNull("cancelled_at")
    .groupBy("direction")
    .select("direction")
    .count({ count: "*" })
    .sum({ s: "amount_paise" });

  const out = { toReceive: 0, toPay: 0, countToReceive: 0, countToPay: 0 };
  for (const r of rows) {
    if (r.direction === "in") {
      out.toReceive = n(r.s);
      out.countToReceive = Number(r.count);
    } else {
      out.toPay = n(r.s);
      out.countToPay = Number(r.count);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// What is still owed on the loans
// ---------------------------------------------------------------------------
// Only the principal paid reduces the debt. Interest and charges are the cost
// of having borrowed and do nothing to the balance - which is the whole
// reason an instalment is stored as three figures rather than one.
async function loanBalances(businessId) {
  const rows = await db("loan_payments")
    .where({ business_id: businessId })
    .whereNull("cancelled_at")
    .groupBy("loan_id")
    .select("loan_id")
    .sum({ principal: "principal_paise", interest: "interest_paise", charges: "charges_paise", paid: "amount_paise" });

  const by = new Map();
  for (const r of rows) {
    by.set(Number(r.loan_id), {
      principalPaid: n(r.principal),
      interestPaid: n(r.interest),
      chargesPaid: n(r.charges),
      totalPaid: n(r.paid),
    });
  }
  return by;
}

module.exports = {
  SETTLED,
  CASH_IN_KINDS,
  CASH_OUT_KINDS,
  bankBalances,
  cashBalance,
  chequesPending,
  loanBalances,
};
