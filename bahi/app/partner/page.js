import PartnerPage, { partnerMeta, partnerFaqs } from "@/components/partner/Page";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: partnerMeta.title,
  description: partnerMeta.description,
  path: "/partner",
});

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: partnerFaqs.map(([q, a]) => ({
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
      <PartnerPage />
    </>
  );
}
