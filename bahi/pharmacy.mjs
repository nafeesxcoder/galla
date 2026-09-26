// pharmacy.mjs - Pharmacy page ka poora content + reusable industry components.
// Chalao project folder se (jahan package.json hai):   node pharmacy.mjs

import { writeFileSync, readFileSync, mkdirSync, existsSync, copyFileSync } from "node:fs";
import { dirname } from "node:path";

if (!existsSync("package.json")) {
  console.log("\npackage.json nahi mila. Kya aap 'bahi' folder ke andar ho?\n");
  process.exit(1);
}
if (!existsSync("components/MenuIcon.js")) {
  console.log("\ncomponents/MenuIcon.js nahi mila. Pehle megamenu.mjs chalao.\n");
  process.exit(1);
}

const put = (p, body) => {
  mkdirSync(dirname(p), { recursive: true });
  if (existsSync(p)) copyFileSync(p, p + ".bak");
  writeFileSync(p, body, "utf8");
  console.log("  wrote   " + p);
};

console.log("\nBuilding the pharmacy page...\n");

put("lib/industry-content.js", `// Industry pages ka detailed content. Jis slug ka content yahan hai,
// us page par saare sections dikhenge. Baki pages simple rehte hain.
// Naya section chahiye to yahan key add karo - component apne aap render kar dega.

export const CONTENT = {
  pharmacy: {
    hero: {
      badge: "Built for chemists and medical stores",
      h1: "Pharmacy billing software",
      lead:
        "Make GST bills, track every batch and expiry date, watch your stock and run the counter from one app. Free to start, works offline.",
      chips: ["Drug licence on the bill", "Batch details", "GST slabs", "Expiry alerts"],
      cta: "Download free",
      cta2: "See pricing",
      trust: ["Made for Indian pharmacies", "Schedule H and H1 records", "Free plan, no expiry"],
    },

    intro: {
      eyebrow: "The basics",
      h2: "What is pharmacy billing software?",
      body: [
        "It is the software a chemist shop uses instead of a bill book and a stock register. You add your medicines once, and from then on every sale makes a proper GST bill, reduces the stock, and records which batch went out and when it expires.",
        "The same data then gives you your purchase records, party ledgers and the summaries your CA needs at return time. Meeting drug and tax rules is still your responsibility, but the records are kept in a form you can produce on demand.",
      ],
    },

    whoFor: {
      eyebrow: "Who it is for",
      h2: "Made for every kind of pharmacy business",
      lead: "Whether you run one counter or supply to fifty of them.",
      items: [
        [
          "Chemist stores",
          "GST bills at the counter, batch and expiry on every line, barcode billing and low stock alerts for daily retail.",
          "pill",
        ],
        [
          "Pharma distributors",
          "Bulk tax invoices, strip and box conversions, manufacturer batch numbers and party-wise margins.",
          "truck",
        ],
        [
          "Hospital pharmacies",
          "Bills tied to patient records, doctor-wise prescription history and emergency stock room tracking.",
          "shield",
        ],
        [
          "Chain pharmacies",
          "Stock across branches, central purchase and store-wise sales from one login.",
          "cart",
        ],
      ],
    },

    features: {
      eyebrow: "Key features",
      h2: "Billing, expiry, wholesale and compliance in one system",
      lead: "The parts of a pharmacy that a general billing app never gets right.",
      blocks: [
        {
          h3: "GST invoicing with a drug licence field",
          p: "Bills that satisfy both the customer and the inspector. Enter your drug licence number once and it prints on every invoice after that.",
          points: [
            "Drug licence number added to invoices automatically",
            "GST worked out by medicine category (Nil, 5%, 18%)",
            "Share the bill by print, WhatsApp or email",
            "HSN codes stored against each medicine",
          ],
          note: "Rates change from time to time. Check the current slabs on gst.gov.in before you rely on them.",
          art: "invoice",
        },
        {
          h3: "Batch and expiry on every bill",
          p: "Know which batch each strip came from and when it runs out. Near-expiry stock shows up while you can still return it.",
          points: [
            "Batch number recorded at the time of billing",
            "Expiry date printed on the invoice",
            "Filter stock by expiry so old batches move first",
            "Stock movement visible across every medicine category",
          ],
          art: "sync",
        },
        {
          h3: "Schedule H and H1 records",
          p: "Restricted medicines need a register that holds up during an inspection. That register is kept for you, every time such a medicine is billed.",
          points: [
            "Only an admin or authorised staff member can release restricted medicines for billing",
            "A description field records the prescription reference, doctor name or reason",
            "The digital Schedule H and H1 register updates with every transaction",
            "Restricted medicines can be switched off at the counter when not needed",
            "Full history retrievable in seconds during an inspection",
          ],
          note: "Requirements come from the Drugs and Cosmetics Act, 1940 and its Rules, 1945. Your pharmacist remains responsible for compliance.",
          art: "shield",
        },
        {
          h3: "Wholesale billing for distributors",
          p: "Built for volume. Bulk orders, party accounts and credit, without a spreadsheet on the side.",
          points: [
            "Bulk invoices with many products on one bill",
            "PTR or MRP based pricing, whichever your trade uses",
            "Party-wise ledger for purchases, payments and outstanding",
            "Credit limits so one buyer cannot run up the whole book",
            "Purchase returns and expired stock handled cleanly",
          ],
          art: "growth",
        },
      ],
    },

    steps: {
      eyebrow: "Getting started",
      h2: "Billing at your counter in four steps",
      lead: "No training needed. Most shops make their first bill the same evening.",
      items: [
        ["Download the app", "Install it on an Android phone or a Windows computer and set up your shop."],
        ["Add your medicines", "Enter or import items with batch, expiry and rates. Excel imports work."],
        ["Make your first bill", "Pick the customer, scan or search the medicine, print or share on WhatsApp."],
        ["Watch stock and records", "Expiry alerts, low stock warnings and GST summaries build up on their own."],
      ],
    },

    compare: {
      eyebrow: "What changes",
      h2: "Register, generic software, and a pharmacy app",
      head: ["What you need", "Paper register", "General billing app", "Pharmacy billing"],
      rows: [
        ["GST by medicine category", "Worked out by hand", "Partly supported", "Nil, 5% or 18% applied for you"],
        ["Batch and expiry", "Paper register only", "Usually missing", "Recorded on every bill"],
        ["Drug licence on the invoice", "Rubber stamp", "Not supported", "Added from settings"],
        ["Schedule H and H1 register", "Physical register", "Not supported", "Kept digitally, role controlled"],
        ["Restricted drug access", "No control", "No control", "Admin releases it"],
        ["Works on phone and computer", "No", "Mostly desktop only", "Android and Windows"],
      ],
    },

    extras: {
      eyebrow: "Also in the app",
      h2: "Barcode billing, stock alerts and GST reports",
      lead: "The smaller things that save an hour a day once the counter gets busy.",
      items: [
        ["Barcode billing", "Scan the strip and it is on the bill. Fewer wrong medicines, faster queues.", "pos"],
        ["Low stock alerts", "Set a minimum for each medicine and reorder before the shelf is empty.", "box"],
        ["GST reports", "Category-wise summaries for GSTR-1 and GSTR-3B, pulled from your own bills.", "ledger"],
      ],
    },

    trust: {
      eyebrow: "Why pharmacies use it",
      h2: "Built around how a chemist shop actually works",
      items: [
        [
          "Made for pharmacy rules",
          "Drug licence details, batch and expiry tracking and audit-ready records are part of the app, not an add-on.",
          "shield",
        ],
        [
          "Simple enough for the counter",
          "No accounting background needed. Staff pick it up during a normal shift.",
          "users",
        ],
        [
          "Your records stay yours",
          "Everything is backed up and exportable to Excel or PDF whenever you want it.",
          "ledger",
        ],
      ],
    },

    related: {
      h2: "Other tools pharmacies use",
      items: [
        ["POS software", "/software/pos-software", "Counter billing with barcode scanning and quick payment modes."],
        ["Inventory software", "/software/inventory-software", "Batch tracking, purchase orders and expiry alerts."],
        ["Billing software", "/software/billing-software", "Quick bills, barcode receipts and daily sales tracking."],
        ["Accounting software", "/software/accounting-software", "Ledgers, expenses, profit and loss and cash flow."],
        ["E-invoice software", "/software/e-invoice-software", "IRN and e-way bills straight from the invoice."],
      ],
    },

    faqs: [
      [
        "What is pharmacy billing software and why does a chemist need it?",
        "It replaces the bill book and the stock register with one system. Bills carry GST and your drug licence number, stock reduces as you sell, and batch and expiry are recorded automatically. The point is not speed alone. It is having records you can produce during an inspection without digging through papers.",
      ],
      [
        "Can my drug licence number print on the invoice?",
        "Yes. Enter it once in your shop settings and it appears on every invoice after that, along with your GSTIN and shop details.",
      ],
      [
        "How does expiry tracking work?",
        "Stock is kept batch-wise, and each batch carries its expiry date. When you bill, the batch is recorded on the invoice. You can also sort your stock by expiry to move or return the oldest batches first.",
      ],
      [
        "Does it handle the different GST rates on medicines?",
        "Yes. Set the rate against each medicine once and it is applied on every bill, whether that is nil-rated, 5% or 18%. Rates change from time to time, so check the current slabs on gst.gov.in.",
      ],
      [
        "How does it help with Schedule H and H1 medicines?",
        "Restricted medicines can only be released for billing by an admin or an authorised staff member, and releasing one requires a note such as the prescription reference or doctor name. The digital register builds up with every transaction and can be pulled up during an inspection.",
      ],
      [
        "Is it suitable for a wholesale pharma business?",
        "Yes. Bulk invoices, strip and box conversions, PTR or MRP based pricing, party ledgers and credit limits are all supported.",
      ],
      [
        "Can I use a barcode scanner?",
        "Yes. Any USB or Bluetooth scanner works, and you can print your own barcode labels for repacked or loose items.",
      ],
      [
        "What happens during a drug inspection or GST audit?",
        "Your transaction history is searchable by date, party or medicine name, and batch and expiry records stay current. GST summaries are ready at the end of each return period.",
      ],
      [
        "Does it work on both phone and computer?",
        "Yes. One account covers an Android phone and a Windows computer, and bills made on one show up on the other.",
      ],
      [
        "Is there a free version?",
        "Yes. The free plan covers unlimited GST and non-GST bills on one device. Paid plans add more devices, staff logins and the compliance reports.",
      ],
      [
        "Will it work if the internet goes down?",
        "Yes. Billing runs offline and everything syncs the moment you are back online.",
      ],
      [
        "Can I move my existing records in?",
        "Medicines, suppliers, customers and opening balances can be imported from an Excel or CSV file.",
      ],
      [
        "Can I control which staff can bill restricted medicines?",
        "Yes. Each staff member has their own login, and you decide who can release Schedule H or H1 medicines and who can only bill regular stock.",
      ],
    ],
  },
};

export function getContent(slug) {
  return CONTENT[slug] ?? null;
}
`);

