// ===========================================================================
// /api/businesses
// ===========================================================================

const express = require("express");
const { z } = require("zod");

const db = require("../../db");
const validate = require("../../middleware/validate");
const { requireAuth, requireBusiness } = require("../../middleware/auth");
const asyncHandler = require("../../utils/asyncHandler");
const ApiError = require("../../utils/ApiError");
const entitlements = require("../account/entitlements");
const { patchShape } = require("../../utils/patchSchema");
const { isValidGstinFormat, stateCodeFromGstin, STATE_CODES } = require("../../utils/gst");
const settings = require("./settings");

const router = express.Router();
router.use(requireAuth);

const gstin = z
  .string()
  .trim()
  .toUpperCase()
  .refine(isValidGstinFormat, "That does not look like a valid GSTIN");

const stateCode = z
  .string()
  .trim()
  .refine((c) => Boolean(STATE_CODES[c]), "Pick a valid state");

const baseFields = {
  name: z.string().trim().min(1).max(160),
  legalName: z.string().trim().max(160).optional(),
  gstin: gstin.optional(),
  stateCode,
  pan: z.string().trim().toUpperCase().regex(/^[A-Z]{5}\d{4}[A-Z]$/, "Enter a valid PAN").optional(),
  phone: z.string().trim().max(20).optional(),
  email: z.email().max(190).optional(),
  addressLine1: z.string().trim().max(190).optional(),
  addressLine2: z.string().trim().max(190).optional(),
  city: z.string().trim().max(100).optional(),
  pincode: z.string().trim().regex(/^\d{6}$/, "Enter a 6 digit pincode").optional(),
  industry: z.string().trim().max(60).optional(),
  fyStartMonth: z.number().int().min(1).max(12).default(4),
};

function toRow(b) {
  return {
    name: b.name,
    legal_name: b.legalName ?? null,
    gstin: b.gstin ?? null,
    state_code: b.stateCode,
    pan: b.pan ?? null,
    phone: b.phone ?? null,
    email: b.email ?? null,
    address_line1: b.addressLine1 ?? null,
    address_line2: b.addressLine2 ?? null,
    city: b.city ?? null,
    pincode: b.pincode ?? null,
    industry: b.industry ?? null,
    fy_start_month: b.fyStartMonth ?? 4,
  };
}

function toPublic(r) {
  return {
    id: r.id,
    name: r.name,
    legalName: r.legal_name,
    gstin: r.gstin,
    stateCode: r.state_code,
    stateName: STATE_CODES[r.state_code] ?? null,
    pan: r.pan,
    phone: r.phone,
    email: r.email,
    addressLine1: r.address_line1,
    addressLine2: r.address_line2,
    city: r.city,
    pincode: r.pincode,
    industry: r.industry,
    logoUrl: r.logo_url,
    fyStartMonth: r.fy_start_month,
    currency: r.currency,
    createdAt: r.created_at,
  };
}

// ---- list mine ----------------------------------------------------------
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const rows = await db("business_members as m")
      .join("businesses as b", "b.id", "m.business_id")
      .where({ "m.user_id": req.user.id, "m.is_active": true })
      .whereNull("b.deleted_at")
      .select("b.*", "m.role")
      .orderBy("b.created_at", "asc");

    res.json({
      ok: true,
      data: rows.map((r) => ({ ...toPublic(r), role: r.role })),
    });
  })
);

