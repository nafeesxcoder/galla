// ===========================================================================
// AUTHENTICATION
// ---------------------------------------------------------------------------
// Sign-in is by mobile number and a one-time code. No passwords, which is
// right for this market: a shopkeeper will not remember one, and a password
// they do remember will be their phone number anyway.
//
// Three things here are deliberate and worth not undoing later:
//
//   1. The OTP is stored HASHED. Anyone who reads the database - a leaked
//      backup, an employee - still cannot sign in as a customer.
//
//   2. Refresh tokens ROTATE. Each refresh issues a new one and kills the
//      old. If a token is ever presented twice, it was stolen, and every
//      session for that user is ended.
//
//   3. Verifying a code that does not exist takes the same work as verifying
//      one that does, so the response time cannot be used to find out which
//      numbers are registered.
// ===========================================================================

const crypto = require("node:crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const db = require("../../db");
const config = require("../../config");
const ApiError = require("../../utils/ApiError");
const logger = require("../../utils/logger");
const sms = require("../../utils/sms");

// A hash of a code that is not a real code, used to burn the same CPU time
// when no OTP row exists. Generated once at boot.
const DUMMY_HASH = bcrypt.hashSync("000000", 10);

// ---------------------------------------------------------------------------
// OTP
// ---------------------------------------------------------------------------

function generateCode(length) {
  // crypto, not Math.random: Math.random is predictable enough that an
  // attacker who sees a few codes can work out the next ones.
  const max = 10 ** length;
  const n = crypto.randomInt(0, max);
  return String(n).padStart(length, "0");
}

async function requestOtp({ dialCode = "+91", phone, ip }) {
  const code = generateCode(config.otp.length);
  const codeHash = await bcrypt.hash(code, 10);

  const expiresAt = new Date(Date.now() + config.otp.ttlMinutes * 60 * 1000);

  // Any code sent earlier is dead the moment a new one goes out. Otherwise
  // several live codes exist for one number at once, and the attacker only
  // has to guess any of them.
  await db("otp_codes")
    .where({ dial_code: dialCode, phone })
    .whereNull("consumed_at")
    .update({ consumed_at: db.fn.now() });

  await db("otp_codes").insert({
    dial_code: dialCode,
    phone,
    code_hash: codeHash,
    expires_at: expiresAt,
    request_ip: ip ?? null,
  });

  const delivery = await sms.sendLoginCode({ dialCode, phone, code });

  // If there is no other way for the person to learn the code, a failed
  // send is a failed request - and it has to say so. Returning sent: true
  // and letting them wait for a message that is never coming is the worst
  // of the options: they retry, burn their hourly allowance, and conclude
  // the app is broken without ever being told what went wrong.
  if (!delivery.ok && !delivery.skipped && !config.otp.echoInResponse) {
    throw new ApiError(
      502,
      "sms_failed",
      "The code could not be sent just now. Try again in a minute."
    );
  }

  return {
    sent: Boolean(delivery.ok),
    expiresInSeconds: config.otp.ttlMinutes * 60,
    // Development only. config forces this off in production AND whenever a
    // real sender is configured, so it cannot be left on by accident.
    ...(config.otp.echoInResponse ? { devCode: code } : {}),
  };
}

async function verifyOtp({ dialCode = "+91", phone, code, ip, userAgent }) {
  const row = await db("otp_codes")
    .where({ dial_code: dialCode, phone })
    .whereNull("consumed_at")
    .orderBy("id", "desc")
    .first();

  // No code for this number. Still do the bcrypt work, so this takes as
  // long as a real check and cannot be told apart by timing.
  if (!row) {
    await bcrypt.compare(code, DUMMY_HASH);
    throw ApiError.badRequest("That code is wrong or has expired.");
  }

  if (new Date(row.expires_at) < new Date()) {
    await bcrypt.compare(code, DUMMY_HASH);
    throw ApiError.badRequest("That code has expired. Ask for a new one.");
  }

  if (row.attempts >= config.otp.maxAttempts) {
    throw ApiError.tooMany("Too many wrong tries. Ask for a new code.");
  }

  const match = await bcrypt.compare(code, row.code_hash);

  if (!match) {
    await db("otp_codes").where({ id: row.id }).increment("attempts", 1);
    // The same message whether the code was wrong or there was none, so
    // nothing here reveals which numbers are registered.
    throw ApiError.badRequest("That code is wrong or has expired.");
  }

  // Burn it. A correct code is single use.
  await db("otp_codes").where({ id: row.id }).update({ consumed_at: db.fn.now() });

  // First sign-in creates the account. There is no separate registration
  // step - for this audience an extra screen is an extra reason to leave.
  let user = await db("users").where({ dial_code: dialCode, phone }).first();
  let isNew = false;

  if (!user) {
    const [id] = await db("users").insert({
      dial_code: dialCode,
      phone,
      phone_verified_at: db.fn.now(),
      last_login_at: db.fn.now(),
    });
    user = await db("users").where({ id }).first();
    isNew = true;
  } else {
    if (user.is_blocked) throw ApiError.forbidden("This account has been blocked.");
    await db("users").where({ id: user.id }).update({
      last_login_at: db.fn.now(),
      phone_verified_at: user.phone_verified_at ?? db.fn.now(),
    });
  }

  const tokens = await issueTokens(user, { ip, userAgent });
  return { user: publicUser(user), isNew, ...tokens };
}

// ---------------------------------------------------------------------------
// Tokens
// ---------------------------------------------------------------------------

function sha256(s) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

function signAccessToken(user) {
  return jwt.sign(
    { sub: String(user.id), typ: "access" },
    config.jwt.secret,
    { expiresIn: config.jwt.accessTtl, issuer: config.jwt.issuer }
  );
}

async function issueTokens(user, { ip, userAgent } = {}) {
  const accessToken = signAccessToken(user);

  // The refresh token is opaque random bytes, not a JWT. There is nothing
  // to read in it, and it is only valid because a row in the database says
  // so - which is exactly what makes it revocable.
  const refreshToken = crypto.randomBytes(48).toString("base64url");
  const expiresAt = new Date(
    Date.now() + config.jwt.refreshTtlDays * 24 * 60 * 60 * 1000
  );

  await db("refresh_tokens").insert({
    user_id: user.id,
    token_hash: sha256(refreshToken),
    expires_at: expiresAt,
    ip: ip ?? null,
    user_agent: (userAgent ?? "").slice(0, 255) || null,
  });

  return {
    accessToken,
    refreshToken,
    expiresIn: config.jwt.accessTtl,
  };
}

async function refresh({ refreshToken, ip, userAgent }) {
  const hash = sha256(refreshToken);
  const row = await db("refresh_tokens").where({ token_hash: hash }).first();

  if (!row) throw ApiError.unauthorized("Please sign in again.");

  // A token that was already revoked is being presented again. Either it
  // was stolen, or the real owner's copy was. Either way end every session
  // for this user and make them sign in again - the standard response to
  // suspected token theft.
  if (row.revoked_at) {
    logger.warn({ userId: row.user_id }, "revoked refresh token reused - ending all sessions");
    await db("refresh_tokens")
      .where({ user_id: row.user_id })
      .whereNull("revoked_at")
      .update({ revoked_at: db.fn.now() });
    throw ApiError.unauthorized("Please sign in again.");
  }

  if (new Date(row.expires_at) < new Date()) {
    throw ApiError.unauthorized("Your session expired. Please sign in again.");
  }

  const user = await db("users").where({ id: row.user_id }).first();
  if (!user) throw ApiError.unauthorized("Please sign in again.");
  if (user.is_blocked) throw ApiError.forbidden("This account has been blocked.");

  // Rotate: this one dies, a new one is issued.
  await db("refresh_tokens")
    .where({ id: row.id })
    .update({ revoked_at: db.fn.now(), last_used_at: db.fn.now() });

  const tokens = await issueTokens(user, { ip, userAgent });
  return { user: publicUser(user), ...tokens };
}

async function logout({ refreshToken, allDevices = false, userId }) {
  if (allDevices && userId) {
    const n = await db("refresh_tokens")
      .where({ user_id: userId })
      .whereNull("revoked_at")
      .update({ revoked_at: db.fn.now() });
    return { endedSessions: n };
  }

  if (!refreshToken) return { endedSessions: 0 };

  const n = await db("refresh_tokens")
    .where({ token_hash: sha256(refreshToken) })
    .whereNull("revoked_at")
    .update({ revoked_at: db.fn.now() });

  return { endedSessions: n };
}

// ---------------------------------------------------------------------------

/** What of a user row is safe to send to a client. */
function publicUser(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    dialCode: u.dial_code,
    phoneVerified: Boolean(u.phone_verified_at),
    createdAt: u.created_at,
  };
}

/** Every business this user can get into, with their role in each. */
async function businessesFor(userId) {
  const rows = await db("business_members as m")
    .join("businesses as b", "b.id", "m.business_id")
    .where({ "m.user_id": userId, "m.is_active": true })
    .whereNull("b.deleted_at")
    .select(
      "b.id",
      "b.name",
      "b.gstin",
      "b.state_code",
      "b.industry",
      "b.logo_url",
      "m.role"
    )
    .orderBy("b.created_at", "asc");

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    gstin: r.gstin,
    stateCode: r.state_code,
    industry: r.industry,
    logoUrl: r.logo_url,
    role: r.role,
  }));
}

module.exports = {
  requestOtp,
  verifyOtp,
  refresh,
  logout,
  publicUser,
  businessesFor,
  issueTokens,
};
