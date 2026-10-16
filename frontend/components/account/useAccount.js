// ===========================================================================
// useAccount - the plan, the expiry and the licence keys
// ---------------------------------------------------------------------------
// One call to /api/account answers everything the account area asks: which
// plan each shop is on, how long is left, and every licence key on the
// account. It is deliberately NOT part of AuthProvider - that runs on every
// page of a public marketing site, and somebody reading the About page has
// no business triggering a licence query.
//
// Two components on the same page want this data (the plan card and the
// licence box, and on /pricing the rail holds both), so a request already in
// flight is shared rather than fired twice. The cache is cleared by refresh()
// after anything that changes the answer - redeeming a key, above all.
// ===========================================================================

"use client";
import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "./AuthProvider";

// Module level, so a second component mounting in the same tick joins the
// first one's request instead of starting its own.
let inFlight = null;
let cached = null;

function fetchAccount({ force = false } = {}) {
  if (force) {
    cached = null;
    inFlight = null;
  }
  if (cached) return Promise.resolve(cached);
  if (inFlight) return inFlight;

  inFlight = api
    .get("/api/account")
    .then((data) => {
      cached = data;
      return data;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

/** Throws the cache away. Call after anything that changes the account. */
export function clearAccountCache() {
  cached = null;
  inFlight = null;
}

export function useAccount() {
  const { signedIn, ready, businessId } = useAuth();
  const [account, setAccount] = useState(cached);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(
    async ({ force = false } = {}) => {
      if (!signedIn) {
        setAccount(null);
        return null;
      }
      setLoading(true);
      setError("");
      try {
        const data = await fetchAccount({ force });
        setAccount(data);
        return data;
      } catch (e) {
        setError(
          e instanceof ApiError && e.isOffline
            ? "Could not reach the server."
            : "Could not load your account just now."
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    [signedIn]
  );

  useEffect(() => {
    if (!ready) return;
    // Not signed in: nothing to ask for, and asking would 401.
    if (!signedIn) {
      setAccount(null);
      return;
    }
    load();
  }, [ready, signedIn, load]);

  // The shop this person is looking at, which is the one the page is about.
  const shop =
    account?.shops?.find((s) => String(s.id) === String(businessId)) ??
    account?.shops?.[0] ??
    null;

  return {
    account,
    shop,
    plan: shop?.plan ?? null,
    licences: account?.licences ?? [],
    activeLicences: account?.activeLicences ?? 0,
    loading,
    error,
    refresh: () => load({ force: true }),
  };
}
