import CtaBand from "@/components/CtaBand";

export const metadata = { title: "Solutions" };

const solutions = [
  { t: "Billing and invoicing", d: "GST and non-GST invoices, estimates, quotations, delivery challans and credit notes.", pts: ["Custom invoice themes", "Thermal printer support", "Billing by barcode scan"] },
  { t: "Inventory management", d: "Stock in and out, batch and expiry tracking, multiple godowns.", pts: ["Low stock alerts", "Item-wise profit", "Batch and expiry dates"] },
  { t: "Accounting", d: "Cash book, bank book, expenses and party ledgers are built for you.", pts: ["Profit and loss", "Balance sheet", "Party statements"] },
  { t: "GST and compliance", d: "Reports ready for GST returns, plus e-way bills and e-invoices.", pts: ["GSTR-1, 3B and 9", "E-way bill", "HSN summary"] },
  { t: "Payments and credit", d: "See who owes you what at a glance and send reminders in one tap.", pts: ["WhatsApp reminders", "UPI QR on invoices", "Payment in and out"] },
  { t: "Online store", d: "Put your items in an online catalogue and take orders on WhatsApp.", pts: ["Free store link", "Order notifications", "Share your catalogue"] },
];

export default function Solutions() {
  return (
    <>
      <section className="page-head">
        <div className="wrap">
          <h1>One tool for every part of your business</h1>
          <p className="lead">From the first bill to the GST report, all in one place.</p>
        </div>
      </section>
      <section className="section">
        <div className="wrap features">
          {solutions.map((s) => (
            <div className="feature" key={s.t}>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
              <ul className="checklist">{s.pts.map((p) => <li key={p}>{p}</li>)}</ul>
            </div>
          ))}
        </div>
      </section>
      <CtaBand />
    </>
  );
}
