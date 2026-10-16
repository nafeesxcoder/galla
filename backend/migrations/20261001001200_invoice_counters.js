// Invoice numbering.
//
// This table exists because invoice numbers are a legal matter, not a
// cosmetic one. GST requires an unbroken sequence per series per financial
// year, and a gap is exactly what draws a question at assessment time.
//
// Using MAX(number)+1 at insert time looks fine until two counters bill at
// the same second and both read the same maximum. This row is locked FOR
// UPDATE inside the invoice transaction instead, so two sales can never be
// handed the same number.
exports.up = async (knex) => {
  await knex.schema.createTable("invoice_counters", (t) => {
    t.bigIncrements("id");
    t.bigInteger("business_id").unsigned().notNullable();

    // sale, purchase, estimate, challan, credit_note, debit_note
    t.string("doc_type", 24).notNullable();

    // "2026-27" - the sequence restarts each financial year.
    t.string("fy", 9).notNullable();

    t.string("prefix", 20).notNullable().defaultTo("");
    t.integer("next_number").notNullable().defaultTo(1);
    t.integer("padding").notNullable().defaultTo(4);

    t.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    t.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());

    t.foreign("business_id").references("businesses.id").onDelete("CASCADE");

    // One counter per business, per document type, per year. The unique
    // index is what makes the lock-and-increment safe.
    t.unique(["business_id", "doc_type", "fy"], { indexName: "counter_unique" });
  });
};

exports.down = (knex) => knex.schema.dropTableIfExists("invoice_counters");
