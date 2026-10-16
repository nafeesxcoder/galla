import { SITE_URL } from "@/lib/seo";
import { INDUSTRIES } from "@/lib/industries";
import { SOFTWARE } from "@/lib/software";

// /sitemap.xml is generated from this file automatically.
//
// TWO RULES worth keeping in mind when you add to it:
//
//   1. Only list pages that exist. A sitemap entry for a missing page hands
//      Google a 404 and costs you crawl budget.
//   2. Never list a page marked noindex. Telling Google "crawl this" and
//      "do not index this" at the same time is a contradiction, and it is
//      the sort of thing that shows up as a warning in Search Console.
//
// That is why /login and everything under /account are absent: both are
// noindex. There is no /solutions entry either - the Solutions menu is a
// menu, not a page.

export default function sitemap() {
  const now = new Date();

  const pages = [
    ["", 1.0, "weekly"],
    ["/pricing", 0.9, "weekly"],
    ["/mobile-app", 0.8, "monthly"],
    ["/desktop", 0.7, "monthly"],
    ["/about", 0.5, "yearly"],
    ["/partner", 0.5, "monthly"],
    ["/contact", 0.5, "monthly"],
    ["/careers", 0.4, "monthly"],
    ["/terms", 0.2, "yearly"],
    ["/privacy", 0.2, "yearly"],
    ["/refund", 0.2, "yearly"],
  ].map(([path, priority, changeFrequency]) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));

  const industryPages = INDUSTRIES.map((i) => ({
    url: `${SITE_URL}/billing-software/${i.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const softwarePages = SOFTWARE.map((s) => ({
    url: `${SITE_URL}/software/${s.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...pages, ...industryPages, ...softwarePages];
}
