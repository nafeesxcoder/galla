// ===========================================================================
// AUTHENTICATION AND ACCESS
// ---------------------------------------------------------------------------
// Two separate questions, deliberately kept apart:
//
//   requireAuth      Who are you?        -> req.user
//   requireBusiness  May you touch THIS  -> req.business, req.membership
//                    business's data?
//
// The second one is the important one in a multi-tenant system. Every route
// that reads or writes business data goes through it, and every query filters
// on req.business.id. One forgotten filter is one shopkeeper reading another
// shopkeeper's sales.
// ===========================================================================

const jwt = require("jsonwebtoken");
const config = require("../config");
const db = require("../db");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

/** Pulls "Bearer xxx" out of the Authorization header. */
function bearer(req) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith("Bearer ")) return null;
  return h.slice(7).trim() || null;
}

const requireAuth = asyncHandler(async (req, res, next) => {
  const token = bearer(req);
  if (!token) throw ApiError.unauthorized();

  let payload;
  try {
    payload = jwt.verify(token, config.jwt.secret, {
      issuer: config.jwt.issuer,
    });
  } catch (e) {
    if (e.name === "TokenExpiredError") {
      // Told apart from an invalid token on purpose: the client should
      // refresh and retry, not throw the person back to the login screen.
      throw new ApiError(401, "token_expired", "Your session expired. Refreshing.");
    }
    throw ApiError.unauthorized("That session is not valid.");
  }

  if (payload.typ !== "access") {
    // A refresh token must never be accepted as an access token.
    throw ApiError.unauthorized("Wrong kind of token.");
  }

  const user = await db("users").where({ id: payload.sub }).first();
  if (!user) throw ApiError.unauthorized("That account no longer exists.");
  if (user.is_blocked) throw ApiError.forbidden("This account has been blocked.");

  req.user = user;
  next();
});

/**
 * Checks the caller is a member of the business named in the request, and
 * loads both the business and their membership.
 *
 * The business id comes from the X-Business-Id header, or :businessId in the
 * path. It is NEVER taken from the body - a body field is too easy to send
 * by accident from a form that happens to have one.
 */
function requireBusiness(minRole = "staff") {
  const ORDER = { viewer: 0, staff: 1, manager: 2, owner: 3 };

  return asyncHandler(async (req, res, next) => {
    if (!req.user) throw ApiError.unauthorized();

    const raw = req.headers["x-business-id"] ?? req.params.businessId;
    const businessId = Number.parseInt(raw, 10);

    if (!businessId || Number.isNaN(businessId)) {
      throw ApiError.badRequest(
        "Which business? Send the X-Business-Id header."
      );
    }

    const membership = await db("business_members")
      .where({ business_id: businessId, user_id: req.user.id, is_active: true })
      .first();

    // Deliberately a 404, not a 403. Telling somebody "that business exists
    // but you cannot see it" tells them it exists.
    if (!membership) throw ApiError.notFound("Business not found.");

    if (ORDER[membership.role] < ORDER[minRole]) {
      throw ApiError.forbidden(
        `This needs ${minRole} access. You are ${membership.role}.`
      );
    }

    const business = await db("businesses")
      .where({ id: businessId })
      .whereNull("deleted_at")
      .first();

    if (!business) throw ApiError.notFound("Business not found.");

    req.business = business;
    req.membership = membership;
    next();
  });
}

module.exports = { requireAuth, requireBusiness, bearer };