put("components/industry/IndustryArt.js", `import InvoiceMock from "@/components/InvoiceMock";
import { ShopArt, SyncArt, GrowthArt } from "@/components/home/Illustrations";

// Compliance / record-keeping illustration
export function ShieldArt() {
  return (
    <svg className="art" viewBox="0 0 420 300" role="img" aria-label="A record book kept safe">
      <circle className="art__blob" cx="330" cy="80" r="58" fill="var(--wash)" />
      <path d="M210 26 118 60v86c0 58 41 99 92 114 51-15 92-56 92-114V60z" fill="#fff"
        stroke="var(--ink)" strokeWidth="3" />
      <path d="M210 26 118 60v86c0 58 41 99 92 114z" fill="var(--wash)" opacity=".55" />
      <g stroke="var(--ledger)" strokeWidth="7" strokeLinecap="round">
        <path d="M156 104h108M156 132h108M156 160h74" />
      </g>
      <circle className="art__pulse" cx="266" cy="176" r="10" fill="var(--marigold)" />
      <g className="art__float">
        <circle cx="266" cy="176" r="30" fill="var(--ledger)" />
        <path d="M252 176l9 10 19-20" fill="none" stroke="#fff" strokeWidth="5"
          strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

export default function IndustryArt({ name }) {
  if (name === "invoice") return <InvoiceMock />;
  if (name === "sync") return <SyncArt />;
  if (name === "growth") return <GrowthArt />;
  if (name === "shield") return <ShieldArt />;
  return <ShopArt />;
}
`);

