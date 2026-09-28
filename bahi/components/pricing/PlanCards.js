// ===========================================================================
// PLANS VIEW  -  the two plan cards (Silver and Gold)
// ---------------------------------------------------------------------------
// Each card shows: icon and name, the struck-out MRP with the current price,
// the "only ₹X per month" line, the CTA, then the short feature list.
// The plan with  popular: true  in content.js gets the tinted background,
// the left accent border and the ribbon in the corner.
// ===========================================================================

import MenuIcon from "@/components/MenuIcon";
import Mark from "./Mark";
import { rupees, perMonth } from "./price";

export default function PlanCards({ plans, features, priceKey, years }) {
  const cardRows = features.filter((f) => f.card);

  return (
    <div className="pr-plans">
      {plans.map((plan, i) => {
        const [mrp, now] = plan.price[priceKey] ?? [0, 0];

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

            <p className="pr-plan__price">
              {mrp > now && <s>{rupees(mrp)}</s>}
              <strong>{rupees(now)}</strong>
            </p>
            <p className="pr-plan__per">Only {perMonth(now, years)} per month</p>

            <button type="button" className={`btn ${plan.popular ? "btn--primary" : "btn--ghost"} pr-plan__cta`}>
              {plan.cta}
            </button>

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
