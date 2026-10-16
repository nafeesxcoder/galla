// Which payment settled which invoice, and by how much.
//
// This is the join that lets one payment clear four bills, and one bill be
// cleared by three instalments. Both happen constantly in a shop that sells
// on credit.
exports.up = async (knex) => {
  await knex.schema.createTable("payment_allocations", (t) => {
    t.bigIncrements("id");
    t.bigInteger("business_id").unsigned().notNullable();
    t.bigInteger("payment_id").unsigned().notNullable();
    t.bigInteger("invoice_id").unsigned().notNullable();

    t.bigInteger("amount_paise").notNullable();

    t.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

    t.foreign("business_id").references("businesses.id").onDelete("CASCADE");
    t.foreign("payment_id").references("payments.id").onDelete("CASCADE");
    t.foreign("invoice_id").references("invoices.id").onDelete("CASCADE");

    // One row per payment-invoice pair. Two part allocations of the same
    // payment to the same invoice should be one row with a bigger amount.
    t.unique(["payment_id", "invoice_id"], { indexName: "allocation_unique" });
    t.index(["invoice_id"], "allocation_invoice_idx");
  });
};

exports.down = (knex) => knex.schema.dropTableIfExists("payment_allocations");