// ---- create -------------------------------------------------------------
router.post(
  "/",
  validate({ body: z.object(baseFields) }),
  asyncHandler(async (req, res) => {
    const b = req.body;

    // How many shops this plan allows. The free plan allows one, and until
    // now that number was printed on screens and checked by nothing.
    //
    // The allowance is the BEST one they hold: somebody paying for Gold on
    // one shop should not be told they may only have one because another of
    // their shops is on free.
    const allowed = await entitlements.bestBusinessAllowance(req.user.id);
    const owned = await entitlements.ownedBusinessCount(req.user.id);
    if (owned >= allowed) {
      throw new ApiError(
        402,
        "plan_limit",
        allowed === 1
          ? "Your plan covers one shop. Upgrade to open another."
          : `Your plan covers ${allowed} shops and you have ${owned}. Upgrade to open another.`
      );
    }

    // If a GSTIN was given, its first two digits ARE the state. Letting the
    // two disagree would put the wrong tax on every invoice, so the GSTIN
    // wins and we say so rather than silently fixing it.
    if (b.gstin) {
      const fromGstin = stateCodeFromGstin(b.gstin);
      if (fromGstin && fromGstin !== b.stateCode) {
        throw ApiError.badRequest(
          `The GSTIN starts with ${fromGstin}, which is ${STATE_CODES[fromGstin]}, but the state says ${STATE_CODES[b.stateCode]}. They have to match.`
        );
      }
    }

    // Everything or nothing: a business with no owner row is unreachable.
    const created = await db.transaction(async (trx) => {
      const [id] = await trx("businesses").insert({
        ...toRow(b),
        owner_id: req.user.id,
      });

      await trx("business_members").insert({
        business_id: id,
        user_id: req.user.id,
        role: "owner",
        accepted_at: trx.fn.now(),
      });

      // Everyone starts on the free plan. No card, no trial countdown.
      const free = await trx("plans").where({ code: "free" }).first();
      if (free) {
        await trx("subscriptions").insert({
          business_id: id,
          plan_id: free.id,
          status: "active",
          starts_at: trx.fn.now(),
        });
      }

      return trx("businesses").where({ id }).first();
    });

    res.status(201).json({ ok: true, data: { ...toPublic(created), role: "owner" } });
  })
);

// ---- read one -----------------------------------------------------------
router.get(
  "/:businessId",
  requireBusiness("viewer"),
  asyncHandler(async (req, res) => {
    // Not just which plan, but what it still permits: days left, whether it
    // has run out, and whether the grace week is running. The app shows a
    // banner from this, and a banner that only appears after the first
    // refusal is a banner nobody thanks you for.
    const state = await entitlements.forBusiness(req.business.id);

    res.json({
      ok: true,
      data: {
        ...toPublic(req.business),
        // Sent on every read, always complete: a screen never has to decide
        // what a missing preference means.
        settings: settings.read(req.business.settings),
        role: req.membership.role,
        plan: {
          code: state.planCode,
          name: state.planName,
          status: state.status,
          endsAt: state.endsAt,
          daysLeft: state.daysLeft,
          expiringSoon: state.expiringSoon,
          expired: state.expired,
          inGrace: state.inGrace,
          graceDaysLeft: state.graceDaysLeft,
          // true means new bills are refused. The screen should say so
          // before they try, not after.
          blocked: state.blocked,
          limits: state.limits,
        },
      },
    });
  })
);

// ---- update -------------------------------------------------------------
router.patch(
  "/:businessId",
  requireBusiness("manager"),
  validate({
    body: z.object({
      ...patchShape(baseFields),
      // Merged section by section rather than replaced - see settings.js.
      settings: settings.patchSchema.optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const patch = toRow({ ...req.business, ...req.body });

    // Only send what was actually asked for, so an absent field does not
    // get blanked.
    const update = {};
    const map = {
      name: "name", legalName: "legal_name", gstin: "gstin", stateCode: "state_code",
      pan: "pan", phone: "phone", email: "email", addressLine1: "address_line1",
      addressLine2: "address_line2", city: "city", pincode: "pincode",
      industry: "industry", fyStartMonth: "fy_start_month",
    };
    for (const [k, col] of Object.entries(map)) {
      if (req.body[k] !== undefined) update[col] = patch[col];
    }

    if (req.body.settings !== undefined) {
      update.settings = JSON.stringify(settings.merge(req.business.settings, req.body.settings));
    }

    if (Object.keys(update).length) {
      update.updated_at = db.fn.now();
      await db("businesses").where({ id: req.business.id }).update(update);
    }

    const row = await db("businesses").where({ id: req.business.id }).first();
    res.json({ ok: true, data: { ...toPublic(row), settings: settings.read(row.settings) } });
  })
);

// ---- the people who can get in ------------------------------------------
router.get(
  "/:businessId/members",
  requireBusiness("manager"),
  asyncHandler(async (req, res) => {
    const rows = await db("business_members as m")
      .join("users as u", "u.id", "m.user_id")
      .where({ "m.business_id": req.business.id })
      .select("m.id", "m.role", "m.is_active", "m.created_at", "u.name", "u.phone", "u.dial_code");

    res.json({
      ok: true,
      data: rows.map((r) => ({
        id: r.id,
        name: r.name,
        phone: `${r.dial_code} ${r.phone}`,
        role: r.role,
        isActive: Boolean(r.is_active),
        addedAt: r.created_at,
      })),
    });
  })
);

module.exports = router;
