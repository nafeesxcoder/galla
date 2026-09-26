// Pharmacy hero ka app mockup. Saara text yahin badal sakte ho.
// Sab kuch container ki width se scale hota hai, to koi fixed size nahi.

const EXPIRING = [
  ["Ibuprofen 400", "20/04/2026"],
  ["Diclofenac gel", "21/04/2026"],
  ["Cetirizine 10", "22/04/2026"],
  ["Amoxicillin 500", "24/04/2026"],
];

const LOW = [
  ["Paracetamol 650", "12", true],
  ["ORS sachets", "39", false],
  ["Cough syrup", "190", false],
  ["Naproxen 250", "9", true],
];

const BILL = [
  ["Paracetamol x2", "36"],
  ["ORS sachet x5", "110"],
  ["Cough syrup", "98"],
  ["CGST + SGST", "12"],
];

const icons = {
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  doc: "M7 2h7l4 4v16H7zM14 2v5h4M10 12h6M10 16h4",
  box: "M3 7.5 12 3l9 4.5v9L12 21l-9-4.5zM3 7.5 12 12l9-4.5M12 12v9",
  pill: "M10.5 3.5a5 5 0 0 1 7 7l-7 7a5 5 0 0 1-7-7zM7 7l10 10",
};

function Tag({ name, icon, className }) {
  return (
    <div className={`phtag ${className}`}>
      <i>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d={icons[icon]} />
        </svg>
      </i>
      {name}
    </div>
  );
}

export default function HeroArt({ shop = "Sunrise Medical Store" }) {
  return (
    <div className="phart" role="img" aria-label="Pharmacy billing app showing an invoice, expiring stock and low stock alerts">
      <div className="phart__stage">
        <Tag name="Accounting" icon="chart" className="phtag--acc" />
        <Tag name="Billing" icon="doc" className="phtag--bill" />
        <Tag name="Inventory" icon="box" className="phtag--inv" />
        <Tag name="Pharmacy" icon="pill" className="phtag--pharm" />

        <div className="phart__screen">
          <div className="phart__frame">
            <div className="phart__inner">
              <div className="phart__side">
                <i /><i /><i /><i /><i /><i />
              </div>
              <div className="phart__doc">
                <b>Tax invoice</b>
                {shop} &middot; DL No. 20B/21B-MZ-4417
                <div className="phart__rule" />
                <div className="phart__lines">
                  <span /><span /><span /><span /><span /><span />
                </div>
                <div className="phart__rule" />
                <div className="phart__lines">
                  <span /><span /><span /><span />
                </div>
                <div className="phart__rule" />
                <div className="phart__lines">
                  <span /><span />
                </div>
                <div className="phart__foot">
                  <span>Amount in words</span>
                  <span>Batch and expiry printed</span>
                </div>
              </div>
            </div>
          </div>
          <div className="phart__stand" />
          <div className="phart__base" />
        </div>

        <div className="phcard phcard--expiry">
          <div className="phcard__head">
            <span>Expiring stock</span>
            <span>In 7 days</span>
          </div>
          {EXPIRING.map(([n, d]) => (
            <div className="phcard__row" key={n}>
              <span>{n}</span>
              <span>{d}</span>
            </div>
          ))}
        </div>

        <div className="phcard phcard--low">
          <div className="phcard__head">
            <span>Low stock</span>
            <span>As of now</span>
          </div>
          {LOW.map(([n, q, low]) => (
            <div className={`phcard__row ${low ? "is-low" : ""}`} key={n}>
              <span>{n}</span>
              <span>{q}</span>
            </div>
          ))}
        </div>

        <div className="phphone">
          <div className="phphone__scr">
            <div className="phphone__bar">INVOICE</div>
            <div className="phphone__body">
              <b>{shop}</b>
              GSTIN 09ABCDE1234F1Z5
              <div className="phphone__tbl">
                {BILL.map(([n, a]) => (
                  <span key={n} style={{ display: "contents" }}>
                    <span>{n}</span>
                    <span>{a}</span>
                  </span>
                ))}
              </div>
              <div className="phphone__tot">
                <span>Total</span>
                <span>&#8377;256</span>
              </div>
              <div className="phphone__btn">Share on WhatsApp</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
