import LegalPage from "@/components/legal/LegalPage";
import { REFUND } from "@/components/legal/refund";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Refund and Cancellation Policy",
  description: "When you can cancel a Galla plan, when you can ask for a refund, and how long it takes.",
  path: "/refund",
});

export default function Page() {
  return <LegalPage title={REFUND.title} intro={REFUND.intro} sections={REFUND.sections} />;
}
