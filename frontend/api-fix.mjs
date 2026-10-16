// ===========================================================================
// myGallaBook - the API client
// ---------------------------------------------------------------------------
// Build 2026-10-16 15:03
//
// Run from the WEBSITE folder:
//
//     node api-fix.mjs
//     npm run dev        <- restart. Env is only read at startup.
//
// WHAT IT FIXES
// -------------
// BASE used ?? for its fallback. ?? only steps in for null and undefined, so
// a NEXT_PUBLIC_API_URL that EXISTS but is blank left BASE as an empty
// string - and every call then went to the website's OWN origin instead of
// the backend. Next answered its own POST /api/auth/otp/request with a 404,
// and the login said "Something went wrong" with the real cause written down
// nowhere.
//
// Now the value is trimmed and ANY falsy value falls back, so a blank line in
// .env.local cannot do that again.
//
// The fallback also goes back to http://localhost:4000 rather than a
// hardcoded test domain. A fallback exists to make a mistake obvious. One
// that points at a server which happens to answer hides the mistake instead -
// and the day you move to the real domain, or run a backend locally, it
// quietly keeps talking to the test box.
//
// AND IT SAYS WHICH BACKEND IT IS USING
// -------------------------------------
// One line in the browser console on first load:
//
//     [myGallaBook] API base: https://test.mygallabook.com
//
// or, when nothing is configured:
//
//     [myGallaBook] API base: http://localhost:4000  (NEXT_PUBLIC_API_URL not set)
//
// Four words in the console beat twenty minutes of wondering where a request
// actually went.
// ===========================================================================

import { writeFileSync, existsSync, readFileSync, copyFileSync } from "node:fs";
import { join } from "node:path";

