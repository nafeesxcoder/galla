// ===========================================================================
// PRIVACY POLICY - the text
// ---------------------------------------------------------------------------
// IMPORTANT: this is a solid starting draft, not legal advice. India's
// Digital Personal Data Protection Act 2023 applies to you, and its rules
// were still being rolled out when this was written. Have a lawyer check
// this before you go live, and again once the rules are fully notified.
//
// Also: this policy must describe what your product ACTUALLY does. As you
// add analytics, a payment gateway or an SMS provider, come back and add
// them to the "Who else sees your data" section. A policy that does not
// match reality is worse than no policy.
// ===========================================================================

import { COMPANY as C } from "./company";

export const PRIVACY = {
  title: "Privacy Policy",

  intro: [
    `This policy explains what personal data ${C.legalName} collects when you use ${C.product}, why we collect it, and what you can do about it.`,
    "We have tried to write it in plain language rather than legal shorthand.",
  ],

  sections: [
    {
      id: "what-we-collect",
      h: "What we collect",
      p: ["There are three kinds of information involved."],
      list: [
        "Account details: your name, mobile number, email address and business name. We need these to create your account and to contact you.",
        "Your business data: the invoices, customers, suppliers, items and payments you enter. This is yours; we only store and process it so the service works.",
        "Technical information: device type, app version, rough location from your IP address, and error logs. We use this to keep the service working and to fix problems.",
      ],
    },
    {
      id: "why",
      h: "Why we use it",
      list: [
        "To run the service - create your account, sync your data, produce your reports.",
        "To verify who you are, using a one-time password sent to your mobile number.",
        "To take payment for a paid plan and send you the invoice for it.",
        "To answer you when you contact support.",
        "To send you service messages - a payment receipt, a plan about to expire, a security notice.",
        "To keep the service secure and to detect misuse.",
        "To meet our own legal and tax obligations.",
      ],
    },
    {
      id: "marketing",
      h: "Marketing messages",
      p: [
        "We may send you occasional messages about features and offers. You can opt out of those at any time, and every marketing message will tell you how.",
        "Service messages are different - a receipt, a security alert or a notice that your plan is ending. Those you cannot opt out of while you have an account, because you need them.",
      ],
    },
    {
      id: "who-sees",
      h: "Who else sees your data",
      p: [
        "We do not sell your personal data. We do not share your business data with anyone for their own marketing.",
        // TODO: keep this list accurate. Add every provider you actually use.
        "We do use service providers who process data on our behalf, under contract, only for what we ask them to do:",
      ],
      list: [
        "Cloud hosting, to run the service and store backups.",
        "An SMS provider, to deliver one-time passwords.",
        "A payment gateway, to take payments. Card details go to them directly; we never see or store your full card number.",
        "An email provider, to send receipts and service messages.",
        "We may also disclose data where the law requires it, for example a valid order from a court or an authority.",
      ],
    },
    {
      id: "where",
      h: "Where your data is stored",
      p: [
        // TODO: state the truth once you have chosen your hosting region.
        "Your data is stored on servers operated by our cloud provider. Where data is processed outside India, we put appropriate safeguards in place as required by Indian law.",
      ],
    },
    {
      id: "how-long",
      h: "How long we keep it",
      list: [
        "While your account is open, we keep your data so the service works.",
        "After you close your account, we keep it for a limited period so you can change your mind and recover it, then delete it.",
        "Some records - invoices we issued to you, tax records - we must keep for longer because the law requires it.",
        "Backups are overwritten on a rolling cycle, so deleted data can persist in a backup for a short time before it is gone.",
      ],
    },
    {
      id: "security",
      h: "How we protect it",
      list: [
        "Data is encrypted in transit between your device and our servers.",
        "Access to production systems is limited to the people who need it.",
        "Backups run automatically.",
        "Passwords and one-time codes are never stored in a readable form.",
      ],
      p: [
        "No system is perfectly secure. If a breach affects your personal data, we will notify you and the relevant authority as the law requires.",
      ],
    },
    {
      id: "your-rights",
      h: "Your rights",
      p: [
        "Under Indian data protection law you have rights over your personal data. You can:",
      ],
      list: [
        "Ask what personal data we hold about you.",
        "Ask us to correct anything that is wrong or out of date.",
        "Ask us to delete your personal data, subject to records we must keep by law.",
        "Withdraw a consent you gave us, which may mean we can no longer provide part of the service.",
        "Nominate someone to exercise these rights for you if you die or become unable to.",
        "Complain to us first, and then to the Data Protection Board if you are not satisfied.",
      ],
      // TODO: set a response time you can actually meet, and meet it.
    },
    {
      id: "how-to-ask",
      h: "How to exercise those rights",
      p: [
        `Write to ${C.privacyEmail} from the email address on your account, or from the mobile number registered to it, and tell us what you want.`,
        "We will respond within a reasonable period. We may need to verify your identity first, so that nobody else can make a request in your name.",
      ],
    },
    {
      id: "children",
      h: "Children",
      p: [
        "The service is for businesses and is not intended for anyone under 18. We do not knowingly collect data from children. If you believe a child has given us personal data, write to us and we will remove it.",
      ],
    },
    {
      id: "cookies",
      h: "Cookies and similar technology",
      p: [
        // TODO: update this the moment you add analytics or ad tracking.
        "Our website uses only what it needs to keep you signed in and to remember basic preferences such as your chosen language.",
        "If we add analytics or advertising tools later, we will update this section and, where required, ask for your consent first.",
      ],
    },
    {
      id: "changes",
      h: "Changes to this policy",
      p: [
        "We will update this policy as the product and the law change. The date at the top shows when it last changed. If a change matters to you, we will tell you in the app or by email.",
      ],
    },
    {
      id: "contact",
      h: "How to reach us",
      p: [
        `${C.legalName}`,
        C.address,
        `Privacy queries: ${C.privacyEmail}`,
        `Phone: ${C.phone}`,
      ],
    },
  ],
};
