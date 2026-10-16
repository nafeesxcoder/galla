// ===========================================================================
// THE LONG CONTENT FOR EACH INDUSTRY PAGE
// ---------------------------------------------------------------------------
// Keyed by the same slug as lib/industries.js. That file is the list; this
// file is what each page actually says.
//
// A slug with no block here still gets a page - it just shows the hero and
// the shared "included in every plan" section. So you can add a business
// type to the list first and write its content later.
//
// SECTIONS, all optional:
//   whatIs    two or three paragraphs explaining the problem in plain words
//   features  six cards - [icon, title, description]
//   steps     four numbered steps - [title, description]
//   whoFor    four kinds of business - [icon, title, description]
//   faqs      questions and answers, also handed to Google as FAQ schema
//
// Icon names must be ones MenuIcon knows - see components/MenuIcon.js.
//
// PHARMACY IS NOT HERE. It has its own designed page under
// components/pharmacy/, with its content in that folder.
// ===========================================================================

export const INDUSTRY_CONTENT = {
  // =========================================================================
  "grocery-store": {
    whatIs: {
      h2: "What a kirana counter actually needs",
      body: [
        "A grocery counter is a speed problem. The basket is small, the margin is thin, and there is always somebody waiting. Software that adds five seconds to each bill costs you more than it saves.",
        "It is also a memory problem. Half your customers are on a monthly khata, and at the end of the month the argument is never about whether they bought something - it is about what and when. A saved bill settles that in one look.",
      ],
    },
    features: {
      h2: "What a grocery shop gets",
      lead: "The four or five things a kirana counter does a hundred times a day.",
      items: [
        ["basket", "Loose and packed together", "Sell by kilo, litre or piece from the same bill. Enter the weight and the amount follows."],
        ["pos", "Fast repeat billing", "Your most-sold items sit on the first screen, so the common bill takes seconds."],
        ["ledger", "Monthly khata accounts", "A running balance per customer, with a statement you can send at month end."],
        ["box", "Low stock alerts", "Know what to order before the shelf is empty, not when a customer points it out."],
        ["phone", "Bills on WhatsApp", "Send the bill and the month-end statement where the customer already reads messages."],
        ["shield", "Works without a signal", "Billing does not stop when the network does. Everything syncs later on its own."],
      ],
    },
    steps: {
      h2: "A bill at the counter",
      lead: "Once your items are in, this is the whole loop.",
      items: [
        ["Add the items", "Type the first two letters, scan a barcode, or tap a frequent item."],
        ["Weigh what needs weighing", "Enter the weight and the rate per kilo does the rest."],
        ["Take payment or put it on khata", "Cash, UPI, or add it to their running balance."],
        ["Print or send", "A slip for the customer, and a saved copy for the month-end argument."],
      ],
    },
    whoFor: {
      h2: "Who this suits",
      lead: "Shops selling daily essentials to the same faces every week.",
      items: [
        ["basket", "Kirana and general stores", "The everyday counter, where speed and khata both matter."],
        ["cart", "Mini marts and self-service shops", "Where barcodes start to beat typing."],
        ["cup", "Dairy and provision stores", "Loose and packed goods together, often on daily credit."],
        ["truck", "Small wholesalers", "Selling to shops on credit terms, with bigger bills and longer memories."],
      ],
    },
    faqs: [
      ["Can I bill loose items by weight?", "Yes. Set the rate per kilo or litre and enter the weight, or connect a weighing scale and let it fill the quantity for you."],
      ["Can I keep monthly credit accounts?", "Yes. Each customer has a running balance, and you can send a statement or a payment reminder on WhatsApp whenever you like."],
      ["Do I need a barcode scanner?", "No. Typing the first letters of an item finds it. A scanner just makes it faster once you have hundreds of packed goods."],
      ["What if the internet goes down during the evening rush?", "Billing carries on. Bills are saved on the device and upload by themselves once the connection returns."],
      ["Can I put my shop name and GSTIN on the bill?", "Yes, along with your logo and terms. Both GST and plain bills work from the same screen."],
      ["Can my son or an assistant bill while I am out?", "Yes, on a separate login, and you can see which bills each person made."],
    ],
  },

  // =========================================================================
  supermarket: {
    whatIs: {
      h2: "Where a supermarket differs from a kirana shop",
      body: [
        "The difference is not size, it is the number of things happening at once. Several counters billing at the same time, thousands of items, offers running on some of them, and stock that has to stay correct across all of it.",
        "That only works if the counters share one set of data. If each till keeps its own list, prices drift apart, the stock count is fiction by Saturday, and nobody can tell you what actually sold.",
      ],
    },
    features: {
      h2: "What a supermarket gets",
      lead: "Built for several counters working off the same shelf.",
      items: [
        ["pos", "Barcode checkout", "Scan and the item is on the bill at the right price and tax. Print your own labels for loose or repacked goods."],
        ["monitor", "Several counters at once", "Every till works from the same items, prices and stock, and the sales merge into one report."],
        ["tag", "Offers and combo pricing", "Run a discount on an item or a whole category for a set period, and stop it automatically."],
        ["box", "Shelf-wise stock reports", "What sells, what sits, and what to reorder this week - by category and by shelf."],
        ["users", "Staff logins", "Each cashier bills under their own login, so the day's takings can be traced."],
        ["ledger", "Day close per counter", "What each till took, split by cash, UPI and card, before anyone goes home."],
      ],
    },
    steps: {
      h2: "How the day runs",
      lead: "Open, sell, close - with the records made as you go.",
      items: [
        ["Open the counters", "Each cashier signs in on their own login."],
        ["Scan and settle", "Barcode in, payment taken, receipt printed. Stock moves with every scan."],
        ["Watch the shelves", "Low stock alerts tell you what to pull from the back or reorder."],
        ["Close the day", "Per-counter totals, payment breakdown and the cash that should be in each drawer."],
      ],
    },
    whoFor: {
      h2: "Who this suits",
      lead: "Anywhere the queue is the constraint.",
      items: [
        ["cart", "Supermarkets and self-service stores", "High footfall, many SKUs, several tills."],
        ["basket", "Departmental stores", "Mixed categories under one roof, each with its own stock behaviour."],
        ["cup", "Bakery and food retail chains", "Fast-moving, dated goods where yesterday's stock is not today's."],
        ["shirt", "Multi-category retail", "Where a barcode is the only sane way to find a price."],
      ],
    },
    faqs: [
      ["Does it work with barcode scanners?", "Yes - any USB or Bluetooth scanner. You can also print your own barcode labels for loose or repacked goods."],
      ["Can two counters bill at the same time?", "Yes, on plans that allow several devices. Both share the same items and stock, and the sales merge in your reports."],
      ["Can I run a discount for a week and have it stop by itself?", "Yes. Set the dates on the offer and it applies and ends without anyone remembering to switch it off."],
      ["Can I see which cashier billed what?", "Yes. Each person has their own login and the reports break down by them."],
      ["What happens if the internet drops mid-rush?", "The counters keep billing. Everything is saved locally and syncs when the connection returns."],
      ["Can I import my item list from Excel?", "Yes. For a shop with thousands of items this saves days of typing."],
    ],
  },

  // =========================================================================
  "jewellery-store": {
    whatIs: {
      h2: "Why jewellery billing is its own problem",
      body: [
        "Nothing on a jewellery bill has a fixed price. The rate changes daily, the amount depends on net weight, and then making charges, wastage and GST go on top. Doing that on a calculator in front of a customer is how mistakes and arguments start.",
        "There is also the exchange. Old gold coming in has to be weighed, valued at its purity, and set against the new purchase - all inside the same bill, or your stock and your accounts stop agreeing.",
      ],
    },
    features: {
      h2: "What a jewellery shop gets",
      lead: "The arithmetic, done the same way every time.",
      items: [
        ["gem", "Daily rate pricing", "Set the day's gold and silver rate once. Every bill after that uses it."],
        ["tag", "Making and wastage charges", "By percentage or a fixed amount per item, applied consistently."],
        ["box", "Purity-wise stock", "22K, 18K and silver kept separate, with gross and net weight on each."],
        ["ledger", "Old gold exchange", "Weigh it, set the purity, and its value comes off the same bill."],
        ["receipt", "Proper GST invoices", "HSN codes and the right rate, with the weight breakdown the customer expects to see."],
        ["shield", "Item-wise records", "Every piece tied to the bill it went out on, for returns and repairs later."],
      ],
    },
    steps: {
      h2: "Making the bill",
      lead: "Rate first, then weight, then the extras.",
      items: [
        ["Set today's rate", "Once, in the morning. Everything priced after that uses it."],
        ["Pick the item and weight", "Gross and net, with the purity attached."],
        ["Add making and wastage", "Percentage or fixed, per item."],
        ["Adjust any exchange", "Old gold valued at its purity and deducted before GST is worked out."],
      ],
    },
    whoFor: {
      h2: "Who this suits",
      lead: "Anyone pricing by weight against a rate that moves.",
      items: [
        ["gem", "Retail jewellery showrooms", "Gold and silver ornaments sold against the day's rate."],
        ["tool", "Goldsmiths and workshops", "Making charges, job work and repair entries."],
        ["truck", "Wholesale jewellers", "Bulk supply to retailers, with purity-wise stock to answer for."],
        ["shield", "Silver and artificial jewellery", "Fixed-price stock alongside rate-based items."],
      ],
    },
    faqs: [
      ["Can I bill at today's gold rate?", "Yes. Update the rate for the day and every item is priced from it, with making charges and GST added on top."],
      ["Can I adjust old gold against a new purchase?", "Yes. Enter the weight and purity of the old ornament and its value is deducted from the bill total."],
      ["Does it handle different purities?", "Yes. 22K, 18K and silver are kept as separate stock with their own rates, gross weight and net weight."],
      ["Can I charge making by percentage for some items and a fixed amount for others?", "Yes, it is set per item, so you can mix both on the same bill."],
      ["Is the GST worked out correctly on an exchange?", "The exchange value is deducted first and tax is worked out on what is actually payable. Check the treatment with your CA, since it depends on how you account for the old gold."],
      ["Can I keep a record of who bought which piece?", "Yes. Every item stays linked to its invoice and customer, which is what you need when something comes back for repair."],
    ],
  },

  // =========================================================================
  "cloth-and-garments": {
    whatIs: {
      h2: "One design is really thirty items",
      body: [
        "A shirt in five sizes and six colours is thirty separate things to keep track of. Treating it as one item is why you run out of medium in the middle of the season while large sits in the godown until the sale.",
        "The other half of the job is fabric, which is sold by the metre and cut, so the stock never comes down in whole numbers. Both have to work in the same app, because most shops do both.",
      ],
    },
    features: {
      h2: "What a garment shop gets",
      lead: "Variants and cut pieces, handled properly.",
      items: [
        ["shirt", "Size and colour variants", "One design, many variants, each with its own stock and barcode."],
        ["scissor", "Cut-piece and metre billing", "Set the rate per metre and enter the length. Stock comes down by what you cut."],
        ["box", "Season-wise reports", "Which designs moved, which are still sitting, and what not to buy again."],
        ["ledger", "Exchange and return", "A size exchange that does not break your stock count."],
        ["tag", "Discount and sale pricing", "Run end-of-season pricing on a category without editing every item."],
        ["pos", "Barcode labels", "Print your own, so a variant is scanned rather than searched for."],
      ],
    },
    steps: {
      h2: "How stock stays honest",
      lead: "The work is in setting it up once.",
      items: [
        ["Set up the design", "Name it once, then add its sizes and colours as variants."],
        ["Print labels", "Each variant gets its own barcode, which is what makes billing fast."],
        ["Bill by scan or by metre", "Ready-made by scan, fabric by length."],
        ["Read the season report", "Which sizes sold out and which never moved, before you place the next order."],
      ],
    },
    whoFor: {
      h2: "Who this suits",
      lead: "Anyone whose stock has sizes, shades or lengths.",
      items: [
        ["shirt", "Readymade garment shops", "Where the same design exists in a dozen versions."],
        ["scissor", "Cloth and fabric shops", "Metre billing, cut pieces and suiting."],
        ["basket", "Footwear shops", "Size-wise stock, with the same reordering problem."],
        ["gem", "Boutiques", "Small runs, where knowing what sold matters more than volume."],
      ],
    },
    faqs: [
      ["Can I track sizes separately?", "Yes. Each size and colour is its own variant with its own stock, so the report shows exactly which sizes are running out."],
      ["Can I bill fabric by the metre?", "Yes. Set the rate per metre and enter the length; the bill works out the amount with tax."],
      ["What happens when someone exchanges for a different size?", "The returned size goes back into stock and the new one comes out, so your count stays right."],
      ["Can I print my own barcode labels?", "Yes, per variant. For a shop with many sizes this is what makes the counter fast."],
      ["Can I put a sale price on a whole category?", "Yes, for a set period, without editing each item one by one."],
      ["Will it tell me what to reorder?", "It shows what sold and what did not, with stock levels. The buying decision stays yours, but it is made on numbers rather than memory."],
    ],
  },

  // =========================================================================
  "electronics-store": {
    whatIs: {
      h2: "High-value items need a paper trail",
      body: [
        "An electronics sale is not finished when the customer leaves. It comes back - for a warranty claim, a service visit, or a dispute about when it was bought. Without the serial number on the bill, none of those are easy to settle.",
        "These are also items where a single sale is worth a lot, so the margin on each one matters. Knowing what you actually make on a model, before you agree to a discount, is the difference between a good month and a busy one.",
      ],
    },
    features: {
      h2: "What an electronics shop gets",
      lead: "Records that hold up when the item comes back.",
      items: [
        ["plug", "Serial number tracking", "Recorded on the bill, so a warranty claim starts with a search rather than a hunt."],
        ["shield", "Warranty dates", "When it started, when it ends, and which customer it belongs to."],
        ["tool", "Service and repair entries", "Kept against the original sale, so the history is in one place."],
        ["ledger", "Margin per sale", "See what you make on a model before you agree to a discount."],
        ["box", "Brand-wise reports", "Which brands and categories actually carry the shop."],
        ["receipt", "EMI and part payment", "Record what was paid and what is outstanding, properly."],
      ],
    },
    steps: {
      h2: "From sale to service",
      lead: "The record follows the item.",
      items: [
        ["Bill with the serial number", "Entered or scanned while billing, tied to that invoice and customer."],
        ["Set the warranty", "Start date and period, stored against the item."],
        ["Find it later", "Search by serial, phone number or customer name when they come back."],
        ["Record the service", "Repair entries sit against the original sale, with any charge added."],
      ],
    },
    whoFor: {
      h2: "Who this suits",
      lead: "Shops selling things that carry a warranty.",
      items: [
        ["plug", "Electronics and appliance shops", "TVs, ACs, washing machines - high value, long warranty."],
        ["monitor", "Computer and IT shops", "Hardware with serials, plus service work."],
        ["tool", "Service and repair centres", "Where the job record matters as much as the bill."],
        ["factory", "Electrical goods dealers", "Wiring, fittings and fixtures, often sold to contractors on credit."],
      ],
    },
    faqs: [
      ["Can I record serial or IMEI numbers?", "Yes. Enter or scan them while billing and they stay linked to that invoice and customer."],
      ["Can I check a warranty later?", "Yes. Search by serial number, phone number or customer to find the bill and the warranty period."],
      ["Can I track repair jobs?", "Yes, against the original sale, with the charge added when the work is done."],
      ["Can I see my margin before giving a discount?", "Yes, if you have entered your purchase rate. The margin on the bill is visible while you are making it."],
      ["Does it handle EMI or part payments?", "It records what was paid and what is outstanding. The financing itself sits with whoever provides it."],
      ["Can I sell to a business customer with their GSTIN?", "Yes. Save their GSTIN against the party and it appears on every invoice."],
    ],
  },

  // =========================================================================
  restaurant: {
    whatIs: {
      h2: "The bill is the last step, not the first",
      body: [
        "In a restaurant the order comes long before the bill, and it changes while the customer is sitting there. Two more rotis, a dessert, one person paying separately. Software that assumes the bill is made once, at the end, gets in the way.",
        "The kitchen is the other half of it. The gap between an order being taken and the kitchen knowing about it is where the evening goes wrong, and a printed slip closes that gap better than a shouted instruction.",
      ],
    },
    features: {
      h2: "What a restaurant gets",
      lead: "Order, kitchen, settle - without walking back and forth.",
      items: [
        ["cup", "Table and takeaway orders", "A running order per table, added to as the meal goes on."],
        ["receipt", "Kitchen order slips", "Printed the moment the order is saved, so the kitchen starts without waiting."],
        ["doc", "Menu with variants", "Categories, half and full portions, and add-ons, each with its own price."],
        ["tag", "Split and part payment", "Several people paying for one table, recorded so the totals still tie out."],
        ["ledger", "Daily sales summary", "The day's collection, item-wise, before you shut."],
        ["users", "Staff logins", "Who took which order, and how the tips and totals break down."],
      ],
    },
    steps: {
      h2: "A table, start to finish",
      lead: "Everything on one screen.",
      items: [
        ["Open the table", "Start a running order for it."],
        ["Send to the kitchen", "The slip prints as soon as the items are saved."],
        ["Add as they order", "More items go onto the same running order."],
        ["Settle", "Print the bill, take payment - split across people or methods if needed."],
      ],
    },
    whoFor: {
      h2: "Who this suits",
      lead: "Anywhere food is ordered before it is paid for.",
      items: [
        ["cup", "Restaurants and cafes", "Table service, where the order builds over an hour."],
        ["basket", "Takeaway and cloud kitchens", "Fast orders with no table to manage."],
        ["cart", "Sweet shops and bakeries", "Counter sales by weight alongside packed items."],
        ["users", "Canteens and messes", "Daily volume, often on monthly accounts."],
      ],
    },
    faqs: [
      ["Can I run bills for several tables at once?", "Yes. Each table keeps its own running order until you settle it, and items can be added at any point."],
      ["Does it print kitchen slips?", "Yes, on a thermal printer, as soon as the order is saved."],
      ["Can I have half and full portions at different prices?", "Yes, as variants of the same menu item."],
      ["Can four people split one table's bill?", "Yes. Split payments are recorded properly, so the day's totals still add up."],
      ["Can I see which items sold today?", "Yes - an item-wise summary for the day, which is what tells you what to prep tomorrow."],
      ["Does it work for takeaway as well as dine-in?", "Yes, both from the same screen, and the reports keep them separate."],
    ],
  },

  // =========================================================================
  "hardware-and-paint": {
    whatIs: {
      h2: "Two businesses in one shop",
      body: [
        "A hardware shop sells to walk-in customers and to contractors, and they behave nothing alike. The walk-in pays and leaves. The contractor takes material for three months and then argues about the total.",
        "The stock is awkward too. You buy a box of a hundred and sell four. You buy paint in twenty-litre drums and sell by the litre. If the software cannot convert between the two, the stock count is wrong from the first purchase entry.",
      ],
    },
    features: {
      h2: "What a hardware shop gets",
      lead: "Conversions that work, and accounts you can defend.",
      items: [
        ["box", "Unit conversion", "Buy by box, sell by piece. Buy by drum, sell by litre. Stock stays correct either way."],
        ["users", "Contractor credit accounts", "A running ledger per party, with a statement you can send as a PDF."],
        ["tag", "Shade and size variants", "Paint shades, pipe sizes and gauges tracked as separate stock."],
        ["doc", "Quotation to invoice", "Turn an approved quotation into a bill without retyping the items."],
        ["ledger", "Outstanding by age", "Who owes what, and for how long, sorted so you know who to call first."],
        ["truck", "Delivery challans", "Material out first, bill after, with both linked."],
      ],
    },
    steps: {
      h2: "A contractor job, end to end",
      lead: "The part where most shops lose money.",
      items: [
        ["Quote the material", "A quotation with your rates, which they can take away and approve."],
        ["Send the material", "On a challan if the bill comes later, with the items recorded either way."],
        ["Convert to an invoice", "The challan becomes the bill without entering the items again."],
        ["Send the statement", "A month-end ledger they cannot argue with, on WhatsApp."],
      ],
    },
    whoFor: {
      h2: "Who this suits",
      lead: "Trades selling material to people who buy it again next week.",
      items: [
        ["tool", "Hardware and sanitary shops", "Mixed units, mixed customers, long credit."],
        ["plug", "Paint and electrical shops", "Shade-wise and gauge-wise stock."],
        ["factory", "Building material dealers", "Cement, steel and sand, sold by weight and load."],
        ["truck", "Plumbing and fittings suppliers", "Sizes, counts and contractor accounts."],
      ],
    },
    faqs: [
      ["Can I buy in boxes and sell in pieces?", "Yes. Set the conversion once and your stock stays correct whichever unit you use."],
      ["Can I send contractors a monthly statement?", "Yes. Each party has a ledger, and the statement can go as a PDF on WhatsApp."],
      ["Can I track paint shades separately?", "Yes, as separate items or variants, each with its own stock."],
      ["Can I turn a quotation into a bill?", "Yes, in one step, with the items and rates carried across untouched."],
      ["How do I know who is overdue?", "The outstanding report sorts parties by how much they owe and how long it has been."],
      ["Can I send material before billing it?", "Yes, on a delivery challan, which converts to a tax invoice later."],
    ],
  },

  // =========================================================================
  "mobile-shop": {
    whatIs: {
      h2: "Three businesses, one counter",
      body: [
        "A mobile shop sells handsets, accessories and repairs, and each behaves differently. Handsets are high value with an IMEI to record. Accessories are low value and high volume. Repairs are jobs that take days and involve somebody else's phone.",
        "The margin is the thing to watch. Handset margins are thin enough that one careless discount wipes out the profit on the sale, and the accessories are often where the shop actually earns.",
      ],
    },
    features: {
      h2: "What a mobile shop gets",
      lead: "The IMEI, the accessories and the repair book, in one place.",
      items: [
        ["phone", "IMEI on the invoice", "Entered or scanned while billing, kept against that invoice for warranty and service."],
        ["box", "Accessory stock", "Cases, chargers and cables tracked with the same app, at the volume they move."],
        ["tool", "Repair and service jobs", "A job entry against the customer and handset, with the charge added when it is done."],
        ["ledger", "Margin per bill", "What you actually make on a handset, visible before you agree a discount."],
        ["shield", "Warranty lookup", "Find the bill by IMEI or phone number when the customer comes back."],
        ["tag", "Exchange handling", "Old phone taken in part exchange, valued and deducted on the same bill."],
      ],
    },
    steps: {
      h2: "Selling a handset",
      lead: "Four things, and one of them decides your profit.",
      items: [
        ["Scan the IMEI", "Onto the bill, where it stays."],
        ["Check the margin", "Before you talk about a discount, not after."],
        ["Add accessories", "Where most of the actual profit on the sale comes from."],
        ["Settle and record", "Cash, UPI, finance or exchange - all recorded against the sale."],
      ],
    },
    whoFor: {
      h2: "Who this suits",
      lead: "Counters selling devices with a number on them.",
      items: [
        ["phone", "Mobile and handset shops", "New phones, accessories and repairs together."],
        ["tool", "Repair-only shops", "Job entries, parts used and charges."],
        ["plug", "Gadget and accessory stores", "High volume, low value, barcode-driven."],
        ["truck", "Mobile distributors", "Bulk supply to retailers, with IMEI records per consignment."],
      ],
    },
    faqs: [
      ["Can I record the IMEI on the bill?", "Yes. Enter or scan it while billing and it stays with that invoice for warranty and service."],
      ["Can I track repairs?", "Yes. Repair jobs are recorded against the customer, with the charge added when the work is done."],
      ["Can I see the margin on a handset before selling?", "Yes, if the purchase rate is entered. It shows while you are making the bill, which is when it is useful."],
      ["Can I take an old phone in exchange?", "Yes. Value it and deduct it from the bill total."],
      ["How do I find a bill when a customer comes back without it?", "Search by IMEI, phone number or name."],
      ["Can I track accessories separately from handsets?", "Yes, and the reports keep them apart, which is what tells you where your profit actually comes from."],
    ],
  },

  // =========================================================================
  "salon-and-spa": {
    whatIs: {
      h2: "Billing time, not stock",
      body: [
        "A salon sells hours and skill, so most billing software - built around stock coming off a shelf - fits badly. What matters instead is who did the work, what package the customer is on, and what they had last time.",
        "Packages are the part that gets lost. A customer pays for ten sittings in advance, then comes in over six months. Without a balance anyone at the counter can see, it ends up being settled by memory, which favours whoever remembers more confidently.",
      ],
    },
    features: {
      h2: "What a salon gets",
      lead: "Services, packages and people.",
      items: [
        ["scissor", "Service-wise billing", "A menu of services with rates, billed in a couple of taps."],
        ["tag", "Packages and prepaid balance", "Sold once, then drawn down visit by visit, with the balance on screen."],
        ["users", "Staff-wise sales", "Which stylist brought in how much, for commissions and for knowing."],
        ["ledger", "Customer history", "What a returning customer took last time, and with whom."],
        ["box", "Product sales", "Shampoos and retail products alongside services, with their own stock."],
        ["phone", "Reminders on WhatsApp", "A nudge when a package is running out or a regular is overdue for a visit."],
      ],
    },
    steps: {
      h2: "A visit",
      lead: "Fast, because the customer is usually in a chair.",
      items: [
        ["Find the customer", "By phone number. Their history and package balance come up with them."],
        ["Add the services", "From your menu, with the staff member who did each one."],
        ["Adjust against a package", "If they are on one, the sittings come off the balance."],
        ["Settle the rest", "Cash, UPI or card for anything outside the package."],
      ],
    },
    whoFor: {
      h2: "Who this suits",
      lead: "Businesses billing time rather than goods.",
      items: [
        ["scissor", "Salons and barbershops", "Walk-ins and regulars, with staff commissions to work out."],
        ["gem", "Spas and wellness centres", "Longer sittings, mostly on packages."],
        ["users", "Clinics and studios", "Appointment-based services with returning customers."],
        ["tool", "Service businesses generally", "Anywhere the bill is for work done, not stock sold."],
      ],
    },
    faqs: [
      ["Can I sell packages?", "Yes. Sell it once and each visit is adjusted against the remaining balance, which anyone at the counter can see."],
      ["Can I see sales by staff member?", "Yes. Assign each service to whoever performed it and the report shows their total."],
      ["Can I look up what a customer had last time?", "Yes, by phone number - their full history comes up."],
      ["Can I sell products as well as services?", "Yes, with their own stock, and the reports keep the two apart."],
      ["Can I remind customers to come back?", "Yes, on WhatsApp - useful when a package is running down or a regular has not been in for a while."],
      ["Do I need to be online?", "No. Billing works offline and syncs when the connection returns."],
    ],
  },

  // =========================================================================
  "wholesale-and-distribution": {
    whatIs: {
      h2: "The money is in the collection, not the sale",
      body: [
        "Wholesale is selling on credit. Making the sale is the easy half; the business lives or dies on whether the money comes back, and on knowing which parties are slow before they become a problem.",
        "The other complication is that every buyer has a different rate. Remembering what you agreed with forty parties is not a system, and a wrong rate on a bill is an argument you will lose.",
      ],
    },
    features: {
      h2: "What a distributor gets",
      lead: "Rates, challans and outstanding, all in the same place.",
      items: [
        ["users", "Party-wise price lists", "Each buyer gets the rate you agreed with them, picked automatically."],
        ["truck", "Delivery challan to invoice", "Send goods on a challan, bill later, without entering items twice."],
        ["shield", "E-way bill ready", "Vehicle, transporter and distance details generated alongside the invoice."],
        ["ledger", "Outstanding by age", "Parties sorted by how much and how long, so collection calls have an order."],
        ["box", "Godown-wise stock", "Stock per location, with transfers recorded properly."],
        ["receipt", "Bulk invoicing", "Many invoices in a run, for businesses billing dozens a day."],
      ],
    },
    steps: {
      h2: "An order, start to payment",
      lead: "The cycle that repeats every week.",
      items: [
        ["Take the order", "Against the party, at their agreed rates."],
        ["Despatch on a challan", "Goods out, with the e-way bill if it is needed."],
        ["Convert to an invoice", "Straight from the challan, so the items match what actually went."],
        ["Collect", "Track what is outstanding by age and chase in that order."],
      ],
    },
    whoFor: {
      h2: "Who this suits",
      lead: "Businesses selling to other businesses, on terms.",
      items: [
        ["truck", "Distributors and stockists", "Regular supply to a fixed set of retailers."],
        ["box", "Wholesalers", "Bulk sales with rate lists per buyer."],
        ["factory", "C and F agents", "Stock held on behalf of a principal, with reporting to match."],
        ["cart", "Cash and carry", "Where the buyer collects, but the terms are still wholesale."],
      ],
    },
    faqs: [
      ["Can each party have its own rate?", "Yes. Save a price list per party and the correct rate is picked when you bill them."],
      ["Does it handle delivery challans?", "Yes. Send goods on a challan first, then convert it into a tax invoice without entering the items again."],
      ["Can I generate e-way bills?", "Yes, from the same invoice, with the vehicle and transporter details."],
      ["How do I know who to chase?", "The outstanding report sorts parties by amount and by how long it has been, so the calls have an order."],
      ["Can I manage stock across godowns?", "Yes - stock per location, with transfers between them recorded."],
      ["Can I raise many invoices at once?", "Yes. Bulk invoicing is there for businesses raising dozens a day."],
    ],
  },

  // =========================================================================
  manufacturing: {
    whatIs: {
      h2: "Stock that changes shape",
      body: [
        "In a shop, what comes in is what goes out. In manufacturing it is not: raw material goes in and something else comes out, and unless the software understands that conversion, both your raw material count and your finished goods count are wrong.",
        "Costing is the reason it matters. If you do not know what material went into a batch, you do not know what the item cost you, and any selling price you set after that is a guess dressed up as a decision.",
      ],
    },
    features: {
      h2: "What a small manufacturer gets",
      lead: "Production entries that keep both sides of the stock honest.",
      items: [
        ["factory", "Raw material consumption", "Record what each production run used, and the raw stock comes down."],
        ["box", "Finished goods stock", "Output is added, ready for sale, in the same entry."],
        ["ledger", "Production costing", "The material cost behind each finished item, which is where a sane selling price starts."],
        ["truck", "Job work entries", "Material sent out to a job worker and received back, tracked both ways."],
        ["receipt", "Tax invoices and e-way bills", "For despatch, from the same records."],
        ["users", "Supplier and buyer ledgers", "Purchases in, sales out, and the outstanding on both sides."],
      ],
    },
    steps: {
      h2: "A production run",
      lead: "One entry keeps both counts right.",
      items: [
        ["Record the inputs", "What material went in, and how much."],
        ["Record the output", "What came out, and how many."],
        ["See the cost", "Material cost per finished unit, worked out from the run."],
        ["Sell and despatch", "The finished stock is available to bill, with an e-way bill if goods are moving."],
      ],
    },
    whoFor: {
      h2: "Who this suits",
      lead: "Small units where the owner still knows every machine.",
      items: [
        ["factory", "Small manufacturing units", "Where what you sell is not what you bought."],
        ["tool", "Fabrication and workshops", "Material, labour and job work together."],
        ["shirt", "Garment and textile units", "Cloth in, finished pieces out, often via job workers."],
        ["cup", "Food processing and packing", "Bulk in, packed units out, with batch records."],
      ],
    },
    faqs: [
      ["Can I track raw material and finished goods?", "Yes. A production entry reduces raw material stock and adds the finished item, so both stay accurate."],
      ["Does it help with costing?", "Yes. The material cost of a production run is shown against the finished item, which you can use to set your selling price."],
      ["Can I track material sent to a job worker?", "Yes - what went out, what came back, and what is still with them."],
      ["Does it handle e-way bills for despatch?", "Yes, generated alongside the invoice."],
      ["Can I see my purchase and sales outstanding together?", "Yes, as supplier and buyer ledgers, so you can see both sides of the working capital."],
      ["Is this full ERP?", "No, and it does not pretend to be. It covers production entries, costing, stock and billing for a small unit. If you need shop-floor scheduling or machine-level planning, you need something larger."],
    ],
  },
};

export function getIndustryContent(slug) {
  return INDUSTRY_CONTENT[slug] ?? null;
}
