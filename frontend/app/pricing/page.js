import PricingPage, { pricingMeta, pricingFaqs } from "@/components/pricing/Page";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: pricingMeta.title,
  description: pricingMeta.description,
  path: "/pricing",
});

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: pricingFaqs.map(([q, a]) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <PricingPage />
    </>
  );
}
