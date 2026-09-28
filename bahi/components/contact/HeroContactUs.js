// ===========================================================================
// SECTION 1  -  "Contact Us" heading with the illustration beside it
// IMAGE: content.js -> hero.img  (empty = the code-drawn illustration)
// ===========================================================================

import Art from "./Art";

export default function HeroContactUs({ hero }) {
  return (
    <section className="ct-hero">
      <div className="wrap ct-hero__grid">
        <div>
          <h1>{hero.h1}</h1>
          <p className="lead">{hero.lead}</p>
        </div>

        <div className="ct-hero__art">
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