put("components/industry/IndustryHero.js", `import Link from "next/link";
import IndustryArt from "./IndustryArt";

export default function IndustryHero({ hero }) {
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
        <IndustryArt name="invoice" />
      </div>
    </section>
  );
}
`);

put("components/industry/IndustryIntro.js", `import Reveal from "@/components/Reveal";
import IndustryArt from "./IndustryArt";

export default function IndustryIntro({ intro }) {
  return (
    <section className="section">
      <div className="wrap artsplit artsplit--flip">
        <Reveal className="artsplit__art">
          <IndustryArt name="shield" />
        </Reveal>
        <Reveal delay={120}>
          <span className="eyebrow">{intro.eyebrow}</span>
          <h2>{intro.h2}</h2>
          {intro.body.map((p) => (
            <p className="lead" key={p.slice(0, 24)}>
              {p}
            </p>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
`);

put("components/industry/IndustryWhoFor.js", `import Reveal from "@/components/Reveal";
import MenuIcon from "@/components/MenuIcon";

export default function IndustryWhoFor({ whoFor }) {
  return (
    <section className="section section--wash">
      <div className="wrap">
        <Reveal>
          <span className="eyebrow">{whoFor.eyebrow}</span>
          <h2>{whoFor.h2}</h2>
          <p className="lead">{whoFor.lead}</p>
        </Reveal>
        <div className="fgrid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          {whoFor.items.map(([t, d, icon], i) => (
            <Reveal key={t} delay={(i % 4) * 70}>
              <article className="fcard">
                <span className="fcard__icon">
                  <MenuIcon name={icon} />
                </span>
                <h3>{t}</h3>
                <p>{d}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
`);

