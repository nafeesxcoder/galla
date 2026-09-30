// ===========================================================================
// AuthProvider - knows whether someone is signed in
// ---------------------------------------------------------------------------
// This is the piece every other part of the account area reads from.
//
// RIGHT NOW it is a DEMO session: signing in just writes a small object to
// the browser's localStorage so you can build and see the logged-in screens.
// It is NOT security. Anyone can set that value by hand.
//
// WHEN THE BACKEND IS READY, three things change and nothing else:
//   1. signIn()  calls your API and stores the returned token
//   2. signOut() tells the API to end the session
//   3. the useEffect below asks the API "who am I?" on load, instead of
//      reading localStorage
//
// Every screen that uses useAuth() keeps working without edits.
// ===========================================================================

"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const KEY = "galla.session";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  // On load, work out whether someone is signed in.
  useEffect(() => {
    // ---- BACKEND: replace this block with a call to your API ------------
    // const res = await fetch("/api/auth/me");
    // setUser(res.ok ? await res.json() : null);
    // ---------------------------------------------------------------------
    try {
      const raw = window.localStorage.getItem(KEY);
      setUser(raw ? JSON.parse(raw) : null);
    } catch {
      setUser(null);
    }
    setReady(true);
  }, []);

  const signIn = useCallback((details) => {
    // details is whatever the login popup collected, e.g. { phone, dial }
    const session = {
      phone: details?.phone ?? "",
      dial: details?.dial ?? "+91",
      name: details?.name ?? "",
      business: details?.business ?? "",
      email: details?.email ?? "",
      // TODO: the real plan and licence count come from your API
      plan: null,
      licences: 0,
      since: new Date().toISOString(),
    };

    setUser(session);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(session));
    } catch {
      // private browsing can block this; the session just will not survive
      // a reload, which is fine for a demo
    }
  }, []);

  const signOut = useCallback(() => {
    // ---- BACKEND: tell the API to end the session too --------------------
    // await fetch("/api/auth/logout", { method: "POST" });
    // ---------------------------------------------------------------------
    setUser(null);
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({ user, ready, signedIn: Boolean(user), signIn, signOut }),
    [user, ready, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Use this anywhere: const { user, signedIn, signOut } = useAuth();
export function useAuth() {
  const ctx = useContext(AuthContext);

  // If a component using this is ever rendered outside the provider, fail
  // quietly rather than crashing the whole page.
  if (!ctx) {
    return { user: null, ready: true, signedIn: false, signIn: () => {}, signOut: () => {} };
  }

  return ctx;
}
