// ===========================================================================
// MONEY MOVING BETWEEN THE DRAWER AND THE BANK
// ---------------------------------------------------------------------------
// This is the table that makes "cash in hand" a real figure instead of a
// guess. A day's takings are cash; at six o'clock some of it is walked to the
// bank. Without a row for that walk, the drawer figure keeps climbing all
// month and the bank figure stays flat, and both are wrong.
//
// Deliberately NOT a payment. A payment involves a customer or a supplier and
// settles a bill. This involves nobody - the same business's money, in a
// different pocket. Recording a deposit as a payment would add a sale that
// never happened.
//
// One row, two sides. from_account_id and to_account_id are both nullable,
// and NULL means the cash drawer:
//
//   cash to bank      from NULL          to account
//   bank to cash      from account       to NULL
//   bank to bank      from account       to account
//   bank charge       from account       to NULL      (and kind says so)
//   bank interest     from NULL          to account
//   cash found        from NULL          to NULL      (and kind says which
//   cash short                                         way it went)
//
// The kind is what tells those last ones apart, which is why it is stored
// rather than worked out from the two columns.
// ===========================================================================

exports.up = async (knex) => {
  await knex.schema.createTable("cash_bank_moves", (t) => {
    t.bigIncrements("id");
    t.bigInteger("business_id").unsigned().notNullable();

    t.enu(
      "kind",
      [
        "cash-to-bank",
        "bank-to-cash",
        "bank-to-bank",
        "bank-charge",
        "bank-interest",
        "cash-increase",
        "cash-decrease",
      ],
      { useNative: false, enumName: "cash_bank_move_kind" }
    ).notNullable();

    // NULL on either side means the cash drawer.
    t.bigInteger("from_account_id").unsigned().nullable();
    t.bigInteger("to_account_id").unsigned().nullable();

    t.date("move_date").notNullable();
    t.bigInteger("amount_paise").notNullable();

    t.string("reference", 120).nullable();
    t.text("notes").nullable();
    t.bigInteger("created_by").unsigned().nullable();

    t.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    t.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
    t.timestamp("cancelled_at").nullable();

    t.foreign("business_id").references("businesses.id").onDelete("CASCADE");
    t.foreign("from_account_id").references("bank_accounts.id").onDelete("CASCADE");
    t.foreign("to_account_id").references("bank_accounts.id").onDelete("CASCADE");
    t.foreign("created_by").references("users.id").onDelete("SET NULL");

    t.index(["business_id", "move_date"], "cash_bank_moves_date_idx");
    t.index(["business_id", "from_account_id"], "cash_bank_moves_from_idx");
    t.index(["business_id", "to_account_id"], "cash_bank_moves_to_idx");
  });
};

exports.down = (knex) => knex.schema.dropTableIfExists("cash_bank_moves");