put("components/industry/IndustryFeatures.js", `import Reveal from "@/components/Reveal";
import IndustryArt from "./IndustryArt";

export default function IndustryFeatures({ features }) {
  return (
    <section className="section">
      <div className="wrap">
        <Reveal>
          <span className="eyebrow">{features.eyebrow}</span>
          <h2>{features.h2}</h2>
          <p className="lead">{features.lead}</p>
        </Reveal>
      </div>

      {features.blocks.map((b, i) => {
        const flip = i % 2 === 1;
        return (
          <div className={\`wrap artsplit featblock \${flip ? "artsplit--flip" : ""}\`} key={b.h3}>
            {flip && (
              <Reveal className="artsplit__art">
                <IndustryArt name={b.art} />
              </Reveal>
            )}

            <Reveal delay={flip ? 120 : 0}>
              <h3 className="featblock__h">{b.h3}</h3>
              <p>{b.p}</p>
              <ul className="checklist">
                {b.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              {b.note && <p className="featblock__note">{b.note}</p>}
            </Reveal>

            {!flip && (
              <Reveal className="artsplit__art" delay={150}>
                <IndustryArt name={b.art} />
              </Reveal>
            )}
          </div>
        );
      })}
    </section>
  );
}
`);

put("components/industry/IndustrySteps.js", `import Reveal from "@/components/Reveal";

export default function IndustrySteps({ steps }) {
  return (
    <section className="section section--wash">
      <div className="wrap">
        <Reveal>
          <span className="eyebrow">{steps.eyebrow}</span>
          <h2>{steps.h2}</h2>
          <p className="lead">{steps.lead}</p>
        </Reveal>
        <ol className="setup">
          {steps.items.map(([t, d], i) => (
            <Reveal as="li" key={t} delay={i * 90} className="setup__item">
              <span className="setup__num">{i + 1}</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
`);

