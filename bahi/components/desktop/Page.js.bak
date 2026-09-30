// ===========================================================================
// DESKTOP PAGE - COMPOSITION
// ---------------------------------------------------------------------------
// This file only sets the order of the sections. To drop one, comment out
// its line; to reorder, move the line. All the text lives in content.js.
// ===========================================================================

import CtaBand from "@/components/CtaBand";
import { CONTENT } from "./content";

import HeroBillingSoftwareForPc from "./HeroBillingSoftwareForPc";
import TrustStatsStrip from "./TrustStatsStrip";
import WhyGallaPcBillingIsBest from "./WhyGallaPcBillingIsBest";
import KeyPcBillingFeatures from "./KeyPcBillingFeatures";
import UniversalDesktopCompatibility from "./UniversalDesktopCompatibility";
import DesktopAppPricing from "./DesktopAppPricing";
import EasyManagementOfAllBillingProcesses from "./EasyManagementOfAllBillingProcesses";
import WhatCustomersAreSaying from "./WhatCustomersAreSaying";
import WatchHowToCreateBills from "./WatchHowToCreateBills";
import WhyGallaInvoicingIsPerfect from "./WhyGallaInvoicingIsPerfect";
import MoreThanJustBilling from "./MoreThanJustBilling";
import NeedHelpInstalling from "./NeedHelpInstalling";
import FrequentlyAskedQuestions from "./FrequentlyAskedQuestions";

export default function DesktopPage() {
  const c = CONTENT;

  return (
    <>
      <HeroBillingSoftwareForPc hero={c.hero} />
      <TrustStatsStrip stats={c.stats} />
      <WhyGallaPcBillingIsBest compare={c.compare} />
      <KeyPcBillingFeatures keyFeatures={c.keyFeatures} />
      <UniversalDesktopCompatibility compatibility={c.compatibility} />
      <DesktopAppPricing pricing={c.pricing} />
      <EasyManagementOfAllBillingProcesses manage={c.manage} />
      {/* Comment this line out until you have real reviews */}
      <WhatCustomersAreSaying reviews={c.reviews} />
      <WatchHowToCreateBills demo={c.demo} />
      <WhyGallaInvoicingIsPerfect perfect={c.perfect} />
      <MoreThanJustBilling more={c.more} />
      <NeedHelpInstalling help={c.help} />
      <FrequentlyAskedQuestions faqs={c.faqs} />
      <CtaBand />
    </>
  );
}

export const desktopMeta = {
  title: "Billing software for PC - Galla desktop app for Windows and Mac",
  description: CONTENT.hero.lead,
};

export const desktopFaqs = CONTENT.faqs;
