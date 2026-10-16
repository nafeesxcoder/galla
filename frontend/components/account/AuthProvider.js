// ===========================================================================
// AuthProvider - who is signed in, and which shop they are looking at
// ---------------------------------------------------------------------------
// This replaces the demo version that wrote to localStorage. It now talks to
// the real API. Everything that reads useAuth() keeps working untouched -
// that was the point of putting it all behind one hook.
//
// Two things it holds, not one:
//
//   user             who is signed in
//   activeBusiness   which shop they are working in
//
// The second matters because one person can own a shop AND be staff at
// somebody else's. Every API call that touches business data carries this
// id, and the backend refuses anything the person is not a member of.
// ===========================================================================

"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api, tokens, activeBusiness as storedBusiness, ApiError } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [businessId, setBusinessId] = useState(null);
  const [ready, setReady] = useState(false);
  // Set when the backend cannot be reached at all, so screens can say so
  // instead of looking broken.
  const [offline, setOffline] = useState(false);

  // ---- work out the state on load ---------------------------------------
  const load = useCallback(async () => {
    if (!tokens.access && !tokens.refresh) {
      setUser(null);
      setBusinesses([]);
      setReady(true);
      return;
    }

    try {
      const data = await api.auth.me();
      setUser(data.user);
      setBusinesses(data.businesses);
      setOffline(false);

      // Keep the shop they were last in, if they still have access to it.
      const stored = storedBusiness.id;
      const keep = data.businesses.find((b) => String(b.id) === String(stored));
      const next = keep ?? data.businesses[0] ?? null;

      setBusinessId(next?.id ?? null);
      storedBusiness.set(next?.id ?? null);
    } catch (e) {
      if (e instanceof ApiError && e.isOffline) {
        // The backend is down. Do NOT throw the tokens away - they are
        // probably still good, and signing somebody out because their wifi
        // dropped is its own kind of bug.
        setOffline(true);
      } else {
        tokens.clear();
        storedBusiness.set(null);
        setUser(null);
        setBusinesses([]);
        setBusinessId(null);
      }
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ---- signing in --------------------------------------------------------
  // Called by the login card once the OTP has been verified. The card does
  // the verifying because it owns the form; this just takes the result.
  const signIn = useCallback(async (authData) => {
    tokens.set({
      accessToken: authData.accessToken,
      refreshToken: authData.refreshToken,
    });
    setUser(authData.user);

    // A brand new user has no shop yet, so this comes back empty and the
    // account page shows the "set up your shop" screen.
    try {
      const me = await api.auth.me();
      setBusinesses(me.businesses);
      const first = me.businesses[0] ?? null;
      setBusinessId(first?.id ?? null);
      storedBusiness.set(first?.id ?? null);
    } catch {
      setBusinesses([]);
    }

    return authData.user;
  }, []);

  // ---- signing out -------------------------------------------------------
  const signOut = useCallback(async (allDevices = false) => {
    try {
      await api.auth.logout(allDevices);
    } catch {
      // If the server cannot be reached we still clear locally. The refresh
      // token stays valid until it expires, which is not ideal, but leaving
      // somebody signed in on a shared counter because the network blipped
      // is worse.
    }
    tokens.clear();
    storedBusiness.set(null);
    setUser(null);
    setBusinesses([]);
    setBusinessId(null);
  }, []);

  // ---- switching shop ----------------------------------------------------
  const switchBusiness = useCallback(
    (id) => {
      const found = businesses.find((b) => String(b.id) === String(id));
      if (!found) return false;
      setBusinessId(found.id);
      storedBusiness.set(found.id);
      return true;
    },
    [businesses]
  );

  // ---- after creating a shop --------------------------------------------
  const addBusiness = useCallback((business) => {
    setBusinesses((list) => [...list, business]);
    setBusinessId(business.id);
    storedBusiness.set(business.id);
  }, []);

  const activeBusiness = useMemo(
    () => businesses.find((b) => String(b.id) === String(businessId)) ?? null,
    [businesses, businessId]
  );

  const value = useMemo(
    () => ({
      user,
      ready,
      offline,
      signedIn: Boolean(user),
      businesses,
      activeBusiness,
      businessId,
      signIn,
      signOut,
      switchBusiness,
      addBusiness,
      reload: load,
    }),
    [user, ready, offline, businesses, activeBusiness, businessId, signIn, signOut, switchBusiness, addBusiness, load]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  // Rendered outside the provider - fail quietly rather than taking the page
  // down. Should not happen, since layout.js wraps everything.
  if (!ctx) {
    return {
      user: null,
      ready: true,
      offline: false,
      signedIn: false,
      businesses: [],
      activeBusiness: null,
      businessId: null,
      signIn: async () => {},
      signOut: async () => {},
      switchBusiness: () => false,
      addBusiness: () => {},
      reload: async () => {},
    };
  }

  return ctx;
}
