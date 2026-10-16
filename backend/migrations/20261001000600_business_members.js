// Who can get into which business, and what they may do.
//
// The owner gets a row here too. It keeps every permission check one query
// against one table, with no "unless they are the owner" special case to
// forget somewhere.
exports.up = async (knex) => {
  await knex.schema.createTable("business_members", (t) => {
    t.bigIncrements("id");
    t.bigInteger("business_id").unsigned().notNullable();
    t.bigInteger("user_id").unsigned().notNullable();

    // owner     everything, including deleting the business
    // manager   everything day to day, not billing or staff
    // staff     makes bills, cannot see profit or reports
    // viewer    read only - for an accountant
    t.enu("role", ["owner", "manager", "staff", "viewer"], {
      useNative: false,
      enumName: "business_role",
    })
      .notNullable()
      .defaultTo("staff");

    // Anything finer than the role, as JSON.
    t.json("permissions").nullable();

    t.timestamp("invited_at").nullable();
    t.timestamp("accepted_at").nullable();
    t.boolean("is_active").notNullable().defaultTo(true);

    t.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    t.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());

    t.foreign("business_id").references("businesses.id").onDelete("CASCADE");
    t.foreign("user_id").references("users.id").onDelete("CASCADE");

    // One row per person per business.
    t.unique(["business_id", "user_id"], { indexName: "member_unique" });
    t.index(["user_id", "is_active"], "member_user_idx");
  });
};

exports.down = (knex) => knex.schema.dropTableIfExists("business_members");
