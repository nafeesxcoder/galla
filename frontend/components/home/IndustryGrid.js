import Link from "next/link";
import Reveal from "@/components/Reveal";
import IndustryIcon from "@/components/industry/IndustryIcon";
import { INDUSTRIES } from "@/lib/industries";

export default function IndustryGrid() {
  return (
    <section className="section">
      <div className="wrap">
        <Reveal>
          <span className="eyebrow">For every business type</span>
          <h2>One billing app, built for your kind of shop</h2>
          <p className="lead">
            Each business bills a little differently. Pick yours and the
            invoice, stock and reports are already set up the way you work.
          </p>
        </Reveal>

        <div className="igrid">
          {INDUSTRIES.map((x, i) => (
            <Reveal key={x.slug} delay={(i % 4) * 70}>
              <Link href={`/billing-software/${x.slug}`} className="icard">
                <span className="icard__icon">
                  <IndustryIcon name={x.icon} />
                </span>
                <h3>{x.name}</h3>
                <p>{x.tagline}</p>
                <span className="icard__go">Learn more →</span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
