// ===========================================================================
// THE SHOP'S PREFERENCES
// ---------------------------------------------------------------------------
// One JSON column, but a strict shape. Free-form JSON in a settings column is
// how you end up with `showHSN`, `show_hsn` and `showHsn` all stored on
// different shops because three screens spelled it three ways, and none of
// them read by the bill.
//
// So every key is declared here with a type and a default. Anything else in a
// PATCH is rejected rather than stored, and anything missing comes back as
// its default - which means every reader can use the value without first
// checking whether it is there.
//
// TWO ZOD TRAPS, BOTH OF WHICH BIT THE FIRST VERSION OF THIS FILE
// ---------------------------------------------------------------
// 1. z.object({...}).default({}) hands back that {} UNPARSED when the input
//    is missing. It does not run the object schema, so none of the field
//    defaults are applied and read(null) returned {bill:{}, defaults:{}} -
//    every caller then reading `undefined` for every setting. The fix is to
//    parse each section explicitly against {}, so the schema actually runs.
//
// 2. A field written .default(x) and then made .optional() yields x when it
//    is missing, not undefined - so a PATCH that set one field would have
//    written the defaults over every other one. patchShape() strips the
//    default first; the same helper the item and party routes use, for the
//    same reason.
//
// READING IS LENIENT, WRITING IS STRICT. A row stored by an older version may
// hold a key this one no longer declares; that must not turn into a 500 on
// every request, so reading ignores what it does not recognise. A PATCH is
// somebody typing today, and a key that does not exist is a bug worth
// reporting rather than storing.
// ===========================================================================

const { z } = require("zod");
const { patchShape } = require("../../utils/patchSchema");

const MODES = ["cash", "upi", "card", "bank", "cheque", "other"];

// ---------------------------------------------------------------------------
// what goes on a bill
// ---------------------------------------------------------------------------
const billFields = {
  // Printed at the bottom of every bill. The place for "Goods once sold will
  // not be taken back" and the warranty wording.
  terms: z.string().trim().max(2000).default(""),
  // One line under the terms - a thank you, a return policy, a website.
  footer: z.string().trim().max(300).default(""),
  // What the signature line says. "For Mehra Store" is the usual form.
  signatureLabel: z.string().trim().max(80).default(""),

  showHsn: z.boolean().default(true),
  showAmountInWords: z.boolean().default(true),
  showPaymentStatus: z.boolean().default(true),
  showSignature: z.boolean().default(true),
  // Prints the account details of every bank account marked "print on
  // invoice", so a customer can transfer into it.
  showBankDetails: z.boolean().default(false),

  // Which paper the print button offers first. A counter with a thermal
  // printer should not have to change this on every bill.
  defaultSize: z.enum(["a4", "thermal"]).default("a4"),
};

// ---------------------------------------------------------------------------
// what a new bill or a new item starts with
// ---------------------------------------------------------------------------
const defaultFields = {
  // Credit days. 0 means due on the day it is issued.
  dueDays: z.number().int().min(0).max(365).default(0),
  // Settle the total to a whole rupee and show the difference as "Round
  // off". Standard on Indian invoices, and a shop that bills in paise can
  // turn it off.
  roundOff: z.boolean().default(true),
  paymentMode: z.enum(MODES).default("cash"),

  itemUnit: z.string().trim().max(20).default("PCS"),
  itemTaxRate: z.number().min(0).max(100).default(0),
  // Whether a price typed into a new item is taken as including GST. Shops
  // selling MRP goods want this on; shops that quote ex-tax want it off.
  // Getting it wrong on every item is the most common way a shop's totals
  // come out eighteen per cent adrift.
  itemPriceIncludesTax: z.boolean().default(false),
};

// Lenient on the way in from the database: unknown keys are dropped, not
// rejected.
const billRead = z.object(billFields);
const defaultsRead = z.object(defaultFields);

/** Parse what is stored, filling in anything missing with its default. */
function read(stored) {
  let raw = stored;
  // MySQL hands a JSON column back as an object; an older MariaDB hands back
  // a string. Both happen, so both are accepted.
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch {
      raw = {};
    }
  }
  if (!raw || typeof raw !== "object") raw = {};

  const section = (schema, value) => {
    const parsed = schema.safeParse(value && typeof value === "object" ? value : {});
    // A stored value of the wrong type - a string where a boolean belongs,
    // left by a hand-edited row - falls back to the defaults for that
    // section rather than taking the whole response down.
    return parsed.success ? parsed.data : schema.parse({});
  };

  return { bill: section(billRead, raw.bill), defaults: section(defaultsRead, raw.defaults) };
}

/**
 * Merge a patch into what is stored, one section at a time.
 *
 * Deliberately NOT a replace. The settings screen saves one section at a
 * time, and a whole-object write would blank every section that screen did
 * not happen to have on it.
 */
function merge(stored, patch) {
  const current = read(stored);
  return {
    bill: billRead.parse({ ...current.bill, ...(patch?.bill || {}) }),
    defaults: defaultsRead.parse({ ...current.defaults, ...(patch?.defaults || {}) }),
  };
}

// For the PATCH body. Strict, so a misspelled key is an error the caller
// sees rather than a setting that silently never applies.
const patchSchema = z
  .object({
    bill: z.object(patchShape(billFields)).strict().optional(),
    defaults: z.object(patchShape(defaultFields)).strict().optional(),
  })
  .strict();

module.exports = { patchSchema, read, merge, MODES };