put("components/industry/IndustryCompare.js", `import Reveal from "@/components/Reveal";

export default function IndustryCompare({ compare }) {
  return (
    <section className="section">
      <div className="wrap">
        <Reveal>
          <span className="eyebrow">{compare.eyebrow}</span>
          <h2>{compare.h2}</h2>
        </Reveal>
        <div className="table-wrap">
          <table className="compare compare--4">
            <thead>
              <tr>
                {compare.head.map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {compare.rows.map((r) => (
                <tr key={r[0]}>
                  {r.map((c, i) => (
                    <td key={i} className={i === r.length - 1 ? "compare__win" : undefined}>
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
`);

put("components/industry/IndustryExtras.js", `import Reveal from "@/components/Reveal";
import MenuIcon from "@/components/MenuIcon";

export default function IndustryExtras({ extras }) {
  return (
    <section className="section section--wash">
      <div className="wrap">
        <Reveal>
          <span className="eyebrow">{extras.eyebrow}</span>
          <h2>{extras.h2}</h2>
          <p className="lead">{extras.lead}</p>
        </Reveal>
        <div className="fgrid">
          {extras.items.map(([t, d, icon], i) => (
            <Reveal key={t} delay={i * 80}>
              <article className="fcard">
                <span className="fcard__icon">
                  <MenuIcon name={icon} />
                </span>
                <h3>{t}</h3>
                <p>{d}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
`);

put("components/industry/IndustryTrust.js", `import Reveal from "@/components/Reveal";
import MenuIcon from "@/components/MenuIcon";

export default function IndustryTrust({ trust }) {
  return (
    <section className="section">
      <div className="wrap">
        <Reveal>
          <span className="eyebrow">{trust.eyebrow}</span>
          <h2>{trust.h2}</h2>
        </Reveal>
        <div className="fgrid">
          {trust.items.map(([t, d, icon], i) => (
            <Reveal key={t} delay={i * 80}>
              <article className="fcard">
                <span className="fcard__icon">
                  <MenuIcon name={icon} />
                </span>
                <h3>{t}</h3>
                <p>{d}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
`);

put("components/industry/IndustryRelated.js", `import Link from "next/link";
import Reveal from "@/components/Reveal";

export default function IndustryRelated({ related }) {
  return (
    <section className="section section--wash">
      <div className="wrap">
        <Reveal>
          <h2>{related.h2}</h2>
        </Reveal>
        <div className="fgrid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))" }}>
          {related.items.map(([t, href, d], i) => (
            <Reveal key={t} delay={(i % 3) * 70}>
              <Link href={href} className="icard">
                <h3>{t}</h3>
                <p>{d}</p>
                <span className="icard__go">Learn more &rarr;</span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
`);

put("components/industry/IndustryFaq.js", `"use client";
import { useState } from "react";
import Reveal from "@/components/Reveal";

const VISIBLE = 6;

export default function IndustryFaq({ faqs, title }) {
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? faqs : faqs.slice(0, VISIBLE);

  return (
    <section className="section">
      <div className="wrap">
        <Reveal className="center">
          <span className="eyebrow">Common questions</span>
          <h2>{title}</h2>
        </Reveal>

        <div className="faq faq--home">
          {shown.map(([q, a]) => (
            <details key={q} name="ind-faq">
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>

        {faqs.length > VISIBLE && (
          <div className="faq__actions">
            <button
              type="button"
              className="btn btn--ghost"
              aria-expanded={showAll}
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? "View less FAQs" : \`View all \${faqs.length} FAQs\`}
              <span className={\`faq__caret \${showAll ? "up" : ""}\`} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
`);

