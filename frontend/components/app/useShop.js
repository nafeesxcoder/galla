"use client";

// ===========================================================================
// WHO IS SIGNED IN, AND WHICH SHOP
// ---------------------------------------------------------------------------
// The login screens and the account page already have an auth provider. The
// app area needs exactly the same facts, so it reads from that one rather
// than keeping a second idea of who is signed in - two sources of truth
// about a session is how you end up billing into the wrong shop.
//
// The import is deliberately forgiving about the hook's name. The provider
// may export useAuth, useAccount or a default; this picks whichever is
// there, so the app area does not break over a naming difference.
// ===========================================================================

import * as Provider from "../account/AuthProvider";

function pickHook() {
  for (const name of ["useAuth", "useAccount", "useSession", "useUser"]) {
    if (typeof Provider[name] === "function") return Provider[name];
  }
  if (typeof Provider.default === "function") return Provider.default;
  return null;
}

const hook = pickHook();

// Normalised, so a screen never has to guess whether the field is called
// businessId or activeBusinessId.
export function useShop() {
  const raw = hook ? hook() : {};
  const state = raw || {};

  const businesses = state.businesses || state.shops || [];
  const businessId =
    state.businessId ?? state.activeBusinessId ?? state.currentBusinessId ?? null;

  const shop =
    state.business ||
    state.activeBusiness ||
    businesses.find((b) => String(b.id) === String(businessId)) ||
    businesses[0] ||
    null;

  return {
    ...state,
    user: state.user || null,
    businesses,
    businessId: businessId ?? (shop ? shop.id : null),
    shop,
    ready: state.ready !== false,
    offline: Boolean(state.offline),
    signedIn: Boolean(state.user),
    // The shop's own state code decides CGST+SGST versus IGST on every bill
    // it issues, so it is lifted out here where billing can reach it.
    stateCode: shop ? shop.stateCode || shop.state_code || null : null,
  };
}

export default useShop;
