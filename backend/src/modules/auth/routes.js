// ===========================================================================
// /api/auth
// ===========================================================================

const express = require("express");
const { z } = require("zod");

const service = require("./service");
const db = require("../../db");
const validate = require("../../middleware/validate");
const { requireAuth } = require("../../middleware/auth");
const limits = require("../../middleware/rateLimit");
const asyncHandler = require("../../utils/asyncHandler");

const router = express.Router();

// Indian mobile numbers start 6-9 and are 10 digits. Kept here rather than
// in the service so a different country can be added without touching the
// sign-in logic.
const phone = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, "Enter a 10 digit Indian mobile number");

const dialCode = z.string().trim().regex(/^\+\d{1,4}$/).default("+91");

function meta(req) {
  return { ip: req.ip, userAgent: req.get("user-agent") };
}

// ---- send a code --------------------------------------------------------
router.post(
  "/otp/request",
  limits.otpRequest,
  validate({ body: z.object({ phone, dialCode }) }),
  asyncHandler(async (req, res) => {
    const out = await service.requestOtp({ ...req.body, ip: req.ip });
    res.json({ ok: true, data: out });
  })
);

// ---- check a code and sign in -------------------------------------------
router.post(
  "/otp/verify",
  limits.otpVerify,
  validate({
    body: z.object({
      phone,
      dialCode,
      code: z.string().trim().regex(/^\d{4,8}$/, "Enter the code you were sent"),
    }),
  }),
  asyncHandler(async (req, res) => {
    const out = await service.verifyOtp({ ...req.body, ...meta(req) });
    res.json({ ok: true, data: out });
  })
);

// ---- swap a refresh token for a new pair --------------------------------
router.post(
  "/refresh",
  validate({ body: z.object({ refreshToken: z.string().min(20) }) }),
  asyncHandler(async (req, res) => {
    const out = await service.refresh({ ...req.body, ...meta(req) });
    res.json({ ok: true, data: out });
  })
);

// ---- sign out ------------------------------------------------------------
router.post(
  "/logout",
  validate({
    body: z.object({
      refreshToken: z.string().min(20).optional(),
      allDevices: z.boolean().default(false),
    }),
  }),
  asyncHandler(async (req, res) => {
    // allDevices needs to know who is asking, so it needs a valid access
    // token. Ending one session does not.
    let userId = null;
    if (req.body.allDevices) {
      const { bearer } = require("../../middleware/auth");
      const jwt = require("jsonwebtoken");
      const config = require("../../config");
      try {
        const p = jwt.verify(bearer(req) ?? "", config.jwt.secret, {
          issuer: config.jwt.issuer,
        });
        userId = p.sub;
      } catch {
        userId = null;
      }
    }

    const out = await service.logout({ ...req.body, userId });
    res.json({ ok: true, data: out });
  })
);

// ---- who am I -----------------------------------------------------------
router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const businesses = await service.businessesFor(req.user.id);
    res.json({
      ok: true,
      data: { user: service.publicUser(req.user), businesses },
    });
  })
);

// ---- update my details --------------------------------------------------
router.patch(
  "/me",
  requireAuth,
  validate({
    body: z.object({
      name: z.string().trim().min(1).max(120).optional(),
      email: z.email("Enter a valid email address").max(190).optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const patch = {};
    if (req.body.name !== undefined) patch.name = req.body.name;
    if (req.body.email !== undefined) patch.email = req.body.email;

    if (Object.keys(patch).length) {
      patch.updated_at = db.fn.now();
      await db("users").where({ id: req.user.id }).update(patch);
    }

    const user = await db("users").where({ id: req.user.id }).first();
    res.json({ ok: true, data: { user: service.publicUser(user) } });
  })
);

// ---- my active sessions -------------------------------------------------
router.get(
  "/sessions",
  requireAuth,
  asyncHandler(async (req, res) => {
    const rows = await db("refresh_tokens")
      .where({ user_id: req.user.id })
      .whereNull("revoked_at")
      .where("expires_at", ">", new Date())
      .select("id", "ip", "user_agent", "created_at", "last_used_at")
      .orderBy("created_at", "desc");

    res.json({
      ok: true,
      data: rows.map((r) => ({
        id: r.id,
        ip: r.ip,
        device: r.user_agent,
        signedInAt: r.created_at,
        lastUsedAt: r.last_used_at,
      })),
    });
  })
);

module.exports = router;
