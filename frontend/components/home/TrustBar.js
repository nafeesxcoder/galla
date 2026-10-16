const items = [
  { t: "GST-ready invoices", d: "HSN codes and tax splits built in" },
  { t: "Works offline", d: "Bills sync when you reconnect" },
  { t: "Your data stays yours", d: "Export to Excel or PDF any time" },
  { t: "Free to start", d: "No card, no trial expiry" },
];

export default function TrustBar() {
  return (
    <section className="trustbar">
      <div className="wrap trustbar__grid">
        {items.map((i) => (
          <div className="trustbar__item" key={i.t}>
            <span className="trustbar__tick" aria-hidden="true" />
            <div>
              <b>{i.t}</b>
              <small>{i.d}</small>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
