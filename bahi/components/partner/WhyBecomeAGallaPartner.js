// ===========================================================================
// SECTION 7  -  "Why Become a Galla Partner?"
// 4 cards: Recurring Income, Fast Payout, Extensive Support, No Investment
// ---------------------------------------------------------------------------
// Uses the .pt-quad grid, which forces all four onto one row on desktop
// instead of wrapping 3 + 1. Card styling is .pt-qcard in partner.css.
// IMAGE: none (icons only)
// ===========================================================================

import Reveal from "@/components/Reveal";
import MenuIcon from "@/components/MenuIcon";

export default function WhyBecomeAGallaPartner({ why }) {
  return (
    <section className="section section--wash">
      <div className="wrap">
        <Reveal className="center">
          <span className="eyebrow pt-eyebrow">{why.eyebrow}</span>
          <h2>{why.h2}</h2>
          <p className="lead">{why.lead}</p>
        </Reveal>

        <div className="pt-quad">
          {why.items.map(([t, d, icon], i) => (
            <Reveal key={t} delay={i * 90}>
              <article className="pt-qcard pt-qcard--num" data-num={String(i + 1).padStart(2, "0")}>
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
