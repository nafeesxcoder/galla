import AboutPage, { aboutMeta, aboutFaqs } from "@/components/about/Page";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: aboutMeta.title,
  description: aboutMeta.description,
  path: "/about",
});

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: aboutFaqs.map(([q, a]) => ({
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
      <AboutPage />
    </>
  );
}