const FILE = "// ===========================================================================\n// THE API CLIENT\n// ---------------------------------------------------------------------------\n// Everything the website sends to the backend goes through here. It handles\n// the three things every screen would otherwise have to handle itself:\n//\n//   1. Attaching the access token, and the business id where one is needed.\n//   2. Refreshing the token when it expires - and retrying the call, so the\n//      person never sees a flicker. The access token only lives 15 minutes,\n//      so this happens constantly.\n//   3. Turning every failure into one predictable shape, so a form can read\n//      error.fields and show a message under the right input.\n//\n// It does NOT fall back to a demo mode when the backend is down. A login\n// that quietly pretends to work is worse than one that says it cannot.\n// ===========================================================================\n\n// ?? was wrong here. It only steps in for null and undefined, so a\n// NEXT_PUBLIC_API_URL that EXISTS but is blank - an empty line in .env.local,\n// a value that got cleared, a host panel field saved empty - left BASE as \"\".\n// Every call then went to the website's own origin instead of the backend,\n// and Next answered its own /api/auth/otp/request with a 404. The login just\n// said \"something went wrong\", with nothing anywhere naming the real cause.\n//\n// So: trim it, and fall back on anything falsy rather than only on null.\nconst CONFIGURED = (process.env.NEXT_PUBLIC_API_URL || \"\").trim().replace(/\\/$/, \"\");\nconst BASE = CONFIGURED || \"http://localhost:4000\";\n\n// Said once, in the browser, when the site is pointed at a backend that is\n// not the local one. Four words in the console beat twenty minutes of\n// wondering which URL a request actually went to.\nif (typeof window !== \"undefined\" && !window.__apiBaseLogged) {\n  window.__apiBaseLogged = true;\n  // eslint-disable-next-line no-console\n  console.info(`[myGallaBook] API base: ${BASE}${CONFIGURED ? \"\" : \"  (NEXT_PUBLIC_API_URL not set)\"}`);\n}\n\nconst ACCESS_KEY = \"mygallabook.access\";\nconst REFRESH_KEY = \"mygallabook.refresh\";\nconst BUSINESS_KEY = \"mygallabook.business\";\n\n// ---------------------------------------------------------------------------\n// Where the tokens live\n// ---------------------------------------------------------------------------\n// localStorage, which is the practical choice for an app like this: the API\n// is on a different origin, so httpOnly cookies would need CSRF handling and\n// a shared domain. The trade is that a cross-site scripting bug could read\n// the token - which is why the access token is short-lived and the refresh\n// token can be revoked from the server.\n//\n// Every read is wrapped: localStorage throws in private browsing on some\n// browsers, and a crash in a getter would take the whole app down.\n\nfunction read(key) {\n  if (typeof window === \"undefined\") return null;\n  try {\n    return window.localStorage.getItem(key);\n  } catch {\n    return null;\n  }\n}\n\nfunction write(key, value) {\n  if (typeof window === \"undefined\") return;\n  try {\n    if (value == null) window.localStorage.removeItem(key);\n    else window.localStorage.setItem(key, value);\n  } catch {\n    // private browsing - the session just will not survive a reload\n  }\n}\n\nexport const tokens = {\n  get access() {\n    return read(ACCESS_KEY);\n  },\n  get refresh() {\n    return read(REFRESH_KEY);\n  },\n  set({ accessToken, refreshToken }) {\n    write(ACCESS_KEY, accessToken ?? null);\n    if (refreshToken !== undefined) write(REFRESH_KEY, refreshToken ?? null);\n  },\n  clear() {\n    write(ACCESS_KEY, null);\n    write(REFRESH_KEY, null);\n  },\n};\n\nexport const activeBusiness = {\n  get id() {\n    return read(BUSINESS_KEY);\n  },\n  set(id) {\n    write(BUSINESS_KEY, id == null ? null : String(id));\n  },\n};\n\n// ---------------------------------------------------------------------------\n// The error every call throws\n// ---------------------------------------------------------------------------\n\nexport class ApiError extends Error {\n  constructor(status, code, message, fields) {\n    super(message);\n    this.name = \"ApiError\";\n    this.status = status;\n    this.code = code;\n    this.fields = fields ?? null;\n  }\n\n  /** True when the backend could not be reached at all. */\n  get isOffline() {\n    return this.code === \"network\";\n  }\n}\n\n// ---------------------------------------------------------------------------\n// Refreshing\n// ---------------------------------------------------------------------------\n// Single-flight: if five requests expire at the same moment, they must not\n// each fire their own refresh. The first one starts it and the rest wait on\n// the same promise. Without this, four of the five refreshes present a token\n// that the first one has already rotated away - which the backend correctly\n// treats as token theft and ends every session.\n\nlet refreshing = null;\n\nasync function refreshTokens() {\n  if (refreshing) return refreshing;\n\n  const refreshToken = tokens.refresh;\n  if (!refreshToken) return null;\n\n  refreshing = (async () => {\n    try {\n      const res = await fetch(`${BASE}/api/auth/refresh`, {\n        method: \"POST\",\n        headers: { \"Content-Type\": \"application/json\" },\n        body: JSON.stringify({ refreshToken }),\n      });\n\n      if (!res.ok) {\n        tokens.clear();\n        return null;\n      }\n\n      const json = await res.json();\n      tokens.set({\n        accessToken: json.data.accessToken,\n        refreshToken: json.data.refreshToken,\n      });\n      return json.data;\n    } catch {\n      // The network failed, not the token. Keep what we have - the person\n      // may be on a lift with no signal, and throwing their session away\n      // for that would be rude.\n      return null;\n    } finally {\n      refreshing = null;\n    }\n  })();\n\n  return refreshing;\n}\n\n// ---------------------------------------------------------------------------\n// The call itself\n// ---------------------------------------------------------------------------\n\nasync function request(method, path, { body, businessId, auth = true, retry = true } = {}) {\n  const headers = { \"Content-Type\": \"application/json\" };\n\n  if (auth && tokens.access) {\n    headers.Authorization = `Bearer ${tokens.access}`;\n  }\n\n  // Business-scoped routes need this. Falls back to whichever shop was last\n  // chosen, so a screen does not have to pass it every time.\n  const biz = businessId ?? activeBusiness.id;\n  if (biz) headers[\"X-Business-Id\"] = String(biz);\n\n  let res;\n  try {\n    res = await fetch(`${BASE}${path}`, {\n      method,\n      headers,\n      body: body === undefined ? undefined : JSON.stringify(body),\n    });\n  } catch {\n    throw new ApiError(\n      0,\n      \"network\",\n      \"Could not reach the server. Check that the backend is running.\"\n    );\n  }\n\n  // The token expired. Refresh once and run the same call again - the person\n  // should never see this happen.\n  if (res.status === 401 && auth && retry && tokens.refresh) {\n    const fresh = await refreshTokens();\n    if (fresh) {\n      return request(method, path, { body, businessId, auth, retry: false });\n    }\n  }\n\n  let json = null;\n  try {\n    json = await res.json();\n  } catch {\n    /* 204, or a response with no body */\n  }\n\n  if (!res.ok || json?.ok === false) {\n    const err = json?.error ?? {};\n    throw new ApiError(\n      res.status,\n      err.code ?? \"unknown\",\n      err.message ?? \"Something went wrong.\",\n      err.details ?? null\n    );\n  }\n\n  return json?.data ?? null;\n}\n\nexport const api = {\n  get: (path, opts) => request(\"GET\", path, opts),\n  post: (path, body, opts) => request(\"POST\", path, { ...opts, body }),\n  patch: (path, body, opts) => request(\"PATCH\", path, { ...opts, body }),\n  delete: (path, opts) => request(\"DELETE\", path, opts),\n\n  // ---- auth --------------------------------------------------------------\n  auth: {\n    requestOtp: (phone, dialCode = \"+91\") =>\n      request(\"POST\", \"/api/auth/otp/request\", { body: { phone, dialCode }, auth: false }),\n\n    verifyOtp: (phone, code, dialCode = \"+91\") =>\n      request(\"POST\", \"/api/auth/otp/verify\", { body: { phone, code, dialCode }, auth: false }),\n\n    me: () => request(\"GET\", \"/api/auth/me\"),\n\n    logout: (allDevices = false) =>\n      request(\"POST\", \"/api/auth/logout\", {\n        body: { refreshToken: tokens.refresh ?? undefined, allDevices },\n        auth: true,\n      }),\n  },\n\n  // ---- is the backend even there? ----------------------------------------\n  health: () => request(\"GET\", \"/health\", { auth: false }),\n};\n\nexport { BASE as API_BASE };\n";
const here = process.cwd();

