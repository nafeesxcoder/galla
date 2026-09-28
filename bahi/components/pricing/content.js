// ===========================================================================
// PRICING PAGE - ALL TEXT, PLANS AND FEATURES
// ---------------------------------------------------------------------------
// The page has two views and a floating button that switches between them:
//   1. Plans view    -> the two plan cards
//   2. Compare view  -> the full feature table
//
// TODO items - search "TODO" for what still needs real data:
//   - every price below is a PLACEHOLDER
//   - check each feature row against what your app actually does
// ===========================================================================

export const CONTENT = {
  head: {
    eyebrow: "Pricing",
    h1: "Simple pricing for every business",
    lead:
      "Start free, then pick the plan that fits. Every plan includes GST billing, inventory and reports.",
  },

  // -------------------------------------------------------------------------
  // The two dropdowns above the plan cards
  // -------------------------------------------------------------------------
  // The price key is built as  `${device}-${term}`, so both ids below have to
  // match the keys used in each plan's  price  object further down.
  devices: [
    { id: "both", label: "Desktop + Mobile" },
    { id: "mobile", label: "Mobile only" },
    { id: "desktop", label: "Desktop only" },
  ],
  terms: [
    { id: "1", label: "1 Year", years: 1 },
    { id: "3", label: "3 Years", years: 3 },
  ],

  // -------------------------------------------------------------------------
  // PLANS
  // -------------------------------------------------------------------------
  // price: [ mrp, currentPrice ] in rupees, as plain numbers.
  // The "only ₹X per month" line is worked out from these, so you never have
  // to keep it in sync by hand.
  //
  // TODO: all of these are PLACEHOLDER numbers. Put your real prices here.
  plans: [
    {
      id: "silver",
      name: "Silver",
      icon: "shield",
      tagline: "For a single counter",
      cta: "Get Galla Silver",
      price: {
        "both-1": [5999, 3999],
        "both-3": [14999, 8999],
        "mobile-1": [3499, 2499],
        "mobile-3": [8999, 5999],
        "desktop-1": [4999, 3499],
        "desktop-3": [12999, 7999],
      },
    },
    {
      id: "gold",
      name: "Gold",
      icon: "gem",
      tagline: "For a growing business",
      popular: true,
      popularLabel: "Most Popular",
      cta: "Get Galla Gold",
      price: {
        "both-1": [7999, 4999],
        "both-3": [19999, 11999],
        "mobile-1": [4999, 3499],
        "mobile-3": [12999, 8499],
        "desktop-1": [6999, 4499],
        "desktop-3": [17999, 10999],
      },
    },
  ],

  // -------------------------------------------------------------------------
  // FEATURES
  // -------------------------------------------------------------------------
  // Each row shows in both views: the short list on the plan cards and the
  // full table in the compare view.
  //
  // Values:  true  -> green tick
  //          false -> red cross
  //          "text" -> shown as text, e.g. "10 per month"
  //
  // card: true  puts the row on the plan cards as well. Leave it off for
  // rows you only want in the comparison table.
  //
  // info: the text shown when someone hovers the (i) next to the name.
  features: [
    {
      name: "Sync data across devices",
      info: "Whatever you enter on one device shows up on the others.",
      card: true,
      silver: true,
      gold: true,
    },
    {
      name: "Create multiple companies",
      info: "Run more than one business from the same account.",
      card: true,
      silver: "3 companies",
      gold: "5 companies",
    },
    {
      name: "Generate E-way Bills",
      info: "Create GST e-way bills straight from a bill you have made.",
      card: true,
      silver: "10 per month",
      gold: "Unlimited",
    },
    {
      name: "Remove advertisement on invoices",
      info: "Bills go out with only your own branding on them.",
      card: true,
      silver: true,
      gold: true,
    },
    {
      name: "Set multiple pricing for items",
      info: "Keep different rates for retail, wholesale and special parties.",
      card: true,
      silver: true,
      gold: true,
    },
    {
      name: "Update items in bulk",
      info: "Change rate, tax or stock for many items at once.",
      card: true,
      silver: true,
      gold: true,
    },
    {
      name: "Export data to Tally",
      info: "Send your data across to Tally without re-entering it.",
      card: true,
      silver: false,
      gold: true,
    },
    {
      name: "Restore deleted transactions",
      info: "Bring back an entry that was deleted by mistake.",
      card: true,
      silver: "2 transactions",
      gold: "Unlimited",
    },
    {
      name: "Combine multiple orders into one sale",
      info: "Merge several orders or challans into a single invoice.",
      card: true,
      silver: false,
      gold: true,
    },
    {
      name: "Accounting module",
      info: "Ledgers, journal entries and the full set of accounting reports.",
      card: true,
      silver: false,
      gold: true,
    },
    {
      name: "Set credit limit for parties",
      info: "Cap how much credit a party can take before you are warned.",
      silver: false,
      gold: true,
    },
    {
      name: "Add fixed assets",
      info: "Record assets and track depreciation against them.",
      silver: true,
      gold: true,
    },
    {
      name: "Automate payment reminders",
      info: "Reminders go out on their own when a payment is overdue.",
      silver: false,
      gold: true,
    },
    {
      name: "Barcode generator and scanner",
      info: "Print your own barcodes and scan items straight onto a bill.",
      silver: true,
      gold: true,
    },
    {
      name: "Godown / multi-location stock",
      info: "Track stock separately for each store or warehouse.",
      silver: false,
      gold: true,
    },
    {
      name: "Bill-wise profit and loss",
      info: "See the margin on each individual bill, not just the month.",
      silver: false,
      gold: true,
    },
    {
      name: "User roles and permissions",
      info: "Give staff their own logins and decide what each can see.",
      silver: "2 users",
      gold: "5 users",
    },
    {
      name: "Automatic cloud backup",
      info: "Your data is backed up on its own, with no action from you.",
      silver: true,
      gold: true,
    },
    {
      name: "Priority customer support",
      info: "Your questions go to the front of the queue.",
      silver: false,
      gold: true,
    },
  ],

  // -------------------------------------------------------------------------
  // The two floating buttons at the bottom of the screen
  // -------------------------------------------------------------------------
  compareCta: "Compare All Features",
  backCta: "Back To Plans",
  featuresTitle: "Features",

  foot: "All prices exclude GST. You can upgrade your plan at any time.",

  // -------------------------------------------------------------------------
  // FAQ
  // -------------------------------------------------------------------------
  faqs: [
    [
      "Is there a free plan?",
      "Yes. You can start free and move to a paid plan only when you need the extra features.",
    ],
    [
      "Can I change my plan later?",
      "Yes. You can upgrade at any time and the remaining value of your current plan is adjusted.",
    ],
    [
      "Does the price include GST?",
      "No. All the prices shown here are before GST.",
    ],
    [
      "What is the difference between the mobile and desktop plans?",
      "A mobile plan covers the phone app, a desktop plan covers the computer app, and Desktop + Mobile covers both with your data synced between them.",
    ],
    [
      "How do I pay?",
      "UPI, card, net banking and the usual online payment methods are all accepted.",
    ],
    [
      "What happens when my plan expires?",
      "Your data stays safe and you can still open it. The paid features pause until you renew.",
    ],
  ],
};
