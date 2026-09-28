// ===========================================================================
// ABOUT PAGE - COMPOSITION
// ---------------------------------------------------------------------------
// This file only sets the order of the sections. To drop one, comment out
// its line; to reorder, move the line. All the text lives in content.js.
// ===========================================================================

import CtaBand from "@/components/CtaBand";
import { CONTENT } from "./content";

import HeroAboutGalla from "./HeroAboutGalla";
import TrustedByIndianBusinesses from "./TrustedByIndianBusinesses";
import NationwideCoverage from "./NationwideCoverage";
import YourBusinessJourney from "./YourBusinessJourney";
import RealMultiDeviceExperience from "./RealMultiDeviceExperience";
import WhyBusinessesChooseGalla from "./WhyBusinessesChooseGalla";
import WhyGallaIsTheBest from "./WhyGallaIsTheBest";
import CompleteBillingSolution from "./CompleteBillingSolution";
import HowToSetUpQuickly from "./HowToSetUpQuickly";
import MakingADifference from "./MakingADifference";
import SmartGstBillingForGrowingBusinesses from "./SmartGstBillingForGrowingBusinesses";
import MultiLanguageSupportAcrossIndia from "./MultiLanguageSupportAcrossIndia";
import CoveredInTopPublications from "./CoveredInTopPublications";
import OneBillingSoftwareAcrossIndustries from "./OneBillingSoftwareAcrossIndustries";
import ManageYourBusinessWithOurApp from "./ManageYourBusinessWithOurApp";
import WhoCanUseGalla from "./WhoCanUseGalla";
import FrequentlyAskedQuestions from "./FrequentlyAskedQuestions";

export default function AboutPage() {
  const c = CONTENT;

  return (
    <>
      <HeroAboutGalla hero={c.hero} />
      <TrustedByIndianBusinesses trustStrip={c.trustStrip} />
      <NationwideCoverage nationwide={c.nationwide} />
      <YourBusinessJourney journey={c.journey} />
      <RealMultiDeviceExperience multiDevice={c.multiDevice} />
      <WhyBusinessesChooseGalla whyChoose={c.whyChoose} />
      <WhyGallaIsTheBest best={c.best} />
      <CompleteBillingSolution complete={c.complete} />
      <HowToSetUpQuickly setup={c.setup} />
      <MakingADifference difference={c.difference} />
      <SmartGstBillingForGrowingBusinesses growth={c.growth} />
      <MultiLanguageSupportAcrossIndia languages={c.languages} />
      <CoveredInTopPublications press={c.press} />
      <OneBillingSoftwareAcrossIndustries everyType={c.everyType} />
      <ManageYourBusinessWithOurApp app={c.app} />
      <WhoCanUseGalla whoCanUse={c.whoCanUse} />
      <FrequentlyAskedQuestions faqs={c.faqs} />
      <CtaBand />
    </>
  );
}

export const aboutMeta = {
  title: "About Galla - GST billing software for Indian small businesses",
  description: CONTENT.hero.lead,
};

export const aboutFaqs = CONTENT.faqs;
