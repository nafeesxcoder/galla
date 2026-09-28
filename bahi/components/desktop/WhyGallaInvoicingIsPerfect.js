// ===========================================================================
// SECTION 10  -  "Why Galla Invoicing Software for PC Fits Small Businesses"
// Side tabs: Direct Print / Reports / Custom Fields / Sync / WhatsApp /
//            Cash and Bank / Stock / Orders
// IMAGE: content.js -> perfect.tabs[].img
// ===========================================================================

"use client";
import { useState } from "react";
import Reveal from "@/components/Reveal";
import Shot from "./Shot";

export default function WhyGallaInvoicingIsPerfect({ perfect }) {
  const [active, setActive] = useState(0);
  const t = perfect.tabs[active];

  return (
    <section className="section">
      <div className="wrap">
        <Reveal className="center">
          <span className="eyebrow">{perfect.eyebrow}</span>
          <h2>{perfect.h2}</h2>
          <p className="lead">{perfect.lead}</p>
        </Reveal>

        <div className="dk-side">
          <div className="dk-side__list" role="tablist" aria-label={perfect.h2}>
            {perfect.tabs.map((x, i) => (
              <button
                key={x.tab}
                type="button"
                role="tab"
                aria-selected={i === active}
                className={`dk-side__btn ${i === active ? "is-on" : ""}`}
                onClick={() => setActive(i)}
              >
                {x.tab}
              </button>
            ))}
          </div>

          <div className="dk-side__body">
            <h3>{t.h3}</h3>
            <p>{t.p}</p>
            <Shot src={t.img} art={t.art} label={t.imgLabel} alt={t.h3} />
          </div>
        </div>
      </div>
    </section>
  );
}
