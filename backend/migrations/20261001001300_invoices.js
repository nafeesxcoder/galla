// Invoices, and everything shaped like one: sales, purchases, estimates,
// delivery challans, credit and debit notes. One table, because they share
// every field and convert into one another constantly - an estimate becomes
// an invoice, a challan becomes an invoice, a return becomes a credit note.
//
// Totals are STORED, not computed on read. An invoice is a record of what
// was agreed on a day; if a tax rate changes next year, recomputing would
// quietly rewrite history.
exports.up = async (knex) => {
  await knex.schema.createTable("invoices", (t) => {
    t.bigIncrements("id");
    t.bigInteger("business_id").unsigned().notNullable();

    t.enu(
      "doc_type",
      ["sale", "purchase", "estimate", "challan", "credit_note", "debit_note"],
      { useNative: false, enumName: "invoice_doc_type" }
    ).notNullable();

    // The number as printed: "INV-2026-27-0042"
    t.string("number", 60).notNullable();
    t.string("prefix", 20).notNullable().defaultTo("");
    t.integer("serial").notNullable();
    t.string("fy", 9).notNullable();

    t.date("issue_date").notNullable();
    t.date("due_date").nullable();

    // Null for a walk-in with no name taken.
    t.bigInteger("party_id").unsigned().nullable();
    // Copied in, not joined, so a later edit to the party does not change
    // what a past invoice says.
    t.string("party_name", 160).nullable();
    t.string("party_gstin", 15).nullable();
    t.string("place_of_supply", 2).nullable();

    // Which tax applied. Stored because the states may be edited later.
    t.boolean("is_inter_state").notNullable().defaultTo(false);

    // Every amount in paise.
    t.bigInteger("gross_paise").notNullable().defaultTo(0);
    t.bigInteger("discount_paise").notNullable().defaultTo(0);
    t.bigInteger("taxable_paise").notNullable().defaultTo(0);
    t.bigInteger("cgst_paise").notNullable().defaultTo(0);
    t.bigInteger("sgst_paise").notNullable().defaultTo(0);
    t.bigInteger("igst_paise").notNullable().defaultTo(0);
    t.bigInteger("cess_paise").notNullable().defaultTo(0);
    t.bigInteger("round_off_paise").notNullable().defaultTo(0);
    t.bigInteger("total_paise").notNullable().defaultTo(0);

    // Kept current as payments are allocated, so the receivables screen is
    // one indexed read instead of a sum over payment_allocations.
    t.bigInteger("paid_paise").notNullable().defaultTo(0);
    t.bigInteger("balance_paise").notNullable().defaultTo(0);

    t.enu("status", ["draft", "issued", "partial", "paid", "cancelled"], {
      useNative: false,
      enumName: "invoice_status",
    })
      .notNullable()
      .defaultTo("issued");

    // E-invoicing, filled in once the government portal returns them.
    t.string("irn", 64).nullable();
    t.text("signed_qr").nullable();
    t.string("ewb_number", 20).nullable();
    t.timestamp("irn_generated_at").nullable();

    // Where this document came from, when it was converted from another.
    t.bigInteger("converted_from_id").unsigned().nullable();

    t.text("notes").nullable();
    t.text("terms").nullable();

    // Who made it. Needed to answer "who billed this" when a shop has staff.
    t.bigInteger("created_by").unsigned().nullable();

    // Invoices are NEVER deleted - a gap in the sequence is the problem.
    // They are cancelled, which keeps the number and the audit trail.
    t.timestamp("cancelled_at").nullable();
    t.string("cancel_reason", 255).nullable();

    t.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    t.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());

    t.foreign("business_id").references("businesses.id").onDelete("CASCADE");
    t.foreign("party_id").references("parties.id").onDelete("SET NULL");
    t.foreign("created_by").references("users.id").onDelete("SET NULL");

    // The number must be unique within its business, type and year. This is
    // the database refusing to let a duplicate exist, whatever the code does.
    t.unique(["business_id", "doc_type", "fy", "number"], {
      indexName: "invoice_number_unique",
    });

    t.index(["business_id", "doc_type", "issue_date"], "invoice_listing_idx");
    t.index(["business_id", "party_id", "status"], "invoice_party_idx");
    // Drives the receivables screen: who owes money, oldest first.
    t.index(["business_id", "status", "due_date"], "invoice_due_idx");
  });
};

exports.down = (knex) => knex.schema.dropTableIfExists("invoices");
