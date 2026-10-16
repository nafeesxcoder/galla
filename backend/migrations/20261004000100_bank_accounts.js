// ===========================================================================
// BANK ACCOUNTS
// ---------------------------------------------------------------------------
// A shop keeps money in two places: the drawer and the bank. The drawer needs
// no row - it is simply "everything in cash that has not been banked" - but
// every bank account does, because a shopkeeper with a current account and a
// savings account wants to know which one the UPI landed in.
//
// The balance is NOT stored here. It is worked out from the payments, the
// expenses and the moves that point at this account. A stored balance is a
// second source of truth, and the day it disagrees with the transactions
// there is no way to tell which one is lying. Only the OPENING balance is
// stored, because that is the one figure no transaction can account for.
// ===========================================================================

exports.up = async (knex) => {
  await knex.schema.createTable("bank_accounts", (t) => {
    t.bigIncrements("id");
    t.bigInteger("business_id").unsigned().notNullable();

    // What the shopkeeper calls it - "HDFC current", "Mummy ka SBI". Not the
    // bank's name, which goes in its own column; people run two accounts at
    // the same bank and need to tell them apart.
    t.string("name", 120).notNullable();
    t.string("bank_name", 120).nullable();

    // Stored in full, not masked. It is their own account number and it has
    // to be printable on an invoice for a customer to pay into.
    t.string("account_number", 40).nullable();
    t.string("ifsc", 20).nullable();
    t.string("account_holder", 160).nullable();
    t.string("branch", 120).nullable();
    t.string("upi_id", 120).nullable();

    t.bigInteger("opening_balance_paise").notNullable().defaultTo(0);
    t.date("opening_date").nullable();

    // The one offered first when taking a payment.
    t.boolean("is_default").notNullable().defaultTo(false);
    // Whether the account details print at the bottom of an invoice so the
    // customer can transfer into it.
    t.boolean("print_on_invoice").notNullable().defaultTo(false);

    t.text("notes").nullable();
    t.bigInteger("created_by").unsigned().nullable();

    t.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    t.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
    t.timestamp("deleted_at").nullable();

    t.foreign("business_id").references("businesses.id").onDelete("CASCADE");
    t.foreign("created_by").references("users.id").onDelete("SET NULL");

    t.index(["business_id", "deleted_at"], "bank_accounts_business_idx");
  });
};

exports.down = (knex) => knex.schema.dropTableIfExists("bank_accounts");
