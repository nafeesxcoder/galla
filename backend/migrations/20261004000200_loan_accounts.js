// ===========================================================================
// LOANS
// ---------------------------------------------------------------------------
// Almost every small shop is running one: a gold loan, a mudra loan, a
// vehicle loan, or money taken from a relative. The questions are always the
// same two - how much is still owed, and when is the next instalment - and
// nothing else in this system can answer them.
//
// A loan is NOT a party with a negative balance. A supplier's balance moves
// when goods arrive; a loan's balance moves when an instalment is paid, and
// each instalment splits into interest (an expense, gone for good) and
// principal (which actually reduces the debt). Treating one as the other
// makes the profit figure wrong by the whole interest bill.
// ===========================================================================

exports.up = async (knex) => {
  await knex.schema.createTable("loan_accounts", (t) => {
    t.bigIncrements("id");
    t.bigInteger("business_id").unsigned().notNullable();

    t.string("name", 120).notNullable();
    t.string("lender", 160).nullable();
    t.string("account_number", 60).nullable();

    t.enu("kind", ["bank", "gold", "vehicle", "personal", "credit-card", "other"], {
      useNative: false,
      enumName: "loan_kind",
    })
      .notNullable()
      .defaultTo("bank");

    // What was borrowed, and what is still owed at the start. They differ
    // when the loan is already part way through when the shop starts using
    // this app, which is the usual case.
    t.bigInteger("principal_paise").notNullable().defaultTo(0);
    t.bigInteger("opening_balance_paise").notNullable().defaultTo(0);

    t.decimal("interest_rate", 6, 3).notNullable().defaultTo(0);
    t.integer("tenure_months").nullable();
    t.bigInteger("emi_paise").notNullable().defaultTo(0);

    t.date("start_date").nullable();
    // Which day of the month the instalment goes out, for the reminder.
    t.integer("due_day").nullable();

    // Where the borrowed money landed, if it landed in a tracked account.
    t.bigInteger("bank_account_id").unsigned().nullable();

    t.text("notes").nullable();
    t.boolean("is_closed").notNullable().defaultTo(false);
    t.bigInteger("created_by").unsigned().nullable();

    t.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    t.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
    t.timestamp("deleted_at").nullable();

    t.foreign("business_id").references("businesses.id").onDelete("CASCADE");
    t.foreign("bank_account_id").references("bank_accounts.id").onDelete("SET NULL");
    t.foreign("created_by").references("users.id").onDelete("SET NULL");

    t.index(["business_id", "deleted_at"], "loan_accounts_business_idx");
  });

  await knex.schema.createTable("loan_payments", (t) => {
    t.bigIncrements("id");
    t.bigInteger("business_id").unsigned().notNullable();
    t.bigInteger("loan_id").unsigned().notNullable();

    t.date("payment_date").notNullable();

    // The three figures of an instalment. amount is what left the account;
    // the other two are how it was applied, and they must add up to it.
    // Kept apart because only the interest is an expense - the principal is
    // the debt shrinking, and counting it as a cost would show the shop
    // losing money every month it repaid a loan.
    t.bigInteger("amount_paise").notNullable();
    t.bigInteger("principal_paise").notNullable().defaultTo(0);
    t.bigInteger("interest_paise").notNullable().defaultTo(0);

    // A charge rather than a repayment - processing fee, late fee, penalty.
    // It increases what was paid without reducing what is owed.
    t.bigInteger("charges_paise").notNullable().defaultTo(0);

    t.enu("mode", ["cash", "upi", "card", "bank", "cheque", "other"], {
      useNative: false,
      enumName: "loan_payment_mode",
    })
      .notNullable()
      .defaultTo("bank");

    t.bigInteger("bank_account_id").unsigned().nullable();
    t.string("reference", 120).nullable();
    t.text("notes").nullable();
    t.bigInteger("created_by").unsigned().nullable();

    t.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    t.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
    t.timestamp("cancelled_at").nullable();

    t.foreign("business_id").references("businesses.id").onDelete("CASCADE");
    t.foreign("loan_id").references("loan_accounts.id").onDelete("CASCADE");
    t.foreign("bank_account_id").references("bank_accounts.id").onDelete("SET NULL");
    t.foreign("created_by").references("users.id").onDelete("SET NULL");

    t.index(["business_id", "loan_id", "payment_date"], "loan_payments_loan_idx");
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists("loan_payments");
  await knex.schema.dropTableIfExists("loan_accounts");
};
