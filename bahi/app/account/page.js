import AccountPage from "@/components/account/AccountPage";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "My Account",
  description: "Your Galla plan, downloads and invoices.",
  path: "/account",
});

// Account pages should never be indexed by search engines
metadata.robots = { index: false, follow: false };

export default function Page() {
  return <AccountPage />;
}
