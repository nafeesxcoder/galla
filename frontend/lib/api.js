// ===========================================================================
// THE API CLIENT
// ---------------------------------------------------------------------------
// Everything the website sends to the backend goes through here. It handles
// the three things every screen would otherwise have to handle itself:
//
//   1. Attaching the access token, and the business id where one is needed.
//   2. Refreshing the token when it expires - and retrying the call, so the
//      person never sees a flicker. The access token only lives 15 minutes,
//      so this happens constantly.
//   3. Turning every failure into one predictable shape, so a form can read
//      error.fields and show a message under the right input.
//
// It does NOT fall back to a demo mode when the backend is down. A login
// that quietly pretends to work is worse than one that says it cannot.
// ===========================================================================

// ?? was wrong here. It only steps in for null and undefined, so a
// NEXT_PUBLIC_API_URL that EXISTS but is blank - an empty line in .env.local,
// a value that got cleared, a host panel field saved empty - left BASE as "".
// Every call then went to the website's own origin instead of the backend,
// and Next answered its own /api/auth/otp/request with a 404. The login just
// said "something went wrong", with nothing anywhere naming the real cause.
//
// So: trim it, and fall back on anything falsy rather than only on null.
const CONFIGURED = (process.env.NEXT_PUBLIC_API_URL || "").trim().replace(/\/$/, "");
const BASE = CONFIGURED || "http://localhost:4000";

// Said once, in the browser, when the site is pointed at a backend that is
// not the local one. Four words in the console beat twenty minutes of
// wondering which URL a request actually went to.
if (typeof window !== "undefined" && !window.__apiBaseLogged) {
  window.__apiBaseLogged = true;
  // eslint-disable-next-line no-console
  console.info(`[myGallaBook] API base: ${BASE}${CONFIGURED ? "" : "  (NEXT_PUBLIC_API_URL not set)"}`);
}

const ACCESS_KEY = "mygallabook.access";
const REFRESH_KEY = "mygallabook.refresh";
const BUSINESS_KEY = "mygallabook.business";

// ---------------------------------------------------------------------------
// Where the tokens live
// ---------------------------------------------------------------------------
// localStorage, which is the practical choice for an app like this: the API
// is on a different origin, so httpOnly cookies would need CSRF handling and
// a shared domain. The trade is that a cross-site scripting bug could read
// the token - which is why the access token is short-lived and the refresh
// token can be revoked from the server.
//
// Every read is wrapped: localStorage throws in private browsing on some
// browsers, and a crash in a getter would take the whole app down.

function read(key) {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key, value) {
  if (typeof window === "undefined") return;
  try {
    if (value == null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // private browsing - the session just will not survive a reload
  }
}

export const tokens = {
  get access() {
    return read(ACCESS_KEY);
  },
  get refresh() {
    return read(REFRESH_KEY);
  },
  set({ accessToken, refreshToken }) {
    write(ACCESS_KEY, accessToken ?? null);
    if (refreshToken !== undefined) write(REFRESH_KEY, refreshToken ?? null);
  },
  clear() {
    write(ACCESS_KEY, null);
    write(REFRESH_KEY, null);
  },
};

export const activeBusiness = {
  get id() {
    return read(BUSINESS_KEY);
  },
  set(id) {
    write(BUSINESS_KEY, id == null ? null : String(id));
  },
};

// ---------------------------------------------------------------------------
// The error every call throws
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  constructor(status, code, message, fields) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = fields ?? null;
  }

  /** True when the backend could not be reached at all. */
  get isOffline() {
    return this.code === "network";
  }
}

// ---------------------------------------------------------------------------
// Refreshing
// ---------------------------------------------------------------------------
// Single-flight: if five requests expire at the same moment, they must not
// each fire their own refresh. The first one starts it and the rest wait on
// the same promise. Without this, four of the five refreshes present a token
// that the first one has already rotated away - which the backend correctly
// treats as token theft and ends every session.

let refreshing = null;

async function refreshTokens() {
  if (refreshing) return refreshing;

  const refreshToken = tokens.refresh;
  if (!refreshToken) return null;

  refreshing = (async () => {
    try {
      const res = await fetch(`${BASE}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        tokens.clear();
        return null;
      }

      const json = await res.json();
      tokens.set({
        accessToken: json.data.accessToken,
        refreshToken: json.data.refreshToken,
      });
      return json.data;
    } catch {
      // The network failed, not the token. Keep what we have - the person
      // may be on a lift with no signal, and throwing their session away
      // for that would be rude.
      return null;
    } finally {
      refreshing = null;
    }
  })();

  return refreshing;
}

// ---------------------------------------------------------------------------
// The call itself
// ---------------------------------------------------------------------------

async function request(method, path, { body, businessId, auth = true, retry = true } = {}) {
  const headers = { "Content-Type": "application/json" };

  if (auth && tokens.access) {
    headers.Authorization = `Bearer ${tokens.access}`;
  }

  // Business-scoped routes need this. Falls back to whichever shop was last
  // chosen, so a screen does not have to pass it every time.
  const biz = businessId ?? activeBusiness.id;
  if (biz) headers["X-Business-Id"] = String(biz);

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      0,
      "network",
      "Could not reach the server. Check that the backend is running."
    );
  }

  // The token expired. Refresh once and run the same call again - the person
  // should never see this happen.
  if (res.status === 401 && auth && retry && tokens.refresh) {
    const fresh = await refreshTokens();
    if (fresh) {
      return request(method, path, { body, businessId, auth, retry: false });
    }
  }

  let json = null;
  try {
    json = await res.json();
  } catch {
    /* 204, or a response with no body */
  }

  if (!res.ok || json?.ok === false) {
    const err = json?.error ?? {};
    throw new ApiError(
      res.status,
      err.code ?? "unknown",
      err.message ?? "Something went wrong.",
      err.details ?? null
    );
  }

  return json?.data ?? null;
}

export const api = {
  get: (path, opts) => request("GET", path, opts),
  post: (path, body, opts) => request("POST", path, { ...opts, body }),
  patch: (path, body, opts) => request("PATCH", path, { ...opts, body }),
  delete: (path, opts) => request("DELETE", path, opts),

  // ---- auth --------------------------------------------------------------
  auth: {
    requestOtp: (phone, dialCode = "+91") =>
      request("POST", "/api/auth/otp/request", { body: { phone, dialCode }, auth: false }),

    verifyOtp: (phone, code, dialCode = "+91") =>
      request("POST", "/api/auth/otp/verify", { body: { phone, code, dialCode }, auth: false }),

    me: () => request("GET", "/api/auth/me"),

    logout: (allDevices = false) =>
      request("POST", "/api/auth/logout", {
        body: { refreshToken: tokens.refresh ?? undefined, allDevices },
        auth: true,
      }),
  },

  // ---- is the backend even there? ----------------------------------------
  health: () => request("GET", "/health", { auth: false }),
};

export { BASE as API_BASE };
