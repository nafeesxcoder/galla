// ===========================================================================
// PRICING PAGE - COMPOSITION
// ---------------------------------------------------------------------------
// This file only sets the order of the sections. All the plans, prices and
// features live in content.js.
// ===========================================================================

import CtaBand from "@/components/CtaBand";
import { CONTENT } from "./content";

import HeroPricing from "./HeroPricing";
import PricingSwitcher from "./PricingSwitcher";
import FrequentlyAskedQuestions from "./FrequentlyAskedQuestions";

export default function PricingPage() {
  const c = CONTENT;

  return (
    <>
      <HeroPricing head={c.head} />
      <PricingSwitcher c={c} />
      <FrequentlyAskedQuestions faqs={c.faqs} />
      <CtaBand />
    </>
  );
}

export const pricingMeta = {
  title: "Pricing - free, Silver and Gold plans",
  description:
    "Start free with no card. Paid plans add multiple companies, extra users, e-way bills and full GST reports. Pay yearly or for three years.",
};

export const pricingFaqs = CONTENT.faqs;
