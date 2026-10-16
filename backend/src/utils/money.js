// ===========================================================================
// MONEY
// ---------------------------------------------------------------------------
// EVERY amount in this system is an integer number of PAISE. Nothing is ever
// stored or calculated as a floating point rupee value.
//
// Why: 0.1 + 0.2 === 0.30000000000000004 in JavaScript. On one invoice that
// is invisible; across a year of a shop's books it becomes a mismatch your
// customer will find and you will not be able to explain. Integers cannot
// drift.
//
// So: 4250.75 rupees is stored as 425075. Converting happens at the edges -
// when a request comes in and when a response goes out - and nowhere else.
//
// The range is fine: a BIGINT of paise holds far more than
// Number.MAX_SAFE_INTEGER rupees, and no Indian small business will come
// close to 90,07,19,92,54,740 rupees on one invoice.
// ===========================================================================

const ApiError = require("./ApiError");

/** Rupees (a number or a numeric string) to paise. Throws on nonsense. */
function toPaise(rupees, field = "amount") {
  const n = typeof rupees === "string" ? Number(rupees) : rupees;

  if (typeof n !== "number" || !Number.isFinite(n)) {
    throw ApiError.badRequest(`${field} must be a number`);
  }
  if (n < 0) {
    throw ApiError.badRequest(`${field} cannot be negative`);
  }

  // Multiply then round, rather than rounding a float: 19.99 * 100 is
  // 1998.9999999999998, which truncates to 1998 and loses a paisa.
  const paise = Math.round(n * 100);

  if (!Number.isSafeInteger(paise)) {
    throw ApiError.badRequest(`${field} is too large`);
  }
  return paise;
}

/** Paise back to rupees, for a response. Always 2 decimal places. */
function toRupees(paise) {
  return Number((Number(paise ?? 0) / 100).toFixed(2));
}

/**
 * Multiply paise by a quantity that may have decimals (1.5 kg, 2.25 metres).
 * Rounds half away from zero, which is what a till does.
 */
function mulQty(paise, qty) {
  return Math.round(Number(paise) * Number(qty));
}

/**
 * A percentage of an amount, in paise. rate is a percentage like 18 or 2.5.
 */
function percentOf(paise, rate) {
  return Math.round((Number(paise) * Number(rate)) / 100);
}

/**
 * Splits an amount into two halves that still add up to the original.
 * CGST and SGST are each half the tax - but half of 1501 paise is 750.5,
 * and rounding both to 751 would invent a paisa out of nothing. So one
 * half takes the odd paisa.
 */
function halve(paise) {
  const a = Math.floor(paise / 2);
  return [paise - a, a];
}

/**
 * The rounding line on an invoice. Indian invoices usually settle to a whole
 * rupee, and the difference is shown as "Round off" so the arithmetic on the
 * paper still adds up.
 */
function roundToRupee(paise) {
  const rounded = Math.round(paise / 100) * 100;
  return { rounded, roundOff: rounded - paise };
}

/** For printing: 425075 -> "4,250.75" in the Indian digit grouping. */
function formatIndian(paise) {
  const neg = paise < 0;
  const abs = Math.abs(Number(paise));
  const rupees = Math.floor(abs / 100);
  const p = String(abs % 100).padStart(2, "0");

  const s = String(rupees);
  // Indian grouping: last three digits, then pairs. 1234567 -> 12,34,567
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3);
  const grouped = rest
    ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3
    : last3;

  return `${neg ? "-" : ""}${grouped}.${p}`;
}

module.exports = {
  toPaise,
  toRupees,
  mulQty,
  percentOf,
  halve,
  roundToRupee,
  formatIndian,
};
