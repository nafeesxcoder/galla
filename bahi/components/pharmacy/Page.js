import Link from "next/link";
import CtaBand from "@/components/CtaBand";
import { CONTENT } from "./content";
import Hero from "./Hero";
import Intro from "./Intro";
import WhoFor from "./WhoFor";
import Features from "./Features";
import Steps from "./Steps";
import Compare from "./Compare";
import Extras from "./Extras";
import Trust from "./Trust";
import Related from "./Related";
import Faq from "./Faq";

// Pharmacy page ke saare section. Order badalna ho to yahan lines upar-neeche kar do.
export default function PharmacyPage({ ind, crumbs, otherTypes }) {
  const c = CONTENT;

  return (
    <>
      {crumbs}
      <Hero hero={c.hero} />
      <Intro intro={c.intro} />
      <WhoFor whoFor={c.whoFor} />
      <Features features={c.features} />
      <Steps steps={c.steps} />
      <Compare compare={c.compare} />
      <Extras extras={c.extras} />
      <Trust trust={c.trust} />
      <Related related={c.related} />
      <Faq faqs={c.faqs} title={`Questions about ${ind.name.toLowerCase()} billing`} />
      {otherTypes}
      <CtaBand />
    </>
  );
}

// Page ka metadata aur FAQ schema yahin se aata hai
export const pharmacyMeta = {
  title: CONTENT.hero.h1,
  description: CONTENT.hero.lead,
};

export const pharmacyFaqs = CONTENT.faqs;
