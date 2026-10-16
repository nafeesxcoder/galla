// One-time passwords.
//
// The code itself is NEVER stored. Only a bcrypt hash of it, for the same
// reason passwords are hashed: anyone who reads this table - a leaked backup,
// a curious employee - must not be able to sign in as somebody else.
exports.up = async (knex) => {
  await knex.schema.createTable("otp_codes", (t) => {
    t.bigIncrements("id");

    t.string("dial_code", 6).notNullable().defaultTo("+91");
    t.string("phone", 20).notNullable();

    t.string("code_hash", 100).notNullable();
    t.timestamp("expires_at").notNullable();

    // Wrong guesses. Past the limit the code is dead, so somebody cannot sit
    // there trying all million six-digit combinations.
    t.integer("attempts").notNullable().defaultTo(0);

    // Set the moment it is used, so one code can never be used twice.
    t.timestamp("consumed_at").nullable();

    // Kept for rate limiting and for working out where a sign-in came from.
    t.string("request_ip", 45).nullable();

    t.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

    t.index(["dial_code", "phone", "created_at"], "otp_phone_idx");
    t.index(["expires_at"], "otp_expiry_idx");
  });
};

exports.down = (knex) => knex.schema.dropTableIfExists("otp_codes");
