// ===========================================================================
// THE BRAND, IN ONE PLACE
// ---------------------------------------------------------------------------
// Change it here and it changes everywhere - the navbar, the footer, the
// legal pages, the schema Google reads, and the emails the forms send.
// ===========================================================================

export const SITE = {
  name: "myGallaBook",
  phone: "+91 7409233994",

  // ⚠️ THIS MAILBOX HAS TO EXIST BEFORE LAUNCH.
  //
  // It is not decoration. This address is shown on the contact page, on all
  // three legal pages, inside the Organization schema Google reads, and it
  // is what a form tells somebody to write to when sending fails. A payment
  // gateway checking the site before approving a merchant account looks for
  // a domain address too - a gmail reads as "not a real company".
  //
  // Most registrars include free email forwarding: point
  // support@mygallabook.com at whichever inbox is actually read. Until that
  // is done, every mail sent here vanishes with no bounce and no warning.
  email: "support@mygallabook.com",

  city: "Noida Sector 3, Uttar Pradesh",
};

// label = i18n key (lib/i18n.js)
//
// /solutions is deliberately absent. The Solutions menu is a menu, not a
// page - the same as Vyapar - so there is nothing to link to. Adding it back
// here would put a 404 in the navbar and the footer.
export const NAV = [
  { href: "/pricing", key: "nav.pricing" },
  { href: "/about", key: "nav.about" },
  { href: "/desktop", key: "nav.desktop" },
  { href: "/careers", key: "nav.careers" },
  { href: "/partner", key: "nav.partner" },
];
