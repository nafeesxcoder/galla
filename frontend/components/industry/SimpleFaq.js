"use client";
import { useState } from "react";
import Reveal from "@/components/Reveal";

const VISIBLE = 6;

export default function SimpleFaq({ faqs, title }) {
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? faqs : faqs.slice(0, VISIBLE);

  return (
    <section className="section">
      <div className="wrap">
        <Reveal className="center">
          <span className="eyebrow">Common questions</span>
          <h2>{title}</h2>
        </Reveal>

        <div className="faq faq--home">
          {shown.map(([q, a]) => (
            <details key={q} name="ind-faq">
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>

        {faqs.length > VISIBLE && (
          <div className="faq__actions">
            <button
              type="button"
              className="btn btn--ghost"
              aria-expanded={showAll}
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? "View less FAQs" : `View all ${faqs.length} FAQs`}
              <span className={`faq__caret ${showAll ? "up" : ""}`} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
