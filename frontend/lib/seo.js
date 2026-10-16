// ===========================================================================
// SEO: the domain, the default words, and the schema helpers
// ---------------------------------------------------------------------------
// Every canonical URL, every Open Graph tag and every bit of structured data
// is built from SITE_URL. It is the one string that must be right - a wrong
// canonical tells Google the real page lives somewhere else, and a site can
// quietly disappear from results for weeks because of it.
// ===========================================================================

// mygallabook.com, with no trailing slash.
//
// The environment variable wins, so a preview deployment on Vercel can point
// its canonicals at itself rather than at the live site. Set
// NEXT_PUBLIC_SITE_URL in Vercel -> Settings -> Environment Variables for
// Preview, and leave Production on this default.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://mygallabook.com").replace(
  /\/$/,
  ""
);

// Shown in Google's results under the title, so it is written for a person
// deciding whether to click, not for a crawler counting keywords. Under 160
// characters, because Google cuts it there.
export const DEFAULT_DESC =
  "GST billing software for Indian small businesses. Make invoices in 30 seconds, track stock and payments, and get GST-ready reports. Free plan, works offline.";

/**
 * The metadata every page exports.
 *
 * `title` goes through the template in app/layout.js, which appends the
 * brand. So pass the page's own words ONLY - "Pricing", not
 * "Pricing | myGallaBook" - or the brand lands in the title twice and both
 * Google and the browser tab show it.
 */
export function pageMeta({ title, description = DEFAULT_DESC, path = "/", image = "/og.png" }) {
  const url = `${SITE_URL}${path}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: "myGallaBook",
      locale: "en_IN",
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

// ---------------------------------------------------------------------------
// Structured data
// ---------------------------------------------------------------------------
// Two helpers so the shape is written once. Both return a plain object to be
// JSON.stringify'd into a <script type="application/ld+json">.

/**
 * The trail at the top of a Google result: Home > Billing software > Pharmacy.
 *
 * @param {Array<[string, string]>} crumbs  [label, path] pairs, in order,
 *                                          NOT including the page itself
 *                                          unless you want it listed.
 */
export function breadcrumbSchema(crumbs) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map(([name, path], i) => ({
      "@type": "ListItem",
      position: i + 1,
      name,
      item: `${SITE_URL}${path}`,
    })),
  };
}

/**
 * FAQ rich results.
 *
 * Google's rule, and it is enforced: the questions and answers here must be
 * the ones actually visible on the page. Marking up questions a visitor
 * cannot see is what gets a site a manual action, so every caller passes the
 * same array it renders.
 *
 * @param {Array<[string, string]>} qa  [question, answer] pairs
 */
export function faqSchema(qa) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: qa.map(([question, answer]) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
}
