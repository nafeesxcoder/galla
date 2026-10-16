// ===========================================================================
// ApiError - an error that knows its HTTP status
// ---------------------------------------------------------------------------
// Anything thrown that is NOT an ApiError is treated as a bug: the client
// gets a generic 500 and the real detail goes to the log, never to the
// response. Leaking a stack trace tells an attacker about your stack.
// ===========================================================================

class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    if (details) this.details = details;
    Error.captureStackTrace?.(this, ApiError);
  }

  static badRequest(msg = "Bad request", details) {
    return new ApiError(400, "bad_request", msg, details);
  }
  static unauthorized(msg = "Sign in to continue") {
    return new ApiError(401, "unauthorized", msg);
  }
  static forbidden(msg = "You do not have access to this") {
    return new ApiError(403, "forbidden", msg);
  }
  static notFound(msg = "Not found") {
    return new ApiError(404, "not_found", msg);
  }
  static conflict(msg = "That conflicts with something that already exists") {
    return new ApiError(409, "conflict", msg);
  }
  static unprocessable(msg = "Could not process that", details) {
    return new ApiError(422, "unprocessable", msg, details);
  }
  static tooMany(msg = "Too many requests. Try again shortly.") {
    return new ApiError(429, "too_many_requests", msg);
  }
}

module.exports = ApiError;
