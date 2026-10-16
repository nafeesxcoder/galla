// ===========================================================================
// /api/invoices/numbering - what the bill numbers look like
// ---------------------------------------------------------------------------
// Every shop wants its own. "INV-2026-27-0001" out of the box, but a shop
// that has been billing by hand for twenty years wants to carry on from
// MS-0457, and an accountant will ask for the series to be unbroken.
//
// Three things are editable: the prefix, the number the next bill gets, and
// how many digits it is padded to. Each is per document type and per
// financial year, because a sale and a purchase have separate series and both
// restart in April.
//
// THE RULE THAT MATTERS: the next number can go UP but not back onto a number
// already used. A duplicate invoice number is not a cosmetic problem - it is
// two different bills that cannot be told apart in a GST return, and the
// database's own unique index would refuse the second one halfway through a
// sale, at the counter, with a customer waiting.
// ===========================================================================

const express = require("express");
const { z } = require("zod");

const db = require("../../db");
const validate = require("../../middleware/validate");
const { requireAuth, requireBusiness } = require("../../middleware/auth");
const asyncHandler = require("../../utils/asyncHandler");
const ApiError = require("../../utils/ApiError");

const router = express.Router();
router.use(requireAuth, requireBusiness("manager"));

const DOC_TYPES = ["sale", "purchase", "estimate", "credit_note", "debit_note"];

// The prefix a series gets the first time a bill of that type is written.
// It MUST match the service's own DEFAULT_PREFIX: a shop that has billed
// nothing yet has no counter row, and showing an example with no prefix
// while the first bill comes out as INV-2026-27-0001 is the screen telling
// the shopkeeper something that is not true.
const DEFAULT_PREFIX = {
  sale: "INV",
  purchase: "PUR",
  estimate: "EST",
  credit_note: "CRN",
  debit_note: "DBN",
};

const LABEL = {
  sale: "Sale bill",
  purchase: "Purchase bill",
  estimate: "Estimate",
  credit_note: "Sales return",
  debit_note: "Purchase return",
};

/** The Indian financial year a date falls in: April to March. */
function fyOf(date = new Date()) {
  const y = date.getUTCFullYear();
  const start = date.getUTCMonth() + 1 >= 4 ? y : y - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
}

function sample(prefix, fy, next, padding) {
  const padded = String(next).padStart(padding, "0");
  return prefix ? `${prefix}-${fy}-${padded}` : `${fy}-${padded}`;
}

// ---- what the series look like now ---------------------------------------
router.get(
  "/",
  validate({ query: z.object({ fy: z.string().trim().max(10).optional() }) }),
  asyncHandler(async (req, res) => {
    const fy = req.validatedQuery.fy || fyOf();

    const [counters, used] = await Promise.all([
      db("invoice_counters").where({ business_id: req.business.id, fy }),
      // How many are already issued, so the screen can say what the lowest
      // safe number is rather than letting somebody find out from an error.
      db("invoices")
        .where({ business_id: req.business.id, fy })
        .groupBy("doc_type")
        .select("doc_type")
        .count({ count: "*" })
        .max({ highest: "serial" }),
    ]);

    const byType = new Map(counters.map((c) => [c.doc_type, c]));
    const usedBy = new Map(used.map((u) => [u.doc_type, u]));

    res.json({
      ok: true,
      data: {
        fy,
        series: DOC_TYPES.map((docType) => {
          const c = byType.get(docType);
          const u = usedBy.get(docType);
          // No counter row yet means nothing of this type has been billed.
          // The prefix is then whatever the first bill will create, not "".
          const prefix = c ? c.prefix ?? "" : DEFAULT_PREFIX[docType] ?? "DOC";
          const next = c ? Number(c.next_number) : 1;
          const padding = c ? Number(c.padding) : 4;
          const highest = u ? Number(u.highest ?? 0) : 0;

          return {
            docType,
            label: LABEL[docType] || docType,
            prefix,
            nextNumber: next,
            padding,
            issued: u ? Number(u.count) : 0,
            // Below this and a number would be reused.
            lowestAllowed: highest + 1,
            example: sample(prefix, fy, next, padding),
          };
        }),
      },
    });
  })
);

// ---- change one ----------------------------------------------------------
router.patch(
  "/:docType",
  validate({
    body: z.object({
      // "" is a real choice: it drops the prefix and numbers as 2026-27-0001.
      prefix: z
        .string()
        .trim()
        .toUpperCase()
        .max(10)
        .regex(/^[A-Z0-9/-]*$/, "Letters, numbers, - and / only")
        .optional(),
      nextNumber: z.number().int().min(1).max(9999999).optional(),
      padding: z.number().int().min(1).max(8).optional(),
      fy: z.string().trim().max(10).optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const docType = req.params.docType;
    if (!DOC_TYPES.includes(docType)) throw ApiError.badRequest("No such kind of bill.");

    const fy = req.body.fy || fyOf();

    const result = await db.transaction(async (trx) => {
      // Locked for the same reason billing locks it: a till issuing a number
      // while this is being changed must queue, not interleave.
      let counter = await trx("invoice_counters")
        .where({ business_id: req.business.id, doc_type: docType, fy })
        .forUpdate()
        .first();

      if (!counter) {
        await trx("invoice_counters").insert({
          business_id: req.business.id,
          doc_type: docType,
          fy,
          // Same fallback as the listing, so editing one field of an
          // untouched series does not silently drop its prefix.
          prefix: req.body.prefix ?? DEFAULT_PREFIX[docType] ?? "DOC",
          next_number: 1,
        });
        counter = await trx("invoice_counters")
          .where({ business_id: req.business.id, doc_type: docType, fy })
          .forUpdate()
          .first();
      }

      const [{ highest }] = await trx("invoices")
        .where({ business_id: req.business.id, doc_type: docType, fy })
        .max({ highest: "serial" });
      const lowestAllowed = Number(highest ?? 0) + 1;

      const patch = {};
      if (req.body.prefix !== undefined) patch.prefix = req.body.prefix;
      if (req.body.padding !== undefined) patch.padding = req.body.padding;

      if (req.body.nextNumber !== undefined) {
        if (req.body.nextNumber < lowestAllowed) {
          throw ApiError.badRequest(
            `${lowestAllowed - 1} is already used, so the next number cannot be below ${lowestAllowed}. ` +
              "Two bills with the same number cannot be told apart in a return."
          );
        }
        patch.next_number = req.body.nextNumber;
      }

      if (Object.keys(patch).length) {
        patch.updated_at = trx.fn.now();
        await trx("invoice_counters").where({ id: counter.id }).update(patch);
      }

      const fresh = await trx("invoice_counters").where({ id: counter.id }).first();
      return {
        docType,
        label: LABEL[docType],
        fy,
        prefix: fresh.prefix ?? "",
        nextNumber: Number(fresh.next_number),
        padding: Number(fresh.padding),
        lowestAllowed,
        example: sample(fresh.prefix ?? "", fy, Number(fresh.next_number), Number(fresh.padding)),
      };
    });

    res.json({ ok: true, data: result });
  })
);

module.exports = router;
