// ===========================================================================
// TURNING A PLAN ON
// ---------------------------------------------------------------------------
// One function, used by both paths that can start or extend a plan:
//
//   a licence key redeemed on the website     (modules/account/routes.js)
//   an offline payment confirmed by hand      (scripts/activate-plan.js)
//
// It lives here and not in either of them because the two must behave
// identically. The moment a key adds time and a bank transfer replaces it,
// somebody has paid for days they do not get - and nobody notices for months,
// because both paths look right on their own.
//
// THE RULE: TIME IS ADDED, NEVER REPLACED
// ---------------------------------------
// Somebody who renews with three months still left keeps those three months.
// They will renew early, because the expiry warning starts a fortnight out,
// and a system that quietly eats the remainder is punishing the customers who
// pay on time.
//
// Only PAID time carries over. A free plan has no end date to carry, and a
// trial is not something you bank on top of a paid year.
// ===========================================================================

/**
 * Starts or extends a business's plan, inside a transaction the caller owns.
 *
 * @param {object}  trx         knex transaction
 * @param {number}  businessId
 * @param {object}  plan        a row from `plans`
 * @param {number}  [months]    defaults to the plan's own period
 * @param {string}  [reference] what paid for it: a licence code, a bank ref
 * @param {number}  [amountPaise] what was actually received, if known
 * @returns {Promise<{extended, countsFrom, expiresAt, months, subscriptionId}>}
 */
async function applyPlan({ trx, businessId, plan, months, reference = null, amountPaise = 0 }) {
  const span = Number(months) || Number(plan.period_months) || 12;

  const live = await trx("subscriptions")
    .where({ business_id: businessId })
    .whereIn("status", ["trial", "active"])
    .orderBy("id", "desc")
    .first();

  const now = new Date();

  // Boolean(), because `a && b.c` returns the falsy VALUE, not false. The
  // free plan has no end date, so without this the caller is handed
  // extended: null - which is not false, and a screen asking `if (extended)`
  // would be right while a test asking `=== false` would be wrong.
  const carryOver = Boolean(
    live && live.status === "active" && live.ends_at && new Date(live.ends_at) > now
  );
  const base = carryOver ? new Date(live.ends_at) : now;

  const endsAt = new Date(base);
  endsAt.setMonth(endsAt.getMonth() + span);

  // A new ROW, not an update. The subscriptions table was built to keep
  // history - "what was this customer paying in March" has no answer if the
  // row is overwritten - so the old one is closed and a new one opened
  // beside it.
  if (live) {
    await trx("subscriptions").where({ id: live.id }).update({
      status: "cancelled",
      cancelled_at: now,
      updated_at: trx.fn.now(),
    });
  }

  const [subscriptionId] = await trx("subscriptions").insert({
    business_id: businessId,
    plan_id: plan.id,
    status: "active",
    starts_at: now,
    ends_at: endsAt,
    // What was actually received, which is not the plan's list price. The
    // migration says it outright: never read the price off the plan to work
    // out what somebody paid. A key may have been sold at a dealer's
    // discount, or given away.
    amount_paid_paise: Number(amountPaise) || 0,
    payment_reference: reference,
  });

  return {
    subscriptionId,
    // What this pushed aside, so it can be put back. A payment accepted on
    // trust and later found to be false has to leave the customer exactly
    // where they were - which for a renewal is their old paid plan, not the
    // free one.
    replacedSubscriptionId: live ? live.id : null,
    months: span,
    extended: carryOver,
    countsFrom: base,
    expiresAt: endsAt,
  };
}

/**
 * Undoes an applyPlan, for a payment that turned out not to exist.
 *
 * Deliberately not a delete. The subscription is closed with a reason and
 * the one it replaced is reopened, so the history reads as what actually
 * happened: a plan was started, and then it was taken back.
 *
 * @param {object} trx                      knex transaction
 * @param {number} subscriptionId           the one applyPlan created
 * @param {number|null} replacedSubscriptionId  the one it closed, if any
 */
async function revokePlan({ trx, subscriptionId, replacedSubscriptionId }) {
  const now = new Date();

  await trx("subscriptions").where({ id: subscriptionId }).update({
    status: "cancelled",
    cancelled_at: now,
    updated_at: trx.fn.now(),
  });

  if (!replacedSubscriptionId) return { restored: false };

  const prior = await trx("subscriptions").where({ id: replacedSubscriptionId }).first();
  // Only put it back if nothing has happened since. If the customer has
  // bought again in the meantime, reopening an old row would give them two
  // live subscriptions, and every screen that asks for "the" plan would pick
  // whichever the database returned first.
  if (!prior || prior.status !== "cancelled") return { restored: false };

  const newer = await trx("subscriptions")
    .where({ business_id: prior.business_id })
    .whereIn("status", ["trial", "active"])
    .first();
  if (newer) return { restored: false };

  await trx("subscriptions").where({ id: prior.id }).update({
    // Back to what it was. An expired one goes back to being expired, and
    // the entitlements code works that out from ends_at as it always did.
    status: "active",
    cancelled_at: null,
    updated_at: trx.fn.now(),
  });

  return { restored: true, endsAt: prior.ends_at };
}

module.exports = { applyPlan, revokePlan };
