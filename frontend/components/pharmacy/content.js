// Pharmacy page ka saara content. Sirf text yahan badalna hai,
// components ko haath lagane ki zarurat nahi.

export const CONTENT = {
  hero: {
    badge: "Built for chemists and medical stores",
    h1: "Pharmacy billing software",
    lead:
      "Make GST bills, track every batch and expiry date, watch your stock and run the counter from one app. Free to start, works offline.",
    chips: ["Drug licence on the bill", "Batch details", "GST slabs", "Expiry alerts"],
    cta: "Download free",
    cta2: "See pricing",
    trust: ["Made for Indian pharmacies", "Schedule H and H1 records", "Free plan, no expiry"],
    art: "pharmacy",
  },

  intro: {
    eyebrow: "The basics",
    h2: "What is pharmacy billing software?",
    body: [
      "It is the software a chemist shop uses instead of a bill book and a stock register. You add your medicines once, and from then on every sale makes a proper GST bill, reduces the stock, and records which batch went out and when it expires.",
      "The same data then gives you your purchase records, party ledgers and the summaries your CA needs at return time. Meeting drug and tax rules is still your responsibility, but the records are kept in a form you can produce on demand.",
    ],
  },

  whoFor: {
    eyebrow: "Who it is for",
    h2: "Made for every kind of pharmacy business",
    lead: "Whether you run one counter or supply to fifty of them.",
    items: [
      [
        "Chemist stores",
        "GST bills at the counter, batch and expiry on every line, barcode billing and low stock alerts for daily retail.",
        "pill",
      ],
      [
        "Pharma distributors",
        "Bulk tax invoices, strip and box conversions, manufacturer batch numbers and party-wise margins.",
        "truck",
      ],
      [
        "Hospital pharmacies",
        "Bills tied to patient records, doctor-wise prescription history and emergency stock room tracking.",
        "shield",
      ],
      [
        "Chain pharmacies",
        "Stock across branches, central purchase and store-wise sales from one login.",
        "cart",
      ],
    ],
  },

  features: {
    eyebrow: "Key features",
    h2: "Billing, expiry, wholesale and compliance in one system",
    lead: "The parts of a pharmacy that a general billing app never gets right.",
    blocks: [
      {
        h3: "GST invoicing with a drug licence field",
        p: "Bills that satisfy both the customer and the inspector. Enter your drug licence number once and it prints on every invoice after that.",
        points: [
          "Drug licence number added to invoices automatically",
          "GST worked out by medicine category (Nil, 5%, 18%)",
          "Share the bill by print, WhatsApp or email",
          "HSN codes stored against each medicine",
        ],
        note: "Rates change from time to time. Check the current slabs on gst.gov.in before you rely on them.",
        art: "invoice",
      },
      {
        h3: "Batch and expiry on every bill",
        p: "Know which batch each strip came from and when it runs out. Near-expiry stock shows up while you can still return it.",
        points: [
          "Batch number recorded at the time of billing",
          "Expiry date printed on the invoice",
          "Filter stock by expiry so old batches move first",
          "Stock movement visible across every medicine category",
        ],
        art: "sync",
      },
      {
        h3: "Schedule H and H1 records",
        p: "Restricted medicines need a register that holds up during an inspection. That register is kept for you, every time such a medicine is billed.",
        points: [
          "Only an admin or authorised staff member can release restricted medicines for billing",
          "A description field records the prescription reference, doctor name or reason",
          "The digital Schedule H and H1 register updates with every transaction",
          "Restricted medicines can be switched off at the counter when not needed",
          "Full history retrievable in seconds during an inspection",
        ],
        note: "Requirements come from the Drugs and Cosmetics Act, 1940 and its Rules, 1945. Your pharmacist remains responsible for compliance.",
        art: "shield",
      },
      {
        h3: "Wholesale billing for distributors",
        p: "Built for volume. Bulk orders, party accounts and credit, without a spreadsheet on the side.",
        points: [
          "Bulk invoices with many products on one bill",
          "PTR or MRP based pricing, whichever your trade uses",
          "Party-wise ledger for purchases, payments and outstanding",
          "Credit limits so one buyer cannot run up the whole book",
          "Purchase returns and expired stock handled cleanly",
        ],
        art: "growth",
      },
    ],
  },

  steps: {
    eyebrow: "Getting started",
    h2: "Billing at your counter in four steps",
    lead: "No training needed. Most shops make their first bill the same evening.",
    items: [
      ["Download the app", "Install it on an Android phone or a Windows computer and set up your shop."],
      ["Add your medicines", "Enter or import items with batch, expiry and rates. Excel imports work."],
      ["Make your first bill", "Pick the customer, scan or search the medicine, print or share on WhatsApp."],
      ["Watch stock and records", "Expiry alerts, low stock warnings and GST summaries build up on their own."],
    ],
  },

  compare: {
    eyebrow: "What changes",
    h2: "Register, generic software, and a pharmacy app",
    head: ["What you need", "Paper register", "General billing app", "Pharmacy billing"],
    rows: [
      ["GST by medicine category", "Worked out by hand", "Partly supported", "Nil, 5% or 18% applied for you"],
      ["Batch and expiry", "Paper register only", "Usually missing", "Recorded on every bill"],
      ["Drug licence on the invoice", "Rubber stamp", "Not supported", "Added from settings"],
      ["Schedule H and H1 register", "Physical register", "Not supported", "Kept digitally, role controlled"],
      ["Restricted drug access", "No control", "No control", "Admin releases it"],
      ["Works on phone and computer", "No", "Mostly desktop only", "Android and Windows"],
    ],
  },

  extras: {
    eyebrow: "Also in the app",
    h2: "Barcode billing, stock alerts and GST reports",
    lead: "The smaller things that save an hour a day once the counter gets busy.",
    items: [
      ["Barcode billing", "Scan the strip and it is on the bill. Fewer wrong medicines, faster queues.", "pos"],
      ["Low stock alerts", "Set a minimum for each medicine and reorder before the shelf is empty.", "box"],
      ["GST reports", "Category-wise summaries for GSTR-1 and GSTR-3B, pulled from your own bills.", "ledger"],
    ],
  },

  trust: {
    eyebrow: "Why pharmacies use it",
    h2: "Built around how a chemist shop actually works",
    items: [
      [
        "Made for pharmacy rules",
        "Drug licence details, batch and expiry tracking and audit-ready records are part of the app, not an add-on.",
        "shield",
      ],
      [
        "Simple enough for the counter",
        "No accounting background needed. Staff pick it up during a normal shift.",
        "users",
      ],
      [
        "Your records stay yours",
        "Everything is backed up and exportable to Excel or PDF whenever you want it.",
        "ledger",
      ],
    ],
  },

  related: {
    h2: "Other tools pharmacies use",
    items: [
      ["POS software", "/software/pos-software", "Counter billing with barcode scanning and quick payment modes."],
      ["Inventory software", "/software/inventory-software", "Batch tracking, purchase orders and expiry alerts."],
      ["Billing software", "/software/billing-software", "Quick bills, barcode receipts and daily sales tracking."],
      ["Accounting software", "/software/accounting-software", "Ledgers, expenses, profit and loss and cash flow."],
      ["E-invoice software", "/software/e-invoice-software", "IRN and e-way bills straight from the invoice."],
    ],
  },

  faqs: [
    [
      "What is pharmacy billing software and why does a chemist need it?",
      "It replaces the bill book and the stock register with one system. Bills carry GST and your drug licence number, stock reduces as you sell, and batch and expiry are recorded automatically. The point is not speed alone. It is having records you can produce during an inspection without digging through papers.",
    ],
    [
      "Can my drug licence number print on the invoice?",
      "Yes. Enter it once in your shop settings and it appears on every invoice after that, along with your GSTIN and shop details.",
    ],
    [
      "How does expiry tracking work?",
      "Stock is kept batch-wise, and each batch carries its expiry date. When you bill, the batch is recorded on the invoice. You can also sort your stock by expiry to move or return the oldest batches first.",
    ],
    [
      "Does it handle the different GST rates on medicines?",
      "Yes. Set the rate against each medicine once and it is applied on every bill, whether that is nil-rated, 5% or 18%. Rates change from time to time, so check the current slabs on gst.gov.in.",
    ],
    [
      "How does it help with Schedule H and H1 medicines?",
      "Restricted medicines can only be released for billing by an admin or an authorised staff member, and releasing one requires a note such as the prescription reference or doctor name. The digital register builds up with every transaction and can be pulled up during an inspection.",
    ],
    [
      "Is it suitable for a wholesale pharma business?",
      "Yes. Bulk invoices, strip and box conversions, PTR or MRP based pricing, party ledgers and credit limits are all supported.",
    ],
    [
      "Can I use a barcode scanner?",
      "Yes. Any USB or Bluetooth scanner works, and you can print your own barcode labels for repacked or loose items.",
    ],
    [
      "What happens during a drug inspection or GST audit?",
      "Your transaction history is searchable by date, party or medicine name, and batch and expiry records stay current. GST summaries are ready at the end of each return period.",
    ],
    [
      "Does it work on both phone and computer?",
      "Yes. One account covers an Android phone and a Windows computer, and bills made on one show up on the other.",
    ],
    [
      "Is there a free version?",
      "Yes. The free plan covers unlimited GST and non-GST bills on one device. Paid plans add more devices, staff logins and the compliance reports.",
    ],
    [
      "Will it work if the internet goes down?",
      "Yes. Billing runs offline and everything syncs the moment you are back online.",
    ],
    [
      "Can I move my existing records in?",
      "Medicines, suppliers, customers and opening balances can be imported from an Excel or CSV file.",
    ],
    [
      "Can I control which staff can bill restricted medicines?",
      "Yes. Each staff member has their own login, and you decide who can release Schedule H or H1 medicines and who can only bill regular stock.",
    ],
  ],
};

export default CONTENT;
