// ===========================================================================
// asyncHandler - lets a route handler be async without try/catch
// ---------------------------------------------------------------------------
// Express 4 does not catch a rejected promise from a handler: the request
// just hangs until it times out. Wrapping every async handler in this sends
// the rejection to the error middleware instead.
// ===========================================================================

module.exports = function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
