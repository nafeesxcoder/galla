// ===========================================================================
// CONTACT PAGE - ALL TEXT AND DETAILS
// ---------------------------------------------------------------------------
// TODO: everything in the  details  block is a PLACEHOLDER.
//       Put your real address, phone numbers and email addresses there.
//       These also need to match what you give your payment gateway, so it
//       is worth getting them right before you go live.
// ===========================================================================

export const CONTENT = {
  // -------------------------------------------------------------------------
  // 1. HEADER  ->  HeroContactUs.js
  // -------------------------------------------------------------------------
  hero: {
    h1: "Contact Us",
    lead: "Questions about billing, plans or your account? Talk to us.",
    img: "", // set a path here to use a real image instead of the drawing
    imgLabel: "Customer support illustration",
  },

  // -------------------------------------------------------------------------
  // 2. LEFT COLUMN  ->  ContactDetails.js
  // -------------------------------------------------------------------------
  details: {
    address: {
      title: "Address",
      // TODO: your real registered address
      lines: ["Galla Software", "Building name, Street", "Area, City, State 000000"],
    },

    phone: {
      title: "Phone",
      numbers: [{ label: "Sales and support", value: "+91 74092 33994" }],
      // TODO: check these are the hours you will actually answer the phone.
      //       Published hours nobody picks up on are worse than none.
      hours: ["09:00 AM - 07:00 PM (Monday to Saturday)", "10:00 AM - 05:00 PM (Sunday)"],
    },

    email: {
      title: "Email",
      items: [{ label: "Support and enquiries", value: "nafeesahadbly@gmail.com" }],
    },
  },

  // -------------------------------------------------------------------------
  // 3. THE FORM  ->  GetInTouchForm.js
  // -------------------------------------------------------------------------
  // The form is FRONTEND ONLY right now. Nothing is sent anywhere. The place
  // for the API call is marked "BACKEND CALL GOES HERE" in GetInTouchForm.js
  form: {
    title: "Get In Touch",
    sub: "Fill in the form and we will get back to you within one working day.",

    name: { label: "First & Last Name", placeholder: "Your full name", required: true },
    phone: { label: "Phone number", placeholder: "10 digit mobile number", required: true },
    email: { label: "Email address", placeholder: "you@company.com", required: true },
    company: { label: "Company name", placeholder: "Your business name", required: false, optional: "optional" },
    message: { label: "Message", placeholder: "Your message here...", required: true },

    note: "Fields required",
    cta: "Submit",
    sending: "Sending...",

    errors: {
      name: "Please enter your name",
      phone: "Please enter a valid 10 digit mobile number",
      email: "Please enter a valid email address",
      message: "Please write a short message",
    },

    done: {
      title: "Thank you",
      text: "We have your message and will get back to you within one working day.",
      again: "Send another message",
    },
  },
};
