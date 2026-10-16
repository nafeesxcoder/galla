// ===========================================================================
// /api/parties - customers and suppliers
// ===========================================================================

const express = require("express");
const { z } = require("zod");

const db = require("../../db");
const validate = require("../../middleware/validate");
const { requireAuth, requireBusiness } = require("../../middleware/auth");
const asyncHandler = require("../../utils/asyncHandler");
const ApiError = require("../../utils/ApiError");
const { patchShape } = require("../../utils/patchSchema");
const { toPaise, toRupees } = require("../../utils/money");
const { isValidGstinFormat, stateCodeFromGstin, STATE_CODES } = require("../../utils/gst");

const router = express.Router();
router.use(requireAuth, requireBusiness("staff"));

const fields = {
  name: z.string().trim().min(1).max(160),
  phone: z.string().trim().max(20).optional(),
  email: z.email().max(190).optional(),
  gstin: z.string().trim().toUpperCase().refine(isValidGstinFormat, "That does not look like a valid GSTIN").optional(),
  stateCode: z.string().trim().refine((c) => Boolean(STATE_CODES[c]), "Pick a valid state").optional(),
  addressLine1: z.string().trim().max(190).optional(),
  addressLine2: z.string().trim().max(190).optional(),
  city: z.string().trim().max(100).optional(),
  pincode: z.string().trim().regex(/^\d{6}$/).optional(),
  shippingAddress: z.string().trim().max(500).optional(),
  openingBalance: z.number().optional(),
  creditLimit: z.number().min(0).optional(),
  creditDays: z.number().int().min(0).max(365).optional(),
  isCustomer: z.boolean().optional(),
  isSupplier: z.boolean().optional(),
  notes: z.string().trim().max(2000).optional(),
};

function toPublic(r) {
  return {
    id: r.id,
    name: r.name,
    phone: r.phone,
    email: r.email,
    gstin: r.gstin,
    stateCode: r.state_code,
    stateName: r.state_code ? STATE_CODES[r.state_code] ?? null : null,
    addressLine1: r.address_line1,
    addressLine2: r.address_line2,
    city: r.city,
    pincode: r.pincode,
    shippingAddress: r.shipping_address,
    openingBalance: toRupees(r.opening_balance_paise),
    // Positive means they owe you. Negative means you owe them.
    balance: toRupees(r.balance_paise),
    creditLimit: toRupees(r.credit_limit_paise),
    creditDays: r.credit_days,
    isCustomer: Boolean(r.is_customer),
    isSupplier: Boolean(r.is_supplier),
    notes: r.notes,
    createdAt: r.created_at,
  };
}

function toRow(b, business) {
  const row = {};
  if (b.name !== undefined) row.name = b.name;
  if (b.phone !== undefined) row.phone = b.phone || null;
  if (b.email !== undefined) row.email = b.email || null;
  if (b.gstin !== undefined) row.gstin = b.gstin || null;
  if (b.addressLine1 !== undefined) row.address_line1 = b.addressLine1 || null;
  if (b.addressLine2 !== undefined) row.address_line2 = b.addressLine2 || null;
  if (b.city !== undefined) row.city = b.city || null;
  if (b.pincode !== undefined) row.pincode = b.pincode || null;
  if (b.shippingAddress !== undefined) row.shipping_address = b.shippingAddress || null;
  if (b.creditDays !== undefined) row.credit_days = b.creditDays;
  if (b.isCustomer !== undefined) row.is_customer = b.isCustomer;
  if (b.isSupplier !== undefined) row.is_supplier = b.isSupplier;
  if (b.notes !== undefined) row.notes = b.notes || null;
  if (b.creditLimit !== undefined) row.credit_limit_paise = toPaise(b.creditLimit, "creditLimit");

  // The state decides CGST+SGST vs IGST on every invoice to this party, so
  // take it from the GSTIN when there is one - that is authoritative - and
  // fall back to the business's own state for a walk-in.
  if (b.gstin) {
    row.state_code = stateCodeFromGstin(b.gstin);
  } else if (b.stateCode !== undefined) {
    row.state_code = b.stateCode || business.state_code;
  }

  return row;
}

