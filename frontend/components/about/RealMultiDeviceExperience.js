// ===========================================================================
// SECTION 5  -  "The Real Multi-Device Experience"
// IMAGE: content.js -> multiDevice.img  (the laptop + phone sync drawing)
// ===========================================================================

import Reveal from "@/components/Reveal";
import Shot from "./Shot";

export default function RealMultiDeviceExperience({ multiDevice }) {
  return (
    <section className="section">
      <div className="wrap artsplit artsplit--flip">
        <Reveal className="artsplit__art">
          <Shot src={multiDevice.img} art={multiDevice.art} label={multiDevice.imgLabel} alt={multiDevice.h2} />
        </Reveal>

        <Reveal delay={140}>
          <span className="eyebrow">{multiDevice.eyebrow}</span>
          <h2>{multiDevice.h2}</h2>
          <p className="lead">{multiDevice.lead}</p>

          <div className="ab-ministats">
            {multiDevice.stats.map(([n, l]) => (
              <div key={l} className="ab-stat">
                <strong>{n}</strong>
                <span>{l}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
