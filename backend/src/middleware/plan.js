// ===========================================================================
// "YOUR PLAN HAS RUN OUT"
// ---------------------------------------------------------------------------
// The one middleware that stops work when a plan has expired, used on the
// routes that CREATE new bills and nowhere else.
//
// Nowhere else is the point. Reading, printing, exporting, taking a payment
// against a bill that already exists, fixing a customer's phone number -
// none of that stops, ever. A shopkeeper's own ledger is not leverage, and
// the GST return they owe the government is not something to stand in front
// of. What they pay for is making new bills, so that is what stops.
//
// 402 rather than 403, because the client has to tell this apart from "you
// are not allowed" and show a renew screen instead of an error. The code
// `plan_expired` is what the app and the website actually switch on.
// ===========================================================================

const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const entitlements = require("../modules/account/entitlements");

/**
 * Refuses the request when the shop's plan ran out more than a week ago.
 *
 * Must come after requireBusiness, which is what puts req.business there.
 */
const requireActivePlan = asyncHandler(async (req, res, next) => {
  const state = await entitlements.forBusiness(req.business.id);

  // Kept on the request so a handler can mention the grace period in what it
  // returns, without asking the database a second time.
  req.plan = state;

  if (!state.blocked) return next();

  throw new ApiError(
    402,
    "plan_expired",
    `Your ${state.planName} plan ended and the ${entitlements.GRACE_DAYS}-day grace period is over, so new bills are paused. Everything you have already is still here. Renew and it starts again straight away.`
  );
});

module.exports = { requireActivePlan };
