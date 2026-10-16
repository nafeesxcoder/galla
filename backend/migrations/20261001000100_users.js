// Users. One row per person, identified by their mobile number.
//
// A person is NOT a business. One person can own a shop and also be staff
// at somebody else's - that link lives in business_members.
exports.up = async (knex) => {
  await knex.schema.createTable("users", (t) => {
    t.bigIncrements("id");

    // The login identity. Dial code is kept separate so the same number can
    // exist under different countries later without a migration.
    t.string("dial_code", 6).notNullable().defaultTo("+91");
    t.string("phone", 20).notNullable();

    t.string("name", 120).nullable();
    t.string("email", 190).nullable();

    // Set the first time an OTP is verified.
    t.timestamp("phone_verified_at").nullable();
    t.timestamp("last_login_at").nullable();

    // A blocked user keeps their data but cannot sign in.
    t.boolean("is_blocked").notNullable().defaultTo(false);

    t.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    t.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());

    // One account per number. This is the whole identity model.
    t.unique(["dial_code", "phone"], { indexName: "users_phone_unique" });
    t.index(["email"], "users_email_idx");
  });
};

exports.down = (knex) => knex.schema.dropTableIfExists("users");
