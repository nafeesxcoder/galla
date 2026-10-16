import Link from "next/link";
import Art from "./Art";
import HeroArt from "./HeroArt";

export default function Hero({ hero }) {
  return (
    <section className="hero">
      <div className="wrap hero__grid">
        <div>
          <span className="pill">{hero.badge}</span>
          <h1>{hero.h1}</h1>
          <p className="lead">{hero.lead}</p>

          {hero.chips?.length > 0 && (
            <div className="chips chips--tight">
              {hero.chips.map((c) => (
                <span key={c}>{c}</span>
              ))}
            </div>
          )}

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
              {hero.trust.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          )}
        </div>
        {hero.art === "pharmacy" ? <HeroArt /> : <Art name="invoice" />}
      </div>
    </section>
  );
}
