// ===========================================================================
// ERROR HANDLING
// ---------------------------------------------------------------------------
// Every error in the app ends up here. Two rules:
//
//   1. An ApiError is something we meant to tell the client. Pass it on.
//   2. Anything else is a bug. The client gets a generic 500; the real
//      error goes to the log. A stack trace in a response is a map of your
//      codebase handed to whoever asked for it.
// ===========================================================================

const ApiError = require("../utils/ApiError");
const logger = require("../utils/logger");

function notFound(req, res, next) {
  next(ApiError.notFound(`No route for ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars -- Express needs all four
function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      ok: false,
      error: { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) },
    });
  }

  // MySQL errors that mean something a user can act on
  if (err && err.code === "ER_DUP_ENTRY") {
    logger.warn({ err }, "duplicate entry");
    return res.status(409).json({
      ok: false,
      error: { code: "conflict", message: "That already exists." },
    });
  }
  if (err && err.code === "ER_NO_REFERENCED_ROW_2") {
    return res.status(400).json({
      ok: false,
      error: { code: "bad_reference", message: "That refers to something which does not exist." },
    });
  }
  if (err && (err.code === "ECONNREFUSED" || err.code === "PROTOCOL_CONNECTION_LOST")) {
    logger.error({ err }, "database unreachable");
    return res.status(503).json({
      ok: false,
      error: { code: "unavailable", message: "The service is temporarily unavailable." },
    });
  }

  // Anything else is ours to fix.
  logger.error({ err, url: req.originalUrl, method: req.method }, "unhandled error");
  res.status(500).json({
    ok: false,
    error: { code: "internal", message: "Something went wrong at our end." },
  });
}

module.exports = { notFound, errorHandler };
