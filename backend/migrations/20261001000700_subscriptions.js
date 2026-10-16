// Which plan a business is on, and until when.
//
// History is kept rather than overwritten: rows are never updated in place
// when a plan changes, a new row is added. You will want to answer "what was
// this customer paying in March" at some point, and an overwritten row
// cannot.
exports.up = async (knex) => {
  await knex.schema.createTable("subscriptions", (t) => {
    t.bigIncrements("id");
    t.bigInteger("business_id").unsigned().notNullable();
    t.bigInteger("plan_id").unsigned().notNullable();

    t.enu("status", ["trial", "active", "expired", "cancelled"], {
      useNative: false,
      enumName: "subscription_status",
    })
      .notNullable()
      .defaultTo("trial");

    t.timestamp("starts_at").notNullable();
    t.timestamp("ends_at").nullable();
    t.timestamp("cancelled_at").nullable();

    // What was actually charged, which may differ from the plan's list
    // price after a discount. Never read the price off the plan to work
    // out what somebody paid.
    t.bigInteger("amount_paid_paise").notNullable().defaultTo(0);

    t.string("payment_reference", 120).nullable();

    t.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    t.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());

    t.foreign("business_id").references("businesses.id").onDelete("CASCADE");
    t.foreign("plan_id").references("plans.id").onDelete("RESTRICT");

    t.index(["business_id", "status"], "subs_business_idx");
    t.index(["ends_at"], "subs_expiry_idx");
  });
};

exports.down = (knex) => knex.schema.dropTableIfExists("subscriptions");
