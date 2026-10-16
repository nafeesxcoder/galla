// ===========================================================================
// WHO IS SIGNED IN, AND WHICH SHOP
// ---------------------------------------------------------------------------
// One source of truth for the whole app. Everything else reads it through
// useSession().
//
// The order on startup matters and is the reason this exists at all:
//
//   1. read the tokens out of the keychain  (async, has to finish first)
//   2. ask the server who that is           (one call, gives user + shops)
//   3. only then decide which screen to show
//
// Skipping step 1 would show the login screen for a moment to somebody who is
// already signed in, every single time they open the app. On a till that is
// opened fifty times a day it reads as the app being broken.
// ===========================================================================

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  api,
  hydrate,
  getBusinessId,
  setBusinessId as persistBusiness,
  setTokens,
  clearTokens,
  getTokens,
} from "./api";

const Ctx = createContext(null);

export function SessionProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [businessId, setBiz] = useState(null);
  const [offline, setOffline] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.get("/api/auth/me");
      setUser(data?.user ?? null);
      const shops = data?.businesses ?? [];
      setBusinesses(shops);
      setOffline(false);

      // Keep whichever shop was last open, as long as it is still ours.
      const saved = getBusinessId();
      const keep = shops.find((b) => String(b.id) === String(saved));
      const chosen = keep || shops[0] || null;
      setBiz(chosen ? chosen.id : null);
      if (chosen && String(chosen.id) !== String(saved)) persistBusiness(chosen.id);
      return true;
    } catch (e) {
      if (e.isOffline) {
        // Offline is not signed out. The tokens are kept and the screens say
        // the server cannot be reached, rather than throwing them back to a
        // login they cannot complete without a signal anyway.
        setOffline(true);
        return false;
      }
      setUser(null);
      setBusinesses([]);
      setBiz(null);
      clearTokens();
      return false;
    }
  }, []);

  useEffect(() => {
    (async () => {
      await hydrate();
      if (getTokens().access) await load();
      setReady(true);
    })();
  }, [load]);

  const value = useMemo(
    () => ({
      ready,
      offline,
      user,
      businesses,
      businessId,
      shop: businesses.find((b) => String(b.id) === String(businessId)) || null,
      signedIn: Boolean(user),

      async requestOtp(phone) {
        return api.post("/api/auth/otp/request", { phone }, { auth: false });
      },

      async verifyOtp(phone, code) {
        const data = await api.post("/api/auth/otp/verify", { phone, code }, { auth: false });
        setTokens(data.accessToken, data.refreshToken);
        await load();
        return data;
      },

      async signOut() {
        const { refresh } = getTokens();
        // Tell the server first so the refresh token is actually revoked, but
        // never let a failure there keep somebody signed in on the device.
        try {
          if (refresh) await api.post("/api/auth/logout", { refreshToken: refresh });
        } catch {
          /* leaving anyway */
        }
        clearTokens();
        persistBusiness(null);
        setUser(null);
        setBusinesses([]);
        setBiz(null);
      },

      switchBusiness(id) {
        setBiz(id);
        persistBusiness(id);
      },

      async createBusiness(body) {
        const biz = await api.post("/api/businesses", body);
        await load();
        setBiz(biz.id);
        persistBusiness(biz.id);
        return biz;
      },

      reload: load,
    }),
    [ready, offline, user, businesses, businessId, load]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSession must be used inside SessionProvider");
  return v;
}
