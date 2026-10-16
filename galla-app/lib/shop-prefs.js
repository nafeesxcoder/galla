// ===========================================================================
// THIS SHOP'S PREFERENCES, WHEREVER THEY ARE NEEDED
// ---------------------------------------------------------------------------
// The Settings screen writes them; the billing screen, the item form and the
// print code all read them. Fetching them in each of those places would mean
// three requests for one answer and three chances to forget.
//
// So it is fetched once per shop and kept. It changes only when somebody
// saves the Settings screen, and that screen calls clearShopPrefs().
//
// The fallbacks matter as much as the fetch. A screen must never wait on this
// to render - a form that appears half a second after the tap is a form that
// gets tapped twice - so the defaults here are the same ones the server uses,
// and anything in flight simply starts with those.
// ===========================================================================

import { useEffect, useState } from "react";
import { getBusinessId } from "./api";
import { getBusiness, listBankAccounts } from "./data";

export const FALLBACK = {
  bill: {
    terms: "",
    footer: "",
    signatureLabel: "",
    showHsn: true,
    showAmountInWords: true,
    showPaymentStatus: true,
    showSignature: true,
    showBankDetails: false,
    defaultSize: "a4",
  },
  defaults: {
    dueDays: 0,
    roundOff: true,
    paymentMode: "cash",
    itemUnit: "PCS",
    itemTaxRate: 0,
    itemPriceIncludesTax: false,
  },
};

let cached = null;
// Shared so that three screens mounting at once make one request between
// them rather than three.
let inFlight = null;

export function clearShopPrefs() {
  cached = null;
  inFlight = null;
}

export async function shopPrefs() {
  const businessId = getBusinessId();
  if (!businessId) return { settings: FALLBACK, bankAccounts: [] };
  if (cached && String(cached.businessId) === String(businessId)) return cached.value;

  if (!inFlight || String(inFlight.businessId) !== String(businessId)) {
    inFlight = {
      businessId,
      promise: (async () => {
        try {
          const shop = await getBusiness(businessId);
          const settings = shop.settings || FALLBACK;
          // Only fetched when the shop actually wants them printed, so a
          // shop with the toggle off does not pay for the request.
          const bankAccounts = settings.bill?.showBankDetails
            ? await listBankAccounts().catch(() => [])
            : [];
          const value = { settings, bankAccounts };
          cached = { businessId, value };
          return value;
        } catch {
          // A screen that works with the defaults beats a screen that will
          // not open because a preference could not be read.
          return { settings: FALLBACK, bankAccounts: [] };
        } finally {
          inFlight = null;
        }
      })(),
    };
  }

  return inFlight.promise;
}

/**
 * The shop's defaults for a screen that needs them at render time.
 *
 * Starts with the fallbacks and swaps in the real ones when they arrive, so
 * nothing ever blocks on this.
 */
export function useShopDefaults() {
  const [value, setValue] = useState(FALLBACK.defaults);

  useEffect(() => {
    let alive = true;
    shopPrefs().then((p) => {
      if (alive && p?.settings?.defaults) setValue(p.settings.defaults);
    });
    return () => {
      alive = false;
    };
  }, []);

  return value;
}
