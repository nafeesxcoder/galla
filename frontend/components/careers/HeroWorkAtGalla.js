// ===========================================================================
// SECTION 1  -  the careers hero
// IMAGE: content.js -> hero.img  (empty = the code-drawn illustration)
// ===========================================================================

import Art from "./Art";

export default function HeroWorkAtGalla({ hero }) {
  return (
    <section className="hero cr-hero">
      <div className="wrap hero__grid">
        <div>
          <span className="pill">{hero.eyebrow}</span>
          <h1>{hero.h1}</h1>
          <p className="lead">{hero.lead}</p>
          <div className="btn-row">
            <a href="#roles" className="btn btn--primary">
              {hero.cta}
            </a>
          </div>
        </div>

        <div className="cr-hero__art">
          {hero.img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hero.img} alt={hero.imgLabel} />
          ) : (
            <Art />
          )}
        </div>
      </div>
    </section>
  );
}
