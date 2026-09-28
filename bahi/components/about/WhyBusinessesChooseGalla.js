// ===========================================================================
// SECTION 6  -  "Why Businesses Choose Galla Billing Software"
// Customer story cards and two stats
// IMAGE: content.js -> whyChoose.stories[].img  (customer photos)
// ===========================================================================

import Reveal from "@/components/Reveal";
import Shot from "./Shot";

export default function WhyBusinessesChooseGalla({ whyChoose }) {
  return (
    <section className="section section--wash">
      <div className="wrap">
        <Reveal className="center">
          <span className="eyebrow">{whyChoose.eyebrow}</span>
          <h2>{whyChoose.h2}</h2>
          <p className="lead">{whyChoose.lead}</p>
        </Reveal>

        <div className="ab-stories">
          {whyChoose.stories.map((s, i) => (
            <Reveal key={s.name} delay={i * 100}>
              <article className="ab-story">
                <Shot src={s.img} art="avatar" initial={s.initial} label={s.imgLabel} alt={s.name} className="ab-story__avatar" />
                <blockquote>{s.quote}</blockquote>
                <p className="ab-story__by">
                  <strong>{s.name}</strong>
                  <span>{s.role}</span>
                </p>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200}>
          <div className="ab-ministats ab-stories__stats">
            {whyChoose.stats.map(([n, l]) => (
              <div key={l} className="ab-stat">
                <strong>{n}</strong>
                <span>{l}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
