// ===========================================================================
// HOW THIS SHOP WANTS THINGS DONE
// ---------------------------------------------------------------------------
// The shop's NAME and address are facts about it, and they have columns of
// their own. These are preferences - what prints at the bottom of a bill, how
// many days credit is the default, whether to round to the rupee - and there
// are a lot of them, with more arriving every time somebody asks for one.
//
// A column each would mean a migration every time, and twenty mostly-null
// columns on a table that is read on every single request. So they live in
// one JSON column instead.
//
// JSON is the right shape here and the wrong shape in most places. It is
// right because nothing JOINs on a preference, nothing SUMs one, and nothing
// needs an index on one - they are read as a lump when a bill is drawn and
// written as a lump when somebody saves the settings screen. The moment a
// field needs to be queried across shops it gets promoted to a real column.
//
// The shape is NOT free-form: the API validates it field by field, so a typo
// cannot quietly become a stored key that nothing ever reads.
// ===========================================================================

exports.up = async (knex) => {
  await knex.schema.alterTable("businesses", (t) => {
    t.json("settings").nullable();
  });
};

exports.down = async (knex) => {
  await knex.schema.alterTable("businesses", (t) => {
    t.dropColumn("settings");
  });
};
