// Customers and suppliers. One table, because the same shop is often both -
// you buy from a distributor and occasionally sell back to them, and keeping
// two rows for one party means two balances that never agree.
exports.up = async (knex) => {
  await knex.schema.createTable("parties", (t) => {
    t.bigIncrements("id");
    t.bigInteger("business_id").unsigned().notNullable();

    t.string("name", 160).notNullable();
    t.string("phone", 20).nullable();
    t.string("email", 190).nullable();

    t.string("gstin", 15).nullable();

    // Decides CGST+SGST vs IGST on every invoice to this party. Falls back
    // to the business's own state when it is not known - a walk-in.
    t.string("state_code", 2).nullable();

    t.string("address_line1", 190).nullable();
    t.string("address_line2", 190).nullable();
    t.string("city", 100).nullable();
    t.string("pincode", 10).nullable();

    // Billing a different address from where goods ship is normal for
    // wholesale, and GST wants both on the invoice.
    t.string("shipping_address", 500).nullable();

    // What they owed when they came onto the system. Positive means they
    // owe you, negative means you owe them.
    t.bigInteger("opening_balance_paise").notNullable().defaultTo(0);

    // Kept up to date as invoices and payments land, so the receivables
    // list does not have to sum a year of rows to draw one screen.
    // Only ever written inside the same transaction as the thing that
    // changed it.
    t.bigInteger("balance_paise").notNullable().defaultTo(0);

    // How much credit this party is allowed. 0 means no limit set.
    t.bigInteger("credit_limit_paise").notNullable().defaultTo(0);
    t.integer("credit_days").notNullable().defaultTo(0);

    t.boolean("is_customer").notNullable().defaultTo(true);
    t.boolean("is_supplier").notNullable().defaultTo(false);

    t.text("notes").nullable();

    t.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    t.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
    t.timestamp("deleted_at").nullable();

    t.foreign("business_id").references("businesses.id").onDelete("CASCADE");

    // Finding a party by phone while the customer stands at the counter is
    // the single most common lookup in the app.
    t.index(["business_id", "phone"], "parties_phone_idx");
    t.index(["business_id", "name"], "parties_name_idx");
    t.index(["business_id", "deleted_at"], "parties_live_idx");
  });
};

exports.down = (knex) => knex.schema.dropTableIfExists("parties");
