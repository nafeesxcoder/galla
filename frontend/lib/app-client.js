// ===========================================================================
// THE APP AREA'S WAY IN TO lib/api.js
// ---------------------------------------------------------------------------
// The login and the account pages already had a working api module before
// the app area existed. Replacing it was a mistake - it exports things those
// screens import, and dropping any of them breaks the build.
//
// So this sits on top of the original instead and leaves it alone. It works
// out what that module offers and calls it accordingly, which means a
// difference in how it is shaped - api.get versus a bare request, data
// wrapped in { ok, data } or not - costs nothing here.
//
// Everything the app area sends to the server goes through this file. If the
// api module is ever renamed or reshaped, this is the only place that needs
// to know.
// ===========================================================================

import * as ApiModule from "./api";

// Copied into a plain object on purpose. Reading Api.something straight off
// an import * namespace is checked at build time, and asking for a name that
// module happens not to export fails the build outright - which defeats the
// whole point of looking to see what is there. Spreading it first turns
// those into ordinary property reads.
const Api = { ...ApiModule };

// ---------------------------------------------------------------------------
// the error type
// ---------------------------------------------------------------------------
// Use the original's if it has one, so an error thrown by the login screen
// and an error thrown here are the same kind of thing and `instanceof` holds.
class LocalApiError extends Error {
  constructor(message, { status = 0, code = "error", fields = null, body = null } = {}) {
    super(message || "Something went wrong.");
    this.name = "ApiError";
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

export const ApiError = Api.ApiError || LocalApiError;

// ---------------------------------------------------------------------------
// which business is active
// ---------------------------------------------------------------------------
// The original module keeps this, under one of several plausible shapes. It
// is read rather than stored again here: two places remembering which shop
// is open is how you end up billing into the wrong one.
function currentBusinessId() {
  const ab = Api.activeBusiness;
  try {
    if (ab == null) {
      if (typeof Api.getBusinessId === "function") return Api.getBusinessId();
      return undefined;
    }
    if (typeof ab === "function") return ab();
    if (typeof ab === "object") {
      if (typeof ab.get === "function") return ab.get();
      if (ab.id !== undefined) return ab.id;
      if (ab.value !== undefined) return ab.value;
      return undefined;
    }
    return ab;
  } catch {
    return undefined;
  }
}

// ---------------------------------------------------------------------------
// the call
// ---------------------------------------------------------------------------
// The api object's own methods come first, because that is the surface the
// rest of the site already uses and so the one certain to behave. A bare
// request() is the fallback.
function buildRequest() {
  const obj = Api.api || Api.default;

  if (obj && typeof obj === "object") {
    const byMethod = {
      GET: obj.get,
      POST: obj.post,
      PATCH: obj.patch,
      PUT: obj.put,
      DELETE: obj.del || obj.delete || obj.remove,
    };
    if (typeof byMethod.GET === "function" && typeof byMethod.POST === "function") {
      return (method, path, options = {}) => {
        const fn = byMethod[method];
        if (typeof fn !== "function") {
          throw new ApiError(`lib/api.js has no ${method.toLowerCase()} method.`, {
            status: 405,
            code: "unsupported",
          });
        }
        // Reads take (path, options). Writes take (path, body, options).
        return method === "GET" || method === "DELETE"
          ? fn.call(obj, path, options)
          : fn.call(obj, path, options.body, options);
      };
    }
  }

  const bare =
    typeof Api.request === "function"
      ? Api.request
      : obj && typeof obj.request === "function"
      ? obj.request.bind(obj)
      : null;

  if (bare) return (method, path, options = {}) => bare(method, path, options);

  throw new ApiError(
    "lib/api.js does not export an api object or a request function the app area can use.",
    { code: "config" }
  );
}

let call = null;

// Some api modules hand back the whole { ok, data } envelope and some have
// already unwrapped it. Either is fine; this settles it in one place.
function unwrap(value) {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    "data" in value &&
    ("ok" in value || "success" in value)
  ) {
    return value.data;
  }
  return value;
}

async function request(method, path, options = {}) {
  if (!call) call = buildRequest();
  const businessId = options.businessId !== undefined ? options.businessId : currentBusinessId();
  const out = await call(method, path, businessId ? { ...options, businessId } : options);
  return unwrap(out);
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
// A list endpoint may answer with a bare array or with an object carrying a
// count for paging. Flatten both so a screen can just map over the result.
export function rowsOf(result) {
  if (!result) return [];
  if (Array.isArray(result)) return result;
  for (const key of ["rows", "items", "data", "results", "list"]) {
    if (Array.isArray(result[key])) return result[key];
  }
  return [];
}

export function totalOf(result, fallback) {
  if (result && typeof result === "object" && !Array.isArray(result)) {
    for (const key of ["total", "count", "totalCount"]) {
      if (typeof result[key] === "number") return result[key];
    }
  }
  return fallback == null ? rowsOf(result).length : fallback;
}

// A query string that leaves out anything empty, so we never send ?search=
export function qs(params) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params || {})) {
    if (v === undefined || v === null || v === "") continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export default api;
