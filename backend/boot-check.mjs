// ===========================================================================
// myGallaBook - the server now checks the database has tables in it
// ---------------------------------------------------------------------------
// Build 2026-10-16 15:26
//
// Run this from inside the BACKEND folder, then restart the app:
//
//     node boot-check.mjs
//
// WHAT WENT WRONG
// ---------------
// A freshly deployed backend printed "API listening" and looked perfectly
// healthy. Every login then returned a 500 that said nothing, because the
// database it was connected to had no tables in it.
//
// Deploying code does not create tables. That is a separate command, and it
// is the one everybody forgets on a first deploy. The startup check only
// asked "can I reach the database" - and reachable is not the same question
// as usable. The server came up, looked fine, and failed on the first
// request that touched a table.
//
// WHAT IT DOES NOW
// ----------------
// At startup it reads the migration state and does one of three things:
//
//   schema is up to date       says so, and starts
//   tables missing             says which command to run, and in production
//                              REFUSES TO START
//   tables missing, and
//   DB_AUTO_MIGRATE=true       runs the migrations itself, then starts
//
// Then it checks the SECOND thing everybody forgets - whether there is any
// data in those tables:
//
//   plans and prices loaded    says how many, and starts
//   plans table empty          says to run the seeds, and starts anyway
//
// An unseeded database does not crash, which is what makes it nasty: the
// pricing page renders with no plans, every payment quote is refused for
// having no price, and creating a shop silently skips the subscription row
// because the code asks for the free plan and moves on when there is none.
// It warns rather than refusing, because that is a broken shop, not an
// unserviceable server - and a seeding slip should not take the site down.
//
// Refusing to start is the point. A server that runs while being unable to
// serve a single request is harder to notice than one that does not start,
// and the only clue is a 500 in a log nobody is watching yet.
//
// SHOULD YOU TURN ON DB_AUTO_MIGRATE
// ----------------------------------
// On your setup - one instance, one host - yes. It saves an SSH session
// after every deploy and this is exactly the trip-up it prevents.
//
// It is OFF by default because two copies of the server booting together
// would both try to migrate, and a restart loop would keep retrying a
// migration that is failing for a reason retrying cannot fix. Add this to
// your host's environment variables:
//
//     DB_AUTO_MIGRATE=true
//
// ALSO FIXED: the migration folder was "./migrations", resolved against
// whatever directory the process happened to start in. A host that launches
// the app from somewhere else found no migrations at all - which looks
// exactly like "there is nothing to migrate". It is an absolute path now.
// ===========================================================================

