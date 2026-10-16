// ===========================================================================
// The price list, from the server
// ---------------------------------------------------------------------------
// There used to be two price lists: real numbers typed into content.js, and a
// zero sitting in the database. Both claimed to be right and they already
// disagreed. This reads the one on the server, which is now the only one.
//
// WHILE IT LOADS, AND IF IT FAILS
// -------------------------------
// No number is shown at all - not a zero, not the old hardcoded figure.
// A price is a promise, and a wrong one shown for half a second is a wrong
// one somebody screenshots. The card shows a quiet placeholder instead, and
// if the server cannot be reached it says so and offers the contact page.
// ===========================================================================

"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

// Shared across the plan cards and the compare table, which are on the same
// page and would otherwise each ask.
let cached = null;
let inFlight = null;

function fetchPlans() {
  if (cached) return Promise.resolve(cached);
  if (inFlight) return inFlight;
  inFlight = api
    .get("/api/plans", { auth: false })
    .then((rows) => {
      cached = rows ?? [];
      return cached;
    })
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

export function usePrices() {
  const [plans, setPlans] = useState(cached);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchPlans()
      .then((rows) => alive && setPlans(rows))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  /**
   * The price for one plan, one device and one term, in rupees.
   * Returns null when it is not known yet or not sold - never 0, which a
   * screen would happily render as "₹0".
   */
  function priceOf(code, device, months) {
    if (!plans) return null;
    const plan = plans.find((p) => p.code === code);
    if (!plan) return null;
    const row = (plan.prices ?? []).find(
      (r) => r.device === device && Number(r.periodMonths) === Number(months)
    );
    return row ? Number(row.price) : null;
  }

  return { plans, priceOf, loading: !plans && !failed, failed };
}
