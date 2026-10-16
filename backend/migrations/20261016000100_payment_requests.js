// Somebody says they have paid. This is where that claim lives until a
// human agrees with it.
//
// WHY THIS TABLE HAS TO EXIST
// ---------------------------
// The offline payment endpoint used to hand out a reference and store
// nothing. The money then arrived in the bank with "GAL-7-K2M4X" in the
// narration and there was no record anywhere of what that reference was for,
// who made it, or what they were owed. It worked only because the person
// who built it was also the person reading the bank statement.
//
// With a UPI QR it stops working entirely: money lands in seconds and the
// customer expects their plan on within minutes. You need a list you can
// open that says who is waiting, for what, and for how long.
//
// WHAT A ROW MEANS
// ----------------
//   pending    quoted, QR shown, nothing claimed yet. Most rows die here -
//              people price things up and walk away. That is fine and they
//              are not chased.
//   claimed    they have typed in a UTR. THIS is the queue to work. If
//              auto_approved is set the plan is ALREADY ON - switched on
//              against an unverified claim - and checking it against the
//              bank is the morning's job, not an optional tidy-up.
//   approved   money seen with your own eyes. The row is finished.
//   rejected   no such payment found. If a plan was switched on, rejecting
//              takes it off again and puts the old one back.
//
// Note what "approved" does NOT mean: it is not what starts the plan when
// auto-approval is on. The plan started at "claimed". Approving only records
// that a human has now agreed with it.
//
// A row is never deleted and never rewritten into a different shape. A
// customer ringing up about a payment from March needs March's row to still
// say what it said in March.
exports.up = async (knex) => {
  await knex.schema.createTable("payment_requests", (t) => {
    t.bigIncrements("id");

    // Who asked. Not the business: somebody can buy a licence before they
    // have made a shop, and that purchase still has to belong to somebody.
    t.bigInteger("user_id").unsigned().notNullable();
    t.bigInteger("business_id").unsigned().nullable();

    t.bigInteger("plan_id").unsigned().notNullable();
    t.enu("device", ["both", "mobile", "desktop"], {
      useNative: false,
      enumName: "payment_request_device",
    }).notNullable().defaultTo("both");
    t.integer("period_months").notNullable().defaultTo(12);
    t.integer("quantity").notNullable().defaultTo(1);

    // Both kept. The unit price is what the price list said at the time, and
    // a price list changes - without this, re-reading an old row through
    // today's prices quietly rewrites history.
    t.bigInteger("unit_price_paise").notNullable().defaultTo(0);
    t.bigInteger("amount_paise").notNullable().defaultTo(0);

    // What they write on the transfer and what goes in the UPI note.
    t.string("reference", 40).notNullable();

    t.enu("method", ["upi", "bank", "cheque"], {
      useNative: false,
      enumName: "payment_request_method",
    }).notNullable().defaultTo("upi");

    t.enu("status", ["pending", "claimed", "approved", "rejected"], {
      useNative: false,
      enumName: "payment_request_status",
    }).notNullable().defaultTo("pending");

    // The number off their UPI app or bank statement. Twelve digits for UPI,
    // longer and messier for NEFT, so it is a string and not an integer.
    t.string("utr", 64).nullable();
    // Anything they want to add - "paid from my brother's account", which is
    // the single most common reason a payment cannot be matched.
    t.string("payer_note", 300).nullable();

    // Why it was rejected, so the customer can be told something better than
    // "no".
    t.string("decision_note", 300).nullable();
    // What approving it created. The trail from money to plan, both ways.
    t.bigInteger("subscription_id").unsigned().nullable();
    // And what it pushed aside. Needed only to undo: a claim accepted on
    // trust and later found to be false has to put the customer back exactly
    // where they were, not on a free plan.
    t.bigInteger("replaced_subscription_id").unsigned().nullable();
    // Whether the plan was switched on before anybody checked the bank. A
    // row with this set and status still "claimed" is money not yet seen -
    // the list to work through every morning.
    t.boolean("auto_approved").notNullable().defaultTo(false);

    t.timestamp("claimed_at").nullable();
    t.timestamp("decided_at").nullable();
    t.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    t.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());

    t.foreign("user_id").references("users.id").onDelete("CASCADE");
    t.foreign("business_id").references("businesses.id").onDelete("SET NULL");
    t.foreign("plan_id").references("plans.id").onDelete("RESTRICT");

    // The reference is read out over the phone and searched for in a bank
    // statement. Two rows sharing one is the end of being able to do either.
    t.unique(["reference"], { indexName: "payment_requests_reference_unique" });

    // One transaction pays for one thing. Without this, a UTR that worked
    // once can be pasted into a second account next month - and it would
    // look right, because the money really did arrive.
    //
    // MySQL allows any number of NULLs in a unique index, so every unclaimed
    // row sits here happily.
    t.unique(["utr"], { indexName: "payment_requests_utr_unique" });

    // The queue, newest first.
    t.index(["status", "created_at"], "payment_requests_status_idx");
    t.index(["user_id"], "payment_requests_user_idx");
  });
};

exports.down = (knex) => knex.schema.dropTableIfExists("payment_requests");
