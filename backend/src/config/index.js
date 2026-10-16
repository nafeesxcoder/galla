// ===========================================================================
// CONFIGURATION
// ---------------------------------------------------------------------------
// Everything the app reads from the environment is loaded and CHECKED here,
// once, at boot. Nothing else in the codebase touches process.env.
//
// Why check at boot: a missing JWT secret should stop the server starting,
// not surface three hours later as a confusing 500 on one endpoint.
// ===========================================================================

require("dotenv").config();

function required(name) {
  const v = process.env[name];
  if (v === undefined || v === "") {
    throw new Error(
      `Missing environment variable: ${name}\n` +
        `Copy .env.example to .env and fill it in.`
    );
  }
  return v;
}

function optional(name, fallback) {
  const v = process.env[name];
  return v === undefined || v === "" ? fallback : v;
}

function int(name, fallback) {
  const v = optional(name, String(fallback));
  const n = Number.parseInt(v, 10);
  if (Number.isNaN(n)) throw new Error(`${name} must be a number, got "${v}"`);
  return n;
}

function bool(name, fallback) {
  const v = optional(name, String(fallback)).toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

const env = optional("NODE_ENV", "development");
const isProd = env === "production";

// In production a weak or default secret is a security hole, so refuse to
// start. In development we allow a fixed one so nobody has to configure
// anything to run the project.
function secret(name, devFallback) {
  if (isProd) {
    const v = required(name);
    if (v.length < 32) {
      throw new Error(`${name} must be at least 32 characters in production.`);
    }
    return v;
  }
  return optional(name, devFallback);
}

const config = {
  env,
  isProd,
  isTest: env === "test",
  port: int("PORT", 4000),

  // Where the browser app lives, for CORS
  corsOrigins: optional("CORS_ORIGINS", "http://localhost:3000")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),

  db: {
    host: optional("DB_HOST", "127.0.0.1"),
    port: int("DB_PORT", 3306),
    user: optional("DB_USER", "root"),
    password: optional("DB_PASSWORD", ""),
    database: optional("DB_NAME", "galla"),
    pool: { min: int("DB_POOL_MIN", 2), max: int("DB_POOL_MAX", 10) },

    // Run pending migrations at startup instead of refusing to start.
    //
    // OFF by default, deliberately. Two copies of the server booting at once
    // would both try to migrate, and a restart loop would retry a migration
    // that is failing for a reason the retry cannot fix. Without this the
    // server still CHECKS, and says exactly which command to run - the
    // dangerous state was never "did not migrate", it was "started anyway
    // and pretended to be fine".
    //
    // On a single-instance host, where the alternative is SSHing in after
    // every deploy, turning it on is the sensible trade.
    autoMigrate: bool("DB_AUTO_MIGRATE", false),
  },

  jwt: {
    secret: secret("JWT_SECRET", "dev-only-secret-do-not-use-in-production-32"),
    // Short-lived, because it cannot be revoked once issued.
    accessTtl: optional("JWT_ACCESS_TTL", "15m"),
    // Long-lived, but stored hashed in the database so it CAN be revoked.
    refreshTtlDays: int("JWT_REFRESH_TTL_DAYS", 30),
    issuer: optional("JWT_ISSUER", "mygallabook-api"),
  },

  otp: {
    length: int("OTP_LENGTH", 6),
    ttlMinutes: int("OTP_TTL_MINUTES", 10),
    maxAttempts: int("OTP_MAX_ATTEMPTS", 5),
    // How many OTPs one phone number can request in an hour
    maxPerHour: int("OTP_MAX_PER_HOUR", 5),
    // With no SMS provider wired up, the code is returned in the response
    // so you can build against it. This is FORCED OFF in production - a
    // login that hands out its own OTP is not a login.
    // Returning the code in the response is a login that hands out its own
    // password. It is allowed in exactly one situation: development, with no
    // way to send a real message.
    //
    // OTP_ECHO does NOT override this. An explicit setting normally wins,
    // but not here: .env files get copied to servers, and the failure is an
    // open door rather than a wrong number. Once SMS_PROVIDER is set the
    // echo is off, in every environment - to debug against it, unset
    // SMS_PROVIDER rather than asking for codes to be handed out while a
    // real sender is live.
    echoInResponse:
      isProd || optional("SMS_PROVIDER", "") !== "" ? false : bool("OTP_ECHO", true),
  },

  sms: {
    // "twilio", or "" to send nothing and log the code instead.
    provider: optional("SMS_PROVIDER", "").toLowerCase(),

    // The words that actually reach the phone. {code} is replaced.
    //
    // For an Indian number this text is NOT free: TRAI's DLT rules mean the
    // message has to match a template registered on the DLT portal, word for
    // word, with only the variables differing. A message that does not match
    // is dropped by the operator, silently, after Twilio has accepted it -
    // so a send that "worked" can still never arrive.
    template: optional("SMS_TEMPLATE", "{code} is your myGallaBook verification code. It is valid for {minutes} minutes. Do not share it with anyone."),

    twilio: {
      // From the Twilio console URL: AC...
      accountSid: optional("TWILIO_ACCOUNT_SID", ""),
      // An API key (SK...) and its secret, NOT the account auth token. A key
      // can be revoked on its own if it leaks; the auth token cannot without
      // breaking everything else at the same time.
      apiKeySid: optional("TWILIO_API_KEY_SID", ""),
      apiKeySecret: optional("TWILIO_API_KEY_SECRET", ""),
      // One of these two. A Messaging Service (MG...) is the better one for
      // India because the sender and the DLT registration are attached to it.
      from: optional("TWILIO_FROM", ""),
      messagingServiceSid: optional("TWILIO_MESSAGING_SERVICE_SID", ""),
      // Overridable so the tests can point at a local stand-in instead of
      // spending real money to prove the request is shaped correctly.
      baseUrl: optional("TWILIO_BASE_URL", "https://api.twilio.com"),
    },
  },

  // -------------------------------------------------------------------------
  // Taking money
  // -------------------------------------------------------------------------
  // There is no payment gateway yet. Money arrives by UPI or bank transfer
  // straight into the account below, which means NOTHING TELLS THIS SERVER
  // THAT IT ARRIVED. Everything here is built around that one fact.
  //
  // These details are not secrets - they are printed on invoices and handed
  // to anybody who wants to pay - so they are defaulted here rather than
  // hidden in .env. Setting the matching variable overrides any of them, so
  // changing banks later is a .env edit and not a code change.
  payments: {
    // SWITCHING THE PLAN ON BEFORE ANYBODY HAS CHECKED THE BANK.
    //
    // With true, typing in a UTR starts the plan that second. That is what a
    // customer expects after paying, and waiting hours for a human is how a
    // paid customer spends the evening angry.
    //
    // The cost is real and worth saying out loud: somebody can type twelve
    // digits that are not a payment and get a plan. The row is kept, marked
    // auto_approved, and `node scripts/payments.js` lists every one still
    // unverified - rejecting it takes the plan straight back off. That check
    // is a daily job, not an optional one.
    //
    // Set it false and nothing starts until you approve it by hand.
    autoApprove: bool("PAYMENT_AUTO_APPROVE", true),

    // Shown under the QR so somebody who cannot scan can still pay, and so
    // the figure on screen can be checked against the app.
    upi: {
      id: optional("UPI_ID", ""),
      payeeName: optional("UPI_PAYEE_NAME", ""),
    },

    bank: {
      // The name on the account, as the bank holds it. Shown so a payer can
      // check it against what their own app says when they add the payee -
      // that comparison is the only protection either side has against a
      // digit typed wrong.
      accountName: optional("BANK_ACCOUNT_NAME", "NAFEES AHMAD"),
      accountNumber: optional("BANK_ACCOUNT_NUMBER", "42443379525"),
      ifsc: optional("BANK_IFSC", "SBIN0013429"),
      // SBIN is State Bank of India - that part of an IFSC is the bank and
      // is not a guess. The branch is the last six digits and IS a guess
      // from here, so it is left for you to fill in.
      bankName: optional("BANK_NAME", "State Bank of India"),
      branch: optional("BANK_BRANCH", ""),
      accountType: optional("BANK_ACCOUNT_TYPE", ""),
    },
  },

  logLevel: optional("LOG_LEVEL", isProd ? "info" : "debug"),
};

module.exports = config;
