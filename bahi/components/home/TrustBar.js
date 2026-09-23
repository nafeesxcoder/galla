const items = [
  { t: "GST-ready billing", d: "Built to current GST rules" },
  { t: "SSL encrypted data", d: "Backups you control" },
  { t: "Checked by CAs", d: "Reports your CA accepts" },
  { t: "Used across retail & trade", d: "Shops, wholesale, manufacturing" },
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
