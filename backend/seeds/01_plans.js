// The plans themselves: what each one is called and what it permits.
//
// PRICES ARE NOT HERE. They are in 02_plan_prices.js, because one plan has
// twelve prices - desktop+mobile, mobile only, desktop only, each for a year
// or three - and one column cannot hold that.
//
// THE LIMITS BELOW ARE NOW REAL. Until recently max_businesses and max_users
// were printed on screens and checked by nothing, so nobody noticed that the
// website promised Silver three companies while this file allowed one. Now
// that they are enforced, that gap would have become a refusal on the second
// shop for somebody who paid for three.
//
// So these numbers MUST match what components/pricing/content.js advertises.
// Change one, change the other. The website is where the promise is made.
exports.seed = async (knex) => {
  await knex("plans")
    .insert([
      {
        code: "free",
        name: "Free",
        description: "For a shop getting started. No card needed.",
        price_paise: 0,
        period_months: 120,
        // One shop, one person. The two limits that make somebody upgrade,
        // and the two that are easy to explain in a sentence.
        max_businesses: 1,
        max_users: 1,
        max_devices: 1,
        features: JSON.stringify({
          invoices: true,
          inventory: true,
          parties: true,
          reports: "basic",
          gstReports: false,
          eInvoice: false,
          multiUser: false,
        }),
        sort_order: 1,
      },
      {
        code: "silver",
        name: "Silver",
        description: "For a shop that has outgrown the free plan.",
        price_paise: 0, // set by 02_plan_prices.js
        period_months: 12,
        // The website says "3 companies" and "2 users" on the Silver card.
        max_businesses: 3,
        max_users: 2,
        max_devices: 2,
        features: JSON.stringify({
          invoices: true,
          inventory: true,
          parties: true,
          reports: "full",
          gstReports: true,
          eInvoice: false,
          multiUser: true,
        }),
        sort_order: 2,
      },
      {
        code: "gold",
        name: "Gold",
        description: "For several counters, or several shops.",
        price_paise: 0, // set by 02_plan_prices.js
        period_months: 12,
        // The website says "5 companies" and "5 users" on the Gold card.
        max_businesses: 5,
        max_users: 5,
        max_devices: 5,
        features: JSON.stringify({
          invoices: true,
          inventory: true,
          parties: true,
          reports: "full",
          gstReports: true,
          eInvoice: true,
          multiUser: true,
          multiBusiness: true,
        }),
        sort_order: 3,
      },
    ])
    .onConflict("code")
    // The limits are merged too, so changing one above and re-running the
    // seed actually changes it. Without them in this list the first seeded
    // value would be permanent, which is how a limit and a promise drift
    // apart in the first place. price_paise is deliberately left out - that
    // belongs to 02_plan_prices.js, which runs straight after this.
    .merge([
      "name",
      "description",
      "features",
      "sort_order",
      "max_businesses",
      "max_users",
      "max_devices",
      "period_months",
    ]);
};
