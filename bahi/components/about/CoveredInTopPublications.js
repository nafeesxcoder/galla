// ===========================================================================
// SECTION 13  -  "Galla in the News"
// ---------------------------------------------------------------------------
// NOTE: do not put a real publication's name or logo here until you
// actually have that coverage. Everything is a placeholder for now.
// To hide the section, comment out its line in Page.js.
// IMAGE: content.js -> press.logos[].img
// ===========================================================================

import Reveal from "@/components/Reveal";
import Shot from "./Shot";

export default function CoveredInTopPublications({ press }) {
  return (
    <section className="section section--wash">
      <div className="wrap">
        <Reveal className="center">
          <span className="eyebrow">{press.eyebrow}</span>
          <h2>{press.h2}</h2>
          <p className="lead">{press.lead}</p>
        </Reveal>

        <div className="ab-logos">
          {press.logos.map((l, i) => (
            <Reveal key={l.name} delay={(i % 6) * 60}>
              <div className="ab-logos__item">
                <Shot src={l.img} label={l.imgLabel} alt={l.name} />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
