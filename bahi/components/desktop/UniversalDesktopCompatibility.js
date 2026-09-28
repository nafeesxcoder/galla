// ===========================================================================
// SECTION 5  -  "Whatever computer you have, Galla runs on it"
// Two blocks: Works on Windows / Works on Mac
// IMAGE: content.js -> compatibility.blocks[].img
// ===========================================================================

import Link from "next/link";
import Reveal from "@/components/Reveal";
import Shot from "./Shot";

export default function UniversalDesktopCompatibility({ compatibility }) {
  return (
    <section className="section section--wash">
      <div className="wrap">
        <Reveal className="center">
          <span className="eyebrow">{compatibility.eyebrow}</span>
          <h2>{compatibility.h2}</h2>
          <p className="lead">{compatibility.lead}</p>
        </Reveal>
      </div>

      {compatibility.blocks.map((b, i) => {
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
              <ul className="checklist">
                {b.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              {b.cta && (
                <Link href={b.cta[1]} className="btn btn--ghost btn--small dk-cta">
                  {b.cta[0]}
                </Link>
              )}
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