console.log("");
console.log("  myGallaBook - the API client");
console.log("  " + "-".repeat(58));
console.log("  Build 2026-10-16 15:03");
console.log("");

if (!(existsSync(join(here, "package.json")) && existsSync(join(here, "lib")) && existsSync(join(here, "app")))) {
  console.log("  This is not the website folder:");
  console.log("      " + here);
  console.log("");
  console.log("  Run it from the one with app/ and lib/ in it.");
  console.log("  Nothing has been written.");
  console.log("");
  process.exit(1);
}

const target = join(here, "lib", "api.js");
if (existsSync(target)) {
  if (readFileSync(target, "utf8") === FILE) {
    console.log("  already up to date");
    console.log("");
    process.exit(0);
  }
  copyFileSync(target, target + ".bak");
  console.log("  lib/api.js replaced  (your old one is lib/api.js.bak)");
} else {
  console.log("  lib/api.js written");
}
writeFileSync(target, FILE);

console.log("");
console.log("  RESTART THE DEV SERVER");
console.log("  " + "-".repeat(58));
console.log("      Ctrl+C, then  npm run dev");
console.log("");
console.log("  Then open the site and press F12. The FIRST line in the Console");
console.log("  tab names the backend the page is talking to.");
console.log("");
console.log("  If it says localhost:4000 when you expected the hosted one, then");
console.log("  NEXT_PUBLIC_API_URL is not reaching the code - and you can see");
console.log("  that in one second instead of guessing at it.");
console.log("");
