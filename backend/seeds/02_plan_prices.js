// The price list.
//
// THIS IS THE ONE PLACE. The website, the app and the offline payment page
// all read these numbers through /api/plans. Change a price here, run
// `npm run seed`, and every screen says the new number.
//
// Rupees are written as rupees below and turned into paise on the way in, so
// what you edit reads the way you say it out loud.
const PRICES = {
  // plan code -> device -> months -> rupees
  silver: {
    both: { 12: 3999, 36: 8999 },
    mobile: { 12: 2499, 36: 5999 },
    desktop: { 12: 3499, 36: 7999 },
  },
  gold: {
    both: { 12: 4999, 36: 11999 },
    mobile: { 12: 3499, 36: 8499 },
    desktop: { 12: 4499, 36: 10999 },
  },
};

const DEVICE_ORDER = { both: 1, mobile: 2, desktop: 3 };

exports.seed = async (knex) => {
  const plans = await knex("plans").select("id", "code");
  const byCode = new Map(plans.map((p) => [p.code, p.id]));

  const rows = [];
  for (const [code, devices] of Object.entries(PRICES)) {
    const planId = byCode.get(code);
    // A plan that is not in the database yet is skipped rather than
    // guessed at. Running the plans seed first fixes it.
    if (!planId) continue;

    for (const [device, terms] of Object.entries(devices)) {
      for (const [months, rupees] of Object.entries(terms)) {
        rows.push({
          plan_id: planId,
          device,
          period_months: Number(months),
          price_paise: Math.round(Number(rupees) * 100),
          is_active: true,
          sort_order: DEVICE_ORDER[device] * 10 + (Number(months) === 12 ? 1 : 2),
        });
      }
    }
  }

  if (rows.length === 0) return;

  // merge, not insert: running this again updates the prices rather than
  // failing on the unique index. That is the whole point - this file is how
  // you change a price.
  await knex("plan_prices").insert(rows).onConflict(["plan_id", "device", "period_months"]).merge(["price_paise", "is_active", "sort_order"]);

  // The headline price on the plan itself: the one most people buy, which is
  // desktop + mobile for a year. It is what /api/plans has always returned
  // and what the offline payment page falls back to.
  for (const [code, devices] of Object.entries(PRICES)) {
    const planId = byCode.get(code);
    if (!planId) continue;
    await knex("plans")
      .where({ id: planId })
      .update({ price_paise: Math.round(devices.both[12] * 100), period_months: 12 });
  }
};
