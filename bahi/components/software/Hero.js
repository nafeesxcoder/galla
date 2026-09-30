// ===========================================================================
// SECTION 1  -  HERO
// ===========================================================================

import Link from "next/link";
import InvoiceMock from "@/components/InvoiceMock";

export default function Hero({ s }) {
  return (
    <section className="hero">
      <div className="wrap hero__grid">
        <div>
          <span className="pill">{s.tagline}</span>
          <h1>{s.h1}</h1>
          <p className="lead">{s.intro}</p>

          <div className="btn-row">
            <Link href="/mobile-app" className="btn btn--primary">
              Start free
            </Link>
            <Link href="/pricing" className="btn btn--ghost">
              See pricing
            </Link>
          </div>

          {s.trust?.length > 0 && (
            <ul className="herotrust">
              {s.trust.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          )}
        </div>

        <InvoiceMock />
      </div>
    </section>
  );
}
