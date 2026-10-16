// ===========================================================================
// KNEX CONFIGURATION
// ---------------------------------------------------------------------------
// Used by the knex CLI (npm run migrate, npm run seed) and by src/db.
// The connection details come from src/config, so there is one source of
// truth for them.
// ===========================================================================

const path = require("node:path");
const config = require("./src/config");

/** @type {import('knex').Knex.Config} */
const base = {
  client: "mysql2",
  connection: {
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    charset: "utf8mb4",
    // Money is stored in paise as BIGINT. The mysql2 driver returns BIGINT
    // as a string by default to avoid losing precision; we want numbers,
    // and every amount we store is far below Number.MAX_SAFE_INTEGER
    // (90,07,19,92,54,740 rupees), so this is safe.
    supportBigNumbers: true,
    bigNumberStrings: false,
    // DATE columns should come back as "2026-04-01", not a Date object in
    // the server's timezone, which silently shifts the day.
    dateStrings: ["DATE"],
    timezone: "Z",
  },
  pool: config.db.pool,
  // Absolute, not "./migrations". A relative path is resolved against
  // whatever directory the process happens to have been started in, and a
  // host that launches the app from somewhere else finds no migrations at
  // all - which looks identical to "there is nothing to migrate".
  migrations: { directory: path.join(__dirname, "migrations"), tableName: "knex_migrations" },
  seeds: { directory: path.join(__dirname, "seeds") },
};

module.exports = {
  development: base,
  test: {
    ...base,
    connection: { ...base.connection, database: config.db.database },
    pool: { min: 1, max: 5 },
  },
  production: {
    ...base,
    pool: { ...config.db.pool, min: 2 },
  },
};