// ---- list ---------------------------------------------------------------
router.get(
  "/",
  validate({
    query: z.object({
      search: z.string().trim().max(100).optional(),
      type: z.enum(["customer", "supplier"]).optional(),
      // Only parties who owe money - the receivables screen.
      owing: z.coerce.boolean().optional(),
      limit: z.coerce.number().int().min(1).max(200).default(50),
      offset: z.coerce.number().int().min(0).default(0),
    }),
  }),
  asyncHandler(async (req, res) => {
    const q = req.validatedQuery;

    const base = db("parties")
      .where({ business_id: req.business.id })
      .whereNull("deleted_at");

    if (q.type === "customer") base.where({ is_customer: true });
    if (q.type === "supplier") base.where({ is_supplier: true });
    if (q.owing) base.where("balance_paise", ">", 0);

    if (q.search) {
      base.where((b) =>
        b.where("name", "like", `%${q.search}%`).orWhere("phone", "like", `%${q.search}%`)
      );
    }

    const [{ total }] = await base.clone().clearSelect().clearOrder().count({ total: "*" });
    const rows = await base
      .clone()
      .orderBy("name", "asc")
      .limit(q.limit)
      .offset(q.offset);

    res.json({
      ok: true,
      data: rows.map(toPublic),
      meta: { total: Number(total), limit: q.limit, offset: q.offset },
    });
  })
);

// ---- create -------------------------------------------------------------
router.post(
  "/",
  validate({ body: z.object(fields) }),
  asyncHandler(async (req, res) => {
    const row = toRow(req.body, req.business);
    row.business_id = req.business.id;
    if (!row.state_code) row.state_code = req.business.state_code;

    // The opening balance is what they owed before they were on the system,
    // so it is where the running balance starts.
    const opening = toPaise(Math.abs(req.body.openingBalance ?? 0), "openingBalance");
    const signed = (req.body.openingBalance ?? 0) < 0 ? -opening : opening;
    row.opening_balance_paise = signed;
    row.balance_paise = signed;

    const [id] = await db("parties").insert(row);
    const created = await db("parties").where({ id }).first();

    res.status(201).json({ ok: true, data: toPublic(created) });
  })
);

// ---- read one -----------------------------------------------------------
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const row = await db("parties")
      .where({ id: req.params.id, business_id: req.business.id })
      .whereNull("deleted_at")
      .first();

    if (!row) throw ApiError.notFound("No such customer or supplier.");
    res.json({ ok: true, data: toPublic(row) });
  })
);

// ---- update -------------------------------------------------------------
router.patch(
  "/:id",
  validate({
    body: z.object(
      patchShape(fields)
    ),
  }),
  asyncHandler(async (req, res) => {
    const existing = await db("parties")
      .where({ id: req.params.id, business_id: req.business.id })
      .whereNull("deleted_at")
      .first();

    if (!existing) throw ApiError.notFound("No such customer or supplier.");

    const patch = toRow(req.body, req.business);

    // The balance is NOT editable through this endpoint. It moves only
    // because an invoice or a payment moved it; letting it be set by hand
    // would quietly break the ledger it is supposed to summarise.
    delete patch.balance_paise;

    if (Object.keys(patch).length) {
      patch.updated_at = db.fn.now();
      await db("parties").where({ id: existing.id }).update(patch);
    }

    const row = await db("parties").where({ id: existing.id }).first();
    res.json({ ok: true, data: toPublic(row) });
  })
);

// ---- delete -------------------------------------------------------------
router.delete(
  "/:id",
  requireBusiness("manager"),
  asyncHandler(async (req, res) => {
    const existing = await db("parties")
      .where({ id: req.params.id, business_id: req.business.id })
      .whereNull("deleted_at")
      .first();

    if (!existing) throw ApiError.notFound("No such customer or supplier.");

    // Soft delete only. Past invoices point at this row, and removing it
    // would leave them with no name on them.
    await db("parties").where({ id: existing.id }).update({ deleted_at: db.fn.now() });
    res.json({ ok: true, data: { id: existing.id, deleted: true } });
  })
);

module.exports = router;
