// ===========================================================================
// SECTION 6  -  "Galla Desktop App Pricing"
// Four plan cards. The plan with  popular: true  gets the highlight.
// PRICES live in content.js -> pricing.plans[].price (placeholders for now)
// IMAGE: none
// ===========================================================================

import Link from "next/link";
import Reveal from "@/components/Reveal";

export default function DesktopAppPricing({ pricing }) {
  return (
    <section className="section">
      <div className="wrap">
        <Reveal className="center">
          <span className="eyebrow">{pricing.eyebrow}</span>
          <h2>{pricing.h2}</h2>
          <p className="lead">{pricing.lead}</p>
        </Reveal>

        <div className="dk-plans">
          {pricing.plans.map((p, i) => (
            <Reveal key={p.name} delay={i * 80}>
              <article className={`dk-plan ${p.popular ? "is-popular" : ""}`}>
                {p.popular && <span className="dk-plan__flag">Most popular</span>}
                <h3>{p.name}</h3>
                <p className="dk-plan__price">
                  <strong>{p.price}</strong>
                  <span>/ {p.per}</span>
                </p>
                <p className="dk-plan__note">{p.note}</p>
                <p className="dk-plan__sub">{p.sub}</p>
                <ul className="checklist">
                  {p.points.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
                <Link
                  href="/pricing"
                  className={`btn ${p.popular ? "btn--primary" : "btn--ghost"} dk-plan__btn`}
                >
                  {p.cta}
                </Link>
              </article>
            </Reveal>
          ))}
        </div>

        {pricing.foot && <p className="dk-plans__foot">{pricing.foot}</p>}
      </div>
    </section>
  );
}
