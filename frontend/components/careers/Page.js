// ===========================================================================
// CAREERS PAGE - COMPOSITION
// ---------------------------------------------------------------------------
// This file only sets the order of the sections. All the text and the job
// openings live in content.js.
// ===========================================================================

import CtaBand from "@/components/CtaBand";
import { CONTENT } from "./content";

import HeroWorkAtGalla from "./HeroWorkAtGalla";
import WhyJoinGalla from "./WhyJoinGalla";
import WhatWeValue from "./WhatWeValue";
import OpenRoles from "./OpenRoles";
import HiringProcess from "./HiringProcess";
import BenefitsAndPerks from "./BenefitsAndPerks";
import GeneralApplication from "./GeneralApplication";

export default function CareersPage() {
  const c = CONTENT;

  return (
    <>
      <HeroWorkAtGalla hero={c.hero} />
      <WhyJoinGalla why={c.why} />
      <WhatWeValue values={c.values} />
      <OpenRoles roles={c.roles} />
      <HiringProcess process={c.process} />
      <BenefitsAndPerks perks={c.perks} />
      <GeneralApplication apply={c.apply} />
      <CtaBand />
    </>
  );
}

export const careersMeta = {
  title: "Careers - build software for Indian shops",
  description:
    "Open roles at myGallaBook. Work on billing, inventory and GST software used by small businesses across India. Remote and Noida.",
};
