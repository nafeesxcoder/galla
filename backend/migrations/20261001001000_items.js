// What the business sells, and what it keeps in stock.
exports.up = async (knex) => {
  await knex.schema.createTable("items", (t) => {
    t.bigIncrements("id");
    t.bigInteger("business_id").unsigned().notNullable();

    t.string("name", 190).notNullable();
    t.string("item_code", 60).nullable();
    t.string("barcode", 60).nullable();

    // Harmonised System code for goods, SAC for services. The CA decides
    // which code applies - the software only stores it.
    t.string("hsn_sac", 10).nullable();

    t.enu("type", ["product", "service"], {
      useNative: false,
      enumName: "item_type",
    })
      .notNullable()
      .defaultTo("product");

    t.string("unit", 20).notNullable().defaultTo("PCS");
    t.string("category", 80).nullable();

    t.bigInteger("sale_price_paise").notNullable().defaultTo(0);
    t.bigInteger("purchase_price_paise").notNullable().defaultTo(0);

    // Whether sale_price already contains the tax. True for anything sold
    // at a printed MRP.
    t.boolean("price_includes_tax").notNullable().defaultTo(false);

    // A percentage: 0, 5, 12, 18, 28.
    t.decimal("tax_rate", 5, 2).notNullable().defaultTo(0);
    // Cess, which a few goods carry on top of GST.
    t.decimal("cess_rate", 5, 2).notNullable().defaultTo(0);

    // Quantities allow decimals: 1.5 kg, 2.25 metres.
    t.decimal("opening_stock", 14, 3).notNullable().defaultTo(0);
    // The live count. Only ever changed inside the same transaction as the
    // stock_moves row that explains the change, so the two cannot disagree.
    t.decimal("current_stock", 14, 3).notNullable().defaultTo(0);
    t.decimal("low_stock_level", 14, 3).notNullable().defaultTo(0);

    // Medicines and food need batch and expiry; a shirt does not. Turning
    // it on per item keeps the billing screen simple where it can be.
    t.boolean("track_batches").notNullable().defaultTo(false);

    t.string("image_url", 255).nullable();
    t.text("description").nullable();

    t.boolean("is_active").notNullable().defaultTo(true);

    t.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    t.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
    t.timestamp("deleted_at").nullable();

    t.foreign("business_id").references("businesses.id").onDelete("CASCADE");

    // A barcode must be unique within a business - scanning it has to find
    // exactly one item. It is NOT unique across businesses: two shops can
    // stock the same product.
    t.unique(["business_id", "barcode"], { indexName: "items_barcode_unique" });
    t.index(["business_id", "name"], "items_name_idx");
    t.index(["business_id", "item_code"], "items_code_idx");
    t.index(["business_id", "is_active", "deleted_at"], "items_live_idx");
  });
};

exports.down = (knex) => knex.schema.dropTableIfExists("items");
