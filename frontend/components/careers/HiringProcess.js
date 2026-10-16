// ===========================================================================
// SECTION 5  -  "Our hiring process"
// IMAGE: none
// ===========================================================================

import Reveal from "@/components/Reveal";

export default function HiringProcess({ process }) {
  return (
    <section className="section section--wash">
      <div className="wrap">
        <Reveal className="center">
          <span className="eyebrow cr-eyebrow">{process.eyebrow}</span>
          <h2>{process.h2}</h2>
          <p className="lead">{process.lead}</p>
        </Reveal>

        <ol className="setup cr-steps">
          {process.items.map(([t, d], i) => (
            <Reveal as="li" key={t} delay={i * 90} className="setup__item">
              <span className="setup__num">{i + 1}</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
