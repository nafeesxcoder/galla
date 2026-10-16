// What the business spends. Rent, transport, salaries, repairs, petty cash.
//
// Separate from purchases: a purchase brings stock in, an expense does not.
// Mixing them makes both the stock count and the profit figure wrong.
exports.up = async (knex) => {
  await knex.schema.createTable("expenses", (t) => {
    t.bigIncrements("id");
    t.bigInteger("business_id").unsigned().notNullable();
    t.bigInteger("party_id").unsigned().nullable();

    t.string("category", 80).notNullable();
    t.date("expense_date").notNullable();

    t.bigInteger("amount_paise").notNullable();
    t.decimal("tax_rate", 5, 2).notNullable().defaultTo(0);
    t.bigInteger("tax_paise").notNullable().defaultTo(0);
    t.bigInteger("total_paise").notNullable();

    t.enu("mode", ["cash", "upi", "card", "bank", "cheque", "other"], {
      useNative: false,
      enumName: "expense_mode",
    })
      .notNullable()
      .defaultTo("cash");

    t.string("reference", 120).nullable();
    t.text("notes").nullable();
    t.string("receipt_url", 255).nullable();

    t.bigInteger("created_by").unsigned().nullable();

    t.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    t.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
    t.timestamp("deleted_at").nullable();

    t.foreign("business_id").references("businesses.id").onDelete("CASCADE");
    t.foreign("party_id").references("parties.id").onDelete("SET NULL");
    t.foreign("created_by").references("users.id").onDelete("SET NULL");

    t.index(["business_id", "expense_date"], "expenses_date_idx");
    t.index(["business_id", "category"], "expenses_category_idx");
  });
};

exports.down = (knex) => knex.schema.dropTableIfExists("expenses");
