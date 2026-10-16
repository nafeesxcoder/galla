// ===========================================================================
// Price formatting helpers
// ---------------------------------------------------------------------------
// content.js stores prices as plain numbers, so the "per month" line is
// always worked out from the real price instead of being typed by hand.
// ===========================================================================

export function rupees(n) {
  return "₹" + Number(n).toLocaleString("en-IN");
}

export function perMonth(total, years) {
  const months = 12 * years;
  const v = total / months;
  // keep the paise, the way a per-month figure is usually shown
  return "₹" + v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
