// ===========================================================================
// /api/account - what the public site shows after somebody logs in
// ---------------------------------------------------------------------------
// NOT the billing app. This is the account desk: which plan each shop is on,
// how long it has left, the licence keys bought, and how to buy another.
// Billing itself lives in the app, and nothing here touches a bill.
//
// The split matters for more than tidiness. The marketing site is public, it
// is indexed, and it will eventually run adverts and analytics on it. A
// customer's sales figures have no business being on that origin at all.
// ===========================================================================

const express = require("express");
const { z } = require("zod");

const db = require("../../db");
const validate = require("../../middleware/validate");
const { requireAuth } = require("../../middleware/auth");
const limits = require("../../middleware/rateLimit");
const asyncHandler = require("../../utils/asyncHandler");
const ApiError = require("../../utils/ApiError");
const { toRupees } = require("../../utils/money");
const licence = require("./licence");
const { applyPlan } = require("./activate");
const entitlements = require("./entitlements");
const config = require("../../config");

const router = express.Router();
// Signed in, but NOT requireBusiness: the account area is about the person,
// who may own several shops or - having just bought a licence - none yet.
router.use(requireAuth);

const DAY = 24 * 60 * 60 * 1000;
// How early the panel starts saying "renew". A fortnight is long enough for
// somebody to act and short enough not to nag.
const EXPIRY_WARNING_DAYS = 15;

function planPublic(p) {
  if (!p) return null;
  return {
    id: p.id,
    code: p.code,
    name: p.name,
    price: toRupees(p.price_paise),
    periodMonths: p.period_months,
    maxBusinesses: p.max_businesses,
    maxUsers: p.max_users,
    maxDevices: p.max_devices,
  };
}

/** Days left, or null for something with no end date. */
function daysLeft(endsAt) {
  if (!endsAt) return null;
  return Math.ceil((new Date(endsAt).getTime() - Date.now()) / DAY);
}

/** The businesses this person is a member of, with their role. */
async function myBusinesses(userId) {
  return db("business_members as m")
    .join("businesses as b", "b.id", "m.business_id")
    .where({ "m.user_id": userId, "m.is_active": true })
    .whereNull("b.deleted_at")
    .select("b.id", "b.name", "m.role")
    .orderBy("b.id");
}

// ---------------------------------------------------------------------------
// everything the My Account panel needs, in one request
// ---------------------------------------------------------------------------
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const businesses = await myBusinesses(req.user.id);
    const ids = businesses.map((b) => b.id);

    const [subs, licences] = await Promise.all([
      ids.length
        ? db("subscriptions as s")
            .join("plans as p", "p.id", "s.plan_id")
            .whereIn("s.business_id", ids)
            .whereIn("s.status", ["trial", "active"])
            .select(
              "s.id",
              "s.business_id",
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
        : [],
      // Licences sitting against one of their shops. A key they bought but
      // have not used yet is NOT here - nothing links it to them until it is
      // redeemed, which is the whole point of a key that can be resold.
      ids.length
        ? db("licences as l")
            .join("plans as p", "p.id", "l.plan_id")
            .join("businesses as b", "b.id", "l.business_id")
            .whereIn("l.business_id", ids)
            .select("l.*", "p.name as plan_name", "p.code as plan_code", "b.name as business_name")
            .orderBy("l.id", "desc")
        : [],
    ]);

    // One subscription per shop: the newest live one wins. Older rows are
    // kept as history and are not shown.
    const subByBusiness = new Map();
    for (const s of subs) {
      const key = Number(s.business_id);
      if (!subByBusiness.has(key)) subByBusiness.set(key, s);
    }

    // The grace state per shop, worked out the same way the middleware that
    // actually refuses a bill works it out - same module, so the panel and
    // the refusal can never tell different stories.
    const states = new Map(
      await Promise.all(
        ids.map(async (id) => [Number(id), await entitlements.forBusiness(id)])
      )
    );

    const shops = businesses.map((b) => {
      const s = subByBusiness.get(Number(b.id));
      const st = states.get(Number(b.id));
      const left = s ? daysLeft(s.ends_at) : null;
      return {
        id: b.id,
        name: b.name,
        role: b.role,
        plan: s
          ? {
              code: s.plan_code,
              name: s.plan_name,
              status: s.status,
              startsAt: s.starts_at,
              endsAt: s.ends_at,
              daysLeft: left,
              // The one thing a shopkeeper actually looks for on this page.
              expiringSoon: left !== null && left > 0 && left <= EXPIRY_WARNING_DAYS,
              expired: Boolean(st?.expired),
              inGrace: Boolean(st?.inGrace),
              graceDaysLeft: st?.graceDaysLeft ?? null,
              // true means new bills are being refused on this shop.
              blocked: Boolean(st?.blocked),
              maxBusinesses: s.max_businesses,
              maxUsers: s.max_users,
              maxDevices: s.max_devices,
            }
          : null,
      };
    });

    res.json({
      ok: true,
      data: {
        user: { id: req.user.id, name: req.user.name, phone: req.user.phone },
        shops,
        activeLicences: licences.filter((l) => l.status === "active").length,
        licences: licences.map((l) => ({
          id: l.id,
          code: l.code,
          planName: l.plan_name,
          planCode: l.plan_code,
          status: l.status,
          businessId: l.business_id,
          businessName: l.business_name,
          periodMonths: l.period_months,
          activatedAt: l.activated_at,
          expiresAt: l.expires_at,
          daysLeft: daysLeft(l.expires_at),
        })),
      },
    });
  })
);

