// ===========================================================================
// THE INDUSTRY INDEX
// ---------------------------------------------------------------------------
// This file is the LIST: which business types exist, what they are called,
// and the few lines that appear at the top of each page.
//
// The long content for each one - the explanation, the features, the steps,
// the FAQs - lives in lib/industry-content.js, keyed by the same slug. They
// are separate because this file is read by the Solutions menu and the
// sitemap, which do not need the long text.
//
// TO ADD A BUSINESS TYPE:
//   1. add an object here
//   2. add a matching block in lib/industry-content.js
// The page, the menu and the sitemap all pick it up on their own.
//
// The icon name has to be one MenuIcon knows. See components/MenuIcon.js.
// ===========================================================================

export const INDUSTRIES = [
  {
    slug: "grocery-store",
    name: "Grocery store",
    icon: "basket",
    tagline: "Fast counter billing for kirana shops",
    h1: "Billing software for grocery stores",
    intro:
      "Weigh, bill and hand over the parcel before the next customer reaches the counter. Loose items, packed goods and monthly credit customers all sit in one app.",
    trust: ["Free plan", "Works offline", "Monthly khata"],
  },
  {
    slug: "supermarket",
    name: "Supermarket",
    icon: "cart",
    tagline: "Barcode billing built for busy counters",
    h1: "Billing software for supermarkets",
    intro:
      "Scan, total and settle in one flow. Several counters, thousands of items, and a queue that keeps moving at peak hours.",
    trust: ["Multiple counters", "Barcode ready", "Live stock"],
  },
  {
    slug: "pharmacy",
    name: "Pharmacy",
    icon: "pill",
    tagline: "Batch, expiry and GST handled together",
    h1: "Billing software for pharmacies and medical stores",
    intro:
      "Medicine billing needs more than a total. Track batch numbers, watch expiry dates and keep your purchase records ready for inspection.",
    trust: ["Batch and expiry", "Schedule H records", "Free plan"],
  },
  {
    slug: "jewellery-store",
    name: "Jewellery store",
    icon: "gem",
    tagline: "Rate-based billing for gold and silver",
    h1: "Billing software for jewellery shops",
    intro:
      "Today's rate, net weight, making charges and GST, worked out together so the bill is right the first time.",
    trust: ["Daily rate pricing", "Old gold exchange", "Purity-wise stock"],
  },
  {
    slug: "cloth-and-garments",
    name: "Cloth and garments",
    icon: "shirt",
    tagline: "Size and colour variants without the confusion",
    h1: "Billing software for cloth shops and garment stores",
    intro:
      "One design, many sizes and colours. Track every variant separately, so you know what to reorder before the season peaks.",
    trust: ["Variant stock", "Metre billing", "Easy exchanges"],
  },
  {
    slug: "electronics-store",
    name: "Electronics store",
    icon: "plug",
    tagline: "Serial numbers and warranty in the bill",
    h1: "Billing software for electronics and appliance shops",
    intro:
      "High-value items need a record. Keep serial numbers, warranty dates and service history tied to the customer who bought them.",
    trust: ["Serial tracking", "Warranty lookup", "Service records"],
  },
  {
    slug: "restaurant",
    name: "Restaurant and cafe",
    icon: "cup",
    tagline: "Orders, kitchen slips and a quick settle",
    h1: "Billing software for restaurants and cafes",
    intro:
      "Take the order, send it to the kitchen and settle the table without walking back and forth with a notepad.",
    trust: ["Table orders", "Kitchen slips", "Day-end summary"],
  },
  {
    slug: "hardware-and-paint",
    name: "Hardware and paint",
    icon: "tool",
    tagline: "Contractor credit and unit conversion",
    h1: "Billing software for hardware and paint shops",
    intro:
      "Sell by piece, box, kilo or litre, and keep contractor accounts clean with statements nobody can argue with.",
    trust: ["Unit conversion", "Party ledgers", "Quote to invoice"],
  },
  {
    slug: "mobile-shop",
    name: "Mobile shop",
    icon: "phone",
    tagline: "IMEI tracking alongside accessory stock",
    h1: "Billing software for mobile shops",
    intro:
      "Handsets, accessories and repairs in one place, with the IMEI recorded on every bill.",
    trust: ["IMEI on the bill", "Repair jobs", "Margin per sale"],
  },
  {
    slug: "salon-and-spa",
    name: "Salon and spa",
    icon: "scissor",
    tagline: "Service billing with packages",
    h1: "Billing software for salons and spas",
    intro:
      "Bill services instead of stock, keep package balances, and remember what each regular usually takes.",
    trust: ["Package balances", "Staff-wise sales", "Customer history"],
  },
  {
    slug: "wholesale-and-distribution",
    name: "Wholesale and distribution",
    icon: "truck",
    tagline: "Bulk orders, party rates and challans",
    h1: "Billing software for wholesalers and distributors",
    intro:
      "Different rates for different parties, delivery challans that turn into invoices, and outstanding you can actually collect.",
    trust: ["Party rate lists", "Challan to invoice", "E-way bill ready"],
  },
  {
    slug: "manufacturing",
    name: "Manufacturing",
    icon: "factory",
    tagline: "Raw material in, finished goods out",
    h1: "Billing software for small manufacturers",
    intro:
      "Track what went into production and what came out, so your costing and your stock both stay honest.",
    trust: ["Production entries", "Material costing", "Job work"],
  },
];

export function getIndustry(slug) {
  return INDUSTRIES.find((i) => i.slug === slug);
}
