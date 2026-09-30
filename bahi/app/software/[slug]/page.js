import Link from "next/link";
import { notFound } from "next/navigation";
import { SOFTWARE, getSoftware } from "@/lib/software";
import { pageMeta } from "@/lib/seo";
import { SITE } from "@/lib/site";
import SoftwarePage from "@/components/software/Page";

export function generateStaticParams() {
  return SOFTWARE.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const s = getSoftware(slug);
  if (!s) return {};

  return pageMeta({
    title: `${s.h1} | ${SITE.name}`,
    description: s.intro,
    path: `/software/${s.slug}`,
  });
}

export default async function Page({ params }) {
  const { slug } = await params;
  const s = getSoftware(slug);
  if (!s) notFound();

  // The FAQ answers Google shows come from the same array the page renders,
  // so the two cannot drift apart.
  const faqSchema = s.faqs?.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: s.faqs.map(([q, a]) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: { "@type": "Answer", text: a },
        })),
      }
    : null;

  // There is no /solutions landing page - the Solutions menu is a menu only -
  // so the breadcrumb goes straight back to the home page.
  const crumbs = (
    <nav className="crumbs wrap" aria-label="Breadcrumb">
      <Link href="/">Home</Link> <span aria-hidden="true">/</span>{" "}
      <span>{s.name}</span>
    </nav>
  );

  return (
    <>
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <SoftwarePage s={s} crumbs={crumbs} />
    </>
  );
}
