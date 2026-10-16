// ===========================================================================
// PLANS VIEW  -  the two plan cards (Silver and Gold)
// ---------------------------------------------------------------------------
// Each card shows: icon and name, the price, the "only ₹X per month" line,
// the CTA, then the short feature list. The plan with  popular: true  in
// content.js gets the tinted background, the accent border and the ribbon.
//
// THE PRICES COME FROM THE SERVER.
// They used to be typed into content.js while the database held a zero -
// two lists, both claiming to be right. Now there is one, and this reads it.
// Everything else on the card - names, taglines, feature rows - is still
// content.js, because that is copy, not a promise about money.
// ===========================================================================

"use client";
import Link from "next/link";
import MenuIcon from "@/components/MenuIcon";
import Mark from "./Mark";
import { rupees, perMonth } from "./price";
import { usePrices } from "./usePrices";

export default function PlanCards({ plans, features, device, months, years }) {
  const cardRows = features.filter((f) => f.card);
  const { priceOf, loading, failed } = usePrices();

  return (
    <div className="pr-plans">
      {plans.map((plan, i) => {
        const now = priceOf(plan.id, device, months);

        return (
          <article
            key={plan.id}
            className={`pr-plan ${plan.popular ? "is-popular" : ""}`}
            style={{ animationDelay: `${i * 110}ms` }}
          >
            {plan.popular && <span className="pr-plan__ribbon">{plan.popularLabel}</span>}

            <header className="pr-plan__head">
              <span className="pr-plan__icon">
                <MenuIcon name={plan.icon} />
              </span>
              <div>
                <h3>{plan.name}</h3>
                <p>{plan.tagline}</p>
              </div>
            </header>

            {/* No number until the real one has arrived. A placeholder figure
                shown for half a second is a figure somebody screenshots. */}
            {now === null ? (
              <>
                <p className="pr-plan__price pr-plan__price--waiting">
                  <strong>{failed ? "Ask us" : " "}</strong>
                </p>
                <p className="pr-plan__per">
                  {failed ? "We could not load prices just now." : loading ? "Loading price..." : "Not sold in this combination."}
                </p>
              </>
            ) : (
              <>
                <p className="pr-plan__price">
                  <strong>{rupees(now)}</strong>
                </p>
                <p className="pr-plan__per">Only {perMonth(now, years)} per month</p>
              </>
            )}

            <Link
              href={failed ? "/contact" : "/account/offline-payment"}
              className={`btn ${plan.popular ? "btn--primary" : "btn--ghost"} pr-plan__cta`}
            >
              {plan.cta}
            </Link>

            <ul className="pr-plan__list">
              {cardRows.map((f) => {
                const v = f[plan.id];
                const off = v === false;
                return (
                  <li key={f.name} className={off ? "is-off" : undefined}>
                    <Mark value={v === true || v === false ? v : true} />
                    <span>
                      {f.name}
                      {typeof v === "string" && <em> ({v})</em>}
                    </span>
                  </li>
                );
              })}
            </ul>
          </article>
        );
      })}
    </div>
  );
}
