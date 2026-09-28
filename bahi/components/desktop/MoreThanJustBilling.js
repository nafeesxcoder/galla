// ===========================================================================
// SECTION 11  -  "What the Galla Desktop App Does Beyond Billing"
// 6 cards
// IMAGE: none (icons only)
// ===========================================================================

import Reveal from "@/components/Reveal";
import MenuIcon from "@/components/MenuIcon";

export default function MoreThanJustBilling({ more }) {
  return (
    <section className="section section--wash">
      <div className="wrap">
        <Reveal className="center">
          <span className="eyebrow">{more.eyebrow}</span>
          <h2>{more.h2}</h2>
          <p className="lead">{more.lead}</p>
        </Reveal>

        <div className="fgrid">
          {more.items.map(([t, d, icon], i) => (
            <Reveal key={t} delay={(i % 3) * 80}>
              <article className="fcard">
                <span className="fcard__icon">
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
