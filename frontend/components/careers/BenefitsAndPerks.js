// ===========================================================================
// SECTION 6  -  "What we offer"
// ---------------------------------------------------------------------------
// Keep only the benefits you actually give. See the TODO in content.js.
// IMAGE: none
// ===========================================================================

import Reveal from "@/components/Reveal";

export default function BenefitsAndPerks({ perks }) {
  return (
    <section className="section">
      <div className="wrap">
        <Reveal className="center">
          <span className="eyebrow cr-eyebrow">{perks.eyebrow}</span>
          <h2>{perks.h2}</h2>
        </Reveal>

        <div className="cr-perks">
          {perks.items.map(([t, d], i) => (
            <Reveal key={t} delay={i * 80}>
              <article className="cr-perk">
                <span className="cr-perk__tick" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <div>
                  <h3>{t}</h3>
                  <p>{d}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
