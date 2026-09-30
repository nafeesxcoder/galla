// ===========================================================================
// SECTION 6  -  FAQ
// The same array is handed to Google as FAQ structured data from the route
// file, so the two can never drift apart.
// ===========================================================================

export default function Faqs({ faqs, name }) {
  if (!faqs?.length) return null;

  return (
    <section className="section section--wash">
      <div className="wrap">
        <h2>Questions about {name.toLowerCase()}</h2>

        <div className="faq faq--home sw-faq">
          {faqs.map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
