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
import PricingRail from "@/components/account/PricingRail";
import { useAuth } from "@/components/account/AuthProvider";

export default function PricingSwitcher({ c }) {
  // The two-column grid is only applied when there is actually a rail to put
  // in the second column. Left on, a visitor who is not signed in would get
  // 300px of empty space beside the plans - on the one page that has to sell.
  const { signedIn, ready } = useAuth();
  const rail = ready && signedIn;

  const [device, setDevice] = useState(c.devices[0].id);
  const [term, setTerm] = useState(c.terms[0].id);
  const [compare, setCompare] = useState(false);
  const top = useRef(null);

  // The server stores a term in MONTHS, the dropdown offers it in years.
  // Converted here, once, rather than in both views.
  const years = c.terms.find((t) => t.id === term)?.years ?? 1;
  const months = years * 12;

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

        {/* The plans on the left, the account rail on the right. The rail
            renders nothing at all for a visitor who is not signed in, so a
            stranger sees the page exactly as before - which is the point:
            this is the page that sells, and a sidebar about somebody else's
            licences would only be in the way. */}
        <div className={rail ? "ac-railgrid" : undefined}>
          <div>
            {/* the key makes the entrance animation replay on every switch */}
            <div className="pr-view" key={compare ? "compare" : "plans"}>
              {compare ? (
                <CompareAllFeatures
                  plans={c.plans}
                  features={c.features}
                  device={device}
                  months={months}
                  title={c.featuresTitle}
                />
              ) : (
                <PlanCards
                  plans={c.plans}
                  features={c.features}
                  device={device}
                  months={months}
                  years={years}
                />
              )}
            </div>
          </div>

          <PricingRail />
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
