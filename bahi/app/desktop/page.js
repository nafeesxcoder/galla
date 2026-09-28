import DesktopPage, { desktopMeta, desktopFaqs } from "@/components/desktop/Page";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: desktopMeta.title,
  description: desktopMeta.description,
  path: "/desktop",
});

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: desktopFaqs.map(([q, a]) => ({
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
      <DesktopPage />
    </>
  );
}
