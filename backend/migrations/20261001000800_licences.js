// Licence keys, for selling through resellers and partners.
//
// A key exists before anybody owns it - that is the point. You issue a batch
// to a partner, they sell them on, and each key attaches to a business when
// it is redeemed.
exports.up = async (knex) => {
  await knex.schema.createTable("licences", (t) => {
    t.bigIncrements("id");

    // The key the customer types in: XXXXX-XXXXX-XXXXX-XXXXX
    t.string("code", 32).notNullable();

    t.bigInteger("plan_id").unsigned().notNullable();

    // Null until redeemed.
    t.bigInteger("business_id").unsigned().nullable();

    t.enu("status", ["issued", "active", "expired", "revoked"], {
      useNative: false,
      enumName: "licence_status",
    })
      .notNullable()
      .defaultTo("issued");

    t.integer("period_months").notNullable().defaultTo(12);

    // Who it was sold through, for partner commissions.
    t.string("issued_to", 160).nullable();

    t.timestamp("issued_at").notNullable().defaultTo(knex.fn.now());
    t.timestamp("activated_at").nullable();
    t.timestamp("expires_at").nullable();
    t.timestamp("revoked_at").nullable();

    t.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    t.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());

    t.foreign("plan_id").references("plans.id").onDelete("RESTRICT");
    t.foreign("business_id").references("businesses.id").onDelete("SET NULL");

    t.unique(["code"], { indexName: "licences_code_unique" });
    t.index(["business_id"], "licences_business_idx");
    t.index(["status"], "licences_status_idx");
  });
};

exports.down = (knex) => knex.schema.dropTableIfExists("licences");
