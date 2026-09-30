// ===========================================================================
// ACCOUNT AREA - ALL TEXT
// ---------------------------------------------------------------------------
// TODO: the download links and the support email are placeholders.
//       Point them at your real files and address before launch.
// ===========================================================================

export const CONTENT = {
  page: {
    h1: "My Account",
    lead: "Your plan, your downloads and your invoices, all in one place.",
  },

  // Shown when nobody is signed in
  guest: {
    h2: "You are not signed in",
    text: "Sign in with your mobile number to see your plan, your downloads and your invoices.",
    cta: "Sign in",
  },

  // The three shortcuts, the same ones Vyapar shows beside its pricing
  quickLinks: {
    title: "Quick Links",
    items: [
      ["Already have a licence?", "/account/license", "Attach a licence key you bought elsewhere.", "ledger"],
      ["Offline payment", "/account/offline-payment", "Pay by bank transfer, cheque or DD.", "receipt"],
      ["Buy multiple licences", "/account/bulk", "For several shops or branches.", "box"],
    ],
  },

  licences: {
    title: "Active Licences",
    none: "No active licences on this account yet.",
    noneCta: "See plans",
    hide: "Hide",
    show: "Show",
  },

  plan: {
    title: "Your plan",
    noneTitle: "No paid plan",
    noneText: "You are on the free plan. Upgrade whenever you need the extra features.",
    cta: "See plans",
    renew: "Renew",
    upgrade: "Upgrade",
    expires: "Expires on",
  },

  downloads: {
    title: "Download Galla",
    text: "Install it on as many of your own devices as your plan allows.",
    // TODO: point these at your real download URLs
    items: [
      ["Windows", "Windows 7 and above", "#", "monitor"],
      ["Mac", "macOS 11 and above", "#", "monitor"],
      ["Android", "Android 8 and above", "#", "phone"],
      ["iOS", "iPhone and iPad", "#", "phone"],
    ],
  },

  invoices: {
    title: "Payments and invoices",
    none: "No payments yet. Your GST invoices will appear here after your first payment.",
    head: ["Date", "Description", "Amount", "Invoice"],
    download: "Download",
  },

  profile: {
    title: "Your details",
    phone: "Mobile number",
    name: "Name",
    business: "Business name",
    email: "Email address",
    notSet: "Not set yet",
    edit: "Edit details",
    // TODO: this opens nothing yet. Wire it up when the backend exists.
    editNote: "Editing your details needs the backend. Coming soon.",
  },

  signOut: "Sign out",
};