put("app/billing-software/[slug]/page.js", `import Link from "next/link";
import { notFound } from "next/navigation";
import { INDUSTRIES, getIndustry } from "@/lib/industries";
import { getContent } from "@/lib/industry-content";
import { pageMeta } from "@/lib/seo";
import { SITE } from "@/lib/site";
import Reveal from "@/components/Reveal";
import InvoiceMock from "@/components/InvoiceMock";
import CtaBand from "@/components/CtaBand";
import IndustryIcon from "@/components/industry/IndustryIcon";

import IndustryHero from "@/components/industry/IndustryHero";
import IndustryIntro from "@/components/industry/IndustryIntro";
import IndustryWhoFor from "@/components/industry/IndustryWhoFor";
import IndustryFeatures from "@/components/industry/IndustryFeatures";
import IndustrySteps from "@/components/industry/IndustrySteps";
import IndustryCompare from "@/components/industry/IndustryCompare";
import IndustryExtras from "@/components/industry/IndustryExtras";
import IndustryTrust from "@/components/industry/IndustryTrust";
import IndustryRelated from "@/components/industry/IndustryRelated";
import IndustryFaq from "@/components/industry/IndustryFaq";

// 12 pages build time par hi ban jate hain
export function generateStaticParams() {
  return INDUSTRIES.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const ind = getIndustry(slug);
  if (!ind) return {};
  const c = getContent(slug);
  return pageMeta({
    title: \`\${c?.hero?.h1 ?? ind.h1} | \${SITE.name}\`,
    description: c?.hero?.lead ?? \`\${ind.intro} Free GST billing software for \${ind.name.toLowerCase()} businesses in India.\`,
    path: \`/billing-software/\${ind.slug}\`,
  });
}

export default async function IndustryPage({ params }) {
  const { slug } = await params;
  const ind = getIndustry(slug);
  if (!ind) notFound();

  const c = getContent(slug);
  const faqList = c?.faqs ?? ind.faqs;
  const others = INDUSTRIES.filter((i) => i.slug !== ind.slug).slice(0, 6);

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqList.map(([q, a]) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  const crumbs = (
    <nav className="crumbs wrap" aria-label="Breadcrumb">
      <Link href="/">Home</Link> <span aria-hidden="true">/</span>{" "}
      <Link href="/solutions">Solutions</Link> <span aria-hidden="true">/</span>{" "}
      <span>{ind.name}</span>
    </nav>
  );

  const otherTypes = (
    <section className="section section--wash">
      <div className="wrap">
        <h2>Other business types</h2>
        <div className="otherlinks">
          {others.map((o) => (
            <Link key={o.slug} href={\`/billing-software/\${o.slug}\`}>
              {o.name} billing &rarr;
            </Link>
          ))}
        </div>
      </div>
    </section>
  );

  const ldJson = (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
  );

  // ---- Detailed page (content file me entry hai) ----
  if (c) {
    return (
      <>
        {crumbs}
        <IndustryHero hero={c.hero} />
        <IndustryIntro intro={c.intro} />
        <IndustryWhoFor whoFor={c.whoFor} />
        <IndustryFeatures features={c.features} />
        <IndustrySteps steps={c.steps} />
        <IndustryCompare compare={c.compare} />
        <IndustryExtras extras={c.extras} />
        <IndustryTrust trust={c.trust} />
        <IndustryRelated related={c.related} />
        <IndustryFaq faqs={c.faqs} title={\`Questions about \${ind.name.toLowerCase()} billing\`} />
        {otherTypes}
        <CtaBand />
        {ldJson}
      </>
    );
  }

  // ---- Simple page (abhi content nahi hai) ----
  return (
    <>
      {crumbs}

      <section className="hero">
        <div className="wrap hero__grid">
          <div>
            <span className="pill">{ind.tagline}</span>
            <h1>{ind.h1}</h1>
            <p className="lead">{ind.intro}</p>
            <div className="btn-row">
              <Link href="/mobile-app" className="btn btn--primary">Start free</Link>
              <Link href="/pricing" className="btn btn--ghost">See pricing</Link>
            </div>
          </div>
          <InvoiceMock />
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <Reveal>
            <span className="eyebrow">Built for this business</span>
            <h2>What {ind.name.toLowerCase()} owners get</h2>
          </Reveal>
          <div className="fgrid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
            {ind.features.map(([t, d], i) => (
              <Reveal key={t} delay={(i % 3) * 80}>
                <article className="fcard">
                  <span className="fcard__icon"><IndustryIcon name={ind.icon} /></span>
                  <h3>{t}</h3>
                  <p>{d}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--wash">
        <div className="wrap">
          <Reveal>
            <h2>Also included in every plan</h2>
            <p className="lead">The same billing, stock and GST tools every {SITE.name} user gets.</p>
          </Reveal>
          <ul className="checklist checklist--2col">
            <li>GST and non-GST invoices with HSN codes</li>
            <li>WhatsApp bills and payment reminders</li>
            <li>Stock tracking with low stock alerts</li>
            <li>UPI QR code on every invoice</li>
            <li>GSTR-1 and GSTR-3B ready reports</li>
            <li>Works offline and syncs later</li>
            <li>Thermal and A4 printer support</li>
            <li>Automatic cloud backup</li>
          </ul>
        </div>
      </section>

      <IndustryFaq faqs={ind.faqs} title={\`Questions from \${ind.name.toLowerCase()} owners\`} />

      {otherTypes}
      <CtaBand />
      {ldJson}
    </>
  );
}
`);


