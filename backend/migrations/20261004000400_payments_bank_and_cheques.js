// ===========================================================================
// WHICH ACCOUNT, AND HAS THE CHEQUE CLEARED?
// ---------------------------------------------------------------------------
// Two gaps in what was already stored.
//
// First: a payment recorded as mode "bank" or "upi" says the money did not go
// in the drawer, but not WHICH account it went into. With one account that is
// a detail; with two it makes every balance unusable.
//
// Second, and worse: a cheque is money you have been PROMISED, not money you
// have. The existing table records it the same way as a handful of notes, so
// the moment a customer pays by cheque the balance jumps as though it had
// cleared. It might clear in three days, it might bounce. Until it is marked
// cleared it must not count towards any balance, and a bounced one must not
// count ever - while still leaving the bill it was against unpaid.
//
// So cheques get a state of their own. The default is "cleared" for every row
// that already exists and for every non-cheque payment, because cash and UPI
// arrive the instant they are recorded and nothing should change for them.
// ===========================================================================

exports.up = async (knex) => {
  await knex.schema.alterTable("payments", (t) => {
    t.bigInteger("bank_account_id").unsigned().nullable();
    t.foreign("bank_account_id").references("bank_accounts.id").onDelete("SET NULL");

    t.enu("cheque_status", ["pending", "cleared", "bounced", "cancelled"], {
      useNative: false,
      enumName: "cheque_status",
    })
      .notNullable()
      .defaultTo("cleared");

    // When the cheque is dated for - a post-dated cheque is a date, not a
    // promise, and the whole point of the screen is to show what is due this
    // week.
    t.date("cheque_due_date").nullable();
    t.date("cheque_settled_date").nullable();
    t.string("cheque_bank", 120).nullable();

    t.index(["business_id", "cheque_status"], "payments_cheque_status_idx");
  });

  // Anything already in there was taken as settled, so leave it that way.
  // Only cheques entered from now on start as pending.
  await knex("payments").where({ mode: "cheque" }).update({ cheque_status: "cleared" });

  await knex.schema.alterTable("expenses", (t) => {
    t.bigInteger("bank_account_id").unsigned().nullable();
    t.foreign("bank_account_id").references("bank_accounts.id").onDelete("SET NULL");
  });

  // The one figure no transaction can account for: what was in the drawer on
  // the day the shop started using the app.
  await knex.schema.alterTable("businesses", (t) => {
    t.bigInteger("opening_cash_paise").notNullable().defaultTo(0);
  });
};

exports.down = async (knex) => {
  await knex.schema.alterTable("payments", (t) => {
    t.dropIndex(["business_id", "cheque_status"], "payments_cheque_status_idx");
    t.dropForeign("bank_account_id");
    t.dropColumn("bank_account_id");
    t.dropColumn("cheque_status");
    t.dropColumn("cheque_due_date");
    t.dropColumn("cheque_settled_date");
    t.dropColumn("cheque_bank");
  });
  await knex.schema.alterTable("expenses", (t) => {
    t.dropForeign("bank_account_id");
    t.dropColumn("bank_account_id");
  });
  await knex.schema.alterTable("businesses", (t) => {
    t.dropColumn("opening_cash_paise");
  });
};
