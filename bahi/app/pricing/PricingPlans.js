"use client";
import { useState } from "react";
import Link from "next/link";

const plans = [
  { name: "Basic", monthly: 0, yearly: 0, note: "Free forever", pts: ["Unlimited invoices", "1 user, 1 device", "Basic reports"] },
  { name: "Silver", monthly: 299, yearly: 2499, featured: true, note: "Most popular", pts: ["Everything in Basic", "3 devices", "GST reports and e-way bills", "WhatsApp reminders"] },
  { name: "Gold", monthly: 499, yearly: 4499, note: "For growing businesses", pts: ["Everything in Silver", "Unlimited devices", "Multiple godowns", "Staff permissions"] },
];

export default function PricingPlans() {
  const [yearly, setYearly] = useState(true);
  return (
    <>
      <div className="toggle" role="group" aria-label="Billing period">
        <button aria-pressed={!yearly} onClick={() => setYearly(false)}>Monthly</button>
        <button aria-pressed={yearly} onClick={() => setYearly(true)}>Yearly (save 30%)</button>
      </div>
      <div className="plans" style={{ textAlign: "left" }}>
        {plans.map((p) => {
          const price = yearly ? p.yearly : p.monthly;
          return (
            <div key={p.name} className={`plan ${p.featured ? "plan--featured" : ""}`}>
              {p.featured && <span className="plan__badge">{p.note}</span>}
              <h3>{p.name}</h3>
              {!p.featured && <p style={{ color: "var(--ink-soft)" }}>{p.note}</p>}
              <div className="plan__price">
                ₹{price.toLocaleString("en-IN")} <small>{price === 0 ? "" : yearly ? "/ year" : "/ month"}</small>
              </div>
              <ul className="checklist">{p.pts.map((x) => <li key={x}>{x}</li>)}</ul>
              <Link href="/mobile-app" className={`btn ${p.featured ? "btn--primary" : "btn--ghost"}`}>
                {price === 0 ? "Start free" : `Choose ${p.name}`}
              </Link>
            </div>
          );
        })}
      </div>
    </>
  );
}
