// ===========================================================================
// The part of the page that holds all the state
// ---------------------------------------------------------------------------
// It keeps three things:
//   - which device option is picked   (Desktop + Mobile / Mobile / Desktop)
//   - which term is picked            (1 Year / 3 Years)
//   - which view is showing           (plans / compare)
//
// The floating button at the bottom switches between the two views:
//   plans view   -> "Compare All Features"
//   compare view -> "Back To Plans"
// ===========================================================================

"use client";
import { useRef, useState } from "react";
import Dropdown from "./Dropdown";
import PlanCards from "./PlanCards";
import CompareAllFeatures from "./CompareAllFeatures";

export default function PricingSwitcher({ c }) {
  const [device, setDevice] = useState(c.devices[0].id);
  const [term, setTerm] = useState(c.terms[0].id);
  const [compare, setCompare] = useState(false);
  const top = useRef(null);

  const priceKey = `${device}-${term}`;
  const years = c.terms.find((t) => t.id === term)?.years ?? 1;

  function toggle() {
    setCompare((v) => !v);
    // put the person back at the top of the section after the view swaps
    requestAnimationFrame(() => {
      top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <section className="section pr-main" ref={top}>
      <div className="wrap">
        <div className="pr-controls">
          <Dropdown options={c.devices} value={device} onChange={setDevice} label="Device" />
          <Dropdown options={c.terms} value={term} onChange={setTerm} label="Plan length" />
        </div>

        {/* the key makes the entrance animation replay on every switch */}
        <div className="pr-view" key={compare ? "compare" : "plans"}>
          {compare ? (
            <CompareAllFeatures
              plans={c.plans}
              features={c.features}
              priceKey={priceKey}
              title={c.featuresTitle}
            />
          ) : (
            <PlanCards plans={c.plans} features={c.features} priceKey={priceKey} years={years} />
          )}
        </div>

        <p className="pr-foot">{c.foot}</p>
      </div>

      {/* floating button, fixed to the bottom of the screen */}
      <div className="pr-float">
        <button type="button" className="pr-float__btn" onClick={toggle}>
          <span className={`pr-float__arrow ${compare ? "up" : "down"}`} aria-hidden="true" />
          {compare ? c.backCta : c.compareCta}
        </button>
      </div>
    </section>
  );
}