// ---------------------------------------------------------------------------
// "Already have a License?"
// ---------------------------------------------------------------------------
router.post(
  "/licences/redeem",
  limits.licenceRedeem,
  validate({
    body: z.object({
      code: z.string().trim().min(1, "Enter the licence key"),
      // Taken from the body, which requireBusiness pointedly refuses to do.
      // This route is the exception and for a reason: the panel lists every
      // shop the person owns and asks which one the key is for, so the shop
      // is a FIELD OF THIS FORM rather than the context the page is already
      // in. It is checked below against their membership, same as the header
      // would be.
      businessId: z.number().int().positive(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const code = licence.normalise(req.body.code);
    // Checked before any database work, so a typo costs nothing and the
    // message says what is actually wrong.
    if (!code) {
      throw ApiError.badRequest("That is not a licence key. It looks like ABCDE-12345-FGHJK-67890.");
    }

    // The shop has to be theirs, and theirs to decide about. A staff member
    // activating a licence on the owner's shop is not their call to make.
    const membership = await db("business_members")
      .where({ business_id: req.body.businessId, user_id: req.user.id, is_active: true })
      .first();
    if (!membership) throw ApiError.notFound("Business not found.");
    if (membership.role !== "owner") throw ApiError.forbidden("Only the owner can apply a licence.");

    const result = await db.transaction(async (trx) => {
      // Locked: two people redeeming the same key in the same second must
      // queue, or both get a licence and one of them was never paid for.
      const key = await trx("licences").where({ code }).forUpdate().first();

      // Deliberately the same message for "no such key" and "already used".
      // Telling somebody a key exists but is taken is how you confirm a
      // guessed key is real.
      if (!key || key.status === "active" || key.business_id) {
        throw ApiError.badRequest("That key is not valid, or it has already been used.");
      }
      if (key.status === "revoked") {
        throw ApiError.badRequest("That key has been cancelled. Talk to whoever sold it to you.");
      }
      if (key.status === "expired") throw ApiError.badRequest("That key has expired.");

      const plan = await trx("plans").where({ id: key.plan_id }).first();
      if (!plan) throw ApiError.badRequest("That key is for a plan that no longer exists.");

      // The same function the offline-payment script uses. Both paths start
      // or extend a plan, and the day they disagree about whether time is
      // added or replaced, somebody has paid for days they do not get.
      const applied = await applyPlan({
        trx,
        businessId: req.body.businessId,
        plan,
        months: Number(key.period_months) || undefined,
        reference: `licence:${code}`,
      });

      await trx("licences").where({ id: key.id }).update({
        business_id: req.body.businessId,
        status: "active",
        activated_at: new Date(),
        expires_at: applied.expiresAt,
        updated_at: trx.fn.now(),
      });

      return {
        code,
        plan: planPublic(plan),
        // extended vs started are different news, and the screen says which.
        ...applied,
      };
    });

    res.json({ ok: true, data: result });
  })
);

// ---------------------------------------------------------------------------
// Paying by UPI or bank transfer
// ---------------------------------------------------------------------------
// There is no payment gateway here. The money goes straight from the
// customer's bank to yours, and NOTHING TELLS THIS SERVER THAT IT ARRIVED.
// Every decision below follows from that one fact.
//
// The shape of it:
//
//   1. POST /offline-payment        quote it, and write down what they are
//                                   buying. The reference that comes back is
//                                   what joins a line on a bank statement to
//                                   a customer - without it a transfer from
//                                   somebody's brother's account is money
//                                   nobody can place.
//   2. they pay                     outside this system entirely
//   3. POST /payments/:ref/claim    they type in the UTR from their UPI app.
//                                   With config.payments.autoApprove the plan
//                                   starts HERE, on trust.
//   4. you check it                 node scripts/payments.js
//
// Step 4 is not a tidy-up. Step 3 accepts twelve digits that nobody has
// verified, and the only thing between that and a free year is somebody
// reading the list every morning.
//
// WHY ACCEPT AN UNVERIFIED CLAIM AT ALL
// -------------------------------------
// Because the alternative is worse. A shopkeeper who has just sent ₹3,999
// and is told to wait for an email will ring you, and go on ringing. The
// risk is bounded - one plan, revocable in one command - and the upside is
// that the product works at the moment somebody pays for it.
//
// Set PAYMENT_AUTO_APPROVE=false and nothing starts until you say so.

const PLAN_MONTHS_FALLBACK = 12;

/** Shape a payment_requests row for a screen. */
function paymentPublic(row) {
  return {
    reference: row.reference,
    status: row.status,
    method: row.method,
    planName: row.plan_name ?? null,
    planCode: row.plan_code ?? null,
    device: row.device,
    periodMonths: row.period_months,
    quantity: row.quantity,
    unitPrice: toRupees(row.unit_price_paise),
    amount: toRupees(row.amount_paise),
    utr: row.utr ?? null,
    // Deliberately exposed: a customer whose plan is already on should see
    // that, and a customer still waiting should see that too. Hiding it is
    // what makes people ring up.
    planStarted: Boolean(row.subscription_id),
    decisionNote: row.decision_note ?? null,
    createdAt: row.created_at,
    claimedAt: row.claimed_at ?? null,
    decidedAt: row.decided_at ?? null,
  };
}

/**
 * The shop a payment is for, checked.
 *
 * Only shops they OWN. Being staff somewhere does not make that shop theirs
 * to buy a plan for, and a plan bought onto somebody else's shop is not
 * something that can be quietly undone later.
 */
async function ownedBusiness(userId, businessId) {
  if (!businessId) return null;
  const row = await db("business_members as m")
    .join("businesses as b", "b.id", "m.business_id")
    .where({
      "m.user_id": userId,
      "m.business_id": businessId,
      "m.role": "owner",
      "m.is_active": true,
    })
    .whereNull("b.deleted_at")
    .select("b.id", "b.name")
    .first();
  return row ?? null;
}

router.post(
  "/offline-payment",
  validate({
    body: z.object({
      planId: z.number().int().positive(),
      businessId: z.number().int().positive().optional(),
      quantity: z.number().int().min(1).max(50).default(1),
      // Which price they are quoting against. Defaults to the one most
      // people buy, so an older screen that does not send these still gets a
      // correct figure rather than a zero.
      device: z.enum(["both", "mobile", "desktop"]).optional(),
      periodMonths: z.number().int().positive().max(240).optional(),
      method: z.enum(["upi", "bank", "cheque"]).optional(),
      notes: z.string().trim().max(300).optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const plan = await db("plans").where({ id: req.body.planId, is_active: true }).first();
    if (!plan) throw ApiError.badRequest("No such plan.");
    if (plan.code === "free") throw ApiError.badRequest("The free plan is not something you pay for.");

    // The price list, not the plan's headline price - "Silver, mobile only,
    // three years" is a different number and quoting the headline would be
    // quoting the wrong one.
    const device = req.body.device ?? "both";
    const months = req.body.periodMonths ?? Number(plan.period_months) ?? PLAN_MONTHS_FALLBACK;
    const priced = await db("plan_prices")
      .where({ plan_id: plan.id, device, period_months: months, is_active: true })
      .first();

    if (!priced && (req.body.device || req.body.periodMonths)) {
      // Asked for a combination that is not sold. Better to say so than to
      // fall back to a different price and let somebody transfer it.
      throw ApiError.badRequest("That plan is not sold for that device and period.");
    }

    const business = await ownedBusiness(req.user.id, req.body.businessId);
    if (req.body.businessId && !business) throw ApiError.notFound("Business not found.");

    const unitPaise = Number(priced?.price_paise ?? plan.price_paise);
    const total = unitPaise * req.body.quantity;

    if (total <= 0) {
      // A plan whose price has not been seeded. Quoting zero and taking a
      // claim against it would start a paid plan for nothing.
      throw ApiError.badRequest("That plan has no price set yet. Call support.");
    }

    // Short, tied to the account rather than random, and read out over the
    // phone - so no characters that sound alike when spoken.
    const reference = `MGB-${req.user.id}-${Date.now().toString(36).toUpperCase().slice(-5)}`;

    const [id] = await db("payment_requests").insert({
      user_id: req.user.id,
      business_id: business ? business.id : null,
      plan_id: plan.id,
      device,
      period_months: months,
      quantity: req.body.quantity,
      unit_price_paise: unitPaise,
      amount_paise: total,
      reference,
      method: req.body.method ?? "upi",
      status: "pending",
      payer_note: req.body.notes || null,
    });

    const row = await db("payment_requests").where({ id }).first();

    res.json({
      ok: true,
      data: {
        ...paymentPublic({ ...row, plan_name: plan.name, plan_code: plan.code }),
        plan: planPublic(plan),
        business: business ? { id: business.id, name: business.name } : null,
        // What the screen is allowed to promise. Getting this from the
        // server rather than hardcoding it means the page cannot say
        // "instant" while the server is set to approve by hand.
        instant: config.payments.autoApprove && req.body.quantity === 1,
        next:
          config.payments.autoApprove && req.body.quantity === 1
            ? "Pay the amount, then enter the UTR from your UPI app or bank. Your plan starts the moment you do."
            : "Pay the amount, then enter the UTR. We check it against the bank and switch your plan on, usually the same working day.",
      },
    });
  })
);

// ---------------------------------------------------------------------------
// "I have paid - here is the transaction number"
// ---------------------------------------------------------------------------
// A UTR is the only thing the customer has that can be found in your bank
// statement. It is not proof: anybody can type twelve digits. It is a claim,
// recorded against their account, which is enough to check later and enough
// to act on now.
router.post(
  "/payments/:reference/claim",
  limits.paymentClaim,
  validate({
    body: z.object({
      // UPI gives twelve digits. NEFT and IMPS references are longer and
      // messier, and a cheque number is six. So: loose, trimmed, and
      // checked by a human rather than by a regular expression that would
      // reject half of the real ones.
      utr: z.string().trim().min(4).max(64),
      businessId: z.number().int().positive().optional(),
      note: z.string().trim().max(300).optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const reference = String(req.params.reference || "").trim().toUpperCase();
    const utr = req.body.utr.replace(/\s+/g, "");

    const result = await db.transaction(async (trx) => {
      // Locked, because two taps on a slow phone are two requests, and
      // without this both of them start a plan.
      const row = await trx("payment_requests")
        .where({ reference, user_id: req.user.id })
        .forUpdate()
        .first();

      // Same message whether the reference does not exist or belongs to
      // somebody else. Telling them apart turns this into a way to find out
      // which references are real.
      if (!row) throw ApiError.notFound("No payment request with that reference.");

      if (row.status === "approved" || row.status === "claimed") {
        throw ApiError.conflict("That payment has already been submitted. We are on it.");
      }
      if (row.status === "rejected") {
        throw ApiError.conflict("That payment was not found in our bank. Start a new one, or call support.");
      }

      const plan = await trx("plans").where({ id: row.plan_id }).first();
      if (!plan) throw ApiError.badRequest("That plan is no longer sold.");

      // Which shop. The request may already name one; if not, the claim has
      // to, because a plan has to land somewhere.
      let businessId = row.business_id ?? null;
      if (!businessId) {
        const business = await ownedBusiness(req.user.id, req.body.businessId);
        if (!business) {
          throw ApiError.badRequest("Tell us which shop this is for. You can only buy for a shop you own.");
        }
        businessId = business.id;
      }

      // Several licences is not one plan on one shop - it is keys to hand
      // out, which is a human job. Switching a plan on for the first of them
      // would be the wrong thing done quickly.
      const instant = config.payments.autoApprove && Number(row.quantity) === 1;

      let applied = null;
      if (instant) {
        applied = await applyPlan({
          trx,
          businessId,
          plan,
          months: Number(row.period_months) || undefined,
          reference: `payment:${reference}`,
          // What was quoted, which is what they were asked to send. Not the
          // plan's list price - those are different numbers and this one is
          // the one that will be checked against the bank.
          amountPaise: Number(row.amount_paise),
        });
      }

      const patch = {
        status: "claimed",
        utr,
        claimed_at: new Date(),
        business_id: businessId,
        updated_at: trx.fn.now(),
        ...(req.body.note ? { payer_note: req.body.note } : {}),
        ...(applied
          ? {
              auto_approved: true,
              subscription_id: applied.subscriptionId,
              replaced_subscription_id: applied.replacedSubscriptionId,
            }
          : {}),
      };

      try {
        await trx("payment_requests").where({ id: row.id }).update(patch);
      } catch (e) {
        // The unique index on utr. One transaction pays for one thing, and
        // a number that has already been used somewhere is either a typo or
        // somebody trying it on - both get the same answer.
        if (e && (e.code === "ER_DUP_ENTRY" || e.errno === 1062)) {
          throw ApiError.conflict(
            "That transaction number has already been used. Check it against your bank app, or call support."
          );
        }
        throw e;
      }

      return { row, plan, instant, applied, businessId };
    });

    res.json({
      ok: true,
      data: {
        reference,
        status: "claimed",
        plan: planPublic(result.plan),
        planStarted: Boolean(result.applied),
        ...(result.applied
          ? {
              extended: result.applied.extended,
              expiresAt: result.applied.expiresAt,
              months: result.applied.months,
            }
          : {}),
        next: result.applied
          ? "Your plan is on. We will match this against our bank as a matter of course."
          : "Got it. We check this against our bank and switch your plan on, usually the same working day.",
      },
    });
  })
);

// ---------------------------------------------------------------------------
// Their own payments, so they can see where one stands
// ---------------------------------------------------------------------------
// Somebody who has paid and heard nothing assumes the money is gone. This is
// cheaper than the phone call.
router.get(
  "/payments",
  asyncHandler(async (req, res) => {
    const rows = await db("payment_requests as pr")
      .join("plans as p", "p.id", "pr.plan_id")
      .where({ "pr.user_id": req.user.id })
      .select("pr.*", "p.name as plan_name", "p.code as plan_code")
      .orderBy("pr.id", "desc")
      .limit(25);

    res.json({ ok: true, data: rows.map(paymentPublic) });
  })
);

module.exports = router;
