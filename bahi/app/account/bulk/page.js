import SimplePage from "@/components/account/SimplePage";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Buy multiple licences",
  description: "Buying Galla for several shops, branches or clients.",
  path: "/account/bulk",
});
metadata.robots = { index: false, follow: false };

export default function Page() {
  return (
    <SimplePage
      title="Buy multiple licences"
      lead="Running several shops, or buying on behalf of your clients? Talk to us rather than paying one by one."
    >
      <section className="ac-card">
        <h2>Who this is for</h2>
        <ul className="ac-bullets">
          <li>A business with more than one branch or counter.</li>
          <li>A CA or consultant buying for several client businesses.</li>
          <li>A reseller or distributor selling Galla on.</li>
        </ul>
      </section>

      <section className="ac-card">
        <h2>What you get</h2>
        <ul className="ac-bullets">
          <li>One invoice instead of many.</li>
          <li>Licence keys you can hand out yourself.</li>
          {/* TODO: only promise a bulk discount once you have decided on one */}
          <li>A single point of contact for support.</li>
        </ul>
        <div className="btn-row">
          <Link href="/contact" className="btn btn--primary">
            Talk to us
          </Link>
          <Link href="/partner" className="btn btn--ghost">
            See the partner programme
          </Link>
        </div>
      </section>
    </SimplePage>
  );
}
