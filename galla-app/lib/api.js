// ===========================================================================
// THE ONE PLACE THAT TALKS TO THE BACKEND
// ---------------------------------------------------------------------------
// Same job as the website's version, with one real difference: a phone has no
// localStorage. Tokens live in the device keychain through SecureStore, which
// is asynchronous - so they are read once at startup into memory, and every
// request after that reads from memory. Writes go to the keychain in the
// background.
//
// That matters because a request cannot wait on the keychain. A billing screen
// that pauses before every call because it is unlocking a keychain entry would
// feel broken, and the shopkeeper would blame the shop's internet.
//
// There is no demo fallback. If the server cannot be reached, a call throws
// with code "network" and the screen says so. A billing app that quietly
// pretends to have saved a bill is worse than one that admits it is offline.
// ===========================================================================

import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import Constants from "expo-constants";

// ---------------------------------------------------------------------------
// where the server is
// ---------------------------------------------------------------------------
// On a real phone "localhost" is the phone itself, not the computer running
// the backend - the commonest hour-wasting mistake in React Native. So in
// development the address is taken from whatever host Expo itself is being
// served from, which is the developer's machine by definition.
function devHost() {
  const raw =
    Constants.expoConfig?.hostUri ||
    Constants.expoGoConfig?.debuggerHost ||
    Constants.manifest2?.extra?.expoClient?.hostUri ||
    "";
  const host = String(raw).split(":")[0];
  return host || "localhost";
}

// ---------------------------------------------------------------------------
// where the server is, decided in this order
// ---------------------------------------------------------------------------
// 1. EXPO_PUBLIC_API_URL, baked in at build time. This is what a shipped app
//    pointing at our own hosting will use, and it wins over everything.
// 2. Whatever the shopkeeper typed into the app. The desktop build is one
//    .exe handed to shops whose server is not ours - a shop running the
//    backend on the counter machine, say - and rebuilding the installer to
//    change a URL is not a thing anybody is going to do.
// 3. In development, the machine Expo is being served from, because on a
//    phone "localhost" means the phone.
//
// There is no fourth. An unset address is left empty rather than pointed at
// a placeholder domain: a request that fails because nothing is configured
// should say so, not spend thirty seconds timing out against a server that
// was never ours.
const BUILT_IN = process.env.EXPO_PUBLIC_API_URL || "";

let chosen = BUILT_IN || (__DEV__ ? `http://${devHost()}:4000` : "");

export function getApiUrl() {
  return chosen;
}

// True when the address is fixed by the build and the shopkeeper should not
// be offered a box to change it.
export function apiUrlIsFixed() {
  return Boolean(BUILT_IN);
}

export function setApiUrl(url) {
  const clean = String(url || "").trim().replace(/\/+$/, "");
  chosen = clean;
  store.set(KEY_API, clean || null);
  return chosen;
}

// ---------------------------------------------------------------------------
// the error type
// ---------------------------------------------------------------------------
export class ApiError extends Error {
  constructor(message, { status = 0, code = "error", fields = null, body = null, noServer = false } = {}) {
    super(message || "Something went wrong.");
    this.name = "ApiError";
    // Nothing is configured yet, which is a setup step rather than a fault.
    this.noServer = noServer;
    this.status = status;
    this.code = code;
    this.fields = fields;
    this.body = body;
  }

  get isOffline() {
    return this.code === "network";
  }

  get isAuth() {
    return this.status === 401;
  }

  get isMissing() {
    return this.status === 404;
  }
}

// ---------------------------------------------------------------------------
// where the tokens live
// ---------------------------------------------------------------------------
const KEY_ACCESS = "mygallabook_access";
const KEY_REFRESH = "mygallabook_refresh";
const KEY_API = "mygallabook.api";
const KEY_BUSINESS = "mygallabook_business";

