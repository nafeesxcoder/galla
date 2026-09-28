// ===========================================================================
// TERMS AND CONDITIONS - the text
// ---------------------------------------------------------------------------
// IMPORTANT: this is a solid starting draft, not legal advice. Before you go
// live, have a lawyer read it against what your product actually does. The
// places most likely to need changing are marked with TODO.
//
// Company details come from company.js, so fill that in first.
// ===========================================================================

import { COMPANY as C } from "./company";

export const TERMS = {
  title: "Terms and Conditions",

  intro: [
    `These terms are an agreement between you and ${C.legalName} ("we", "us"), the company behind ${C.product}. They cover your use of our website, our mobile and desktop apps, and anything else we provide.`,
    "By creating an account or using the software, you accept these terms. If you do not accept them, please do not use the service.",
  ],

  sections: [
    {
      id: "the-service",
      h: "What we provide",
      p: [
        `${C.product} is billing and accounting software for small businesses. It lets you create invoices, track stock, record payments and produce reports.`,
        "We may add, change or remove features over time. If we remove something you are paying for, we will tell you in advance.",
      ],
    },
    {
      id: "your-account",
      h: "Your account",
      p: [
        "You need an account to use most of the service. You are responsible for what happens under your account.",
      ],
      list: [
        "Give us accurate details when you register, and keep them up to date.",
        "Keep your login and OTP to yourself. Anything done through your account is treated as done by you.",
        "Tell us straight away if you think someone else has got into your account.",
        "You must be at least 18 and able to enter a contract under Indian law.",
        "One account is for one business. Extra businesses may need a higher plan.",
      ],
    },
    {
      id: "acceptable-use",
      h: "How you may and may not use it",
      p: ["You may use the service for your own lawful business purposes."],
      list: [
        "Do not use it to create false, misleading or fraudulent invoices or records.",
        "Do not try to break into, overload or reverse engineer the service.",
        "Do not resell or rent access to the service unless you have a written agreement with us.",
        "Do not upload anything unlawful, or anything that infringes someone else's rights.",
        "Do not use the service to send unsolicited bulk messages.",
      ],
    },
    {
      id: "your-data",
      h: "Your data belongs to you",
      p: [
        "The business data you put into the service - your invoices, customers, items and reports - stays yours. We do not claim ownership of it.",
        "You give us permission to store and process that data only so far as we need to in order to run the service for you, keep it backed up and support you when you ask.",
        "You can export your data at any time. If you close your account, you can take a copy with you.",
      ],
    },
    {
      id: "compliance",
      h: "Tax and legal compliance is yours",
      p: [
        `${C.product} produces invoices and reports in GST format and works out tax from the rates you enter. That is a tool, not advice.`,
        "You remain responsible for whether the rates, HSN or SAC codes and details you enter are correct, for filing your returns on time, and for meeting any licence or record-keeping rules that apply to your trade.",
        "We are not your accountant or your tax adviser. For anything that matters, ask a qualified professional.",
      ],
    },
    {
      id: "plans-payment",
      h: "Plans and payment",
      list: [
        "Prices shown on our pricing page are in Indian Rupees and do not include GST unless we say otherwise.",
        "Paid plans are charged in advance for the period you choose.",
        "We may change our prices. A change never affects a period you have already paid for.",
        "If a payment fails, paid features may pause until the payment goes through. Your data stays safe.",
        "Refunds are covered in our Refund and Cancellation Policy.",
      ],
    },
    {
      id: "free-trial",
      h: "Free trial and free plan",
      p: [
        "We may offer a free trial or a free plan. Features and limits on those can change, and we can end them at any time.",
        "A free trial does not turn into a paid plan on its own. Nothing is charged unless you choose a paid plan yourself.",
      ],
    },
    {
      id: "availability",
      h: "Availability",
      p: [
        "We work to keep the service running, but we do not promise it will never be unavailable. Maintenance, updates and problems outside our control all happen.",
        "Parts of the software work offline and sync when you reconnect. Sync depends on your own internet connection and device.",
      ],
    },
    {
      id: "ip",
      h: "Our intellectual property",
      p: [
        `The software, the ${C.product} name, our logo, design and content are ours and stay ours. These terms do not give you any right to them beyond using the service as intended.`,
        "You may not copy, modify or create derivative works from our software, except where the law specifically allows it.",
      ],
    },
    {
      id: "third-party",
      h: "Third-party services",
      p: [
        "The service may connect to things we do not control - payment gateways, messaging services, cloud storage, government portals. Those have their own terms, and we are not responsible for how they behave.",
      ],
    },
    {
      id: "liability",
      h: "Limits on our liability",
      p: [
        // TODO: a lawyer should check this clause against Indian law and your
        //       insurance position before you rely on it.
        "The service is provided as it is. To the extent the law allows, we are not liable for indirect or consequential loss, lost profits, lost business or lost data.",
        "Where we are found liable despite the above, our total liability is limited to what you paid us in the twelve months before the claim arose.",
        "Nothing here limits liability that cannot be limited under Indian law.",
      ],
    },
    {
      id: "suspension",
      h: "Suspension and closing an account",
      p: [
        "You can stop using the service and close your account at any time.",
        "We may suspend or close an account that breaks these terms, that is being used unlawfully, or where payment has not been made. Where it is reasonable to do so, we will warn you first and give you a chance to put it right.",
        "After an account closes we keep your data for a limited period so you can recover it, then delete it. See our Privacy Policy for how long.",
      ],
    },
    {
      id: "changes",
      h: "Changes to these terms",
      p: [
        "We may update these terms as the product and the law change. The date at the top shows when they last changed.",
        "If a change materially affects you, we will tell you by email or in the app before it takes effect. Continuing to use the service after that means you accept the new terms.",
      ],
    },
    {
      id: "law",
      h: "Governing law",
      p: [
        `These terms are governed by the laws of India. Any dispute will be handled by the courts at ${C.jurisdiction}.`,
      ],
    },
    {
      id: "contact",
      h: "How to reach us",
      p: [
        `${C.legalName}`,
        C.address,
        `Email: ${C.legalEmail}`,
        `Phone: ${C.phone}`,
      ],
    },
  ],
};
