import Link from "next/link";
import { notFound } from "next/navigation";
import { INDUSTRIES, getIndustry } from "@/lib/industries";
import { getIndustryContent } from "@/lib/industry-content";
import { pageMeta } from "@/lib/seo";
import { SITE } from "@/lib/site";
import MenuIcon from "@/components/MenuIcon";
import CtaBand from "@/components/CtaBand";
import IndustryPage from "@/components/industry/Page";

import PharmacyPage, { pharmacyMeta, pharmacyFaqs } from "@/components/pharmacy/Page";

// An industry with its own designed page goes here.
// To add one: build components/<slug>/Page.js, then add an entry below.
const CUSTOM = {
  pharmacy: { Page: PharmacyPage, meta: pharmacyMeta, faqs: pharmacyFaqs },
};

export function generateStaticParams() {
  return INDUSTRIES.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const ind = getIndustry(slug);
  if (!ind) return {};

  const custom = CUSTOM[slug];
  return pageMeta({
    title: `${custom?.meta?.title ?? ind.h1} | ${SITE.name}`,
    description: custom?.meta?.description ?? ind.intro,
    path: `/billing-software/${ind.slug}`,
  });
}

export default async function Page({ params }) {
  const { slug } = await params;
  const ind = getIndustry(slug);
  if (!ind) notFound();

  const custom = CUSTOM[slug];
  const content = getIndustryContent(slug);

  // The FAQs Google is shown are the same ones on the page, so the two
  // cannot drift apart.
  const faqList = custom?.faqs ?? content?.faqs ?? [];
  const ldJson = faqList.length ? (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqList.map(([q, a]) => ({
            "@type": "Question",
            name: q,
            acceptedAnswer: { "@type": "Answer", text: a },
          })),
        }),
      }}
    />
  ) : null;

  // There is no /solutions landing page - the Solutions menu is a menu -
  // so the breadcrumb goes straight back to the home page.
  const crumbs = (
    <nav className="crumbs wrap" aria-label="Breadcrumb">
      <Link href="/">Home</Link> <span aria-hidden="true">/</span>{" "}
      <span>{ind.name}</span>
    </nav>
  );

  const others = INDUSTRIES.filter((i) => i.slug !== ind.slug).slice(0, 6);
  const otherTypes = (
    <section className="section section--wash">
      <div className="wrap">
        <h2>Other business types</h2>
        <p className="lead">
          It is the same app underneath. These pages just show the parts each
          trade leans on.
        </p>
        <div className="sw-others">
          {others.map((o) => (
            <Link
              key={o.slug}
              href={`/billing-software/${o.slug}`}
              className="sw-other"
            >
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
  );

  // ---- industries with their own designed page ----
  if (custom) {
    const Custom = custom.Page;
    return (
      <>
        <Custom ind={ind} crumbs={crumbs} otherTypes={otherTypes} />
        {ldJson}
      </>
    );
  }

  // ---- everything else, on the shared template ----
  return (
    <>
      <IndustryPage
        ind={ind}
        content={content}
        crumbs={crumbs}
        otherTypes={otherTypes}
      />
      <CtaBand />
      {ldJson}
    </>
  );
}
