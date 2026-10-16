// The plans you sell. Seeded, not created through the API.
exports.up = async (knex) => {
  await knex.schema.createTable("plans", (t) => {
    t.bigIncrements("id");

    t.string("code", 40).notNullable();
    t.string("name", 120).notNullable();
    t.text("description").nullable();

    // Paise, like every other amount here. 0 is the free plan.
    t.bigInteger("price_paise").notNullable().defaultTo(0);
    t.integer("period_months").notNullable().defaultTo(12);

    // Limits the API enforces.
    t.integer("max_businesses").notNullable().defaultTo(1);
    t.integer("max_users").notNullable().defaultTo(1);
    t.integer("max_devices").notNullable().defaultTo(1);

    // Feature switches, as JSON so a new one does not need a migration.
    t.json("features").nullable();

    t.boolean("is_active").notNullable().defaultTo(true);
    t.integer("sort_order").notNullable().defaultTo(0);

    t.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    t.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());

    t.unique(["code"], { indexName: "plans_code_unique" });
  });
};

exports.down = (knex) => knex.schema.dropTableIfExists("plans");
