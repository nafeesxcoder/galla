// ===========================================================================
// SECTION 4  -  "Key PC Billing Features for Indian Small Businesses"
// Tabs: Tax Invoicing / Quick Sale Entry / Customize Your Bill / Payment Modes
// IMAGE: content.js -> keyFeatures.tabs[].img  (one per tab)
// ===========================================================================

"use client";
import { useState } from "react";
import Reveal from "@/components/Reveal";
import Shot from "./Shot";

export default function KeyPcBillingFeatures({ keyFeatures }) {
  const [active, setActive] = useState(0);
  const t = keyFeatures.tabs[active];

  return (
    <section className="section">
      <div className="wrap">
        <Reveal className="center">
          <span className="eyebrow">{keyFeatures.eyebrow}</span>
          <h2>{keyFeatures.h2}</h2>
          <p className="lead">{keyFeatures.lead}</p>
        </Reveal>

        <div className="dk-tabs" role="tablist" aria-label={keyFeatures.h2}>
          {keyFeatures.tabs.map((x, i) => (
            <button
              key={x.tab}
              type="button"
              role="tab"
              aria-selected={i === active}
              className={`dk-tab ${i === active ? "is-on" : ""}`}
              onClick={() => setActive(i)}
            >
              {x.tab}
            </button>
          ))}
        </div>

        <div className="dk-panel artsplit">
          <div>
            <h3>{t.h3}</h3>
            <p>{t.p}</p>
            <ul className="checklist">
              {t.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
          <div className="artsplit__art">
            <Shot src={t.img} art={t.art} label={t.imgLabel} alt={t.h3} />
          </div>
        </div>
      </div>
    </section>
  );
}
