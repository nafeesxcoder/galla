// ===========================================================================
// INDUSTRY PAGE - the shared template
// ---------------------------------------------------------------------------
// Every business type that does not have its own designed page renders
// through this. Pharmacy is the exception - it has components/pharmacy/.
//
// The section components are the SAME ONES the /software pages use. They are
// imported rather than copied on purpose: the two page types have the same
// shape, so sharing them means a design change lands in both places at once
// and they can never drift apart. The "sw-" CSS classes come along for the
// same reason.
//
// What it renders comes from two files:
//   lib/industries.js         - the hero (name, tagline, h1, intro, trust)
//   lib/industry-content.js   - everything below it
// They are merged into one object here, so a key can live in either.
// ===========================================================================

import Hero from "@/components/software/Hero";
import WhatItIs from "@/components/software/WhatItIs";
import Features from "@/components/software/Features";
import HowItWorks from "@/components/software/HowItWorks";
import WhoUsesIt from "@/components/software/WhoUsesIt";
import Faqs from "@/components/software/Faqs";

export default function IndustryPage({ ind, content, crumbs, otherTypes }) {
  // lib/industries.js provides the top of the page, industry-content.js the
  // rest. A slug with no content block still gets a working page.
  const s = { ...ind, ...(content ?? {}) };

  return (
    <>
      {crumbs}

      <Hero s={s} />
      {s.whatIs && <WhatItIs s={s} />}
      {s.features && <Features f={s.features} />}
      {s.steps && <HowItWorks steps={s.steps} />}
      {s.whoFor && <WhoUsesIt who={s.whoFor} />}

      <section className="section">
        <div className="wrap">
          <h2>Included whatever you sell</h2>
          <p className="lead">
            These are not extras for your trade. Every Galla account has them.
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

      {/* "jewellery store billing" rather than "jewellery store", which reads
          as a half-finished sentence in the heading */}
      {s.faqs && <Faqs faqs={s.faqs} name={`${ind.name} billing`} />}

      {otherTypes}
    </>
  );
}
