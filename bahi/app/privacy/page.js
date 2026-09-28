import LegalPage from "@/components/legal/LegalPage";
import { PRIVACY } from "@/components/legal/privacy";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Privacy Policy",
  description: "What data Galla collects, why we collect it and what you can do about it.",
  path: "/privacy",
});

export default function Page() {
  return <LegalPage title={PRIVACY.title} intro={PRIVACY.intro} sections={PRIVACY.sections} />;
}
