import LegalPage from "@/components/legal/LegalPage";
import { TERMS } from "@/components/legal/terms";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Terms and Conditions",
  description: "The terms that apply when you use Galla billing software.",
  path: "/terms",
});

export default function Page() {
  return <LegalPage title={TERMS.title} intro={TERMS.intro} sections={TERMS.sections} />;
}
