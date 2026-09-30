// ===========================================================================
// SOFTWARE PAGE - COMPOSITION
// ---------------------------------------------------------------------------
// One template, six pages. Everything it renders comes from the matching
// entry in lib/software.js, so a change to a page is a change to that file.
//
// Sections are optional: leave a key out of lib/software.js and its block
// simply does not render.
// ===========================================================================

import Link from "next/link";
import CtaBand from "@/components/CtaBand";
import MenuIcon from "@/components/MenuIcon";
import { SOFTWARE } from "@/lib/software";
import Hero from "./Hero";
import WhatItIs from "./WhatItIs";
import Features from "./Features";
import HowItWorks from "./HowItWorks";
import WhoUsesIt from "./WhoUsesIt";
import Faqs from "./Faqs";

export default function SoftwarePage({ s, crumbs }) {
  const others = SOFTWARE.filter((x) => x.slug !== s.slug);

  return (
    <>
      {crumbs}

      <Hero s={s} />
      {s.whatIs && <WhatItIs s={s} />}
      {s.features && <Features f={s.features} />}
      {s.steps && <HowItWorks steps={s.steps} />}
      {s.whoFor && <WhoUsesIt who={s.whoFor} />}

      {/* everything in every plan - the same list on all six pages */}
      <section className="section">
        <div className="wrap">
          <h2>Included whichever way you use it</h2>
          <p className="lead">
            These are not add-ons. Every Galla account has them.
          </p>
          <ul className="sw-checks">
            <li>GST and non-GST invoices with HSN codes</li>
            <li>WhatsApp bills and payment reminders</li>
            <li>Stock tracking with low stock alerts</li>
            <li>UPI QR code on every invoice</li>
            <li>GSTR-1 and GSTR-3B ready summaries</li>
            <li>Works offline and syncs later</li>
            <li>Thermal and A4 printer support</li>
            <li>Automatic backup to your account</li>
          </ul>
        </div>
      </section>

      {s.faqs && <Faqs faqs={s.faqs} name={s.name} />}

      <section className="section">
        <div className="wrap">
          <h2>The rest of the same app</h2>
          <p className="lead">
            These are not separate products you buy one by one. It is one app -
            these are the parts of it.
          </p>
          <div className="sw-others">
            {others.map((o) => (
              <Link key={o.slug} href={`/software/${o.slug}`} className="sw-other">
                <span className="sw-other__icon">
                  <MenuIcon name={o.icon} />
                </span>
                <span>
                  <strong>{o.name}</strong>
                  <em>{o.tagline}</em>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
