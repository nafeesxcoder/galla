import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { SITE } from "@/lib/site";
import Reveal from "@/components/Reveal";
import CtaBand from "@/components/CtaBand";
import { ShopArt, GrowthArt } from "@/components/home/Illustrations";

export const metadata = pageMeta({
  title: "About us",
  description:
    "Why we build simple GST billing software for Indian small businesses, what we are working on next, and how to reach us.",
  path: "/about",
});

const timeline = [
  ["Now", "GST and non-GST billing, stock tracking and reports on Android and Windows."],
  ["Next", "E-invoice, e-way bill and stock across multiple shops or godowns."],
  ["Later", "An online store link and WhatsApp tools to bring customers back."],
];

const values = [
  [
    "Plain language",
    "No accounting jargon anywhere in the app. Udhaar is udhaar, not accounts receivable.",
  ],
  [
    "Honest pricing",
    "One price list, on the pricing page. No sales call to find out what it costs, no surprise renewal.",
  ],
  [
    "Your data is yours",
    "Export everything to Excel or PDF whenever you want, including the day you decide to leave.",
  ],
  [
    "Support in your language",
    "Phone and WhatsApp help in the language you are comfortable speaking.",
  ],
];

export default function About() {
  return (
    <>
      <nav className="crumbs wrap" aria-label="Breadcrumb">
        <Link href="/">Home</Link> <span aria-hidden="true">/</span> <span>About us</span>
      </nav>

      <section className="hero">
        <div className="wrap hero__grid">
          <div>
            <span className="pill">Why we built this</span>
            <h1>Accounts a shop owner can read without an accountant</h1>
            <p className="lead">
              Most billing software is written for people who already know accounting. {SITE.name}{" "}
              is written for the person behind the counter.
            </p>
            <div className="btn-row">
              <Link href="/solutions" className="btn btn--primary">
                See what it does
              </Link>
              <Link href="/partner" className="btn btn--ghost">
                Partner with us
              </Link>
            </div>
          </div>
          <ShopArt />
        </div>
      </section>

      <section className="section">
        <div className="wrap artsplit artsplit--flip">
          <Reveal className="artsplit__art">
            <GrowthArt />
          </Reveal>
          <Reveal delay={120}>
            <span className="eyebrow">The idea</span>
            <h2>The bahi-khata got the job done. It just could not add up GST.</h2>
            <p className="lead">
              A paper ledger is honest, fast and everyone understands it. What it cannot do is work
              out tax, warn you that an item is finished, or tell you who has owed you money since
              March.
            </p>
            <p className="lead">
              So we kept the register and gave it a calculator, a memory and a WhatsApp button.
              Nothing more complicated than that.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section section--wash">
        <div className="wrap">
          <Reveal>
            <span className="eyebrow">Where we are</span>
            <h2>What is built, and what is coming</h2>
            <p className="lead">
              We would rather show you the real list than a page of promises.
            </p>
          </Reveal>
          <ol className="setup" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            {timeline.map(([y, t], i) => (
              <Reveal as="li" key={y} delay={i * 90} className="setup__item">
                <span className="setup__num">{i + 1}</span>
                <h3>{y}</h3>
                <p>{t}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <Reveal>
            <span className="eyebrow">How we work</span>
            <h2>Four things we do not bend on</h2>
          </Reveal>
          <div className="fgrid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}>
            {values.map(([t, d], i) => (
              <Reveal key={t} delay={(i % 4) * 70}>
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

      <section className="section section--wash">
        <div className="wrap split">
          <Reveal>
            <span className="eyebrow">Talk to us</span>
            <h2>A real person picks up</h2>
            <p className="lead">
              Questions about the app, a problem with a bill, or an idea for something we should
              build. All of it reaches the same small team.
            </p>
            <ul className="checklist">
              <li>
                Call <a href={`tel:${SITE.phone.replace(/\s/g, "")}`}>{SITE.phone}</a>
              </li>
              <li>
                Write to <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
              </li>
              <li>{SITE.city}</li>
            </ul>
          </Reveal>
          <Reveal className="panel" delay={120}>
            <h3>Working with us</h3>
            <p style={{ marginTop: ".8rem", color: "var(--ink-soft)" }}>
              If you sell to shops, train them, or file their returns, there is a partner programme
              with recurring commission.
            </p>
            <Link
              href="/partner"
              className="btn btn--ghost btn--small"
              style={{ marginTop: "1.2rem" }}
            >
              See the partner programme
            </Link>
          </Reveal>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
