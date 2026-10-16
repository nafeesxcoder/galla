// ===========================================================================
// BUILDING A PATCH SCHEMA OUT OF A CREATE SCHEMA
// ---------------------------------------------------------------------------
// There is one trap here and it is expensive.
//
// In Zod, a field written as z.number().default(0) and then made .optional()
// still hands back the DEFAULT when the field is missing - not undefined:
//
//     z.object({ taxRate: z.number().default(0).optional() }).parse({})
//       -> { taxRate: 0 }
//
// Which means a PATCH that only sends a price arrives at the route with
// taxRate: 0, cessRate: 0, trackBatches: false and isActive: true, and every
// one of them is written to the row. Change one item's price and its GST rate
// silently becomes zero. Nothing errors, nothing logs, and the next bill for
// that item charges no tax - which is discovered at the end of the quarter,
// if at all.
//
// So the default has to be stripped before the field is made optional. That
// is all this does, and it exists as one function so that no module has to
// remember it.
// ===========================================================================

/** Strips a .default() if there is one, leaving the underlying type. */
function undefaulted(schema) {
  let s = schema;
  // A field can be wrapped more than once - .default().optional() from an
  // earlier edit, say - so unwrap until there is nothing left to unwrap.
  while (s && typeof s.removeDefault === "function" && s._def?.innerType !== undefined) {
    const inner = s.removeDefault();
    if (inner === s) break;
    s = inner;
  }
  return s;
}

/**
 * Turns a map of create-time field schemas into a patch body where every
 * field is genuinely optional: missing means missing, and a field the caller
 * did not send is never written.
 */
function patchShape(fields) {
  return Object.fromEntries(
    Object.entries(fields).map(([key, schema]) => [key, undefaulted(schema).optional()])
  );
}

module.exports = { patchShape, undefaulted };
