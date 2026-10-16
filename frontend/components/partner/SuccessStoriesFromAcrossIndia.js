// ===========================================================================
// SECTION 6  -  "Success Stories from Across India"
// ---------------------------------------------------------------------------
// This is the design from the screenshot:
//   - a bar of four region tabs (North / South / West / East)
//   - each card is split in two: a coloured left panel (photo, name, role
//     and the earnings badge) and a white right panel with the quote
//   - switching tabs slides the cards back in
//
// COLOUR: the left panel uses the site green (--ledger). The screenshot used
// red. To go red, change  --pt-accent  at the top of partner.css.
//
// TODO: everything here is a placeholder. Only use a real partner's name,
//       photo and earnings once you have their written permission.
// IMAGE: content.js -> stories.items[region][].img
// ===========================================================================

"use client";
import { useState } from "react";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import Shot from "./Shot";

export default function SuccessStoriesFromAcrossIndia({ stories }) {
  const [region, setRegion] = useState(stories.regions[0]);
  const list = stories.items[region] ?? [];

  return (
    <section className="section">
      <div className="wrap">
        <Reveal className="center">
          <span className="eyebrow pt-eyebrow">{stories.eyebrow}</span>
          <h2 className="pt-underline">{stories.h2}</h2>
          <p className="lead">{stories.lead}</p>
        </Reveal>

        {/* region tabs */}
        <div className="pt-regions" role="tablist" aria-label="Region">
          {stories.regions.map((r) => (
            <button
              key={r}
              type="button"
              role="tab"
              aria-selected={r === region}
              className={`pt-region ${r === region ? "is-on" : ""}`}
              onClick={() => setRegion(r)}
            >
              {r}
            </button>
          ))}
        </div>

        {/* the region in the key makes the entrance animation replay
            every time the tab changes */}
        <div className="pt-stories" key={region}>
          {list.map((s, i) => (
            <article className="pt-story" key={`${region}-${i}`} style={{ animationDelay: `${i * 110}ms` }}>
              <div className="pt-story__side">
                <Shot
                  src={s.img}
                  art="avatar"
                  initial={s.initial}
                  label={s.imgLabel}
                  alt={s.name}
                  className="pt-story__pic"
                />
                <p className="pt-story__name">{s.name}</p>
                <p className="pt-story__role">{s.role}</p>
                <span className="pt-story__amount">{s.amount}</span>
              </div>
              <div className="pt-story__body">
                <p>{s.quote}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="center pt-stories__cta">
          <Link href={stories.cta[1]} className="btn btn--primary">
            {stories.cta[0]}
          </Link>
        </div>
      </div>
    </section>
  );
}
