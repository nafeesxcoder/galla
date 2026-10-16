// Refresh tokens, stored hashed.
//
// Why both an access token and a refresh token: a JWT cannot be withdrawn
// once issued, so the access token is short-lived (15 minutes). The refresh
// token lives for weeks but is a row in this table, which means signing out -
// or losing a phone - can actually end the session.
exports.up = async (knex) => {
  await knex.schema.createTable("refresh_tokens", (t) => {
    t.bigIncrements("id");
    t.bigInteger("user_id").unsigned().notNullable();

    // SHA-256 of the token. Same reasoning as the OTP hash.
    t.string("token_hash", 64).notNullable();

    t.timestamp("expires_at").notNullable();
    t.timestamp("revoked_at").nullable();

    // So a person can see their active sessions and end the ones they do
    // not recognise.
    t.string("user_agent", 255).nullable();
    t.string("ip", 45).nullable();

    t.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    t.timestamp("last_used_at").nullable();

    t.foreign("user_id").references("users.id").onDelete("CASCADE");
    t.unique(["token_hash"], { indexName: "refresh_token_hash_unique" });
    t.index(["user_id", "revoked_at"], "refresh_user_idx");
  });
};

exports.down = (knex) => knex.schema.dropTableIfExists("refresh_tokens");
