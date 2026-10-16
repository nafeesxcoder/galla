// Every change to a stock figure, and why.
//
// items.current_stock is a running total for speed; THIS is the truth. When
// the two disagree - and one day they will, after a crash or a bug - this
// table is what you replay to find out which is right and when it went
// wrong. A billing system without one can only shrug.
//
// Nothing here is ever updated or deleted. It is append-only.
exports.up = async (knex) => {
  await knex.schema.createTable("stock_moves", (t) => {
    t.bigIncrements("id");
    t.bigInteger("business_id").unsigned().notNullable();
    t.bigInteger("item_id").unsigned().notNullable();
    t.bigInteger("batch_id").unsigned().nullable();

    // Negative takes stock out, positive puts it in.
    t.decimal("quantity_change", 14, 3).notNullable();

    // What the running total became after this move. Lets you answer "what
    // was the stock on 3 March" without summing from the beginning of time.
    t.decimal("balance_after", 14, 3).notNullable();

    t.enu(
      "reason",
      ["sale", "purchase", "opening", "adjustment", "return_in", "return_out", "transfer", "damage", "expiry"],
      { useNative: false, enumName: "stock_reason" }
    ).notNullable();

    // What caused it, so you can click through to the document.
    t.string("ref_type", 24).nullable();
    t.bigInteger("ref_id").unsigned().nullable();

    t.text("notes").nullable();
    t.bigInteger("created_by").unsigned().nullable();

    t.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

    t.foreign("business_id").references("businesses.id").onDelete("CASCADE");
    t.foreign("item_id").references("items.id").onDelete("CASCADE");
    t.foreign("batch_id").references("item_batches.id").onDelete("SET NULL");
    t.foreign("created_by").references("users.id").onDelete("SET NULL");

    t.index(["business_id", "item_id", "created_at"], "moves_item_idx");
    t.index(["ref_type", "ref_id"], "moves_ref_idx");
  });
};

exports.down = (knex) => knex.schema.dropTableIfExists("stock_moves");
