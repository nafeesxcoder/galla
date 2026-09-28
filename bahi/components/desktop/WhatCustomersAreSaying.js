// ===========================================================================
// SECTION 8  -  "What People Say About the Galla PC App"
// ---------------------------------------------------------------------------
// NOTE: every review here is a PLACEHOLDER. Do not put anyone's name or
// words here until you have a real review. To hide the section, comment
// out its line in Page.js.
// IMAGE: content.js -> reviews.items[].img
// ===========================================================================

import Reveal from "@/components/Reveal";
import Shot from "./Shot";

export default function WhatCustomersAreSaying({ reviews }) {
  return (
    <section className="section">
      <div className="wrap">
        <Reveal className="center">
          <span className="eyebrow">{reviews.eyebrow}</span>
          <h2>{reviews.h2}</h2>
          <p className="lead">{reviews.lead}</p>
        </Reveal>

        <div className="dk-reviews">
          {reviews.items.map((r, i) => (
            <Reveal key={r.name} delay={i * 90}>
              <article className="dk-review">
                <Shot
                  src={r.img}
                  art="avatar"
                  initial={r.initial}
                  label={r.imgLabel}
                  alt={r.name}
                  className="dk-review__avatar"
                />
                <blockquote>{r.quote}</blockquote>
                <p className="dk-review__by">
                  <strong>{r.name}</strong>
                  <span>{r.role}</span>
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
