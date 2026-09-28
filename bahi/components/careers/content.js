// ===========================================================================
// CAREERS PAGE - ALL TEXT AND JOB OPENINGS
// ===========================================================================
//
//  >>> THE ONE THING TO EDIT: the  roles  array below. <<<
//
//  - Leave it EMPTY and the page shows "no openings right now" with a
//    general CV form. That is the honest state when you are not hiring.
//  - Add a role and the listing appears by itself, with department filter
//    buttons built from whatever departments you used.
//
//  Only list a job you would actually interview for. Listing roles you are
//  not filling wastes people's time and gets talked about publicly.
// ===========================================================================

export const CONTENT = {
  // -------------------------------------------------------------------------
  // 1. HERO  ->  HeroWorkAtGalla.js
  // -------------------------------------------------------------------------
  hero: {
    eyebrow: "Careers",
    h1: "Build software that runs real shops",
    lead:
      "Galla is billing software for small Indian businesses - the kind of shop where one wrong bill matters. If that sounds like work worth doing, we would like to hear from you.",
    cta: "See open roles",
    img: "",
    imgLabel: "The team at work",
  },

  // -------------------------------------------------------------------------
  // 2. WHY JOIN  ->  WhyJoinGalla.js
  // -------------------------------------------------------------------------
  why: {
    eyebrow: "Why join",
    h2: "What you get out of working here",
    lead: "A small team means your work is visible, and it ships.",
    items: [
      [
        "Your work actually ships",
        "No six-month roadmap before anything reaches a user. What you build this month is on a real counter next month.",
        "box",
      ],
      [
        "Real ownership",
        "You own a piece of the product end to end, not a ticket queue. You decide how it works, not just how it is coded.",
        "shield",
      ],
      [
        "Users you can picture",
        "A kirana owner, a chemist, a garment shop. You can go and watch someone use what you built, which very few software jobs allow.",
        "users",
      ],
      [
        "Room to learn",
        "A small team means you touch parts of the stack you would never be allowed near at a large company.",
        "ledger",
      ],
    ],
  },

  // -------------------------------------------------------------------------
  // 3. VALUES  ->  WhatWeValue.js
  // -------------------------------------------------------------------------
  values: {
    eyebrow: "How we work",
    h2: "What we care about",
    items: [
      [
        "Ship, then improve",
        "We would rather put something simple in front of a real shopkeeper than polish a feature nobody has used.",
      ],
      [
        "Say it plainly",
        "Clear writing, honest status updates and no hiding a problem until it is too big to fix quietly.",
      ],
      [
        "Respect the counter",
        "Our users are busy and often not technical. If a feature needs a manual, it is not finished.",
      ],
      [
        "Own the outcome",
        "Nobody says \"that was not my ticket\". If it is broken and you can see it, it is yours.",
      ],
    ],
  },

  // -------------------------------------------------------------------------
  // 4. OPEN ROLES  ->  OpenRoles.js
  // -------------------------------------------------------------------------
  roles: {
    eyebrow: "Open roles",
    h2: "Where we need help",
    lead: "Every role below is one we are actively interviewing for.",

    // What shows when the list is empty
    emptyTitle: "No open roles right now",
    emptyText:
      "We are not actively hiring at the moment, but that changes quickly. If you think you would be a good fit, send your details anyway - we keep good CVs on file and come back to them first.",

    applyCta: "Apply",

    // ========================================================================
    // ADD YOUR JOBS HERE
    // ------------------------------------------------------------------------
    // Copy this block for each opening:
    //
    //   {
    //     title: "Frontend Engineer",
    //     dept: "Engineering",          // becomes a filter button
    //     location: "Remote",           // or "Bengaluru", "Hybrid - Delhi"
    //     type: "Full time",            // or "Internship", "Contract"
    //     experience: "2-4 years",
    //     summary: "One or two lines on what this person will actually do.",
    //     apply: "mailto:careers@example.com?subject=Frontend Engineer",
    //   },
    //
    // Leave the array empty and the page shows the message above instead.
    // ========================================================================
    list: [],
  },

  // -------------------------------------------------------------------------
  // 5. HIRING PROCESS  ->  HiringProcess.js
  // -------------------------------------------------------------------------
  process: {
    eyebrow: "What happens next",
    h2: "Our hiring process",
    lead: "Four steps, and we tell you where you stand at each one.",
    items: [
      ["You apply", "Send your CV and anything you have built. A link to real work counts for more than a long CV."],
      ["First conversation", "A call about what you have done and what you want to do next. Not a quiz."],
      ["A practical task", "A small piece of real work, scoped to a few hours. We pay for anything longer."],
      ["Final chat and offer", "You meet the people you would work with, ask us anything, and we come back with an answer either way."],
    ],
  },

  // -------------------------------------------------------------------------
  // 6. BENEFITS  ->  BenefitsAndPerks.js
  // -------------------------------------------------------------------------
  // TODO: only keep the ones you genuinely offer. Delete the rest.
  //       Promising a benefit you do not give is the fastest way to lose
  //       someone in their first month.
  perks: {
    eyebrow: "The practical stuff",
    h2: "What we offer",
    items: [
      ["Flexible hours", "We care when the work lands, not when you sat down."],
      ["Learning budget", "Courses, books and conferences that make you better at the job."],
      ["Your choice of machine", "Work on hardware you are actually fast on."],
      ["Paid leave", "Take your holidays. We mean it."],
    ],
    note:
      "TODO: keep only the benefits you actually provide, and add anything missing.",
  },

  // -------------------------------------------------------------------------
  // 7. GENERAL APPLICATION  ->  GeneralApplication.js
  // -------------------------------------------------------------------------
  // Frontend only for now. The API call goes where it says
  // "BACKEND CALL GOES HERE" in GeneralApplication.js
  apply: {
    h2: "Send us your details",
    sub: "Tell us what you do and what you would like to work on. We read every one.",

    name: { label: "Full name", placeholder: "Your name", required: true },
    email: { label: "Email address", placeholder: "you@example.com", required: true },
    phone: { label: "Phone number", placeholder: "10 digit mobile number", required: true },
    role: { label: "What do you do?", placeholder: "Frontend engineer, designer, sales...", required: true },
    link: { label: "Portfolio, GitHub or LinkedIn", placeholder: "https://", required: false, optional: "optional" },
    message: { label: "Anything you want us to know", placeholder: "A few lines about your work...", required: false, optional: "optional" },

    note: "Fields required",
    cta: "Send application",
    sending: "Sending...",

    errors: {
      name: "Please enter your name",
      email: "Please enter a valid email address",
      phone: "Please enter a valid 10 digit mobile number",
      role: "Please tell us what you do",
    },

    done: {
      title: "Thank you",
      text: "We have your details. If there is a fit, someone will be in touch.",
      again: "Send another application",
    },
  },
};
