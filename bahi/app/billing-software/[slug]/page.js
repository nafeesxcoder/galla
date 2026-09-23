import Link from "next/link";
import { notFound } from "next/navigation";
import { INDUSTRIES, getIndustry } from "@/lib/industries";
import { pageMeta } from "@/lib/seo";
import { SITE } from "@/lib/site";
import Reveal from "@/components/Reveal";
import InvoiceMock from "@/components/InvoiceMock";
import CtaBand from "@/components/CtaBand";
import IndustryIcon from "@/components/industry/IndustryIcon";

// 12 pages build time par hi ban jate hain
export function generateStaticParams() {
  return INDUSTRIES.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const ind = getIndustry(slug);
  if (!ind) return {};
  return pageMeta({
    title: `${ind.h1} | ${SITE.name}`,
    description: `${ind.intro} Free GST billing software for ${ind.name.toLowerCase()} businesses in India.`,
    path: `/billing-software/${ind.slug}`,
  });
}

export default async function IndustryPage({ params }) {
  const { slug } = await params;
  const ind = getIndustry(slug);
  if (!ind) notFound();

  const others = INDUSTRIES.filter((i) => i.slug !== ind.slug).slice(0, 6);

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: ind.faqs.map(([q, a]) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  return (
    <>
      <nav className="crumbs wrap" aria-label="Breadcrumb">
        <Link href="/">Home</Link> <span aria-hidden="true">/</span>{" "}
        <Link href="/solutions">Solutions</Link> <span aria-hidden="true">/</span>{" "}
        <span>{ind.name}</span>
      </nav>

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

      <section className="section">
        <div className="wrap">
          <Reveal className="center">
            <h2>Questions from {ind.name.toLowerCase()} owners</h2>
          </Reveal>
          <div className="faq faq--home">
            {ind.faqs.map(([q, a]) => (
              <details key={q} name="ind-faq">
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--wash">
        <div className="wrap">
          <h2>Other business types</h2>
          <div className="otherlinks">
            {others.map((o) => (
              <Link key={o.slug} href={`/billing-software/${o.slug}`}>{o.name} billing →</Link>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    </>
  );
}

