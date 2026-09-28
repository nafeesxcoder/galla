import ContactPage, { contactMeta } from "@/components/contact/Page";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: contactMeta.title,
  description: contactMeta.description,
  path: "/contact",
});

export default function Page() {
  return <ContactPage />;
}
