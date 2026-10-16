// ===========================================================================
// RATE LIMITS
// ---------------------------------------------------------------------------
// In-memory, which means each server instance counts on its own. Behind
// several instances that multiplies the real limit - it is a speed bump, not
// a lock.
//
// TODO before you run more than one instance: move the store to Redis
//      (rate-limit-redis). Until then this is honest about what it is.
//
// The OTP limit is the one that matters. Without it, anybody can make your
// SMS provider send a thousand messages at your expense.
// ===========================================================================

const rateLimit = require("express-rate-limit");
const config = require("../config");

const common = {
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    error: { code: "too_many_requests", message: "Too many requests. Try again shortly." },
  },
};

// Everything, as a backstop.
const general = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  max: config.isProd ? 300 : 10000,
});

// Asking for an OTP. Keyed on the phone number being asked about, not the
// caller's IP: one person behind a shared connection should not be able to
// burn through everyone else's allowance, and an attacker rotating IPs
// should not get a fresh allowance each time.
const otpRequest = rateLimit({
  ...common,
  windowMs: 60 * 60 * 1000,
  max: config.otp.maxPerHour,
  keyGenerator: (req) => `otp:${req.body?.dialCode ?? "+91"}${req.body?.phone ?? "unknown"}`,
  skip: () => config.isTest,
  message: {
    ok: false,
    error: {
      code: "too_many_requests",
      message: "Too many codes requested for this number. Try again in an hour.",
    },
  },
});

// Verifying an OTP. Separate from the request limit so guessing is capped
// even when no new codes are being asked for.
const otpVerify = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => `verify:${req.body?.dialCode ?? "+91"}${req.body?.phone ?? "unknown"}`,
  skip: () => config.isTest,
});

// Writes are cheaper to abuse than reads.
const writes = rateLimit({
  ...common,
  windowMs: 60 * 1000,
  max: config.isProd ? 120 : 10000,
});

// Typing in a licence key. Guessing one is hopeless on the arithmetic alone -
// twenty characters from an alphabet of thirty-two - so this is not really
// about brute force. It is about the cost of being wrong: if the key space
// were ever shrunk, or keys were ever issued in a pattern, an unlimited
// redeem endpoint is a free licence generator. Keyed on the signed-in user,
// because that is who would be doing it.
const licenceRedeem = rateLimit({
  ...common,
  windowMs: 60 * 60 * 1000,
  max: 20,
  // No IP fallback. requireAuth runs before this on every route that uses
  // it, so req.user is always there - and an IP fallback would be worse
  // than nothing anyway: two shops in the same market behind one connection
  // would share an allowance.
  keyGenerator: (req) => `licence:${req.user.id}`,
  skip: () => config.isTest,
  message: {
    ok: false,
    error: {
      code: "too_many_requests",
      message: "Too many licence keys tried. Wait an hour, or call support.",
    },
  },
});

// Submitting "I have paid, here is the UTR".
//
// This does not stop the real abuse - one made-up transaction number is one
// request, and no limit catches that. What it stops is a script working
// through numbers across many references, and it caps how much mess one
// account can make in the queue you have to read every morning.
const paymentClaim = rateLimit({
  ...common,
  windowMs: 60 * 60 * 1000,
  max: 15,
  // Same reasoning as licenceRedeem: requireAuth has already run, and an IP
  // fallback would make two shops on one connection share an allowance.
  keyGenerator: (req) => `payment:${req.user.id}`,
  skip: () => config.isTest,
  message: {
    ok: false,
    error: {
      code: "too_many_requests",
      message: "Too many payment submissions. Wait an hour, or call support.",
    },
  },
});

module.exports = { general, otpRequest, otpVerify, writes, licenceRedeem, paymentClaim };