// SecureStore is the keychain on a device. On web it does not exist, so this
// falls back to localStorage - which is the right trade: a browser has no
// keychain to use, and refusing to run there would cost us the desktop build.
const store = {
  async get(key) {
    try {
      if (Platform.OS === "web") {
        return typeof window === "undefined" ? null : window.localStorage.getItem(key);
      }
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async set(key, value) {
    try {
      if (Platform.OS === "web") {
        if (typeof window === "undefined") return;
        if (value == null) window.localStorage.removeItem(key);
        else window.localStorage.setItem(key, value);
        return;
      }
      if (value == null) await SecureStore.deleteItemAsync(key);
      else await SecureStore.setItemAsync(key, value);
    } catch {
      /* a locked keychain or a private browser. Not worth crashing over. */
    }
  },
};

// The in-memory copy every request reads.
let mem = { access: null, refresh: null, businessId: null };
let hydrated = false;

export async function hydrate() {
  if (hydrated) return mem;
  const [access, refresh, business, api] = await Promise.all([
    store.get(KEY_ACCESS),
    store.get(KEY_REFRESH),
    store.get(KEY_BUSINESS),
    store.get(KEY_API),
  ]);
  // A saved address only applies when the build did not fix one.
  if (!BUILT_IN && api) chosen = api;
  mem = { access, refresh, businessId: business ? Number(business) : null };
  hydrated = true;
  return mem;
}

export function getTokens() {
  return { access: mem.access, refresh: mem.refresh };
}

export function setTokens(access, refresh) {
  mem.access = access || null;
  mem.refresh = refresh || null;
  store.set(KEY_ACCESS, mem.access);
  store.set(KEY_REFRESH, mem.refresh);
}

export function clearTokens() {
  setTokens(null, null);
}

export function getBusinessId() {
  return mem.businessId;
}

export function setBusinessId(id) {
  mem.businessId = id == null ? null : Number(id);
  store.set(KEY_BUSINESS, mem.businessId == null ? null : String(mem.businessId));
}

export function isSignedIn() {
  return Boolean(mem.access);
}

// ---------------------------------------------------------------------------
// why could it not reach the server
// ---------------------------------------------------------------------------
// A browser reports a server that is switched off and a server that refused
// the request on CORS grounds as exactly the same thing: fetch throws a
// TypeError and tells JavaScript nothing else, deliberately. So "could not
// reach the server" covers two problems with completely different fixes, and
// whoever is setting this up gets to guess which one they have.
//
// A no-cors probe looks like the way out and is not: this backend sends
// Cross-Origin-Resource-Policy: same-origin, which makes the browser reject
// the opaque response too. The probe then fails whether the server is up or
// not, which is worse than not guessing - it would confidently report the
// wrong cause.
//
// So the server is asked to say so itself. /api/ping answers every origin and
// exists for this one purpose. If it answers, the server is up and the
// failure was CORS. If it does not answer, either the server is down or it is
// an older build without the route - and the message says both rather than
// picking one.
//
// Development only, and the web only: a phone has no CORS, and in production
// none of this is something a shopkeeper can act on.
async function diagnose() {
  const plain = "Could not reach the server.";
  // The desktop build is the web build, and it is not __DEV__ - but whoever
  // is setting it up needs this answer every bit as much as a developer does.
  if (Platform.OS !== "web") return plain;

  const origin = webOrigin();
  try {
    const res = await fetch(`${getApiUrl()}/api/ping`, { cache: "no-store" });
    if (res.ok) {
      return (
        `${getApiUrl()} is running but refused this request — that is CORS. ` +
        `Add ${origin} to CORS_ORIGINS in the backend's .env and restart the backend.`
      );
    }
  } catch {
    /* either nothing is listening, or this backend has no /api/ping */
  }

  return (
    `Could not reach ${getApiUrl()}. Either the backend is not running, or it is running and CORS is blocking ` +
    `${origin}. Open ${getApiUrl()}/api/auth/me in a tab: if it says "unauthorized" the backend is up and it is CORS.`
  );
}

function webOrigin() {
  try {
    return globalThis.location?.origin || "this address";
  } catch {
    return "this address";
  }
}

// ---------------------------------------------------------------------------
// refresh, once at a time
// ---------------------------------------------------------------------------
// Several screens can hit a 401 in the same tick. Without this guard each one
// would try to refresh, and the backend treats a reused refresh token as theft
// and revokes every session - signing the shopkeeper out mid-bill.
let refreshing = null;

async function refreshTokens() {
  if (refreshing) return refreshing;
  const token = mem.refresh;
  if (!token) return null;

  refreshing = (async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: token }),
      });
      if (!res.ok) {
        clearTokens();
        return null;
      }
      const json = await res.json().catch(() => null);
      const data = json && json.data ? json.data : json;
      if (!data?.accessToken) {
        clearTokens();
        return null;
      }
      setTokens(data.accessToken, data.refreshToken || token);
      return { access: data.accessToken, refresh: data.refreshToken || token };
    } catch {
      // Offline, not signed out. Throwing the tokens away here would make
      // them log in again the moment the signal comes back, for nothing.
      return null;
    } finally {
      refreshing = null;
    }
  })();

  return refreshing;
}

