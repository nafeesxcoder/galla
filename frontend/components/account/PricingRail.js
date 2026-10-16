// ===========================================================================
// PricingRail - the sidebar that appears beside the plans once signed in
// ---------------------------------------------------------------------------
// This is the panel from the Vyapar screenshot: Quick Links plus the
// "0 Active Licences" box, shown on the pricing page after login.
//
// TO USE IT: in components/pricing/PricingSwitcher.js, wrap the plans and
// this together:
//
//     import PricingRail from "@/components/account/PricingRail";
//     ...
//     <div className="ac-railgrid">
//       <div> ...the existing plans view... </div>
//       <PricingRail />
//     </div>
//
// It renders nothing at all when nobody is signed in, so the pricing page
// looks exactly as it does now for visitors.
// ===========================================================================

"use client";
import { useAuth } from "./AuthProvider";
import QuickLinks from "./QuickLinks";
import LicenceBox from "./LicenceBox";
import { CONTENT } from "./content";

export default function PricingRail() {
  const { signedIn, ready } = useAuth();

  if (!ready || !signedIn) return null;

  return (
    <aside className="ac-rail">
      <h2 className="ac-rail__title">{CONTENT.page.h1}</h2>
      <QuickLinks compact />
      <LicenceBox />
    </aside>
  );
}
