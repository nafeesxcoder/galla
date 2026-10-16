// Batches, for items where track_batches is on.
//
// A chemist does not have "40 strips of Crocin" - they have 12 from one
// batch expiring in March and 28 from another expiring in November, and the
// difference is the whole job. Stock for such items lives here, per batch.
exports.up = async (knex) => {
  await knex.schema.createTable("item_batches", (t) => {
    t.bigIncrements("id");
    t.bigInteger("business_id").unsigned().notNullable();
    t.bigInteger("item_id").unsigned().notNullable();

    t.string("batch_no", 60).notNullable();
    t.date("expiry_date").nullable();
    t.date("manufacture_date").nullable();

    t.decimal("quantity", 14, 3).notNullable().defaultTo(0);

    // Per batch, because the price you paid changes between deliveries.
    t.bigInteger("purchase_price_paise").nullable();
    t.bigInteger("sale_price_paise").nullable();
    t.bigInteger("mrp_paise").nullable();

    t.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    t.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());

    t.foreign("business_id").references("businesses.id").onDelete("CASCADE");
    t.foreign("item_id").references("items.id").onDelete("CASCADE");

    t.unique(["item_id", "batch_no"], { indexName: "batch_unique" });
    // Sorted by expiry, so "what is about to expire" and "sell the oldest
    // first" are both one indexed read.
    t.index(["business_id", "expiry_date"], "batch_expiry_idx");
  });
};

exports.down = (knex) => knex.schema.dropTableIfExists("item_batches");
