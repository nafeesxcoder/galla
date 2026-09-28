// ===========================================================================
// PARTNER PAGE - ALL TEXT AND IMAGE PATHS
// ---------------------------------------------------------------------------
// Every section below is named after its heading, so the matching component
// file is easy to find.
//
// IMAGES:
//   Where  img: ""  is empty, the code-drawn artwork from Art.js is shown.
//   To use a real photo instead, put the file in  public/  and set
//   img: "/my-photo.png"  here. The drawing disappears automatically.
//
// TODO items - search "TODO" for the places that still need real data:
//   - partner success stories (names, photos, earnings)
//   - the per-client rate used by the earnings calculator
// ===========================================================================

export const CONTENT = {
  // -------------------------------------------------------------------------
  // 1. HERO + FORM  ->  HeroBecomeAGallaPartner.js
  // -------------------------------------------------------------------------
  hero: {
    crumb: ["Home", "Become partner"],
    badge: "Partner program",
    h1: "Become a Galla Partner",
    // TODO: before publishing any income claim, confirm your real numbers.
    //       Overstated earnings claims can cause legal trouble later.
    h2: "Turn your client network into monthly income",
    lead:
      "Recommend Galla to the businesses you already work with. Earn on every sale and every renewal, with nothing to invest upfront.",
    chips: ["Zero investment", "Regular payouts", "Your own partner dashboard"],
    form: {
      title: "Become a partner",
      sub: "Fill in the form and our team will call you within 24 hours.",
      nameLabel: "Name",
      namePlaceholder: "Your full name",
      phoneLabel: "Phone",
      phonePlaceholder: "10 digit mobile number",
      cta: "Register Now",
      // The form is frontend only for now. Backend goes in PartnerForm.js
      done: "Thank you. We have your details and our team will call you shortly.",
      errName: "Please enter your name",
      errPhone: "Please enter a valid 10 digit mobile number",
    },
    ticks: [
      "GST-compliant invoicing",
      "Secure platform",
      "Earn on every renewal",
      "Free marketing material",
    ],
  },

  // -------------------------------------------------------------------------
  // 2. PARTNER TYPES  ->  WhichKindOfPartnerAreYou.js
  // -------------------------------------------------------------------------
  types: {
    eyebrow: "Who can join",
    h2: "Which Kind of Partner Are You?",
    lead: "We have a programme for every professional background.",
    items: [
      [
        "CA / Tax Consultant",
        "Recommend Galla to the clients you already advise and earn on every renewal. Compliant software also adds to your professional credibility.",
        "ledger",
      ],
      [
        "Software Reseller / Distributor",
        "Sell Galla subscriptions to local businesses and build a recurring book of business with regular settlements.",
        "box",
      ],
      [
        "Retail Store Owner",
        "Help nearby shops handle billing, stock and GST. Stronger relationships, and extra income alongside your own counter.",
        "basket",
      ],
      [
        "Hardware Store Owner",
        "Already connected to other local businesses? Point them to Galla and earn while you run your own shop.",
        "tool",
      ],
    ],
  },

  // -------------------------------------------------------------------------
  // 3. CA SECTION  ->  AreYouACaOrTaxProfessional.js
  // -------------------------------------------------------------------------
  ca: {
    eyebrow: "For CA professionals",
    h2: "Are you a CA or tax professional? This is for you.",
    lead:
      "You already advise your clients on compliance, GST and accounting. The Galla CA Partner Program turns that existing trust into a second income, with no extra work.",
    points: [
      [
        "Your clients need this anyway",
        "Galla handles GST billing, e-invoicing and accounting. Recommend something your clients already need, and earn on every renewal.",
      ],
      [
        "Onboarding under your name",
        "Share your own referral link. Clients sign up under your name, and every activation and payout shows in one dashboard.",
      ],
      [
        "Recurring income, not one-time",
        "You earn each time a referred client renews, not just on the first sale. As active clients grow, so does the income.",
      ],
      [
        "Compliance-ready software",
        "Galla produces GST-format bills and reports, so recommending it protects your professional credibility.",
      ],
    ],
    img: "",
    art: "ca",
    imgLabel: "Partner dashboard",
    cta: ["Join as a CA Partner", "#partner-form"],
    foot: "Registration is free. You get your partner dashboard once approved.",
  },

  // -------------------------------------------------------------------------
  // 4. PRODUCT CONFIDENCE  ->  WhyYourClientsWillLoveGalla.js
  // -------------------------------------------------------------------------
  // Heading is split in two so the second half can be highlighted.
  product: {
    eyebrow: "Product confidence",
    h2: ["Why Your Clients Will ", "Love Galla?"],
    lead:
      "Galla is a business accounting app built for Indian small businesses - GST billing, inventory and financial reporting in one place.",
    // Each card has a small UI mockup on top (drawn in Art.js) and text below.
    items: [
      {
        title: "GST-Ready Invoicing",
        text: "GSTIN and HSN auto-validated. Compliant by default.",
        art: "cardInvoice",
        img: "", // real screenshot goes here if you have one
        imgLabel: "GST invoice mockup",
      },
      {
        title: "Auto GSTR Reports",
        text: "GSTR-1 and GSTR-3B ready before you ask.",
        art: "cardGstr",
        img: "",
        imgLabel: "GSTR reports mockup",
      },
      {
        title: "Instant Data Sharing",
        text: "Clients share P&L and ledgers directly from the app.",
        art: "cardShare",
        img: "",
        imgLabel: "Data sharing mockup",
      },
      {
        title: "Errors Caught at Entry",
        text: "Wrong HSN codes are flagged before filing, not after.",
        art: "cardError",
        img: "",
        imgLabel: "Error validation mockup",
      },
    ],
    cta: ["Become a Partner", "#partner-form"],
  },

  // -------------------------------------------------------------------------
  // 5. THREE STEPS  ->  StartEarningInThreeSteps.js
  // -------------------------------------------------------------------------
  steps: {
    eyebrow: "How it works",
    h2: "Start Earning in 3 Simple Steps",
    lead: "No tech skills, no inventory, no upfront cost.",
    items: [
      [
        "Register for free",
        "Fill in the form above. Get approved within 24 hours and receive your partner link and dashboard access.",
      ],
      [
        "Refer businesses",
        "Share your link with clients, shop owners or your local network. They get a good billing app, you get credited for the referral.",
      ],
      [
        "Earn into your bank",
        "Settlements go straight to your bank account. Sales, renewals and payouts are all tracked in your dashboard.",
      ],
    ],
    cta: ["Get Started Now", "#partner-form"],
  },

  // -------------------------------------------------------------------------
  // 6. SUCCESS STORIES  ->  SuccessStoriesFromAcrossIndia.js
  // -------------------------------------------------------------------------
  // TODO: everything here is a placeholder. Only use a real partner's name,
  //       photo and earnings after you have their written permission.
  stories: {
    eyebrow: "Partners",
    h2: "Success Stories from Across India",
    lead: "Real partner stories will appear here. These are placeholders for now.",
    regions: ["North", "South", "West", "East"],
    items: {
      North: [
        {
          name: "Partner name",
          role: "(Partner type)",
          amount: "₹— / month",
          quote: "The partner's story goes here. This is a placeholder.",
          initial: "N",
          img: "",
          imgLabel: "Partner photo",
        },
        {
          name: "Partner name",
          role: "(Partner type)",
          amount: "₹— / month",
          quote: "The partner's story goes here. This is a placeholder.",
          initial: "N",
          img: "",
          imgLabel: "Partner photo",
        },
      ],
      South: [
        {
          name: "Partner name",
          role: "(Partner type)",
          amount: "₹— / month",
          quote: "The partner's story goes here. This is a placeholder.",
          initial: "S",
          img: "",
          imgLabel: "Partner photo",
        },
        {
          name: "Partner name",
          role: "(Partner type)",
          amount: "₹— / month",
          quote: "The partner's story goes here. This is a placeholder.",
          initial: "S",
          img: "",
          imgLabel: "Partner photo",
        },
      ],
      West: [
        {
          name: "Partner name",
          role: "(Partner type)",
          amount: "₹— / month",
          quote: "The partner's story goes here. This is a placeholder.",
          initial: "W",
          img: "",
          imgLabel: "Partner photo",
        },
        {
          name: "Partner name",
          role: "(Partner type)",
          amount: "₹— / month",
          quote: "The partner's story goes here. This is a placeholder.",
          initial: "W",
          img: "",
          imgLabel: "Partner photo",
        },
      ],
      East: [
        {
          name: "Partner name",
          role: "(Partner type)",
          amount: "₹— / month",
          quote: "The partner's story goes here. This is a placeholder.",
          initial: "E",
          img: "",
          imgLabel: "Partner photo",
        },
        {
          name: "Partner name",
          role: "(Partner type)",
          amount: "₹— / month",
          quote: "The partner's story goes here. This is a placeholder.",
          initial: "E",
          img: "",
          imgLabel: "Partner photo",
        },
      ],
    },
    cta: ["Become a Partner", "#partner-form"],
  },

  // -------------------------------------------------------------------------
  // 7. WHY PARTNER  ->  WhyBecomeAGallaPartner.js
  // -------------------------------------------------------------------------
  why: {
    eyebrow: "The benefits",
    h2: "Why Become a Galla Partner?",
    lead: "A network you build once keeps paying you every year.",
    items: [
      [
        "Recurring Income",
        "Earn on the first sale and on every renewal after it, so the income grows steadily over time.",
        "ledger",
      ],
      ["Fast Payout", "Settlements go directly to your bank account.", "download"],
      [
        "Extensive Support",
        "Marketing material, training and a dedicated support team, so you are never working alone.",
        "users",
      ],
      [
        "No Investment Required",
        "No stock to buy and no registration fee. Start with zero investment.",
        "handshake",
      ],
    ],
  },

  // -------------------------------------------------------------------------
  // 8. CALCULATOR  ->  EarningsCalculator.js
  // -------------------------------------------------------------------------
  calc: {
    eyebrow: "Do the maths",
    h2: "Calculate What You Could Earn",
    lead: "Move the slider to see an estimate.",
    title: "Earnings Calculator",
    sub: "Your potential earnings as a Galla Partner",
    label: "Number of clients",
    min: 1,
    max: 100,
    start: 10,
    // TODO: this rate is a PLACEHOLDER. Put your real per-client monthly
    //       commission here - both figures below are calculated from it.
    perClientPerMonth: 400,
    monthlyLabel: "Monthly earnings",
    annualLabel: "Annual earnings",
    note: "This is only an estimate, not a guarantee. Actual earnings depend on the plan and on renewals.",
    getTitle: "What You Get as a Galla Partner",
    get: [
      "A dedicated dashboard to track earnings",
      "Digital marketing material and assets",
      "Regular product training sessions",
      "A personal relationship manager",
      "Access to the partner community",
      "Special incentives and bonuses",
    ],
  },

  // -------------------------------------------------------------------------
  // 9. FAQ  ->  FrequentlyAskedQuestions.js
  // -------------------------------------------------------------------------
  faqs: [
    [
      "What is the Galla Partner Program?",
      "It is a referral programme. You introduce Galla to businesses and earn on every successful referral, both on the first sale and on renewals.",
    ],
    [
      "Can I recommend Galla without becoming a full-time partner?",
      "Yes. Many partners refer alongside their own work. There is no minimum target.",
    ],
    [
      "How much can I earn as a Galla Partner?",
      "It depends on how many clients you refer and how many of them renew. The calculator above is only an estimate, not a guarantee.",
    ],
    [
      "Do I need to invest anything to join?",
      "No. Registration is free, there is no stock to buy and no joining fee.",
    ],
    [
      "Does recommending Galla create a conflict of interest?",
      "Galla is business software your client would use anyway. Even so, it is worth checking the rules of your own professional body.",
    ],
    [
      "When and how do I get paid?",
      "After approval, settlements go straight to your bank account. Every payout is recorded in your partner dashboard.",
    ],
    [
      "What happens after I register?",
      "Our team contacts you within 24 hours. Once approved, you receive your partner link and dashboard.",
    ],
  ],
};
