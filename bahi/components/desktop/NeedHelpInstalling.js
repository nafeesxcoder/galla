// ===========================================================================
// SECTION 12  -  "Need help installing it?"
// Two buttons and three small badges
// IMAGE: none
// ===========================================================================

import Link from "next/link";
import Reveal from "@/components/Reveal";

export default function NeedHelpInstalling({ help }) {
  return (
    <section className="section">
      <div className="wrap">
        <Reveal>
          <div className="dk-help">
            <h2>{help.h2}</h2>
            <p>{help.lead}</p>
            <div className="btn-row dk-help__btns">
              <Link href={help.cta[1]} className="btn btn--primary">
                {help.cta[0]}
              </Link>
              <Link href={help.cta2[1]} className="btn btn--ghost">
                {help.cta2[0]}
              </Link>
            </div>
            <ul className="dk-help__badges">
              {help.badges.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
