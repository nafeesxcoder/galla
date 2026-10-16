// ===========================================================================
// THE EXPRESS APP
// ---------------------------------------------------------------------------
// Built separately from the server so tests can mount it without opening a
// port.
// ===========================================================================

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const pinoHttp = require("pino-http");

const config = require("./config");
const logger = require("./utils/logger");
const limits = require("./middleware/rateLimit");
const { notFound, errorHandler } = require("./middleware/error");

const app = express();

// Behind Vercel, nginx or a load balancer, req.ip is the proxy's address
// unless this is set - which would make every rate limit count the whole
// internet as one visitor.
app.set("trust proxy", 1);

// Two origins that are allowed without being listed in CORS_ORIGINS.
//
// The desktop app, always. Tauri serves the app from its own scheme, and no
// web page can claim it, so this grants nothing to anybody else. Without it
// an installed .exe cannot reach the server at all.
//
// Any localhost origin, in development only. Expo serves on 8081, the website
// on 3000, a second window picks 3001 - listing every one of them is busywork
// whose only product is a blank screen with an unhelpful error. A deployed
// server never sees NODE_ENV as development, and would not trust a localhost
// origin if it did: that would be a page on a customer's own computer talking
// to live data.
const DESKTOP_ORIGINS = new Set([
  "tauri://localhost",
  "http://tauri.localhost",
  "https://tauri.localhost",
]);

function isAppOrigin(origin) {
  if (DESKTOP_ORIGINS.has(origin)) return true;
  // config.isProd, not process.env. The config module reads the environment
  // once at boot and says so in its own comment - "nothing else in the
  // codebase touches process.env" - and it is right: reading NODE_ENV here
  // directly got the wrong answer, because .env sets it and this file is
  // loaded after that. One source of truth, and it is config.
  if (config.isProd) return false;
  try {
    const { hostname } = new URL(origin);
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
  } catch {
    return false;
  }
}

app.use(helmet());
app.use(
  cors({
    origin(origin, cb) {
      // No origin means a server-to-server call or curl, which CORS does
      // not apply to anyway.
      if (!origin) return cb(null, true);
      if (config.corsOrigins.includes(origin)) return cb(null, true);
      // The desktop app, and in development anything on localhost. See the
      // note above isAppOrigin.
      if (isAppOrigin(origin)) return cb(null, true);
      cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Business-Id"],
  })
);

// A 1mb body is plenty for an invoice with a hundred lines, and a cap stops
// a single request eating the server's memory.
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

if (!config.isTest) {
  app.use(
    pinoHttp({
      logger,
      // Health checks every few seconds would drown everything else.
      autoLogging: { ignore: (req) => req.url.startsWith("/health") },
    })
  );
}

app.use(limits.general);

// ---- routes --------------------------------------------------------------
app.use("/health", require("./modules/health/routes"));
// ---- is anybody there ----------------------------------------------------
// Deliberately open to every origin, and deliberately empty. When the app
// cannot reach this server the browser will not say whether nothing is
// listening or whether CORS refused the request, and the two have completely
// different fixes. This answers that question and nothing else - no data, no
// session, nothing about the shop.
app.get("/api/ping", (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Cross-Origin-Resource-Policy", "cross-origin");
  res.json({ ok: true, data: { up: true, at: new Date().toISOString() } });
});

app.use("/api/auth", require("./modules/auth/routes"));
app.use("/api/plans", require("./modules/plans/routes"));
// The account desk the public website shows after login: plans, expiry,
// licence keys. Not the billing app - see the file's own note.
app.use("/api/account", require("./modules/account/routes"));
app.use("/api/businesses", require("./modules/businesses/routes"));
app.use("/api/parties", require("./modules/parties/routes"));
app.use("/api/items", require("./modules/items/routes"));
// Mounted BEFORE /api/invoices, so that "numbering" is not swallowed by
// the :id route in the invoices router and read as invoice number
// "numbering".
app.use("/api/invoices/numbering", require("./modules/invoices/numbering"));
app.use("/api/invoices", require("./modules/invoices/routes"));
app.use("/api/payments", require("./modules/payments/routes"));
app.use("/api/expenses", require("./modules/expenses/routes"));
app.use("/api/cashbank", require("./modules/cashbank/routes"));
app.use("/api/loans", require("./modules/loans/routes"));
app.use("/api/backup", require("./modules/backup/routes"));

// ---- the end of the line -------------------------------------------------
app.use(notFound);
app.use(errorHandler);

module.exports = app;
