"use client";

import { Suspense } from "react";
import Shell from "../../../components/app/Shell";
import Billing from "../../../components/app/billing/Billing";
import { BILLING } from "../../../components/app/content";

export default function BillingPage() {
  // flush, because the billing screen runs its own two-column layout right
  // to the edges rather than sitting inside the usual page padding.
  return (
    <Shell title={BILLING.title} flush>
      {/* The screen reads ?from= when an estimate is being turned into a
          bill, and Next wants anything using the search params inside a
          Suspense boundary. */}
      <Suspense fallback={null}>
        <Billing />
      </Suspense>
    </Shell>
  );
}
