// ===========================================================================
// CONTACT PAGE - COMPOSITION
// ---------------------------------------------------------------------------
// This file only sets the order of the sections. All the text and the
// contact details live in content.js.
// ===========================================================================

import { CONTENT } from "./content";
import HeroContactUs from "./HeroContactUs";
import ContactDetails from "./ContactDetails";
import GetInTouchForm from "./GetInTouchForm";

export default function ContactPage() {
  const c = CONTENT;

  return (
    <>
      <HeroContactUs hero={c.hero} />

      <section className="section ct-main">
        <div className="wrap ct-grid">
          <ContactDetails details={c.details} />
          <GetInTouchForm form={c.form} />
        </div>
      </section>
    </>
  );
}

export const contactMeta = {
  title: "Contact us",
  description:
    "Questions about billing, GST or your plan? Call, WhatsApp or write to us. Support in English and Hindi, nine to nine, Monday to Saturday.",
};
