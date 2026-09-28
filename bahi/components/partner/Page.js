// ===========================================================================
// PARTNER PAGE - COMPOSITION
// ---------------------------------------------------------------------------
// This file only sets the order of the sections. To drop one, comment out
// its line. All the text lives in content.js.
// ===========================================================================

import CtaBand from "@/components/CtaBand";
import { CONTENT } from "./content";

import HeroBecomeAGallaPartner from "./HeroBecomeAGallaPartner";
import WhichKindOfPartnerAreYou from "./WhichKindOfPartnerAreYou";
import AreYouACaOrTaxProfessional from "./AreYouACaOrTaxProfessional";
import WhyYourClientsWillLoveGalla from "./WhyYourClientsWillLoveGalla";
import StartEarningInThreeSteps from "./StartEarningInThreeSteps";
import SuccessStoriesFromAcrossIndia from "./SuccessStoriesFromAcrossIndia";
import WhyBecomeAGallaPartner from "./WhyBecomeAGallaPartner";
import EarningsCalculator from "./EarningsCalculator";
import FrequentlyAskedQuestions from "./FrequentlyAskedQuestions";

export default function PartnerPage() {
  const c = CONTENT;

  return (
    <>
      <HeroBecomeAGallaPartner hero={c.hero} />
      <WhichKindOfPartnerAreYou types={c.types} />
      <AreYouACaOrTaxProfessional ca={c.ca} />
      <WhyYourClientsWillLoveGalla product={c.product} />
      <StartEarningInThreeSteps steps={c.steps} />
      {/* Comment this line out until you have real partner stories */}
      <SuccessStoriesFromAcrossIndia stories={c.stories} />
      <WhyBecomeAGallaPartner why={c.why} />
      <EarningsCalculator calc={c.calc} />
      <FrequentlyAskedQuestions faqs={c.faqs} />
      <CtaBand />
    </>
  );
}

export const partnerMeta = {
  title: "Become a Galla Partner - referral program for CAs and resellers",
  description: CONTENT.hero.lead,
};

export const partnerFaqs = CONTENT.faqs;
