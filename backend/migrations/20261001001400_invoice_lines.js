// The lines on an invoice.
//
// Item details are COPIED here, not joined from items. If the shopkeeper
// renames an item or changes its price next month, a bill printed today must
// still say what it said today. A joined invoice silently rewrites itself.
exports.up = async (knex) => {
  await knex.schema.createTable("invoice_lines", (t) => {
    t.bigIncrements("id");
    t.bigInteger("business_id").unsigned().notNullable();
    t.bigInteger("invoice_id").unsigned().notNullable();

    // Null if somebody typed a one-off line that is not a saved item.
    t.bigInteger("item_id").unsigned().nullable();
    t.bigInteger("batch_id").unsigned().nullable();

    t.integer("line_no").notNullable().defaultTo(1);

    // The snapshot.
    t.string("name", 190).notNullable();
    t.string("hsn_sac", 10).nullable();
    t.string("unit", 20).notNullable().defaultTo("PCS");
    t.string("batch_no", 60).nullable();
    t.date("expiry_date").nullable();

    t.decimal("quantity", 14, 3).notNullable();
    t.bigInteger("rate_paise").notNullable();

    t.bigInteger("gross_paise").notNullable().defaultTo(0);
    t.bigInteger("discount_paise").notNullable().defaultTo(0);
    t.bigInteger("taxable_paise").notNullable().defaultTo(0);

    t.decimal("tax_rate", 5, 2).notNullable().defaultTo(0);
    t.bigInteger("cgst_paise").notNullable().defaultTo(0);
    t.bigInteger("sgst_paise").notNullable().defaultTo(0);
    t.bigInteger("igst_paise").notNullable().defaultTo(0);
    t.bigInteger("cess_paise").notNullable().defaultTo(0);

    t.bigInteger("total_paise").notNullable().defaultTo(0);

    t.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

    t.foreign("business_id").references("businesses.id").onDelete("CASCADE");
    t.foreign("invoice_id").references("invoices.id").onDelete("CASCADE");
    t.foreign("item_id").references("items.id").onDelete("SET NULL");
    t.foreign("batch_id").references("item_batches.id").onDelete("SET NULL");

    t.index(["invoice_id"], "lines_invoice_idx");
    // Answers "how much of this item did we sell this month".
    t.index(["business_id", "item_id"], "lines_item_idx");
  });
};

exports.down = (knex) => knex.schema.dropTableIfExists("invoice_lines");
