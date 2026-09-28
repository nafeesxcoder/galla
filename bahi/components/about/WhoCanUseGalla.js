// ===========================================================================
// SECTION 16  -  "Who Can Use Galla GST Billing Software"
// ---------------------------------------------------------------------------
// This section reads its list straight from lib/industries.js, so the links
// can never break. To add a new industry, add it in lib/industries.js and it
// appears here automatically.
// IMAGE: none (icons only)
// ===========================================================================

import Link from "next/link";
import Reveal from "@/components/Reveal";
import MenuIcon from "@/components/MenuIcon";
import { INDUSTRIES } from "@/lib/industries";

export default function WhoCanUseGalla({ whoCanUse }) {
  return (
    <section className="section">
      <div className="wrap">
        <Reveal className="center">
          <span className="eyebrow">{whoCanUse.eyebrow}</span>
          <h2>{whoCanUse.h2}</h2>
          <p className="lead">{whoCanUse.lead}</p>
        </Reveal>

        <div className="igrid">
          {INDUSTRIES.map((ind, i) => (
            <Reveal key={ind.slug} delay={(i % 4) * 70}>
              <Link href={`/billing-software/${ind.slug}`} className="icard">
                <span className="fcard__icon">
                  <MenuIcon name={ind.icon} />
                </span>
                <h3>{ind.name}</h3>
                <p>{ind.tagline ?? ind.intro}</p>
                <span className="icard__go" aria-hidden="true">
                  &rarr;
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
