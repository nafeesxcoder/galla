// ===========================================================================
// /robots.txt, generated
// ---------------------------------------------------------------------------
// Two different jobs, often confused:
//
//   robots.txt   "do not CRAWL this"
//   noindex      "do not LIST this in results"
//
// A page that is disallowed here can still appear in Google as a bare URL,
// because Google was told not to read it and so never saw the noindex. That
// is why the private areas below carry a noindex in their own metadata as
// well - this file only saves crawl budget.
// ===========================================================================

import { SITE_URL } from "@/lib/seo";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          // Signing in, and everything behind it. Nothing here is useful in
          // a search result and some of it is somebody's own account.
          "/login",
          "/account",
          // The billing app itself. A shopkeeper's bills must never be
          // crawled, and these routes are noindex in their own layout too.
          "/app",
          // Form handlers. Crawling a POST endpoint achieves nothing.
          "/api/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
