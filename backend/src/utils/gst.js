// ===========================================================================
// GST
// ---------------------------------------------------------------------------
// The one rule that decides everything here:
//
//   supplier's state === place of supply  ->  CGST + SGST  (intra-state)
//   supplier's state !== place of supply  ->  IGST         (inter-state)
//
// "Place of supply" is normally the customer's state. For a counter sale to
// a walk-in with no address it is the supplier's own state, so a shop selling
// over the counter always charges CGST + SGST.
//
// IMPORTANT, and worth saying plainly: this file computes tax from the rates
// and the state codes it is GIVEN. Whether those rates and codes are right
// for what is being sold is the business's responsibility, not the software's.
// HSN classification and rate selection are a tax question, not a code
// question - the shopkeeper's CA decides them.
// ===========================================================================

const { mulQty, percentOf, halve, roundToRupee } = require("./money");
const ApiError = require("./ApiError");

// The GST state codes, as they appear in the first two digits of a GSTIN.
const STATE_CODES = {
  "01": "Jammu and Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  10: "Bihar",
  11: "Sikkim",
  12: "Arunachal Pradesh",
  13: "Nagaland",
  14: "Manipur",
  15: "Mizoram",
  16: "Tripura",
  17: "Meghalaya",
  18: "Assam",
  19: "West Bengal",
  20: "Jharkhand",
  21: "Odisha",
  22: "Chhattisgarh",
  23: "Madhya Pradesh",
  24: "Gujarat",
  26: "Dadra and Nagar Haveli and Daman and Diu",
  27: "Maharashtra",
  29: "Karnataka",
  30: "Goa",
  31: "Lakshadweep",
  32: "Kerala",
  33: "Tamil Nadu",
  34: "Puducherry",
  35: "Andaman and Nicobar Islands",
  36: "Telangana",
  37: "Andhra Pradesh",
  38: "Ladakh",
  97: "Other Territory",
};

/**
 * Checks the SHAPE of a GSTIN and its check digit. It does NOT tell you the
 * number is real or active - only the GST portal can say that.
 *
 * Format: 22AAAAA0000A1Z5
 *   2  state code
 *   10 PAN
 *   1  entity number for that PAN in that state
 *   1  always 'Z'
 *   1  check digit
 */
function isValidGstinFormat(gstin) {
  if (typeof gstin !== "string") return false;
  const g = gstin.trim().toUpperCase();

  if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(g)) {
    return false;
  }
  if (!STATE_CODES[g.slice(0, 2)]) return false;

  return g[14] === gstinCheckDigit(g.slice(0, 14));
}

/** The GSTIN check digit, by the official algorithm. */
function gstinCheckDigit(first14) {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let sum = 0;

  for (let i = 0; i < 14; i++) {
    const v = chars.indexOf(first14[i]);
    if (v < 0) return null;
    // Alternating weight of 1 and 2, starting at 1
    const product = v * (i % 2 === 0 ? 1 : 2);
    sum += Math.floor(product / 36) + (product % 36);
  }

  return chars[(36 - (sum % 36)) % 36];
}

/** The state code out of a GSTIN - the first two digits. */
function stateCodeFromGstin(gstin) {
  if (typeof gstin !== "string" || gstin.length < 2) return null;
  const code = gstin.slice(0, 2);
  return STATE_CODES[code] ? code : null;
}

/**
 * Works out one invoice line.
 *
 * All money in and out is PAISE.
 *
 *   qty         how many (may have decimals - 1.5 kg)
 *   ratePaise   price per unit
 *   discount    either { type: "percent", value: 10 } or
 *                      { type: "amount", valuePaise: 5000 }
 *   taxRate     a percentage: 0, 5, 12, 18, 28
 *   interState  true -> IGST, false -> CGST + SGST
 *   taxInclusive  true if ratePaise already contains the tax, which is how
 *                 MRP-priced goods are sold
 */
