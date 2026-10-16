// ===========================================================================
// UNITS
// ---------------------------------------------------------------------------
// These are the UQC codes - the Unit Quantity Codes the GST portal accepts.
// Using the real codes now means an e-invoice or a GSTR-1 export later does
// not need every item in the shop re-tagged.
// ===========================================================================

export const UNITS = [
  { code: "PCS", label: "Piece", short: "pcs" },
  { code: "NOS", label: "Numbers", short: "nos" },
  { code: "KGS", label: "Kilogram", short: "kg" },
  { code: "GMS", label: "Gram", short: "g" },
  { code: "LTR", label: "Litre", short: "ltr" },
  { code: "MLT", label: "Millilitre", short: "ml" },
  { code: "BAG", label: "Bag", short: "bag" },
  { code: "BOX", label: "Box", short: "box" },
  { code: "BTL", label: "Bottle", short: "btl" },
  { code: "PAC", label: "Packet", short: "pkt" },
  { code: "DOZ", label: "Dozen", short: "dz" },
  { code: "MTR", label: "Metre", short: "mtr" },
  { code: "CMS", label: "Centimetre", short: "cm" },
  { code: "SQF", label: "Square feet", short: "sqft" },
  { code: "SQM", label: "Square metre", short: "sqm" },
  { code: "TON", label: "Tonne", short: "ton" },
  { code: "QTL", label: "Quintal", short: "qtl" },
  { code: "PAIR", label: "Pair", short: "pair" },
  { code: "SET", label: "Set", short: "set" },
  { code: "ROL", label: "Roll", short: "roll" },
  { code: "TUB", label: "Tube", short: "tube" },
  { code: "CAN", label: "Can", short: "can" },
  { code: "OTH", label: "Other", short: "unit" },
];

const BY_CODE = new Map(UNITS.map((u) => [u.code, u]));

export function unitShort(code) {
  const u = BY_CODE.get(String(code || "").toUpperCase());
  return u ? u.short : String(code || "").toLowerCase() || "unit";
}

export function unitLabel(code) {
  const u = BY_CODE.get(String(code || "").toUpperCase());
  return u ? u.label : code || "Unit";
}

// How a sale is settled. "Credit" is not a payment mode as such - it means
// nothing was taken and the customer owes it - but it belongs in the same
// list because that is how it is chosen at the counter.
export const PAYMENT_MODES = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "bank", label: "Bank transfer" },
  { value: "cheque", label: "Cheque" },
  { value: "other", label: "Other" },
];

export function modeLabel(value) {
  const m = PAYMENT_MODES.find((x) => x.value === value);
  return m ? m.label : value || "";
}
