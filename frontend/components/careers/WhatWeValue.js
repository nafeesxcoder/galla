// ===========================================================================
// SECTION 3  -  "What we care about"
// IMAGE: none
// ===========================================================================

import Reveal from "@/components/Reveal";

export default function WhatWeValue({ values }) {
  return (
    <section className="section section--wash">
      <div className="wrap">
        <Reveal className="center">
          <span className="eyebrow cr-eyebrow">{values.eyebrow}</span>
          <h2>{values.h2}</h2>
        </Reveal>

        <ol className="cr-values">
          {values.items.map(([t, d], i) => (
            <Reveal as="li" key={t} delay={i * 80} className="cr-value">
              <span className="cr-value__no">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
