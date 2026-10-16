// ===========================================================================
// /api/plans - what you sell. Public, because the pricing page needs it.
// ---------------------------------------------------------------------------
// Every price the website, the app and the offline payment page show comes
// from here. Nothing is typed into a screen any more: a number written into
// the front end is wrong on every browser that has a cached copy, and the one
// thing a shopkeeper will not forgive is being shown one figure and charged
// another.
// ===========================================================================

const express = require("express");
const db = require("../../db");
const config = require("../../config");
const asyncHandler = require("../../utils/asyncHandler");
const { toRupees } = require("../../utils/money");

const router = express.Router();

// ---------------------------------------------------------------------------
// GET /api/plans/payment-info - where to send the money
// ---------------------------------------------------------------------------
// Public, and it lives beside the prices on purpose. What something costs and
// where to pay for it are the same question, and the last time this project
// kept one of them in the website instead of the server, the site advertised
// ₹3,999 while the database held ₹0. An account number getting out of step
// the same way is money landing in a closed account.
//
// Nothing secret is here. A bank account number and an IFSC are what you
// hand to anybody who wants to pay you.
//
// Fields come back empty rather than missing, and empty means "not set up
// yet" - a screen can then leave that row out instead of printing a blank
// label under a heading.
router.get("/payment-info", (req, res) => {
  const { bank, upi } = config.payments;

  res.json({
    ok: true,
    data: {
      // The QR picture itself is a file in the website's public folder, not
      // a URL from here - it is a different image on a different domain for
      // every deployment, and a server guessing at it would be wrong.
      upi: { id: upi.id, payeeName: upi.payeeName },
      bank: {
        accountName: bank.accountName,
        accountNumber: bank.accountNumber,
        ifsc: bank.ifsc,
        bankName: bank.bankName,
        branch: bank.branch,
        accountType: bank.accountType,
      },
      // So the screen can promise the right thing. With this false it must
      // say "we will check and switch it on", and with it true it can say
      // the plan starts straight away. Promising the wrong one is how a
      // customer sits refreshing a page for an hour.
      instant: config.payments.autoApprove,
    },
  });
});

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const rows = await db("plans").where({ is_active: true }).orderBy("sort_order", "asc");

    // One query for every plan's prices rather than one per plan.
    const prices = rows.length
      ? await db("plan_prices")
          .whereIn(
            "plan_id",
            rows.map((p) => p.id)
          )
          .where({ is_active: true })
          .orderBy("sort_order", "asc")
      : [];

    const byPlan = new Map();
    for (const p of prices) {
      const key = Number(p.plan_id);
      if (!byPlan.has(key)) byPlan.set(key, []);
      byPlan.get(key).push({
        id: p.id,
        device: p.device,
        periodMonths: p.period_months,
        price: toRupees(p.price_paise),
      });
    }

    res.json({
      ok: true,
      data: rows.map((p) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        description: p.description,
        // The headline: desktop + mobile for a year, which is what most
        // people buy. The full list is in `prices` below.
        price: toRupees(p.price_paise),
        periodMonths: p.period_months,
        maxBusinesses: p.max_businesses,
        maxUsers: p.max_users,
        maxDevices: p.max_devices,
        features: typeof p.features === "string" ? JSON.parse(p.features) : p.features,
        // Empty for the free plan, and for any plan whose prices have not
        // been seeded. A screen with no prices should say so, not show zero.
        prices: byPlan.get(Number(p.id)) ?? [],
      })),
    });
  })
);

module.exports = router;
