// What each plan costs, for every way it can be bought.
//
// WHY A TABLE AND NOT A COLUMN
// ----------------------------
// `plans` has one price_paise, and one number cannot hold "Silver, mobile
// only, three years". So the real prices ended up typed into the website's
// content.js instead, and the plans table kept a zero - two price lists, both
// claiming to be right, already disagreeing with each other.
//
// A customer being shown one number and charged another is the single worst
// thing a billing company can do, so there is now one place: this table.
// The website reads it, the app reads it, and the offline payment page quotes
// from it.
//
// NO MRP COLUMN
// -------------
// There was a struck-through "was ₹5,999" on the site. Nobody was ever
// charged ₹5,999, which makes it a discount that never happened. It is gone
// rather than stored. If a real sale is run later, adding a column back is
// one migration - and then the struck-out number will be true.
//
// WHAT THIS DOES NOT DO
// ---------------------
// It prices "mobile only" and "desktop only" differently. It does NOT stop a
// mobile-only customer using the desktop app - nothing in this system binds a
// subscription to a device yet. That is a separate piece of work, and until
// it exists the device choice is a price difference and nothing more.
exports.up = async (knex) => {
  await knex.schema.createTable("plan_prices", (t) => {
    t.bigIncrements("id");
    t.bigInteger("plan_id").unsigned().notNullable();

    // What they are buying it for. Not enforced anywhere yet - see above.
    t.enu("device", ["both", "mobile", "desktop"], {
      useNative: false,
      enumName: "plan_price_device",
    }).notNullable();

    t.integer("period_months").notNullable();

    // Paise, like every other amount in this database. Rupees in a float is
    // how 4999 becomes 4998.999999999999.
    t.bigInteger("price_paise").notNullable();

    t.boolean("is_active").notNullable().defaultTo(true);
    t.integer("sort_order").notNullable().defaultTo(0);

    t.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    t.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());

    t.foreign("plan_id").references("plans.id").onDelete("CASCADE");

    // One price per combination. Two rows for the same thing is how a page
    // starts showing whichever the database felt like returning first.
    t.unique(["plan_id", "device", "period_months"], { indexName: "plan_prices_combo_unique" });
    t.index(["plan_id"], "plan_prices_plan_idx");
  });
};

exports.down = (knex) => knex.schema.dropTableIfExists("plan_prices");
