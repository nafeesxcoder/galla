// A business. This is the tenant boundary: every item, party, invoice and
// rupee in the system belongs to exactly one business_id, and no query may
// ever cross that line.
exports.up = async (knex) => {
  await knex.schema.createTable("businesses", (t) => {
    t.bigIncrements("id");
    t.bigInteger("owner_id").unsigned().notNullable();

    t.string("name", 160).notNullable();
    t.string("legal_name", 160).nullable();

    // Null for a business not registered under GST. Plenty are not, and the
    // app has to bill for them too - they just issue a bill of supply
    // instead of a tax invoice.
    t.string("gstin", 15).nullable();

    // The supplier's state. This single field decides CGST+SGST vs IGST on
    // every invoice the business raises, so it is not optional.
    t.string("state_code", 2).notNullable();

    t.string("pan", 10).nullable();
    t.string("phone", 20).nullable();
    t.string("email", 190).nullable();

    t.string("address_line1", 190).nullable();
    t.string("address_line2", 190).nullable();
    t.string("city", 100).nullable();
    t.string("pincode", 10).nullable();

    t.string("logo_url", 255).nullable();

    // What this shop sells - it drives which features are shown.
    t.string("industry", 60).nullable();

    // The books run April to March in India, but let it be set so the
    // software does not argue with an accountant who does it differently.
    t.tinyint("fy_start_month").notNullable().defaultTo(4);

    t.string("currency", 3).notNullable().defaultTo("INR");
    t.string("timezone", 64).notNullable().defaultTo("Asia/Kolkata");

    t.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    t.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
    t.timestamp("deleted_at").nullable();

    t.foreign("owner_id").references("users.id").onDelete("RESTRICT");
    t.index(["owner_id"], "businesses_owner_idx");
    t.index(["gstin"], "businesses_gstin_idx");
  });
};

exports.down = (knex) => knex.schema.dropTableIfExists("businesses");
