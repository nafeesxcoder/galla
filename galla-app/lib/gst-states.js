// ===========================================================================
// STATES AND UNION TERRITORIES, WITH THEIR GST CODES
// ---------------------------------------------------------------------------
// The two-digit code is the first two characters of every GSTIN, and it is
// what decides whether a bill carries CGST + SGST or IGST. So this list is
// not decoration - get a code wrong and every bill to that customer has the
// wrong tax on it.
//
// Ordered alphabetically because that is how somebody looks for their state
// in a dropdown, not by code.
// ===========================================================================

export const GST_STATES = [
  { code: "35", name: "Andaman and Nicobar Islands" },
  { code: "37", name: "Andhra Pradesh" },
  { code: "12", name: "Arunachal Pradesh" },
  { code: "18", name: "Assam" },
  { code: "10", name: "Bihar" },
  { code: "04", name: "Chandigarh" },
  { code: "22", name: "Chhattisgarh" },
  { code: "26", name: "Dadra and Nagar Haveli and Daman and Diu" },
  { code: "07", name: "Delhi" },
  { code: "30", name: "Goa" },
  { code: "24", name: "Gujarat" },
  { code: "06", name: "Haryana" },
  { code: "02", name: "Himachal Pradesh" },
  { code: "01", name: "Jammu and Kashmir" },
  { code: "20", name: "Jharkhand" },
  { code: "29", name: "Karnataka" },
  { code: "32", name: "Kerala" },
  { code: "38", name: "Ladakh" },
  { code: "31", name: "Lakshadweep" },
  { code: "23", name: "Madhya Pradesh" },
  { code: "27", name: "Maharashtra" },
  { code: "14", name: "Manipur" },
  { code: "17", name: "Meghalaya" },
  { code: "15", name: "Mizoram" },
  { code: "13", name: "Nagaland" },
  { code: "21", name: "Odisha" },
  { code: "97", name: "Other Territory" },
  { code: "34", name: "Puducherry" },
  { code: "03", name: "Punjab" },
  { code: "08", name: "Rajasthan" },
  { code: "11", name: "Sikkim" },
  { code: "33", name: "Tamil Nadu" },
  { code: "36", name: "Telangana" },
  { code: "16", name: "Tripura" },
  { code: "09", name: "Uttar Pradesh" },
  { code: "05", name: "Uttarakhand" },
  { code: "19", name: "West Bengal" },
];

const BY_CODE = new Map(GST_STATES.map((s) => [s.code, s.name]));

export function stateName(code) {
  if (!code) return "";
  return BY_CODE.get(String(code).padStart(2, "0")) || "";
}

// ---------------------------------------------------------------------------
// GSTIN
// ---------------------------------------------------------------------------
// Shape only. A GSTIN that passes this is still not proof the business
// exists or is active - only the GST portal can say that. But catching a
// typo here saves a rejected invoice later.
//
// 15 characters: 2 state code, 10 PAN, 1 entity number, 1 "Z", 1 check digit.
const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function gstinCheckDigit(first14) {
  // The portal's own algorithm: each character's value, doubled on every
  // second position from the left, folded back into base 36.
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const value = ALPHABET.indexOf(first14[i]);
    if (value < 0) return null;
    const factor = i % 2 === 0 ? 1 : 2;
    const product = value * factor;
    sum += Math.floor(product / 36) + (product % 36);
  }
  const remainder = sum % 36;
  return ALPHABET[(36 - remainder) % 36];
}

export function isValidGstin(value) {
  const s = String(value || "").trim().toUpperCase();
  if (s.length !== 15) return false;
  if (!GSTIN_RE.test(s)) return false;
  if (!BY_CODE.has(s.slice(0, 2))) return false;
  const expected = gstinCheckDigit(s.slice(0, 14));
  return expected !== null && expected === s[14];
}

export function stateCodeFromGstin(value) {
  const s = String(value || "").trim();
  if (s.length < 2) return "";
  return BY_CODE.has(s.slice(0, 2)) ? s.slice(0, 2) : "";
}
