// ===========================================================================
// SECTION 1  -  HERO
// Heading: "Billing software for your PC"
// IMAGE: content.js -> hero.img  (if empty, the "pc" drawing from Art.js)
// ===========================================================================

import Link from "next/link";
import Shot from "./Shot";

export default function HeroBillingSoftwareForPc({ hero }) {
  return (
    <section className="hero">
      <div className="wrap hero__grid">
        <div>
          <span className="pill">{hero.badge}</span>
          <h1>{hero.h1}</h1>
          <p className="lead">{hero.lead}</p>

          <div className="btn-row">
            <Link href="/mobile-app" className="btn btn--primary">
              {hero.cta}
            </Link>
            <Link href="/pricing" className="btn btn--ghost">
              {hero.cta2}
            </Link>
          </div>

          {hero.trust?.length > 0 && (
            <ul className="herotrust">
              {hero.trust.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="dk-hero__art">
          <Shot src={hero.img} art={hero.art} label={hero.imgLabel} alt={hero.h1} />
        </div>
      </div>
    </section>
  );
}
