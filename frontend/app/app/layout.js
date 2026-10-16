// ===========================================================================
// /app - EVERYTHING BEHIND THE LOGIN
// ---------------------------------------------------------------------------
// This stays a server component so it can carry metadata, and it does only
// one thing with it: keep the whole area out of search engines. These pages
// are somebody's shop, not marketing. A stray crawl of /app would be at best
// pointless and at worst an invitation.
// ===========================================================================

export const metadata = {
  title: "myGallaBook",
  robots: { index: false, follow: false, nocache: true },
};

export default function AppLayout({ children }) {
  return children;
}
