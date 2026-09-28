import CareersPage, { careersMeta } from "@/components/careers/Page";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: careersMeta.title,
  description: careersMeta.description,
  path: "/careers",
});

export default function Page() {
  return <CareersPage />;
}
