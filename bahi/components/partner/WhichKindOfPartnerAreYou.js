// ===========================================================================
// SECTION 2  -  "Which Kind of Partner Are You?"
// 4 cards: CA, Software Reseller, Retail Store, Hardware Store
// ---------------------------------------------------------------------------
// Uses the .pt-quad grid, which forces all four onto one row on desktop
// instead of wrapping 3 + 1. Card styling is .pt-qcard in partner.css.
// IMAGE: none (icons only)
// ===========================================================================

import Reveal from "@/components/Reveal";
import MenuIcon from "@/components/MenuIcon";

export default function WhichKindOfPartnerAreYou({ types }) {
  return (
    <section className="section">
      <div className="wrap">
        <Reveal className="center">
          <span className="eyebrow pt-eyebrow">{types.eyebrow}</span>
          <h2>{types.h2}</h2>
          <p className="lead">{types.lead}</p>
        </Reveal>

        <div className="pt-quad">
          {types.items.map(([t, d, icon], i) => (
            <Reveal key={t} delay={i * 90}>
              <article className="pt-qcard">
                <span className="pt-qcard__bar" aria-hidden="true" />
                <span className="pt-qcard__icon">
                  <MenuIcon name={icon} />
                </span>
                <h3>{t}</h3>
                <p>{d}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
