import Reveal from "@/components/Reveal";

const features = [
  [
    "Multiple payment modes",
    "Take cash, UPI, card or bank transfer and record each one against the right bill.",
  ],
  [
    "Discounts and tax handling",
    "Item-level or bill-level discounts with more than one tax rate in the same invoice.",
  ],
  [
    "E-invoice and e-way bill",
    "Generate GST e-invoices and e-way bills straight from the bill you just made.",
  ],
  [
    "Automatic bill numbering",
    "Every invoice gets a unique number and status, so filing and audits stay clean.",
  ],
  [
    "WhatsApp bills and reminders",
    "Send invoices and payment reminders to customers without leaving the app.",
  ],
  [
    "Barcode generator and scanner",
    "Print your own barcodes and add items to a bill by scanning them.",
  ],
  [
    "MRP-based billing",
    "Tax is calculated back from the MRP, so printed prices and bills always match.",
  ],
  [
    "Estimates and quotations",
    "Turn an approved estimate into an invoice without typing the items again.",
  ],
  [
    "Custom invoice formats",
    "Pick a layout and add your shop name, logo and details for a branded bill.",
  ],
  [
    "Hardware support",
    "Works with thermal printers, weighing scales and card machines.",
  ],
  [
    "Profit on every bill",
    "See the margin on each invoice and price your items with real numbers.",
  ],
  [
    "Delivery challan and orders",
    "Track an order from booking to delivery with proper paperwork at each step.",
  ],
  [
    "Scan purchase bills",
    "Photograph a supplier bill and let the scanner fill in the entry for you.",
  ],
  [
    "Salesman tracking",
    "Follow field staff activity and keep on-ground sales organised.",
  ],
  [
    "Import your old data",
    "Bring items, parties and balances over from your existing books or Excel.",
  ],
];

export default function FeatureGrid() {
  return (
    <section className="section section--wash">
      <div className="wrap">
        <Reveal>
          <span className="eyebrow">Built for India</span>
          <h2>Everything in one billing app</h2>
          <p className="lead">
            The features shop owners ask for most, without extra add-ons or
            hidden plans.
          </p>
        </Reveal>

        <div className="fgrid">
          {features.map(([t, d], i) => (
            <Reveal key={t} delay={(i % 3) * 90}>
              <article className="fcard">
                <span className="fcard__dot" aria-hidden="true" />
                <h3>{t}</h3>
                <p>{d}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
