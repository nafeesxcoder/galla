// ===========================================================================
// SECTION 2  -  the plain explanation
// Long-form prose. This is the part search engines read, and the part a
// first-time visitor reads to work out whether this is for them.
// ===========================================================================

export default function WhatItIs({ s }) {
  return (
    <section className="section">
      <div className="wrap sw-prose">
        <span className="eyebrow">The basics</span>
        <h2>{s.whatIs.h2}</h2>
        {s.whatIs.body.map((p) => (
          <p key={p.slice(0, 26)}>{p}</p>
        ))}
      </div>
    </section>
  );
}
