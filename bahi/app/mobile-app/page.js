import { pageMeta } from "@/lib/seo";
import MobileApp from "./MobileApp";

export const metadata = pageMeta({
  title: "Try mobile app",
  description:
    "Billing, stock and payments from your phone. Get the Android or iPhone app and start billing in minutes.",
  path: "/mobile-app",
});

export default function Page() {
  return <MobileApp />;
}

