// ===========================================================================
// /manifest.webmanifest
// ---------------------------------------------------------------------------
// What Android shows if somebody adds the site to their home screen, and
// what Chrome reads for the install prompt. Small file, and the one that
// decides whether the icon on a shopkeeper's phone says "myGallaBook" with
// the right colour, or shows a grey globe with a truncated URL.
//
// This is the WEBSITE's manifest, not the app's. The real app is the React
// Native build on the Play Store; this just makes the site behave properly
// when it is pinned.
// ===========================================================================

import { SITE } from "@/lib/site";
import { DEFAULT_DESC } from "@/lib/seo";

export default function manifest() {
  return {
    name: `${SITE.name} — GST billing software`,
    // What fits under an icon. Android cuts at roughly 12 characters, so the
    // long name above is never the one shown on the home screen.
    short_name: SITE.name,
    description: DEFAULT_DESC,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    // The same green as the theme colour in app/layout.js. Two different
    // greens here and the status bar flickers between them on launch.
    theme_color: "#0e6b52",
    lang: "en-IN",
    dir: "ltr",
    categories: ["business", "finance", "productivity"],
    icons: [
      // These must exist in public/. If a file here is missing, Chrome
      // drops the install prompt silently rather than complaining.
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        // A SEPARATE FILE, not icon-512 again.
        //
        // Android crops a maskable icon to whatever shape the launcher
        // prefers - circle, squircle, teardrop - and only guarantees the
        // middle 80%. The two icons above are drawn out to their own edges,
        // so pointing "maskable" at one of them hands Android a picture it
        // is about to slice the top off.
        //
        // This one is the same artwork shrunk to 72% on a full-bleed green
        // square, so there is nothing at the edges worth keeping.
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
