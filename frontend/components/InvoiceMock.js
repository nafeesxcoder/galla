const items = [
  { name: "Basmati rice 25kg", qty: 4, rate: 1850, gst: 5 },
  { name: "Mustard oil 15L", qty: 2, rate: 2240, gst: 5 },
  { name: "Steel tiffin set", qty: 6, rate: 420, gst: 12 },
];

const inr = (n) => "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 2 });

export default function InvoiceMock() {
  const sub = items.reduce((s, i) => s + i.qty * i.rate, 0);
  const tax = items.reduce((s, i) => s + (i.qty * i.rate * i.gst) / 100, 0);
  const total = sub + tax;

  return (
    <div className="invoice" aria-label="Sample GST invoice">
      <div className="invoice__head">
        <div>
          <strong>Sharma General Store</strong>
          <div style={{ color: "var(--ink-soft)", fontSize: ".88rem" }}>GSTIN 09ABCDE1234F1Z5</div>
        </div>
        <div className="invoice__no">Tax invoice<br />#INV-0482</div>
      </div>
      <table>
        <thead>
          <tr><th>Item</th><th className="num">Qty</th><th className="num">Amount</th></tr>
        </thead>
        <tbody>
          {items.map((i, idx) => (
            <tr key={i.name} className="invoice__row" style={{ animationDelay: `${0.25 + idx * 0.35}s` }}>
              <td>{i.name}</td>
              <td className="num">{i.qty}</td>
              <td className="num">{inr(i.qty * i.rate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="invoice__tax">
        <div><span>Subtotal</span><span>{inr(sub)}</span></div>
        <div><span>CGST</span><span>{inr(tax / 2)}</span></div>
        <div><span>SGST</span><span>{inr(tax / 2)}</span></div>
      </div>
      <div className="invoice__total"><span>Total</span><span>{inr(total)}</span></div>
      <span className="invoice__stamp">Paid via UPI</span>
    </div>
  );
}
