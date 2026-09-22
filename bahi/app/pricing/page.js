import PricingPlans from "./PricingPlans";

export const metadata = { title: "Pricing" };

const rows = [
  ["GST invoices", "✓", "✓", "✓"],
  ["Devices", "1", "3", "Unlimited"],
  ["GST reports", "—", "✓", "✓"],
  ["E-way bill", "—", "✓", "✓"],
  ["Multiple godowns", "—", "—", "✓"],
  ["Staff login", "—", "—", "✓"],
];

const faqs = [
  ["Can I make GST bills on the free plan?", "Yes. The Basic plan includes unlimited GST and non-GST invoices."],
  ["Can I upgrade in the middle of a plan?", "Yes, any time. The unused amount is adjusted against the new plan."],
  ["Is my data safe?", "Data is stored with encrypted backups and you can export it to Excel whenever you want."],
  ["Do you give refunds?", "You get a full refund within 7 days of purchase."],
];

export default function Pricing() {
  return (
    <>
      <section className="section center">
        <div className="wrap">
          <h1>Simple pricing, no hidden charges</h1>
          <p className="lead">Start free. Upgrade when you need more.</p>
          <PricingPlans />
        </div>
      </section>
      <section className="section section--wash">
        <div className="wrap">
          <h2>Compare plans</h2>
          <div className="table-wrap">
            <table className="compare">
              <thead><tr><th>Feature</th><th>Basic</th><th>Silver</th><th>Gold</th></tr></thead>
              <tbody>{rows.map((r) => <tr key={r[0]}>{r.map((c, i) => <td key={i}>{c}</td>)}</tr>)}</tbody>
            </table>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="wrap">
          <h2 className="center">Frequently asked questions</h2>
          <div className="faq">
            {faqs.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
          </div>
        </div>
      </section>
    </>
  );
}
