// ===========================================================================
// SECTION 7  -  "Why Galla is the Best Billing Software for Small Businesses"
// 16 feature cards (eyebrow: Built for India)
// IMAGE: none (icons only)
// ===========================================================================

import Reveal from "@/components/Reveal";
import MenuIcon from "@/components/MenuIcon";

export default function WhyGallaIsTheBest({ best }) {
  return (
    <section className="section">
      <div className="wrap">
        <Reveal className="center">
          <span className="eyebrow">{best.eyebrow}</span>
          <h2>{best.h2}</h2>
          <p className="lead">{best.lead}</p>
        </Reveal>

        <div className="fgrid">
          {best.items.map(([t, d, icon], i) => (
            <Reveal key={t} delay={(i % 4) * 70}>
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
