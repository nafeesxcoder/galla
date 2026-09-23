// Har industry ka page yahin se banta hai. Naya business type add karna ho to
// bas is list me ek object add kar do, page aur sitemap dono apne aap ban jayenge.

export const INDUSTRIES = [
  {
    slug: "grocery-store",
    name: "Grocery store",
    icon: "basket",
    h1: "Billing software for grocery stores",
    tagline: "Fast counter billing for kirana shops",
    intro:
      "Weigh, bill and hand over the parcel before the next customer reaches the counter. Loose items, packed goods and monthly credit customers all sit in one app.",
    features: [
      [
        "Loose and packed items together",
        "Sell by kilo, litre or piece, with rates that update the bill as you weigh.",
      ],
      [
        "Fast repeat billing",
        "Frequently sold items stay on the first screen, so a bill takes seconds.",
      ],
      [
        "Monthly khata customers",
        "Keep running credit accounts and send a statement at month end.",
      ],
      ["Low stock alerts", "Know what to order before the shelf goes empty."],
    ],
    faqs: [
      [
        "Can I bill loose items by weight?",
        "Yes. Set the rate per kilo or litre and enter the weight, or connect a weighing scale and let it fill the quantity for you.",
      ],
      [
        "Can I keep monthly credit accounts?",
        "Yes. Each customer has a running balance, and you can send them a statement or a payment reminder on WhatsApp any time.",
      ],
    ],
  },
  {
    slug: "supermarket",
    name: "Supermarket",
    icon: "cart",
    h1: "Billing software for supermarkets",
    tagline: "Barcode billing built for busy counters",
    intro:
      "Scan, total and settle in one flow. Multiple counters, thousands of items and a queue that keeps moving even at peak hours.",
    features: [
      [
        "Barcode scanning",
        "Scan an item and it is on the bill with the right price and tax.",
      ],
      [
        "Multiple billing counters",
        "Every counter works on the same stock and prices.",
      ],
      [
        "Offers and combo pricing",
        "Run discounts on items or categories for a set period.",
      ],
      [
        "Shelf-wise stock reports",
        "See what sells, what sits and what to reorder this week.",
      ],
    ],
    faqs: [
      [
        "Does it work with barcode scanners?",
        "Yes. Any USB or Bluetooth scanner works, and you can also print your own barcode labels for loose or repacked goods.",
      ],
      [
        "Can two counters bill at the same time?",
        "Yes, on plans that allow multiple devices. Both counters share the same items and stock, and sales are merged in your reports.",
      ],
    ],
  },
  {
    slug: "pharmacy",
    name: "Pharmacy",
    icon: "pill",
    h1: "Billing software for pharmacies and medical stores",
    tagline: "Batch, expiry and GST handled together",
    intro:
      "Medicine billing needs more than a total. Track batch numbers, watch expiry dates and keep your purchase records ready for inspection.",
    features: [
      [
        "Batch and expiry tracking",
        "Every strip is billed from the right batch, with the expiry stored against it.",
      ],
      [
        "Expiry alerts",
        "See stock nearing expiry in time to return it to the distributor.",
      ],
      [
        "Salt and brand search",
        "Find a medicine by brand or composition while the customer waits.",
      ],
      [
        "Purchase and distributor records",
        "Keep supplier bills, credit notes and returns in order.",
      ],
    ],
    faqs: [
      [
        "Does it track batch numbers and expiry?",
        "Yes. Stock is kept batch-wise with expiry dates, the bill picks the correct batch, and you get alerts for stock nearing expiry.",
      ],
      [
        "Can I handle distributor returns?",
        "Yes. Expired or damaged stock can be returned against a purchase entry and adjusted with a debit note.",
      ],
    ],
  },
  {
    slug: "jewellery-store",
    name: "Jewellery store",
    icon: "gem",
    h1: "Billing software for jewellery shops",
    tagline: "Rate-based billing for gold and silver",
    intro:
      "Today's rate, net weight, making charges and GST, calculated together so the bill is right the first time.",
    features: [
      [
        "Daily rate-based pricing",
        "Set the day's gold and silver rate once and every bill uses it.",
      ],
      [
        "Making and wastage charges",
        "Add charges by percentage or fixed amount per item.",
      ],
      [
        "Purity-wise stock",
        "Keep 22K, 18K and silver stock separate with net and gross weight.",
      ],
      [
        "Old gold exchange",
        "Adjust the value of exchanged ornaments inside the same bill.",
      ],
    ],
    faqs: [
      [
        "Can I bill by today's gold rate?",
        "Yes. Update the rate for the day and every item is priced from it, with making charges and GST added on top.",
      ],
      [
        "Can I adjust old gold against a new purchase?",
        "Yes. Enter the weight and purity of the old ornament and its value is deducted from the bill total.",
      ],
    ],
  },
  {
    slug: "cloth-and-garments",
    name: "Cloth and garments",
    icon: "shirt",
    h1: "Billing software for cloth shops and garment stores",
    tagline: "Size and colour variants without the confusion",
    intro:
      "One design, many sizes and colours. Track every variant separately so you know what to reorder before the season peaks.",
    features: [
      [
        "Size and colour variants",
        "One item, many variants, each with its own stock and barcode.",
      ],
      [
        "Cut-piece and metre billing",
        "Bill fabric by metre with the rate applied automatically.",
      ],
      [
        "Season-wise reports",
        "See which designs moved and which are still lying in the godown.",
      ],
      [
        "Exchange and return",
        "Handle size exchanges without breaking your stock count.",
      ],
    ],
    faqs: [
      [
        "Can I track sizes separately?",
        "Yes. Each size and colour is its own variant with separate stock, so your reports show exactly which sizes are running out.",
      ],
      [
        "Can I bill fabric by metre?",
        "Yes. Set the rate per metre and enter the length, and the bill calculates the amount with tax.",
      ],
    ],
  },
  {
    slug: "electronics-store",
    name: "Electronics store",
    icon: "plug",
    h1: "Billing software for electronics and appliance shops",
    tagline: "Serial numbers and warranty in the bill",
    intro:
      "High-value items need a record. Keep serial numbers, warranty dates and service history tied to the customer who bought them.",
    features: [
      [
        "Serial number tracking",
        "Record the serial number on the bill so warranty claims are easy.",
      ],
      ["Warranty dates", "Look up when a product's warranty started and ends."],
      [
        "Service and repair entries",
        "Keep a record of repairs against the original sale.",
      ],
      [
        "Brand-wise reports",
        "See which brands and categories bring you the most profit.",
      ],
    ],
    faqs: [
      [
        "Can I record serial or IMEI numbers?",
        "Yes. Serial numbers can be entered while billing and stay linked to that invoice and customer.",
      ],
      [
        "Can I check warranty later?",
        "Yes. Search by serial number or customer to find the bill and see the warranty period.",
      ],
    ],
  },
  {
    slug: "restaurant",
    name: "Restaurant and cafe",
    icon: "cup",
    h1: "Billing software for restaurants and cafes",
    tagline: "Orders, kitchen slips and quick settle",
    intro:
      "Take the order, send it to the kitchen and settle the table without walking back and forth with a notepad.",
    features: [
      [
        "Table and takeaway orders",
        "Keep running orders per table and add items as they come.",
      ],
      [
        "Kitchen order slips",
        "Print or display the order for the kitchen the moment it is taken.",
      ],
      [
        "Menu with rates",
        "Categories, variants and half or full portions with their own prices.",
      ],
      [
        "Daily sales summary",
        "Know the day's collection, item-wise, before you shut.",
      ],
    ],
    faqs: [
      [
        "Can I run bills for multiple tables?",
        "Yes. Each table keeps its own running order until you settle it, and items can be added at any time.",
      ],
      [
        "Does it print kitchen slips?",
        "Yes. A separate kitchen slip can be printed on a thermal printer as soon as the order is saved.",
      ],
    ],
  },
  {
    slug: "hardware-and-paint",
    name: "Hardware and paint",
    icon: "tool",
    h1: "Billing software for hardware and paint shops",
    tagline: "Contractor credit and unit conversion",
    intro:
      "Sell by piece, box, kilo or litre, and keep contractor accounts clean with statements they cannot argue with.",
    features: [
      [
        "Unit conversion",
        "Buy by box, sell by piece, with stock adjusting correctly.",
      ],
      [
        "Contractor credit accounts",
        "Running accounts with statements and reminders.",
      ],
      [
        "Shade and size variants",
        "Track paint shades or pipe sizes as separate items.",
      ],
      [
        "Quotation to invoice",
        "Turn an approved quotation into a bill without retyping.",
      ],
    ],
    faqs: [
      [
        "Can I buy in boxes and sell in pieces?",
        "Yes. Set the conversion once and your stock stays correct whichever unit you use.",
      ],
      [
        "Can I send contractors a monthly statement?",
        "Yes. Each party has a ledger, and you can share the statement as a PDF on WhatsApp.",
      ],
    ],
  },
  {
    slug: "mobile-shop",
    name: "Mobile shop",
    icon: "phone",
    h1: "Billing software for mobile shops",
    tagline: "IMEI tracking with accessory stock",
    intro:
      "Handsets, accessories and repairs in one place, with the IMEI recorded on every bill.",
    features: [
      [
        "IMEI on the invoice",
        "Each handset is billed against its IMEI number.",
      ],
      [
        "Accessory stock",
        "Cases, chargers and cables tracked with the same app.",
      ],
      [
        "Repair and service records",
        "Keep job entries against the customer and handset.",
      ],
      [
        "Profit per bill",
        "See the margin on each handset before you offer a discount.",
      ],
    ],
    faqs: [
      [
        "Can I record the IMEI on the bill?",
        "Yes. Enter or scan the IMEI while billing and it stays with that invoice for warranty and service.",
      ],
      [
        "Can I track repairs?",
        "Yes. Repair jobs can be recorded against the customer with the charge added when the work is done.",
      ],
    ],
  },
  {
    slug: "salon-and-spa",
    name: "Salon and spa",
    icon: "scissor",
    h1: "Billing software for salons and spas",
    tagline: "Service billing with packages",
    intro:
      "Bill services instead of stock, keep package balances and remember what each regular customer usually takes.",
    features: [
      [
        "Service-wise billing",
        "A menu of services with rates, billed in a couple of taps.",
      ],
      [
        "Packages and prepaid balance",
        "Track how many sittings a customer has left.",
      ],
      ["Staff-wise sales", "See which stylist brought in how much this month."],
      ["Customer history", "Look up what a returning customer took last time."],
    ],
    faqs: [
      [
        "Can I sell packages?",
        "Yes. Sell a package once and each visit is adjusted against the remaining balance.",
      ],
      [
        "Can I see sales by staff member?",
        "Yes. Assign a service to the staff member who performed it and the report shows their total.",
      ],
    ],
  },
  {
    slug: "wholesale-and-distribution",
    name: "Wholesale and distribution",
    icon: "truck",
    h1: "Billing software for wholesalers and distributors",
    tagline: "Bulk orders, party rates and challans",
    intro:
      "Different rates for different parties, delivery challans that turn into invoices, and outstanding you can actually collect.",
    features: [
      [
        "Party-wise price lists",
        "Each buyer sees the rate you agreed with them.",
      ],
      [
        "Delivery challan to invoice",
        "Send goods on a challan and convert it to a bill later.",
      ],
      [
        "E-way bill ready",
        "Generate the e-way bill details along with the invoice.",
      ],
      [
        "Outstanding and collection",
        "Sort parties by how much and how long they owe.",
      ],
    ],
    faqs: [
      [
        "Can each party have its own rate?",
        "Yes. Save a price list per party and the correct rate is picked when you bill them.",
      ],
      [
        "Does it handle delivery challans?",
        "Yes. Send goods on a challan first, then convert it into a tax invoice without entering the items again.",
      ],
    ],
  },
  {
    slug: "manufacturing",
    name: "Manufacturing",
    icon: "factory",
    h1: "Billing software for small manufacturers",
    tagline: "Raw material in, finished goods out",
    intro:
      "Track what went into production and what came out, so your costing and your stock both stay honest.",
    features: [
      ["Raw material consumption", "Record what each production run used."],
      ["Finished goods stock", "Output is added to stock ready for sale."],
      [
        "Production costing",
        "See the material cost behind each finished item.",
      ],
      [
        "Job work entries",
        "Track material sent out and received back from job workers.",
      ],
    ],
    faqs: [
      [
        "Can I track raw material and finished goods?",
        "Yes. A production entry reduces raw material stock and adds the finished item, so both stay accurate.",
      ],
      [
        "Does it help with costing?",
        "Yes. The material cost of a production run is shown against the finished item, which you can use to set your selling price.",
      ],
    ],
  },
];

export function getIndustry(slug) {
  return INDUSTRIES.find((i) => i.slug === slug);
}
