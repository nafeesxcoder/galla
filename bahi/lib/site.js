// ===========================================================================
// THE BRAND, IN ONE PLACE
// ---------------------------------------------------------------------------
// Change it here and it changes everywhere - the navbar, the footer, the
// legal pages, the schema Google reads, and the emails the forms send.
// ===========================================================================

export const SITE = {
  name: "Galla",
  phone: "+91 7409233994",

  // TODO: galla.com is somebody else's domain - this address does not exist
  //       and mail sent to it will not reach you. Change it the moment your
  //       own domain is decided.
  //
  //       It matters more than it looks: this address is shown on the
  //       contact page, on all three legal pages, in the Organization
  //       schema Google reads, and it is what the forms tell a visitor to
  //       write to if sending fails. A payment gateway checking your site
  //       before approving a merchant account will look for it too.
  email: "nafeesahadbly@gmail.com",

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
