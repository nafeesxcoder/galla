// ===========================================================================
// COMPARE VIEW  -  the full feature table
// ---------------------------------------------------------------------------
// The compact plan headers stay stuck to the top while the table scrolls,
// exactly as in the screenshot. Every feature from content.js appears here,
// not only the ones marked  card: true.
// ===========================================================================

import MenuIcon from "@/components/MenuIcon";
import Mark from "./Mark";
import Info from "./Info";
import { rupees } from "./price";

export default function CompareAllFeatures({ plans, features, priceKey, title }) {
  return (
    <div className="pr-compare">
      {/* sticky plan headers */}
      <div className="pr-sticky">
        <div className="pr-sticky__row">
          <div className="pr-sticky__spacer" />
          {plans.map((plan) => {
            const [, now] = plan.price[priceKey] ?? [0, 0];
            return (
              <div key={plan.id} className={`pr-sticky__plan ${plan.popular ? "is-popular" : ""}`}>
                <p className="pr-sticky__name">
                  <span className="pr-plan__icon pr-plan__icon--sm">
                    <MenuIcon name={plan.icon} />
                  </span>
                  {plan.name}
                </p>
                <p className="pr-sticky__price">{rupees(now)}</p>
                <button type="button" className={`btn btn--small ${plan.popular ? "btn--primary" : "btn--ghost"}`}>
                  {plan.cta}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <h3 className="pr-compare__title">{title}</h3>

      <div className="pr-table">
        {features.map((f, i) => (
          <div className="pr-row" key={f.name} style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }}>
            <div className="pr-row__name">
              {f.name}
              <Info text={f.info} />
            </div>
            {plans.map((plan) => (
              <div className={`pr-row__cell ${plan.popular ? "is-popular" : ""}`} key={plan.id}>
                <Mark value={f[plan.id]} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
