import SimplePage from "@/components/account/SimplePage";
import LicenceForm from "@/components/account/LicenceForm";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Attach a licence key",
  description: "Already bought Galla elsewhere? Attach your licence key here.",
  path: "/account/license",
});
metadata.robots = { index: false, follow: false };

export default function Page() {
  return (
    <SimplePage
      title="Already have a licence?"
      lead="If you bought Galla through a reseller or a partner, enter the key here to attach it to this account."
    >
      <LicenceForm />
      <p className="ac-note">
        Cannot find your key? It is on the receipt from whoever you bought it from. If
        you still cannot find it, contact us and we will look it up.
      </p>
    </SimplePage>
  );
}