// ---------------------------------------------------------------------------
// the request
// ---------------------------------------------------------------------------
export async function request(method, path, options = {}) {
  const { body, businessId, auth = true, retry = true, signal, headers: extra } = options;

  const headers = { ...(extra || {}) };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  if (auth) {
    if (mem.access) headers.Authorization = `Bearer ${mem.access}`;
    const bid = businessId !== undefined ? businessId : mem.businessId;
    if (bid) headers["X-Business-Id"] = String(bid);
  }

  if (!getApiUrl()) {
    throw new ApiError("No server address set yet.", { code: "network", noServer: true });
  }

  let res;
  try {
    res = await fetch(`${getApiUrl()}${path}`, {
      method,
      headers,
      signal,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (e) {
    if (e?.name === "AbortError") throw e;
    throw new ApiError(await diagnose(), { code: "network" });
  }

  if (res.status === 401 && auth && retry && mem.refresh) {
    const fresh = await refreshTokens();
    if (fresh) return request(method, path, { ...options, retry: false });
  }

  if (res.status === 204) return null;

  const text = await res.text();
  let json = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      /* a proxy or a crash page, not our JSON */
    }
  }

  if (!res.ok) {
    const err = json && (json.error || json);
    throw new ApiError((err && (err.message || err.error)) || `Request failed (${res.status}).`, {
      status: res.status,
      code: (err && err.code) || "error",
      fields: (err && (err.fields || err.details)) || null,
      body: json,
    });
  }

  // The backend wraps everything as { ok, data, meta }. Unwrap it once, here.
  //
  // The meta is NOT thrown away with the envelope. It carries the row count
  // for a paged list and the totals a report needs, and dropping it had two
  // consequences that both looked like something else:
  //
  //   - totalOf() fell back to "however many rows came in this page", so a
  //     list of 200 reported 200 whatever the shop actually had;
  //   - pageThrough() compares what it has against that total, so it decided
  //     it was finished after the first page. A shop with 600 items saw 200,
  //     and the stock value under it was a third of the real figure.
  //
  // It is attached non-enumerably so that nothing else changes: spreading
  // the result, JSON.stringify, Object.keys and every existing caller behave
  // exactly as before.
  if (json && typeof json === "object" && "data" in json) {
    const data = json.data;
    if (data && typeof data === "object" && json.meta) {
      try {
        Object.defineProperty(data, "meta", { value: json.meta, enumerable: false, configurable: true });
      } catch {
        /* a frozen or primitive-wrapped body; the data still goes back */
      }
    }
    return data;
  }
  return json;
}

export const api = {
  get: (path, options) => request("GET", path, options),
  post: (path, body, options) => request("POST", path, { ...(options || {}), body }),
  patch: (path, body, options) => request("PATCH", path, { ...(options || {}), body }),
  put: (path, body, options) => request("PUT", path, { ...(options || {}), body }),
  del: (path, options) => request("DELETE", path, options),
  request,
};

// ---------------------------------------------------------------------------
// small helpers
// ---------------------------------------------------------------------------
export function rowsOf(result) {
  if (!result) return [];
  if (Array.isArray(result)) return result;
  for (const key of ["rows", "items", "data", "results", "list"]) {
    if (Array.isArray(result[key])) return result[key];
  }
  return [];
}

export function totalOf(result, fallback) {
  // The server puts the row count in meta, which request() keeps on the
  // result. This is the figure that decides whether there is another page,
  // so it is looked at first.
  const meta = result && typeof result === "object" ? result.meta : null;
  if (meta) {
    for (const key of ["total", "count", "totalCount"]) {
      if (typeof meta[key] === "number") return meta[key];
    }
  }
  if (result && typeof result === "object" && !Array.isArray(result)) {
    for (const key of ["total", "count", "totalCount"]) {
      if (typeof result[key] === "number") return result[key];
    }
  }
  return fallback == null ? rowsOf(result).length : fallback;
}

/** The server's meta for this response, or an empty object. */
export function metaOf(result) {
  return (result && typeof result === "object" && result.meta) || {};
}

export function qs(params) {
  const parts = [];
  for (const [k, v] of Object.entries(params || {})) {
    if (v === undefined || v === null || v === "") continue;
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  }
  return parts.length ? `?${parts.join("&")}` : "";
}

export default api;