import { mkdirSync, writeFileSync, existsSync, readFileSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";

const FILES = {"src/server.js":"// ===========================================================================\n// STARTING AND STOPPING\n// ---------------------------------------------------------------------------\n// The shutdown handling is not ceremony. A process killed mid-request during\n// a deploy can leave a half-written invoice - stock taken out, the sale not\n// recorded. Draining first means in-flight transactions finish.\n// ===========================================================================\n\nconst app = require(\"./app\");\nconst config = require(\"./config\");\nconst db = require(\"./db\");\nconst logger = require(\"./utils/logger\");\nconst sms = require(\"./utils/sms\");\n\nasync function start() {\n  // Fail loudly at boot rather than on the first request at 9am.\n  try {\n    await db.raw(\"SELECT 1\");\n    logger.info({ database: config.db.database }, \"database reachable\");\n  } catch (e) {\n    logger.error({ err: e }, \"cannot reach the database - not starting\");\n    process.exit(1);\n  }\n\n  // ---------------------------------------------------------------------\n  // IS THERE ANYTHING IN IT?\n  // ---------------------------------------------------------------------\n  // \"Reachable\" and \"usable\" are different questions, and until this check\n  // existed only the first one was being asked. A freshly deployed server\n  // connected to an empty database, logged \"API listening\", and looked\n  // completely healthy - then threw a 500 on the first request that touched\n  // a table, with nothing in the startup output hinting at why.\n  //\n  // Deploying code does not create tables. That is a separate command, and\n  // it is the one everybody forgets on the first deploy.\n  try {\n    const [, pending] = await db.migrate.list();\n\n    if (pending.length) {\n      const names = pending.map((p) => (typeof p === \"string\" ? p : p?.file ?? String(p)));\n\n      if (config.db.autoMigrate) {\n        logger.warn({ pending: pending.length }, \"database is out of date - running migrations\");\n        const [batch, ran] = await db.migrate.latest();\n        logger.info({ batch, applied: ran.length }, \"migrations applied\");\n      } else {\n        logger.error(\n          { pending: pending.length, first: names[0] },\n          \"the database is missing tables - this server cannot serve a single request\"\n        );\n        logger.error(\"run this in the backend folder:   npx knex migrate:latest\");\n        logger.error(\"or set DB_AUTO_MIGRATE=true to have it done at startup\");\n        // In production, running is worse than not running: every login\n        // returns a 500 that says nothing, and the only clue is in a log\n        // nobody is watching yet.\n        if (config.isProd) {\n          logger.error(\"refusing to start\");\n          process.exit(1);\n        }\n      }\n    } else {\n      logger.info(\"database schema is up to date\");\n    }\n  } catch (e) {\n    logger.error({ err: e }, \"could not read the migration state - not starting\");\n    process.exit(1);\n  }\n\n  // ---------------------------------------------------------------------\n  // THE TABLES EXIST. IS THERE ANYTHING IN THEM?\n  // ---------------------------------------------------------------------\n  // Migrations build the structure. The plans and their prices are DATA, and\n  // data comes from the seeds - a second command, and the second one\n  // everybody forgets.\n  //\n  // An unseeded database fails quietly, which is worse than failing loudly:\n  // the pricing page renders with no plans, every payment quote is refused\n  // for having no price, and - the one that hides longest - creating a shop\n  // silently skips the subscription row, because the code asks for the free\n  // plan and simply moves on when there is none.\n  //\n  // Not fixed automatically. Seeds insert rows, and a server that re-inserts\n  // its price list on every restart is a server that will overwrite a price\n  // you changed by hand. Saying so is the right amount of help.\n  try {\n    const [{ plans }] = await db(\"plans\").count({ plans: \"*\" });\n    const [{ prices }] = await db(\"plan_prices\").count({ prices: \"*\" });\n\n    if (Number(plans) === 0) {\n      logger.error(\"the plans table is EMPTY - the pricing page and every payment will be broken\");\n      logger.error(\"run this in the backend folder:   npx knex seed:run\");\n    } else if (Number(prices) === 0) {\n      logger.warn({ plans }, \"plans exist but none of them have a price - payments cannot be quoted\");\n      logger.warn(\"run this in the backend folder:   npx knex seed:run\");\n    } else {\n      logger.info({ plans, prices }, \"plans and prices are loaded\");\n    }\n  } catch (e) {\n    // Never fatal. A counting query that fails for some reason of its own is\n    // not a good enough reason to refuse to serve anybody.\n    logger.warn({ err: e }, \"could not check whether the plans are seeded\");\n  }\n\n  // Say what will happen to login codes, at boot, in one line.\n  //\n  // A half-configured provider is the dangerous state: it looks set up, and\n  // every single login fails at the moment a real shopkeeper tries it. In\n  // production that is worth refusing to start for - nobody can sign in\n  // anyway, and a server that runs while being useless is harder to notice\n  // than one that does not start.\n  const gaps = sms.missing();\n  if (gaps.length) {\n    logger.error({ missing: gaps }, \"SMS_PROVIDER is set but the settings are incomplete\");\n    if (config.isProd) {\n      logger.error(\"refusing to start: nobody would be able to sign in\");\n      process.exit(1);\n    }\n  } else if (sms.configured()) {\n    logger.info(\"login codes will be sent by SMS\");\n  } else {\n    logger.warn(\n      config.isProd\n        ? \"NO SMS PROVIDER - nobody can sign in. Set SMS_PROVIDER and the Twilio settings.\"\n        : \"no SMS provider - login codes are returned in the response for development\"\n    );\n  }\n\n  const server = app.listen(config.port, () => {\n    logger.info(\n      { port: config.port, env: config.env },\n      `API listening on http://localhost:${config.port}`\n    );\n  });\n\n  async function shutdown(signal) {\n    logger.info({ signal }, \"shutting down\");\n\n    server.close(async () => {\n      try {\n        await db.destroy();\n        logger.info(\"closed cleanly\");\n        process.exit(0);\n      } catch (e) {\n        logger.error({ err: e }, \"error while closing\");\n        process.exit(1);\n      }\n    });\n\n    // If something is stuck, do not hang forever.\n    setTimeout(() => {\n      logger.error(\"could not close in 10s - forcing exit\");\n      process.exit(1);\n    }, 10000).unref();\n  }\n\n  process.on(\"SIGTERM\", () => shutdown(\"SIGTERM\"));\n  process.on(\"SIGINT\", () => shutdown(\"SIGINT\"));\n\n  // A rejected promise nobody caught is a bug. Log it with its stack rather\n  // than letting the process die silently.\n  process.on(\"unhandledRejection\", (reason) => {\n    logger.error({ err: reason }, \"unhandled promise rejection\");\n  });\n  process.on(\"uncaughtException\", (err) => {\n    logger.error({ err }, \"uncaught exception - shutting down\");\n    shutdown(\"uncaughtException\");\n  });\n}\n\nstart();\n","src/config/index.js":"// ===========================================================================\n// CONFIGURATION\n// ---------------------------------------------------------------------------\n// Everything the app reads from the environment is loaded and CHECKED here,\n// once, at boot. Nothing else in the codebase touches process.env.\n//\n// Why check at boot: a missing JWT secret should stop the server starting,\n// not surface three hours later as a confusing 500 on one endpoint.\n// ===========================================================================\n\nrequire(\"dotenv\").config();\n\nfunction required(name) {\n  const v = process.env[name];\n  if (v === undefined || v === \"\") {\n    throw new Error(\n      `Missing environment variable: ${name}\\n` +\n        `Copy .env.example to .env and fill it in.`\n    );\n  }\n  return v;\n}\n\nfunction optional(name, fallback) {\n  const v = process.env[name];\n  return v === undefined || v === \"\" ? fallback : v;\n}\n\nfunction int(name, fallback) {\n  const v = optional(name, String(fallback));\n  const n = Number.parseInt(v, 10);\n  if (Number.isNaN(n)) throw new Error(`${name} must be a number, got \"${v}\"`);\n  return n;\n}\n\nfunction bool(name, fallback) {\n  const v = optional(name, String(fallback)).toLowerCase();\n  return v === \"1\" || v === \"true\" || v === \"yes\";\n}\n\nconst env = optional(\"NODE_ENV\", \"development\");\nconst isProd = env === \"production\";\n\n// In production a weak or default secret is a security hole, so refuse to\n// start. In development we allow a fixed one so nobody has to configure\n// anything to run the project.\nfunction secret(name, devFallback) {\n  if (isProd) {\n    const v = required(name);\n    if (v.length < 32) {\n      throw new Error(`${name} must be at least 32 characters in production.`);\n    }\n    return v;\n  }\n  return optional(name, devFallback);\n}\n\nconst config = {\n  env,\n  isProd,\n  isTest: env === \"test\",\n  port: int(\"PORT\", 4000),\n\n  // Where the browser app lives, for CORS\n  corsOrigins: optional(\"CORS_ORIGINS\", \"http://localhost:3000\")\n    .split(\",\")\n    .map((s) => s.trim())\n    .filter(Boolean),\n\n  db: {\n    host: optional(\"DB_HOST\", \"127.0.0.1\"),\n    port: int(\"DB_PORT\", 3306),\n    user: optional(\"DB_USER\", \"root\"),\n    password: optional(\"DB_PASSWORD\", \"\"),\n    database: optional(\"DB_NAME\", \"galla\"),\n    pool: { min: int(\"DB_POOL_MIN\", 2), max: int(\"DB_POOL_MAX\", 10) },\n\n    // Run pending migrations at startup instead of refusing to start.\n    //\n    // OFF by default, deliberately. Two copies of the server booting at once\n    // would both try to migrate, and a restart loop would retry a migration\n    // that is failing for a reason the retry cannot fix. Without this the\n    // server still CHECKS, and says exactly which command to run - the\n    // dangerous state was never \"did not migrate\", it was \"started anyway\n    // and pretended to be fine\".\n    //\n    // On a single-instance host, where the alternative is SSHing in after\n    // every deploy, turning it on is the sensible trade.\n    autoMigrate: bool(\"DB_AUTO_MIGRATE\", false),\n  },\n\n  jwt: {\n    secret: secret(\"JWT_SECRET\", \"dev-only-secret-do-not-use-in-production-32\"),\n    // Short-lived, because it cannot be revoked once issued.\n    accessTtl: optional(\"JWT_ACCESS_TTL\", \"15m\"),\n    // Long-lived, but stored hashed in the database so it CAN be revoked.\n    refreshTtlDays: int(\"JWT_REFRESH_TTL_DAYS\", 30),\n    issuer: optional(\"JWT_ISSUER\", \"mygallabook-api\"),\n  },\n\n  otp: {\n    length: int(\"OTP_LENGTH\", 6),\n    ttlMinutes: int(\"OTP_TTL_MINUTES\", 10),\n    maxAttempts: int(\"OTP_MAX_ATTEMPTS\", 5),\n    // How many OTPs one phone number can request in an hour\n    maxPerHour: int(\"OTP_MAX_PER_HOUR\", 5),\n    // With no SMS provider wired up, the code is returned in the response\n    // so you can build against it. This is FORCED OFF in production - a\n    // login that hands out its own OTP is not a login.\n    // Returning the code in the response is a login that hands out its own\n    // password. It is allowed in exactly one situation: development, with no\n    // way to send a real message.\n    //\n    // OTP_ECHO does NOT override this. An explicit setting normally wins,\n    // but not here: .env files get copied to servers, and the failure is an\n    // open door rather than a wrong number. Once SMS_PROVIDER is set the\n    // echo is off, in every environment - to debug against it, unset\n    // SMS_PROVIDER rather than asking for codes to be handed out while a\n    // real sender is live.\n    echoInResponse:\n      isProd || optional(\"SMS_PROVIDER\", \"\") !== \"\" ? false : bool(\"OTP_ECHO\", true),\n  },\n\n  sms: {\n    // \"twilio\", or \"\" to send nothing and log the code instead.\n    provider: optional(\"SMS_PROVIDER\", \"\").toLowerCase(),\n\n    // The words that actually reach the phone. {code} is replaced.\n    //\n    // For an Indian number this text is NOT free: TRAI's DLT rules mean the\n    // message has to match a template registered on the DLT portal, word for\n    // word, with only the variables differing. A message that does not match\n    // is dropped by the operator, silently, after Twilio has accepted it -\n    // so a send that \"worked\" can still never arrive.\n    template: optional(\"SMS_TEMPLATE\", \"{code} is your myGallaBook verification code. It is valid for {minutes} minutes. Do not share it with anyone.\"),\n\n    twilio: {\n      // From the Twilio console URL: AC...\n      accountSid: optional(\"TWILIO_ACCOUNT_SID\", \"\"),\n      // An API key (SK...) and its secret, NOT the account auth token. A key\n      // can be revoked on its own if it leaks; the auth token cannot without\n      // breaking everything else at the same time.\n      apiKeySid: optional(\"TWILIO_API_KEY_SID\", \"\"),\n      apiKeySecret: optional(\"TWILIO_API_KEY_SECRET\", \"\"),\n      // One of these two. A Messaging Service (MG...) is the better one for\n      // India because the sender and the DLT registration are attached to it.\n      from: optional(\"TWILIO_FROM\", \"\"),\n      messagingServiceSid: optional(\"TWILIO_MESSAGING_SERVICE_SID\", \"\"),\n      // Overridable so the tests can point at a local stand-in instead of\n      // spending real money to prove the request is shaped correctly.\n      baseUrl: optional(\"TWILIO_BASE_URL\", \"https://api.twilio.com\"),\n    },\n  },\n\n  // -------------------------------------------------------------------------\n  // Taking money\n  // -------------------------------------------------------------------------\n  // There is no payment gateway yet. Money arrives by UPI or bank transfer\n  // straight into the account below, which means NOTHING TELLS THIS SERVER\n  // THAT IT ARRIVED. Everything here is built around that one fact.\n  //\n  // These details are not secrets - they are printed on invoices and handed\n  // to anybody who wants to pay - so they are defaulted here rather than\n  // hidden in .env. Setting the matching variable overrides any of them, so\n  // changing banks later is a .env edit and not a code change.\n  payments: {\n    // SWITCHING THE PLAN ON BEFORE ANYBODY HAS CHECKED THE BANK.\n    //\n    // With true, typing in a UTR starts the plan that second. That is what a\n    // customer expects after paying, and waiting hours for a human is how a\n    // paid customer spends the evening angry.\n    //\n    // The cost is real and worth saying out loud: somebody can type twelve\n    // digits that are not a payment and get a plan. The row is kept, marked\n    // auto_approved, and `node scripts/payments.js` lists every one still\n    // unverified - rejecting it takes the plan straight back off. That check\n    // is a daily job, not an optional one.\n    //\n    // Set it false and nothing starts until you approve it by hand.\n    autoApprove: bool(\"PAYMENT_AUTO_APPROVE\", true),\n\n    // Shown under the QR so somebody who cannot scan can still pay, and so\n    // the figure on screen can be checked against the app.\n    upi: {\n      id: optional(\"UPI_ID\", \"\"),\n      payeeName: optional(\"UPI_PAYEE_NAME\", \"\"),\n    },\n\n    bank: {\n      // The name on the account, as the bank holds it. Shown so a payer can\n      // check it against what their own app says when they add the payee -\n      // that comparison is the only protection either side has against a\n      // digit typed wrong.\n      accountName: optional(\"BANK_ACCOUNT_NAME\", \"NAFEES AHMAD\"),\n      accountNumber: optional(\"BANK_ACCOUNT_NUMBER\", \"42443379525\"),\n      ifsc: optional(\"BANK_IFSC\", \"SBIN0013429\"),\n      // SBIN is State Bank of India - that part of an IFSC is the bank and\n      // is not a guess. The branch is the last six digits and IS a guess\n      // from here, so it is left for you to fill in.\n      bankName: optional(\"BANK_NAME\", \"State Bank of India\"),\n      branch: optional(\"BANK_BRANCH\", \"\"),\n      accountType: optional(\"BANK_ACCOUNT_TYPE\", \"\"),\n    },\n  },\n\n  logLevel: optional(\"LOG_LEVEL\", isProd ? \"info\" : \"debug\"),\n};\n\nmodule.exports = config;\n","knexfile.js":"// ===========================================================================\n// KNEX CONFIGURATION\n// ---------------------------------------------------------------------------\n// Used by the knex CLI (npm run migrate, npm run seed) and by src/db.\n// The connection details come from src/config, so there is one source of\n// truth for them.\n// ===========================================================================\n\nconst path = require(\"node:path\");\nconst config = require(\"./src/config\");\n\n/** @type {import('knex').Knex.Config} */\nconst base = {\n  client: \"mysql2\",\n  connection: {\n    host: config.db.host,\n    port: config.db.port,\n    user: config.db.user,\n    password: config.db.password,\n    database: config.db.database,\n    charset: \"utf8mb4\",\n    // Money is stored in paise as BIGINT. The mysql2 driver returns BIGINT\n    // as a string by default to avoid losing precision; we want numbers,\n    // and every amount we store is far below Number.MAX_SAFE_INTEGER\n    // (90,07,19,92,54,740 rupees), so this is safe.\n    supportBigNumbers: true,\n    bigNumberStrings: false,\n    // DATE columns should come back as \"2026-04-01\", not a Date object in\n    // the server's timezone, which silently shifts the day.\n    dateStrings: [\"DATE\"],\n    timezone: \"Z\",\n  },\n  pool: config.db.pool,\n  // Absolute, not \"./migrations\". A relative path is resolved against\n  // whatever directory the process happens to have been started in, and a\n  // host that launches the app from somewhere else finds no migrations at\n  // all - which looks identical to \"there is nothing to migrate\".\n  migrations: { directory: path.join(__dirname, \"migrations\"), tableName: \"knex_migrations\" },\n  seeds: { directory: path.join(__dirname, \"seeds\") },\n};\n\nmodule.exports = {\n  development: base,\n  test: {\n    ...base,\n    connection: { ...base.connection, database: config.db.database },\n    pool: { min: 1, max: 5 },\n  },\n  production: {\n    ...base,\n    pool: { ...config.db.pool, min: 2 },\n  },\n};\n"};
const here = process.cwd();

console.log("");
console.log("  myGallaBook - startup database check");
console.log("  " + "-".repeat(58));
console.log("  Build 2026-10-16 15:26");
console.log("");

if (!(existsSync(join(here, "package.json")) && existsSync(join(here, "src")) && existsSync(join(here, "migrations")))) {
  console.log("  This is not the backend folder:");
  console.log("      " + here);
  console.log("");
  console.log("  Run it from the one with src/ and migrations/ in it.");
  console.log("  Nothing has been written.");
  console.log("");
  process.exit(1);
}

let written = 0, backed = 0, same = 0;
for (const [rel, content] of Object.entries(FILES)) {
  const file = join(here, rel);
  mkdirSync(dirname(file), { recursive: true });
  if (existsSync(file)) {
    if (readFileSync(file, "utf8") === content) { same++; continue; }
    copyFileSync(file, file + ".bak");
    backed++;
  }
  writeFileSync(file, content);
  written++;
}

console.log(`  ${written} written (${backed} replaced and backed up as .bak)`);
if (same) console.log(`  ${same} already up to date`);
console.log("");
console.log("  ON YOUR SERVER");
console.log("  " + "-".repeat(58));
console.log("  Add this environment variable, then restart the app:");
console.log("");
console.log("      DB_AUTO_MIGRATE=true");
console.log("");
console.log("  The startup log will then say one of these, every time:");
console.log("");
console.log("      database schema is up to date");
console.log("      database is out of date - running migrations");
console.log("      the database is missing tables - ... refusing to start");
console.log("");
console.log("  If you would rather run migrations by hand, leave the variable");
console.log("  out. The check still runs, it just tells you to run:");
console.log("");
console.log("      npx knex migrate:latest");
console.log("");
console.log("  AND ON A BRAND NEW DATABASE, THE SEEDS");
console.log("  " + "-".repeat(58));
console.log("  Migrations build the tables. The plans and their prices are");
console.log("  DATA, and that is a second command:");
console.log("");
console.log("      npx knex seed:run");
console.log("");
console.log("  Run it ONCE on a fresh database. It is not automatic because");
console.log("  seeds insert rows - a server that re-ran them on every restart");
console.log("  would overwrite a price you had changed by hand.");
console.log("");
console.log("  The startup log tells you which state you are in:");
console.log("");
console.log("      plans and prices are loaded              good");
console.log("      the plans table is EMPTY - ...           run the seeds");
console.log("");
