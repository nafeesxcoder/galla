import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { INDUSTRIES } from "@/lib/industries";
import Reveal from "@/components/Reveal";
import CtaBand from "@/components/CtaBand";
import { ShopArt, SyncArt, GrowthArt } from "@/components/home/Illustrations";

export const metadata = pageMeta({
  title: "Solutions",
  description:
    "Billing, inventory, accounting, GST compliance, payments and an online store, all in one app for small businesses.",
  path: "/solutions",
});

const pillars = [
  {
    eyebrow: "Billing and invoicing",
    h: "Every kind of bill your shop needs",
    p: "GST invoices, cash memos, estimates, delivery challans and credit notes come out of the same screen, with the tax worked out for you.",
    points: [
      "GST and non-GST invoices with HSN or SAC codes",
      "Estimates and quotations that convert to bills",
      "Delivery challans, credit and debit notes",
      "Your logo and shop details on every format",
    ],
    Art: ShopArt,
    flip: false,
  },
  {
    eyebrow: "Stock and inventory",
    h: "Know what is on the shelf without counting it",
    p: "Stock moves with every bill and every purchase entry, so the number on the screen matches the number in the godown.",
    points: [
      "Low stock alerts before the shelf runs empty",
      "Batch numbers and expiry dates where you need them",
      "Barcode printing and scanning",
      "Item-wise profit so you can price with real numbers",
    ],
    Art: SyncArt,
    flip: true,
  },
  {
    eyebrow: "Accounts and GST",
    h: "Reports your CA can actually use",
    p: "Cash book, party ledgers and tax summaries build themselves from the bills you already made. Nothing to type twice.",
    points: [
      "GSTR-1, GSTR-3B and HSN summaries",
      "Party-wise outstanding and statements",
      "Profit and loss, balance sheet, cash flow",
      "Export anything to Excel or PDF",
    ],
    Art: GrowthArt,
    flip: false,
  },
];

const more = [
  ["Payments and credit", "See who owes you what, and send a reminder with the bill attached on WhatsApp."],
  ["UPI collection", "A QR code on the invoice so the customer can pay before they leave the counter."],
  ["Online store", "A free store link you can share on WhatsApp to take orders without a website."],
  ["Staff logins", "Each person gets their own login, and you decide what they can see or change."],
  ["Multiple locations", "Separate stock per shop or godown, with transfers between them."],
  ["Automatic backup", "Your day is backed up to the cloud before you pull the shutter down."],
];

const before = [
  ["Making a bill", "Write it, then check the tax on a calculator", "Pick items, tax applies itself"],
  ["Knowing your stock", "Count the shelf on Sunday", "Current count on the screen"],
  ["Collecting udhaar", "Remember who owes what", "A list sorted by how long it is pending"],
  ["GST filing", "Two days of sorting bills", "A report you send to your CA"],
  ["Losing your records", "One wet register and it is gone", "Backed up and exportable"],
];

const faqs = [
  [
    "Do I have to use all of it from day one?",
    "No. Most shops start with billing alone. Stock, reports and the rest are already there when you need them, nothing extra to install.",
  ],
  [
    "Will it work if I am not registered under GST?",
    "Yes. Make cash memos and simple bills without a GSTIN. Add your GSTIN in settings later and GST billing starts working right away.",
  ],
  [
    "Can I bring my old records in?",
    "Yes. Items, parties and opening balances can be imported from an Excel or CSV file, so you do not type your old books again.",
  ],
  [
    "What happens when the internet goes down?",
    "Billing keeps running on the device and everything syncs the moment you are back online.",
  ],
];

export default function Solutions() {
  return (
    <>
      <nav className="crumbs wrap" aria-label="Breadcrumb">
        <Link href="/">Home</Link> <span aria-hidden="true">/</span> <span>Solutions</span>
      </nav>

      <section className="hero">
        <div className="wrap hero__grid">
          <div>
            <span className="pill">One app, not six</span>
            <h1>Everything between the counter and the CA</h1>
            <p className="lead">
              Billing, stock, udhaar, GST and reports run off the same data. Enter a bill once and
              every screen that needs it is already up to date.
            </p>
            <div className="btn-row">
              <Link href="/mobile-app" className="btn btn--primary">
                Start free
              </Link>
              <Link href="/pricing" className="btn btn--ghost">
                See pricing
              </Link>
            </div>
            <div className="ministats">
              <div>
                <b>1</b>
                <span>Entry, every report</span>
              </div>
              <div>
                <b>0</b>
                <span>Add-ons to buy</span>
              </div>
            </div>
          </div>
          <ShopArt />
        </div>
      </section>

      {pillars.map((s) => (
        <section
          key={s.eyebrow}
          className={s.flip ? "section section--wash" : "section"}
        >
          <div className={`wrap artsplit ${s.flip ? "artsplit--flip" : ""}`}>
            {s.flip && (
              <Reveal className="artsplit__art">
                <s.Art />
              </Reveal>
            )}

            <Reveal delay={s.flip ? 120 : 0}>
              <span className="eyebrow">{s.eyebrow}</span>
              <h2>{s.h}</h2>
              <p className="lead">{s.p}</p>
              <ul className="checklist">
                {s.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </Reveal>

            {!s.flip && (
              <Reveal className="artsplit__art" delay={150}>
                <s.Art />
              </Reveal>
            )}
          </div>
        </section>
      ))}

      <section className="section section--wash">
        <div className="wrap">
          <Reveal>
            <span className="eyebrow">And the rest of it</span>
            <h2>The parts you reach for later</h2>
            <p className="lead">
              None of this is a separate plan or an add-on. It is in the app, waiting until your
              shop needs it.
            </p>
          </Reveal>
          <div className="fgrid">
            {more.map(([t, d], i) => (
              <Reveal key={t} delay={(i % 3) * 80}>
                <article className="fcard">
                  <span className="fcard__dot" aria-hidden="true" />
                  <h3>{t}</h3>
                  <p>{d}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <Reveal>
            <span className="eyebrow">What changes</span>
            <h2>The register way, and the {SITE.name} way</h2>
          </Reveal>
          <div className="table-wrap">
            <table className="compare">
              <thead>
                <tr>
                  <th>Daily job</th>
                  <th>On paper</th>
                  <th>In {SITE.name}</th>
                </tr>
              </thead>
              <tbody>
                {before.map((r) => (
                  <tr key={r[0]}>
                    {r.map((c, i) => (
                      <td key={i}>{c}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section section--wash">
        <div className="wrap">
          <Reveal>
            <h2>Set up the way your shop bills</h2>
            <p className="lead">
              Open your business type and see the invoice, stock and report setup made for that
              work.
            </p>
          </Reveal>
          <div className="otherlinks">
            {INDUSTRIES.map((i) => (
              <Link key={i.slug} href={`/billing-software/${i.slug}`}>
                {i.name} billing &rarr;
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <Reveal className="center">
            <h2>Questions before you start</h2>
          </Reveal>
          <div className="faq faq--home">
            {faqs.map(([q, a]) => (
              <details key={q} name="sol-faq">
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
