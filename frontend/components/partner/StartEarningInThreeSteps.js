// ===========================================================================
// SECTION 5  -  "Start Earning in 3 Simple Steps"
// 01 Register  /  02 Refer  /  03 Earn
// IMAGE: none
// ===========================================================================

import Link from "next/link";
import Reveal from "@/components/Reveal";

export default function StartEarningInThreeSteps({ steps }) {
  return (
    <section className="section section--wash">
      <div className="wrap">
        <Reveal className="center">
          <span className="eyebrow">{steps.eyebrow}</span>
          <h2>{steps.h2}</h2>
          <p className="lead">{steps.lead}</p>
        </Reveal>

        <ol className="pt-steps">
          {steps.items.map(([t, d], i) => (
            <Reveal as="li" key={t} delay={i * 110} className="pt-step">
              <span className="pt-step__no">{String(i + 1).padStart(2, "0")}</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </Reveal>
          ))}
        </ol>

        <div className="center">
          <Link href={steps.cta[1]} className="btn btn--primary">
            {steps.cta[0]}
          </Link>
        </div>
      </div>
    </section>
  );
}
