import { SITE_URL } from "@/lib/seo";

// /robots.txt apne aap ban jata hai
export default function robots() {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/login"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
