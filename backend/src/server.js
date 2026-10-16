// ===========================================================================
// STARTING AND STOPPING
// ---------------------------------------------------------------------------
// The shutdown handling is not ceremony. A process killed mid-request during
// a deploy can leave a half-written invoice - stock taken out, the sale not
// recorded. Draining first means in-flight transactions finish.
// ===========================================================================

const app = require("./app");
const config = require("./config");
const db = require("./db");
const logger = require("./utils/logger");
const sms = require("./utils/sms");

async function start() {
  // Fail loudly at boot rather than on the first request at 9am.
  try {
    await db.raw("SELECT 1");
    logger.info({ database: config.db.database }, "database reachable");
  } catch (e) {
    logger.error({ err: e }, "cannot reach the database - not starting");
    process.exit(1);
  }

  // ---------------------------------------------------------------------
  // IS THERE ANYTHING IN IT?
  // ---------------------------------------------------------------------
  // "Reachable" and "usable" are different questions, and until this check
  // existed only the first one was being asked. A freshly deployed server
  // connected to an empty database, logged "API listening", and looked
  // completely healthy - then threw a 500 on the first request that touched
  // a table, with nothing in the startup output hinting at why.
  //
  // Deploying code does not create tables. That is a separate command, and
  // it is the one everybody forgets on the first deploy.
  try {
    const [, pending] = await db.migrate.list();

    if (pending.length) {
      const names = pending.map((p) => (typeof p === "string" ? p : p?.file ?? String(p)));

      if (config.db.autoMigrate) {
        logger.warn({ pending: pending.length }, "database is out of date - running migrations");
        const [batch, ran] = await db.migrate.latest();
        logger.info({ batch, applied: ran.length }, "migrations applied");
      } else {
        logger.error(
          { pending: pending.length, first: names[0] },
          "the database is missing tables - this server cannot serve a single request"
        );
        logger.error("run this in the backend folder:   npx knex migrate:latest");
        logger.error("or set DB_AUTO_MIGRATE=true to have it done at startup");
        // In production, running is worse than not running: every login
        // returns a 500 that says nothing, and the only clue is in a log
        // nobody is watching yet.
        if (config.isProd) {
          logger.error("refusing to start");
          process.exit(1);
        }
      }
    } else {
      logger.info("database schema is up to date");
    }
  } catch (e) {
    logger.error({ err: e }, "could not read the migration state - not starting");
    process.exit(1);
  }

  // ---------------------------------------------------------------------
  // THE TABLES EXIST. IS THERE ANYTHING IN THEM?
  // ---------------------------------------------------------------------
  // Migrations build the structure. The plans and their prices are DATA, and
  // data comes from the seeds - a second command, and the second one
  // everybody forgets.
  //
  // An unseeded database fails quietly, which is worse than failing loudly:
  // the pricing page renders with no plans, every payment quote is refused
  // for having no price, and - the one that hides longest - creating a shop
  // silently skips the subscription row, because the code asks for the free
  // plan and simply moves on when there is none.
  //
  // Not fixed automatically. Seeds insert rows, and a server that re-inserts
  // its price list on every restart is a server that will overwrite a price
  // you changed by hand. Saying so is the right amount of help.
  try {
    const [{ plans }] = await db("plans").count({ plans: "*" });
    const [{ prices }] = await db("plan_prices").count({ prices: "*" });

    if (Number(plans) === 0) {
      logger.error("the plans table is EMPTY - the pricing page and every payment will be broken");
      logger.error("run this in the backend folder:   npx knex seed:run");
    } else if (Number(prices) === 0) {
      logger.warn({ plans }, "plans exist but none of them have a price - payments cannot be quoted");
      logger.warn("run this in the backend folder:   npx knex seed:run");
    } else {
      logger.info({ plans, prices }, "plans and prices are loaded");
    }
  } catch (e) {
    // Never fatal. A counting query that fails for some reason of its own is
    // not a good enough reason to refuse to serve anybody.
    logger.warn({ err: e }, "could not check whether the plans are seeded");
  }

  // Say what will happen to login codes, at boot, in one line.
  //
  // A half-configured provider is the dangerous state: it looks set up, and
  // every single login fails at the moment a real shopkeeper tries it. In
  // production that is worth refusing to start for - nobody can sign in
  // anyway, and a server that runs while being useless is harder to notice
  // than one that does not start.
  const gaps = sms.missing();
  if (gaps.length) {
    logger.error({ missing: gaps }, "SMS_PROVIDER is set but the settings are incomplete");
    if (config.isProd) {
      logger.error("refusing to start: nobody would be able to sign in");
      process.exit(1);
    }
  } else if (sms.configured()) {
    logger.info("login codes will be sent by SMS");
  } else {
    logger.warn(
      config.isProd
        ? "NO SMS PROVIDER - nobody can sign in. Set SMS_PROVIDER and the Twilio settings."
        : "no SMS provider - login codes are returned in the response for development"
    );
  }

  const server = app.listen(config.port, () => {
    logger.info(
      { port: config.port, env: config.env },
      `API listening on http://localhost:${config.port}`
    );
  });

  async function shutdown(signal) {
    logger.info({ signal }, "shutting down");

    server.close(async () => {
      try {
        await db.destroy();
        logger.info("closed cleanly");
        process.exit(0);
      } catch (e) {
        logger.error({ err: e }, "error while closing");
        process.exit(1);
      }
    });

    // If something is stuck, do not hang forever.
    setTimeout(() => {
      logger.error("could not close in 10s - forcing exit");
      process.exit(1);
    }, 10000).unref();
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  // A rejected promise nobody caught is a bug. Log it with its stack rather
  // than letting the process die silently.
  process.on("unhandledRejection", (reason) => {
    logger.error({ err: reason }, "unhandled promise rejection");
  });
  process.on("uncaughtException", (err) => {
    logger.error({ err }, "uncaught exception - shutting down");
    shutdown("uncaughtException");
  });
}

start();
