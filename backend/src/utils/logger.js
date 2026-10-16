// ===========================================================================
// LOGGING
// ---------------------------------------------------------------------------
// Structured JSON in production so a log service can search it; readable
// lines in development.
//
// The redact list matters: logs get shipped, copied and read by people who
// have no business seeing a token or an OTP.
// ===========================================================================

const pino = require("pino");
const config = require("../config");

const logger = pino({
  level: config.logLevel,
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "*.password",
      "*.token",
      "*.refreshToken",
      "*.accessToken",
      "*.code",
      "*.code_hash",
      "*.otp",
    ],
    censor: "[redacted]",
  },
  ...(config.isProd
    ? {}
    : { transport: { target: "pino/file", options: { destination: 1 } } }),
});

module.exports = logger;
