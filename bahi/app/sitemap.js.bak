import { SITE_URL } from "@/lib/seo";
import { INDUSTRIES } from "@/lib/industries";

// /sitemap.xml apne aap ban jata hai
export default function sitemap() {
  const now = new Date();

  const pages = [
    ["", 1.0, "weekly"],
    ["/pricing", 0.9, "weekly"],
    ["/solutions", 0.8, "monthly"],
    ["/mobile-app", 0.8, "monthly"],
    ["/desktop", 0.7, "monthly"],
    ["/about", 0.5, "yearly"],
    ["/careers", 0.4, "monthly"],
    ["/partner", 0.5, "monthly"],
    ["/login", 0.3, "yearly"],
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

  return [...pages, ...industryPages];
}
