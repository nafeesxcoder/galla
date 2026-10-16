// ===========================================================================
// REFUND AND CANCELLATION POLICY - the text
// ---------------------------------------------------------------------------
// WHY THIS PAGE EXISTS: Indian payment gateways (Razorpay, PayU, Cashfree,
// Instamojo) will not approve a merchant account without a refund and
// cancellation policy published on the website. It is one of the first
// things their review team looks for, along with Terms, Privacy and a
// Contact page with a real address.
//
// IMPORTANT: this is a starting draft, not legal advice. The refund window
// and timelines come from company.js - set them to what you can actually
// honour. A policy you do not follow is worse than a strict one you do.
// ===========================================================================

import { COMPANY as C } from "./company";

export const REFUND = {
  title: "Refund and Cancellation Policy",

  intro: [
    `This policy explains when you can cancel a ${C.product} plan, when you can ask for a refund, and how long it takes.`,
    "We would rather sort out the problem than keep money from someone who is unhappy. If something is not working, talk to us first - most issues are fixed the same day.",
  ],

  sections: [
    {
      id: "free-first",
      h: "Try it free before you pay",
      p: [
        `Every plan can be tried free before you buy. We strongly suggest using the free trial to check that ${C.product} does what your business needs, because that avoids the refund question entirely.`,
      ],
    },
    {
      id: "cancellation",
      h: "Cancelling your plan",
      list: [
        "You can cancel at any time from your account, or by writing to us.",
        "Cancelling stops the plan from renewing. It does not end the current period - you keep the paid features until the period you have paid for runs out.",
        "Your data is not deleted when you cancel. You can still sign in, see it and export it.",
      ],
    },
    {
      id: "refund-window",
      h: "When you can ask for a refund",
      p: [
        `You can ask for a refund within ${C.refundWindow} of the payment, in these situations:`,
      ],
      list: [
        "You were charged twice for the same plan.",
        "You were charged after cancelling.",
        "You paid for a plan and were not able to use it because of a fault on our side that we could not fix.",
        "The amount charged was wrong.",
      ],
    },
    {
      id: "no-refund",
      h: "When we cannot refund",
      list: [
        `Requests made more than ${C.refundWindow} after the payment.`,
        "A plan that has been used for a substantial part of its period and worked as described.",
        "A change of mind after the free trial, where the software works as described.",
        "Problems caused by your own device, internet connection or incorrect data entry.",
        "An account suspended or closed for breaking our Terms and Conditions.",
      ],
      p: [
        "Where a request falls outside this policy but there is a genuine problem, write to us anyway. We look at each case on its facts.",
      ],
    },
    {
      id: "how-to-ask",
      h: "How to ask for a refund",
      p: ["Write to us with enough detail that we can find the payment."],
      list: [
        `Email ${C.email} from the address on your account.`,
        "Put your registered mobile number in the message.",
        "Tell us the payment date and amount, or attach the receipt.",
        "Tell us what went wrong.",
      ],
    },
    {
      id: "timeline",
      h: "How long it takes",
      list: [
        "We acknowledge a refund request within two working days.",
        "We tell you our decision, with a reason, within five working days.",
        `If approved, the money is sent back to the original payment method within ${C.refundDays}.`,
        "How long it then takes to appear depends on your bank or card issuer, which is outside our control.",
      ],
      p: [
        "A refund always goes back to the method you paid with. We cannot send it to a different card, account or person.",
      ],
    },
    {
      id: "partial",
      h: "Partial refunds",
      p: [
        "Where we agree a refund on a plan you have partly used, we may refund the unused portion rather than the whole amount. We will tell you the figure and how we worked it out before we process it.",
      ],
    },
    {
      id: "gst",
      h: "GST on refunds",
      p: [
        "Where GST was charged on the original payment, the refund is processed in line with GST rules and a credit note is issued where required.",
      ],
    },
    {
      id: "changes",
      h: "Changes to this policy",
      p: [
        "We may update this policy. The version that applies to your payment is the one published on the day you paid. The date at the top shows when it last changed.",
      ],
    },
    {
      id: "contact",
      h: "How to reach us",
      p: [
        `${C.legalName}`,
        C.address,
        `Email: ${C.email}`,
        `Phone: ${C.phone}`,
      ],
    },
  ],
};
