// ===========================================================================
// SECTION 4  -  the numbered steps
// ===========================================================================

export default function HowItWorks({ steps }) {
  return (
    <section className="section">
      <div className="wrap">
        <span className="eyebrow">Step by step</span>
        <h2>{steps.h2}</h2>
        <p className="lead">{steps.lead}</p>

        <ol className="sw-steps">
          {steps.items.map(([t, d], i) => (
            <li key={t} style={{ "--i": i }}>
              <span className="sw-steps__num" aria-hidden="true">
                {i + 1}
              </span>
              <strong>{t}</strong>
              <p>{d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
