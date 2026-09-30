// ===========================================================================
// THE SIX SOFTWARE PAGES - ALL CONTENT
// ---------------------------------------------------------------------------
// Each entry below becomes one page at /software/<slug>. The page template
// lives in components/software/Page.js and renders whatever is here, so
// adding a section means adding a key here and a block there.
//
// The sitemap and the Solutions mega menu both read this array, so a new
// entry appears in both without any other edit.
//
// NOTE ON CLAIMS: everything here describes what the software does. There
// are no download counts, star ratings or customer numbers, because those
// have to be true and provable before they go on a page.
// ===========================================================================

export const SOFTWARE = [
  // =========================================================================
  {
    slug: "billing-software",
    name: "Billing software",
    icon: "receipt",
    tagline: "Bills in seconds, tax worked out for you",
    h1: "Billing software for small businesses",
    intro:
      "Pick the customer, add the items, and the bill is ready - GST calculated, invoice numbered, print or WhatsApp in one tap. Free to start, works offline.",
    trust: ["Free plan", "Works offline", "GST ready"],

    whatIs: {
      h2: "What billing software actually does",
      body: [
        "Billing software replaces the bill book. You enter your items and your customers once; after that every sale produces a proper invoice with the tax worked out, the invoice number in sequence, and a copy saved that you can find again in seconds.",
        "That saved copy is the part that matters. At the end of the month you are not adding up carbon copies - your sales total, your tax summary and your list of who still owes you are already there, made from bills you had to create anyway.",
      ],
    },

    features: {
      h2: "What you get",
      lead: "The things a counter actually needs, not a feature list written for a demo.",
      items: [
        ["receipt", "GST and non-GST bills", "Both, from the same screen. CGST, SGST and IGST are picked automatically based on where your customer is."],
        ["phone", "Share on WhatsApp", "Send the bill to the customer the moment it is made. No printing, no photo of a paper bill."],
        ["doc", "Your own invoice format", "Your logo, your terms, your fields. Several themes to start from, all of them GST-valid."],
        ["pos", "Barcode billing", "Scan and the line is added. For a shop with hundreds of items, this is the difference between a queue and no queue."],
        ["tag", "UPI QR on the bill", "The customer scans the invoice and pays. No separate QR standee, no asking them to type your number."],
        ["shield", "Works with no internet", "Bills are made and saved on the device. When the connection comes back they sync on their own."],
      ],
    },

    steps: {
      h2: "How a bill gets made",
      lead: "Four taps, and most of them are optional after the first time.",
      items: [
        ["Pick the customer", "Or skip it for a walk-in. Saved customers bring their GSTIN and address with them."],
        ["Add the items", "Type, scan or pick from your list. Price and tax rate come from the item, so nothing is typed twice."],
        ["Take the payment", "Cash, UPI, card or credit. Part payment is fine - the rest goes to their outstanding."],
        ["Send it", "Print, WhatsApp, email, or all three. The copy is saved either way."],
      ],
    },

    whoFor: {
      h2: "Who uses it",
      lead: "Anyone who gives a customer a piece of paper at the end of a sale.",
      items: [
        ["basket", "Retail counters", "Shops billing many small sales a day, where speed at the counter is the whole job."],
        ["truck", "Wholesalers and distributors", "Bigger bills, credit terms, and a need to know who is behind on payment."],
        ["tool", "Service businesses", "Workshops, repairs, contractors - where the bill is made after the work, not at a counter."],
        ["factory", "Manufacturers", "Tax invoices against purchase orders, with stock moving out as you bill."],
      ],
    },

    faqs: [
      ["Is the billing software free?", "There is a free plan you can use without giving a card. Paid plans add the heavier features - see the pricing page for what is in each."],
      ["Are the invoices GST compliant?", "Yes. CGST, SGST and IGST, HSN and SAC codes, and the invoice formats your CA expects. You stay responsible for the rates and codes you enter being correct."],
      ["Can I bill without an internet connection?", "Yes. Bills are made and stored on the device, and sync by themselves once you are back online."],
      ["Can I put my own logo on the invoice?", "Yes, along with your business details, terms and the fields you want shown. Several themes are included to start from."],
      ["Can my staff make bills too?", "Yes. Each person gets their own login and you choose what they can see, so you can tell who made which bill."],
      ["Does it work on a phone as well as a computer?", "Yes - Android, iOS, Windows and Mac, all on one account with the same data."],
    ],
  },

  // =========================================================================
  {
    slug: "invoicing-software",
    name: "Invoicing software",
    icon: "doc",
    tagline: "Quote, invoice and follow up in one place",
    h1: "Invoicing software with GST built in",
    intro:
      "Send the estimate, turn it into an invoice when they say yes, and chase the payment without typing anything twice.",
    trust: ["Estimate to invoice in one tap", "Automatic numbering", "Payment reminders"],

    whatIs: {
      h2: "Invoicing is more than making the bill",
      body: [
        "Most businesses quote before they invoice. The quote gets discussed, something changes, and then the invoice has to be typed again from scratch - which is where wrong amounts and wrong item lists come from.",
        "Invoicing software keeps the whole chain joined: estimate, invoice, delivery challan, credit note. Each one is made from the one before it, so the numbers agree, and the invoice numbers stay in an unbroken sequence, which is what matters at return time.",
      ],
    },

    features: {
      h2: "What you get",
      lead: "Everything between agreeing a price and getting paid.",
      items: [
        ["doc", "Estimates and quotations", "Send a quote with an expiry date. One tap turns an accepted quote into the invoice."],
        ["receipt", "Automatic invoice numbering", "An unbroken sequence, with your own prefix and financial-year reset. Gaps in numbering are what draw questions."],
        ["truck", "Delivery challans", "Send goods first, invoice after. The challan converts to an invoice without re-entering the items."],
        ["ledger", "Credit and debit notes", "Returns and corrections handled properly, linked to the original invoice, ready for GSTR-1."],
        ["phone", "Payment reminders", "A list of who is overdue and by how long, with a reminder you can send on WhatsApp in a tap."],
        ["tag", "Recurring invoices", "For anything billed monthly - rent, maintenance, a retainer. Set it once."],
      ],
    },

    steps: {
      h2: "From quote to money in the bank",
      lead: "The same four documents every business ends up making.",
      items: [
        ["Send an estimate", "With your prices, terms and an expiry date, so an old quote does not come back months later."],
        ["Convert it", "When they agree, the estimate becomes an invoice. Items, rates and taxes carry across untouched."],
        ["Record the payment", "Full or part. What is left shows in that customer's outstanding straight away."],
        ["Follow up", "Overdue invoices are listed oldest first. Send the reminder from the same screen."],
      ],
    },

    whoFor: {
      h2: "Who uses it",
      lead: "Businesses where the invoice is the end of a conversation, not a counter sale.",
      items: [
        ["tool", "Contractors and service providers", "Quote the job, invoice on completion, chase the balance."],
        ["users", "Agencies and consultants", "Retainers, milestones and recurring monthly invoices."],
        ["truck", "Suppliers on credit terms", "Challan out, invoice after, and a clear view of what is still unpaid."],
        ["factory", "Anyone working against purchase orders", "Documents that reference each other properly, which is what the buyer's accounts team asks for."],
      ],
    },

    faqs: [
      ["What is the difference between an estimate and an invoice?", "An estimate is a proposed price - it creates no tax liability and no receivable. An invoice is the demand for payment, and it is what goes into your GST return. Keeping them separate matters."],
      ["Can I set my own invoice number format?", "Yes - your own prefix, starting number and financial-year reset. The sequence stays unbroken, which is what matters if you are ever asked about it."],
      ["Can I send invoices on WhatsApp?", "Yes, along with email and print. Payment reminders go the same way."],
      ["Does it handle returns?", "Yes, as credit notes linked to the original invoice, which is how a return has to be recorded for GST."],
      ["Can I invoice the same customer every month automatically?", "Yes. Set a recurring invoice once and it is created on schedule."],
      ["Will my CA be able to work with this?", "Yes. The reports export to Excel, and the invoice and return formats are the standard ones."],
    ],
  },

  // =========================================================================
  {
    slug: "inventory-software",
    name: "Inventory software",
    icon: "box",
    tagline: "The shelf and the screen finally agree",
    h1: "Inventory software for shops and godowns",
    intro:
      "Stock moves by itself as you bill and purchase. See what is left, what is about to run out, and what is quietly expiring at the back.",
    trust: ["Live stock count", "Low stock alerts", "Batch and expiry"],

    whatIs: {
      h2: "Why stock registers stop matching reality",
      body: [
        "A separate stock register only works if someone updates it after every sale and every delivery. In a busy shop that stops happening by the second week, and from then on the register is a guess.",
        "Inventory software fixes this by not being separate. Stock comes down when you make a bill and goes up when you record a purchase - the same entries you were making anyway. Nobody has to remember an extra step, so the count stays true.",
      ],
    },

    features: {
      h2: "What you get",
      lead: "Knowing what you have, before you promise it to somebody.",
      items: [
        ["box", "Live stock count", "Every bill and purchase moves the number. What you see is what is on the shelf."],
        ["shield", "Low stock alerts", "Set a level per item and get told before you run out, not after a customer asks."],
        ["pill", "Batch numbers and expiry", "For medicines, food and anything dated. Sell the oldest batch first and see what is close to expiring."],
        ["factory", "Multiple godowns", "Stock per location, and transfers between them recorded properly."],
        ["pos", "Barcodes", "Scan to bill, scan to receive. Faster and it removes the wrong-item mistakes."],
        ["ledger", "Stock reports", "What moved, what did not, and what your stock is worth right now."],
      ],
    },

    steps: {
      h2: "How stock stays correct",
      lead: "No extra work, because it rides on the entries you already make.",
      items: [
        ["Add your items once", "Name, unit, rate, tax and opening quantity. Import from Excel if you have a list."],
        ["Bill as usual", "Stock comes down automatically on every sale. No separate register entry."],
        ["Record purchases", "Stock goes up, and the purchase bill is saved against the supplier at the same time."],
        ["Check and correct", "A physical count now and then will still find differences. Adjust them in the app and the reason is recorded."],
      ],
    },

    whoFor: {
      h2: "Who uses it",
      lead: "Anyone holding stock they can lose money on.",
      items: [
        ["basket", "Retail shops", "Hundreds of small items where running out means a lost sale."],
        ["pill", "Pharmacies and food businesses", "Where batch and expiry are not optional extras but the core of the job."],
        ["truck", "Wholesalers and distributors", "Big quantities across godowns, with transfers to track."],
        ["shirt", "Garment and footwear shops", "Size and colour variants, where one item is really thirty."],
      ],
    },

    faqs: [
      ["Does the stock update by itself?", "Yes. Making a bill reduces stock and recording a purchase increases it. There is no separate register to maintain."],
      ["Can I track batch numbers and expiry dates?", "Yes. You can see what is nearing expiry and sell the oldest batch first, which is what most chemists and food businesses need."],
      ["Can I manage stock in more than one godown?", "Yes - stock per location, and transfers between locations recorded properly."],
      ["Can I import my existing item list?", "Yes, from Excel or CSV. It saves a long evening of typing."],
      ["What about items that come in different sizes or colours?", "You can keep them as separate items with their own stock, which is how a garment or footwear shop usually needs it."],
      ["Will it tell me what my stock is worth?", "Yes, there is a stock value report - useful at year end and when your CA asks."],
    ],
  },

  // =========================================================================
  {
    slug: "accounting-software",
    name: "Accounting software",
    icon: "ledger",
    tagline: "Reports made from the bills you already entered",
    h1: "Accounting software that builds itself",
    intro:
      "You are already entering sales and purchases. The ledgers, the cash book and the profit and loss come out of that, without a second round of data entry.",
    trust: ["No double entry work", "Party ledgers", "Export to Excel"],

    whatIs: {
      h2: "Accounting without doing the work twice",
      body: [
        "Most small businesses enter their sales twice: once to make the bill, and again into accounting software or a spreadsheet at month end. That second round is where the errors and the lost evenings live.",
        "Here the billing and the accounts are the same data. A bill made at the counter has already landed in the sales ledger, the customer's outstanding and the tax summary. Month end becomes reading a report rather than building one.",
      ],
    },

    features: {
      h2: "What you get",
      lead: "The reports a small business is actually asked for.",
      items: [
        ["users", "Party ledgers", "Every customer and supplier with their full history and what is outstanding right now."],
        ["ledger", "Cash and bank book", "Money in, money out, and the closing balance - matched against the bank when you reconcile."],
        ["doc", "Profit and loss", "Income against expenses for any period you choose, not just the year."],
        ["receipt", "GST summaries", "The figures laid out the way GSTR-1 and GSTR-3B want them."],
        ["box", "Expense tracking", "Rent, salaries, transport, repairs - recorded as they happen and grouped by head."],
        ["shield", "Export to Excel", "Your CA gets a file they can work with instead of screenshots."],
      ],
    },

    steps: {
      h2: "How it works",
      lead: "The accounts follow the billing, not the other way round.",
      items: [
        ["Bill and buy as usual", "Every sale and purchase entry is also an accounting entry. You do not enter it twice."],
        ["Record what you spend", "Petty cash, rent, transport. Put it in when it happens rather than reconstructing it later."],
        ["Record payments", "When money comes in or goes out, mark it against the bill. Outstanding updates itself."],
        ["Read the reports", "Ledgers, cash book and P&L for any period. Export and send to your CA."],
      ],
    },

    whoFor: {
      h2: "Who uses it",
      lead: "Businesses that need real books without hiring someone to keep them.",
      items: [
        ["basket", "Owner-run shops", "Where the owner does the accounts after closing and wants it to take minutes."],
        ["users", "Businesses with a CA", "Clean exports mean smaller bills and fewer questions at return time."],
        ["truck", "Anyone selling on credit", "Party ledgers show exactly who owes what and for how long."],
        ["factory", "Growing businesses", "Where guesswork about profit stops being good enough."],
      ],
    },

    faqs: [
      ["Do I need to know accounting to use this?", "No. You record sales, purchases, payments and expenses in plain language, and the ledgers are built behind that."],
      ["Does it replace my CA?", "No, and it is not meant to. It gives your CA clean, complete records, which usually means less work and a smaller bill. Filing and advice stay with them."],
      ["Can I see how much profit I made last month?", "Yes - a profit and loss report for any period you pick."],
      ["Can I export to Excel or Tally?", "Reports export to Excel. For Tally, you can export the data and your CA can import it - ask us if you need help with the format."],
      ["Does it handle GST returns?", "It produces the summaries in GSTR-1 and GSTR-3B format. The filing itself is done on the GST portal."],
      ["Is my data safe?", "It is backed up to your account rather than sitting only on one device. A lost phone is not a lost year of records."],
    ],
  },

  // =========================================================================
  {
    slug: "pos-software",
    name: "POS software",
    icon: "pos",
    tagline: "Scan, total, settle, next customer",
    h1: "POS billing software for busy counters",
    intro:
      "Built for the hour when six people are waiting. Barcode in, payment taken, receipt printed, and on to the next one.",
    trust: ["Barcode checkout", "Keyboard shortcuts", "Thermal printer ready"],

    whatIs: {
      h2: "What makes POS different from ordinary billing",
      body: [
        "A point-of-sale counter has one constraint the rest of billing does not: the customer is standing in front of you. Anything that takes an extra three seconds per bill becomes a queue at six in the evening.",
        "POS software is billing stripped down for that moment. Scan or a keyboard shortcut instead of searching, one key to settle, and the receipt out of a thermal printer before the customer has put their wallet away. Everything else - the reports, the stock, the accounts - happens behind it without slowing the counter down.",
      ],
    },

    features: {
      h2: "What you get",
      lead: "Speed at the counter, and the record-keeping that follows on its own.",
      items: [
        ["pos", "Barcode checkout", "Scan and the line is added at the right price. No typing, no picking from a list."],
        ["monitor", "Keyboard shortcuts", "For a trained hand, keys are faster than a screen. The whole sale can be done without the mouse."],
        ["receipt", "Thermal receipts", "58mm and 80mm printers, with an A4 tax invoice when the customer asks for one."],
        ["tag", "Split payments", "Part cash, part UPI, part card - recorded properly so the day's totals still tie out."],
        ["box", "Stock as you sell", "Every scan moves the stock count. No end-of-day reconciliation."],
        ["ledger", "Day close", "What sold, what came in by which payment method, and what is in the drawer."],
      ],
    },

    steps: {
      h2: "A sale at the counter",
      lead: "Under ten seconds once the items are set up.",
      items: [
        ["Scan", "Each item is added at its saved price and tax rate."],
        ["Adjust if needed", "Quantity, a discount, a manual item - all reachable without leaving the screen."],
        ["Settle", "Cash, UPI, card, or a split across them. A UPI QR can go on the receipt."],
        ["Print and move on", "Receipt out, stock down, sale recorded. Next customer."],
      ],
    },

    whoFor: {
      h2: "Who uses it",
      lead: "Counters where the queue is the problem.",
      items: [
        ["basket", "Grocery and general stores", "High volume, small baskets, and a rush at predictable hours."],
        ["cup", "Restaurants and cafes", "Fast orders, split bills and takeaway alongside dine-in."],
        ["pill", "Chemist counters", "Speed, plus the batch and expiry the trade requires."],
        ["shirt", "Garment and footwear", "Many variants, where scanning beats searching every time."],
      ],
    },

    faqs: [
      ["Do I need special hardware?", "No. It runs on a normal computer or an Android phone. A barcode scanner and a thermal printer make it faster but are not required to start."],
      ["Which printers work?", "Standard 58mm and 80mm thermal printers, and ordinary A4 printers for a full tax invoice."],
      ["Can it work if the internet goes down mid-rush?", "Yes. Sales are recorded on the device and sync when the connection returns. The counter does not stop."],
      ["Can a customer pay part cash and part UPI?", "Yes, split payments are recorded properly, so your day-end totals still tie out."],
      ["Can I see how the day went?", "Yes - a day close showing what sold, the breakdown by payment method, and what should be in the drawer."],
      ["Can more than one counter run at once?", "Yes, on separate logins, with the sales coming together in one set of books."],
    ],
  },

  // =========================================================================
  {
    slug: "e-invoice-software",
    name: "E-invoice software",
    icon: "shield",
    tagline: "IRN and e-way bill from the same screen",
    h1: "E-invoice and e-way bill software",
    intro:
      "Generate the IRN and the e-way bill from the invoice you just made, instead of re-typing it into a government portal.",
    trust: ["IRN and QR on the invoice", "E-way bill details", "Ready for GSTR-1"],

    whatIs: {
      h2: "What e-invoicing is, and who has to do it",
      body: [
        "E-invoicing means your invoice is registered on the government's portal before you send it, and comes back with an Invoice Reference Number and a QR code that must be printed on it. It is not a different invoice - it is the same one, registered.",
        "The turnover threshold at which it becomes compulsory has been lowered several times, so a business that did not have to do it last year may have to now. Check the current threshold against your turnover, or ask your CA - this is one of the rules that changes.",
      ],
    },

    features: {
      h2: "What you get",
      lead: "The portal work, done from where you already made the bill.",
      items: [
        ["shield", "IRN and signed QR", "Generated against the invoice and printed on it, in the format the rules require."],
        ["truck", "E-way bills", "Vehicle number, distance and transporter details, from the same invoice."],
        ["box", "Bulk generation", "For businesses raising many invoices a day, rather than one at a time."],
        ["doc", "Cancel and amend", "Handled within the windows the rules allow, with the reason recorded."],
        ["receipt", "Ready for GSTR-1", "What you registered flows into your return summary rather than being typed again."],
        ["ledger", "A record of what was filed", "IRN, acknowledgement number and date kept against each invoice, so you can produce them."],
      ],
    },

    steps: {
      h2: "How it works",
      lead: "The invoice you already made, registered.",
      items: [
        ["Make the invoice", "As you normally would, with GSTIN, HSN codes and rates filled in."],
        ["Generate the IRN", "The details go to the portal and the IRN and signed QR come back."],
        ["Add e-way bill details", "Where goods are moving, add the vehicle and transporter and generate the e-way bill."],
        ["Send it", "Print or share the invoice with the QR on it. The record is kept against the invoice."],
      ],
    },

    whoFor: {
      h2: "Who needs it",
      lead: "Anyone over the current turnover threshold, and anyone moving goods.",
      items: [
        ["factory", "Manufacturers", "B2B invoices at volume, usually with goods movement attached."],
        ["truck", "Wholesalers and distributors", "Where the e-way bill matters as much as the invoice."],
        ["box", "Businesses over the threshold", "The threshold has been lowered several times - worth checking against your own turnover."],
        ["users", "Suppliers to large buyers", "Big buyers often ask for e-invoices regardless of your own turnover."],
      ],
    },

    faqs: [
      ["Is e-invoicing compulsory for me?", "It depends on your turnover against the current threshold, which has been lowered several times. Check the present limit or ask your CA - it is not a number worth guessing at."],
      ["What is an IRN?", "The Invoice Reference Number the portal returns when your invoice is registered. It comes with a signed QR code, and both have to appear on the invoice you give the customer."],
      ["Can I generate the e-way bill at the same time?", "Yes. Add the vehicle and transporter details to the same invoice and generate it without going to a separate portal."],
      ["What if I make a mistake?", "An e-invoice can be cancelled within the window the rules allow. After that, the correction is made with a credit note. The app keeps a record of either."],
      ["Do I still have to file GSTR-1?", "Yes. E-invoicing registers the invoice; it does not file your return. What you registered flows into the GSTR-1 summary so you are not typing it again."],
      ["Can I generate many at once?", "Yes, bulk generation is there for businesses raising a lot of invoices in a day."],
    ],
  },
];

export function getSoftware(slug) {
  return SOFTWARE.find((s) => s.slug === slug);
}
