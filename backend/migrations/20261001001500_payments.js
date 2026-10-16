// Money in and money out.
//
// A payment is deliberately NOT tied to one invoice. A customer who owes you
// for four bills hands over one amount, and a payment that can only point at
// one invoice forces you to invent four fake ones. The split lives in
// payment_allocations.
exports.up = async (knex) => {
  await knex.schema.createTable("payments", (t) => {
    t.bigIncrements("id");
    t.bigInteger("business_id").unsigned().notNullable();
    t.bigInteger("party_id").unsigned().nullable();

    t.enu("direction", ["in", "out"], {
      useNative: false,
      enumName: "payment_direction",
    }).notNullable();

    t.string("number", 60).nullable();
    t.date("payment_date").notNullable();

    t.bigInteger("amount_paise").notNullable();

    // Anything not yet set against an invoice - an advance, or an overpayment.
    t.bigInteger("unallocated_paise").notNullable().defaultTo(0);

    t.enu("mode", ["cash", "upi", "card", "bank", "cheque", "other"], {
      useNative: false,
      enumName: "payment_mode",
    })
      .notNullable()
      .defaultTo("cash");

    // UPI reference, cheque number, bank transaction id.
    t.string("reference", 120).nullable();
    t.text("notes").nullable();

    t.bigInteger("created_by").unsigned().nullable();

    t.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    t.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
    t.timestamp("cancelled_at").nullable();

    t.foreign("business_id").references("businesses.id").onDelete("CASCADE");
    t.foreign("party_id").references("parties.id").onDelete("SET NULL");
    t.foreign("created_by").references("users.id").onDelete("SET NULL");

    t.index(["business_id", "payment_date"], "payments_date_idx");
    t.index(["business_id", "party_id"], "payments_party_idx");
    t.index(["business_id", "mode", "payment_date"], "payments_mode_idx");
  });
};

exports.down = (knex) => knex.schema.dropTableIfExists("payments");