function computeLine({
  qty,
  ratePaise,
  discount = null,
  taxRate = 0,
  interState = false,
  taxInclusive = false,
}) {
  if (!Number.isFinite(Number(qty)) || Number(qty) <= 0) {
    throw ApiError.badRequest("Quantity must be more than zero");
  }
  if (Number(taxRate) < 0 || Number(taxRate) > 100) {
    throw ApiError.badRequest("Tax rate must be between 0 and 100");
  }

  const gross = mulQty(ratePaise, qty);

  let discountPaise = 0;
  if (discount) {
    if (discount.type === "percent") {
      discountPaise = percentOf(gross, discount.value);
    } else if (discount.type === "amount") {
      discountPaise = Math.round(Number(discount.valuePaise));
    }
    if (discountPaise < 0) throw ApiError.badRequest("Discount cannot be negative");
    if (discountPaise > gross) {
      throw ApiError.badRequest("Discount cannot be more than the line amount");
    }
  }

  const afterDiscount = gross - discountPaise;

  // With an MRP-style inclusive price, the taxable value is what is left
  // once the tax already inside the price is taken back out.
  let taxable;
  let taxTotal;
  if (taxInclusive && Number(taxRate) > 0) {
    taxable = Math.round((afterDiscount * 100) / (100 + Number(taxRate)));
    taxTotal = afterDiscount - taxable;
  } else {
    taxable = afterDiscount;
    taxTotal = percentOf(taxable, taxRate);
  }

  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (interState) {
    igst = taxTotal;
  } else {
    // Half each, with the odd paisa going to CGST so the two still add up
    // to the total rather than inventing or losing a paisa.
    [cgst, sgst] = halve(taxTotal);
  }

  return {
    grossPaise: gross,
    discountPaise,
    taxablePaise: taxable,
    taxRate: Number(taxRate),
    cgstPaise: cgst,
    sgstPaise: sgst,
    igstPaise: igst,
    taxPaise: taxTotal,
    totalPaise: taxable + taxTotal,
  };
}

/**
 * Adds the lines up into the invoice totals, and works out the round-off.
 * Totals are summed from the per-line figures that are actually stored, so
 * what is printed always matches what is in the database.
 */
function computeTotals(lines, { roundOff = true } = {}) {
  const t = lines.reduce(
    (acc, l) => ({
      grossPaise: acc.grossPaise + l.grossPaise,
      discountPaise: acc.discountPaise + l.discountPaise,
      taxablePaise: acc.taxablePaise + l.taxablePaise,
      cgstPaise: acc.cgstPaise + l.cgstPaise,
      sgstPaise: acc.sgstPaise + l.sgstPaise,
      igstPaise: acc.igstPaise + l.igstPaise,
      taxPaise: acc.taxPaise + l.taxPaise,
    }),
    {
      grossPaise: 0,
      discountPaise: 0,
      taxablePaise: 0,
      cgstPaise: 0,
      sgstPaise: 0,
      igstPaise: 0,
      taxPaise: 0,
    }
  );

  const beforeRounding = t.taxablePaise + t.taxPaise;

  if (!roundOff) {
    return { ...t, roundOffPaise: 0, totalPaise: beforeRounding };
  }

  const { rounded, roundOff: off } = roundToRupee(beforeRounding);
  return { ...t, roundOffPaise: off, totalPaise: rounded };
}

/**
 * Which tax applies. Pass the supplier's state code and the place of supply.
 * With no place of supply - a walk-in with no address - it is a local sale.
 */
function isInterState(supplierStateCode, placeOfSupplyCode) {
  if (!placeOfSupplyCode) return false;
  return String(supplierStateCode) !== String(placeOfSupplyCode);
}

module.exports = {
  STATE_CODES,
  isValidGstinFormat,
  gstinCheckDigit,
  stateCodeFromGstin,
  computeLine,
  computeTotals,
  isInterState,
};
