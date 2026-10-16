// ===========================================================================
// WHAT A SHOP IS ALLOWED TO DO RIGHT NOW
// ---------------------------------------------------------------------------
// Until this file existed, a plan was decoration. The limits on it -
// max_users, max_businesses - were printed on screens and checked by nothing,
// and the end date was stored and read by nothing. A shop whose plan ran out
// in March could still be making bills in December, and the free plan's "1
// user" was a sentence rather than a rule.
//
// Everything that decides "no, you need to pay" comes from here, so there is
// one answer and not five slightly different ones.
//
// THE RULE, IN WORDS
// ------------------
// When a plan ends, nothing happens for a WEEK. After that week, no NEW
// bills - and that is all. Every bill, customer, item, payment and report
// they already have stays open, exportable and printable forever.
//
// That shape is deliberate. Their books are theirs; holding a shopkeeper's
// own sales ledger hostage over a renewal is not a business model, it is a
// hostage situation, and the GST return they owe the government is not
// something we get to stand in front of. What they are paying for is the
// making of new bills, so that is what stops.
//
// The week exists because people genuinely forget. A shop that cannot bill on
// a Monday morning because a card expired on Sunday does not renew - it
// leaves, loudly. A week costs almost nothing and saves exactly the customers
// who were always going to pay.
// ===========================================================================

const db = require("../../db");

const DAY = 24 * 60 * 60 * 1000;

/** How long after the end date before anything actually stops. */
const GRACE_DAYS = 7;

/**
 * What this shop may do, as one object.
 *
 * It never throws and never returns null: a shop with no subscription row at
 * all - which should not happen, but databases are databases - is treated as
 * being on the free plan rather than as being blocked. Locking somebody out
 * because of a missing row is the worst possible failure here.
 */
async function forBusiness(businessId) {
  const sub = await db("subscriptions as s")
    .join("plans as p", "p.id", "s.plan_id")
    .where({ "s.business_id": businessId })
    .whereIn("s.status", ["trial", "active"])
    .select(
      "s.status",
      "s.starts_at",
      "s.ends_at",
      "p.code as plan_code",
      "p.name as plan_name",
      "p.max_businesses",
      "p.max_users",
      "p.max_devices"
    )
    .orderBy("s.id", "desc")
    .first();

  const now = Date.now();
  const endsAt = sub?.ends_at ? new Date(sub.ends_at) : null;

  // No end date means it never expires - the free plan, and anything else
  // sold without a term.
  const msLeft = endsAt ? endsAt.getTime() - now : null;
  const daysLeft = msLeft === null ? null : Math.ceil(msLeft / DAY);

  const expired = msLeft !== null && msLeft <= 0;
  const graceEndsAt = endsAt ? new Date(endsAt.getTime() + GRACE_DAYS * DAY) : null;
  const inGrace = expired && now < graceEndsAt.getTime();
  const blocked = expired && !inGrace;

  return {
    planCode: sub?.plan_code ?? "free",
    planName: sub?.plan_name ?? "Free",
    status: sub?.status ?? "active",
    endsAt: endsAt ? endsAt.toISOString() : null,
    daysLeft,

    expired,
    inGrace,
    // Days of grace remaining, so a screen can say "3 days" rather than
    // "soon" - which nobody acts on.
    graceDaysLeft: inGrace ? Math.ceil((graceEndsAt.getTime() - now) / DAY) : null,
    graceEndsAt: graceEndsAt ? graceEndsAt.toISOString() : null,
    blocked,

    // The warning starts a fortnight out, which is long enough to do
    // something about and short enough not to become wallpaper.
    expiringSoon: daysLeft !== null && daysLeft > 0 && daysLeft <= 15,

    limits: {
      businesses: Number(sub?.max_businesses ?? 1),
      users: Number(sub?.max_users ?? 1),
      devices: Number(sub?.max_devices ?? 1),
    },
  };
}

/**
 * How many shops this person already owns.
 *
 * Owns, not belongs to: being staff at somebody else's shop does not spend
 * your own allowance, or a manager at three shops could never open one of
 * their own.
 */
async function ownedBusinessCount(userId) {
  const row = await db("business_members as m")
    .join("businesses as b", "b.id", "m.business_id")
    .where({ "m.user_id": userId, "m.role": "owner", "m.is_active": true })
    .whereNull("b.deleted_at")
    .count({ n: "b.id" })
    .first();
  return Number(row?.n ?? 0);
}

/** How many active members a shop has, for the max_users limit. */
async function memberCount(businessId) {
  const row = await db("business_members")
    .where({ business_id: businessId, is_active: true })
    .count({ n: "id" })
    .first();
  return Number(row?.n ?? 0);
}

/**
 * The best plan any of this person's shops is on, for deciding whether they
 * may open another.
 *
 * Their allowance is the largest one they hold. Somebody who pays for Gold on
 * one shop should not be told they may only have one shop because their other
 * one is on free.
 */
async function bestBusinessAllowance(userId) {
  const row = await db("business_members as m")
    .join("businesses as b", "b.id", "m.business_id")
    .join("subscriptions as s", "s.business_id", "b.id")
    .join("plans as p", "p.id", "s.plan_id")
    .where({ "m.user_id": userId, "m.role": "owner", "m.is_active": true })
    .whereIn("s.status", ["trial", "active"])
    .whereNull("b.deleted_at")
    // An expired plan does not carry its allowance. NULL ends_at never
    // expires, so it counts.
    .where((q) => q.whereNull("s.ends_at").orWhere("s.ends_at", ">", new Date()))
    .max({ n: "p.max_businesses" })
    .first();
  return Number(row?.n ?? 1);
}

module.exports = {
  forBusiness,
  ownedBusinessCount,
  memberCount,
  bestBusinessAllowance,
  GRACE_DAYS,
};
