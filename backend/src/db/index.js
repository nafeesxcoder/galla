// ===========================================================================
// THE DATABASE HANDLE
// ---------------------------------------------------------------------------
// One knex instance for the whole process. Import this, never create another.
// ===========================================================================

const knex = require("knex");
const config = require("../config");
const knexfile = require("../../knexfile");

const db = knex(knexfile[config.env] ?? knexfile.development);

module.exports = db;