/* ---- CSS ---- */
{
  const p = "components/home/home.css";
  let cur = readFileSync(p, "utf8");
  copyFileSync(p, p + ".bak");
  const marker = "/* ===== Industry detail pages ===== */";
  const i = cur.indexOf(marker);
  if (i !== -1) cur = cur.slice(0, i);
  writeFileSync(p, cur.trimEnd() + "\n\n" + `/* ===== Industry detail pages ===== */
.chips--tight { margin-top: 1.4rem; }
.chips--tight span { font-size: .9rem; padding: .35rem .9rem; background: var(--wash); border-color: transparent; }
.herotrust { list-style: none; display: flex; flex-wrap: wrap; gap: .5rem 1.4rem; margin-top: 1.8rem;
  color: var(--ink-soft); font-size: .92rem; }
.herotrust li { position: relative; padding-left: 1.3rem; }
.herotrust li::before { content: ""; position: absolute; left: 0; top: .5rem; width: .8rem; height: .42rem;
  border-left: 2.5px solid var(--ledger); border-bottom: 2.5px solid var(--ledger); transform: rotate(-45deg); }

.featblock { padding-block: 3rem; align-items: center; }
.featblock + .featblock { border-top: 1px solid var(--line); }
.featblock__h { font-size: 1.6rem; margin-bottom: .7rem; }
.featblock p { color: var(--ink-soft); }
.featblock__note { margin-top: 1.2rem; padding: .8rem 1rem; background: var(--wash); border-radius: 10px;
  font-size: .9rem; color: var(--ink-soft); max-width: none; }
@media (max-width: 900px) { .featblock { padding-block: 2.2rem; } }

.compare--4 th, .compare--4 td { font-size: .95rem; vertical-align: top; }
.compare--4 th:first-child, .compare--4 td:first-child { font-weight: 600; }
.compare__win { color: var(--ledger-dark); font-weight: 600; background: var(--wash); }
.compare--4 thead th:last-child { color: var(--ledger); }
`, "utf8");
  console.log("  patched " + p);
}

console.log("\nDone. Ab chalao:  npm run build");
console.log("Page dekho:  /billing-software/pharmacy\n");
