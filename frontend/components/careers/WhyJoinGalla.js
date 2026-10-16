// ===========================================================================
// SECTION 2  -  "What you get out of working here"
// IMAGE: none (icons only)
// ===========================================================================

import Reveal from "@/components/Reveal";
import MenuIcon from "@/components/MenuIcon";

export default function WhyJoinGalla({ why }) {
  return (
    <section className="section">
      <div className="wrap">
        <Reveal className="center">
          <span className="eyebrow cr-eyebrow">{why.eyebrow}</span>
          <h2>{why.h2}</h2>
          <p className="lead">{why.lead}</p>
        </Reveal>

        <div className="cr-quad">
          {why.items.map(([t, d, icon], i) => (
            <Reveal key={t} delay={i * 90}>
              <article className="cr-card">
                <span className="cr-card__bar" aria-hidden="true" />
                <span className="cr-card__icon">
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
