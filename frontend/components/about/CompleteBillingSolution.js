// ===========================================================================
// SECTION 8  -  "Complete Billing Solution for Better Business Management"
// 4 alternating blocks: GST Billing / Inventory / POS / Reports
// IMAGE: content.js -> complete.blocks[].img  (one screenshot per block)
// ===========================================================================

import Link from "next/link";
import Reveal from "@/components/Reveal";
import Shot from "./Shot";

export default function CompleteBillingSolution({ complete }) {
  return (
    <section className="section section--wash">
      <div className="wrap">
        <Reveal className="center">
          <span className="eyebrow">{complete.eyebrow}</span>
          <h2>{complete.h2}</h2>
          <p className="lead">{complete.lead}</p>
        </Reveal>
      </div>

      {complete.blocks.map((b, i) => {
        const flip = i % 2 === 1;
        return (
          <div className={`wrap artsplit featblock ${flip ? "artsplit--flip" : ""}`} key={b.h3}>
            {flip && (
              <Reveal className="artsplit__art">
                <Shot src={b.img} art={b.art} label={b.imgLabel} alt={b.h3} />
              </Reveal>
            )}

            <Reveal delay={flip ? 120 : 0}>
              <h3 className="featblock__h">{b.h3}</h3>
              <p>{b.p}</p>
              <Link href={b.link[1]} className="ab-link">
                {b.link[0]} <span aria-hidden="true">&rarr;</span>
              </Link>
            </Reveal>

            {!flip && (
              <Reveal className="artsplit__art" delay={150}>
                <Shot src={b.img} art={b.art} label={b.imgLabel} alt={b.h3} />
              </Reveal>
            )}
          </div>
        );
      })}
    </section>
  );
}
