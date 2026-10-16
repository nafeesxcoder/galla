// ===========================================================================
// /api/items - what the business sells
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
const stock = require("./stock");

const router = express.Router();
router.use(requireAuth, requireBusiness("staff"));

const fields = {
  name: z.string().trim().min(1).max(190),
  itemCode: z.string().trim().max(60).optional(),
  barcode: z.string().trim().max(60).optional(),
  hsnSac: z.string().trim().max(10).optional(),
  type: z.enum(["product", "service"]).default("product"),
  unit: z.string().trim().max(20).default("PCS"),
  category: z.string().trim().max(80).optional(),
  salePrice: z.number().min(0).default(0),
  purchasePrice: z.number().min(0).default(0),
  priceIncludesTax: z.boolean().default(false),
  taxRate: z.number().min(0).max(100).default(0),
  cessRate: z.number().min(0).max(100).default(0),
  openingStock: z.number().default(0),
  lowStockLevel: z.number().min(0).default(0),
  trackBatches: z.boolean().default(false),
  description: z.string().trim().max(2000).optional(),
  isActive: z.boolean().default(true),
};

function toPublic(r) {
  return {
    id: r.id,
    name: r.name,
    itemCode: r.item_code,
    barcode: r.barcode,
    hsnSac: r.hsn_sac,
    type: r.type,
    unit: r.unit,
    category: r.category,
    salePrice: toRupees(r.sale_price_paise),
    purchasePrice: toRupees(r.purchase_price_paise),
    priceIncludesTax: Boolean(r.price_includes_tax),
    taxRate: Number(r.tax_rate),
    cessRate: Number(r.cess_rate),
    openingStock: Number(r.opening_stock),
    currentStock: Number(r.current_stock),
    lowStockLevel: Number(r.low_stock_level),
    isLowStock:
      Number(r.low_stock_level) > 0 && Number(r.current_stock) <= Number(r.low_stock_level),
    trackBatches: Boolean(r.track_batches),
    description: r.description,
    isActive: Boolean(r.is_active),
    createdAt: r.created_at,
  };
}

function toRow(b) {
  const row = {};
  const direct = {
    name: "name", itemCode: "item_code", barcode: "barcode", hsnSac: "hsn_sac",
    type: "type", unit: "unit", category: "category", description: "description",
  };
  for (const [k, col] of Object.entries(direct)) {
    if (b[k] !== undefined) row[col] = b[k] || null;
  }
  if (b.name !== undefined) row.name = b.name;
  if (b.unit !== undefined) row.unit = b.unit || "PCS";

  if (b.salePrice !== undefined) row.sale_price_paise = toPaise(b.salePrice, "salePrice");
  if (b.purchasePrice !== undefined) row.purchase_price_paise = toPaise(b.purchasePrice, "purchasePrice");
  if (b.priceIncludesTax !== undefined) row.price_includes_tax = b.priceIncludesTax;
  if (b.taxRate !== undefined) row.tax_rate = b.taxRate;
  if (b.cessRate !== undefined) row.cess_rate = b.cessRate;
  if (b.lowStockLevel !== undefined) row.low_stock_level = b.lowStockLevel;
  if (b.trackBatches !== undefined) row.track_batches = b.trackBatches;
  if (b.isActive !== undefined) row.is_active = b.isActive;

  return row;
}

// ---- list ---------------------------------------------------------------
router.get(
  "/",
  validate({
    query: z.object({
      search: z.string().trim().max(100).optional(),
      category: z.string().trim().max(80).optional(),
      lowStock: z.coerce.boolean().optional(),
      includeInactive: z.coerce.boolean().default(false),
      limit: z.coerce.number().int().min(1).max(200).default(50),
      offset: z.coerce.number().int().min(0).default(0),
    }),
  }),
  asyncHandler(async (req, res) => {
    const q = req.validatedQuery;

    const base = db("items")
      .where({ business_id: req.business.id })
      .whereNull("deleted_at");

    if (!q.includeInactive) base.where({ is_active: true });
    if (q.category) base.where({ category: q.category });
    if (q.lowStock) {
      base.where("low_stock_level", ">", 0).whereRaw("current_stock <= low_stock_level");
    }
    if (q.search) {
      base.where((b) =>
        b
          .where("name", "like", `%${q.search}%`)
          .orWhere("barcode", q.search)
          .orWhere("item_code", "like", `%${q.search}%`)
      );
    }

    const [{ total }] = await base.clone().clearSelect().clearOrder().count({ total: "*" });
    const rows = await base.clone().orderBy("name", "asc").limit(q.limit).offset(q.offset);

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
    const row = toRow(req.body);
    row.business_id = req.business.id;
    row.opening_stock = req.body.openingStock ?? 0;
    row.current_stock = req.body.openingStock ?? 0;

    const created = await db.transaction(async (trx) => {
      let id;
      try {
        [id] = await trx("items").insert(row);
      } catch (e) {
        if (e.code === "ER_DUP_ENTRY") {
          throw ApiError.conflict("An item with that barcode already exists.");
        }
        throw e;
      }

      // Opening stock is a stock movement like any other. Recording it
      // means the stock history starts at a known point rather than
      // appearing from nowhere.
      if (Number(row.opening_stock) !== 0) {
        await trx("stock_moves").insert({
          business_id: req.business.id,
          item_id: id,
          quantity_change: row.opening_stock,
          balance_after: row.opening_stock,
          reason: "opening",
          ref_type: "item",
          ref_id: id,
          created_by: req.user.id,
        });
      }

      return trx("items").where({ id }).first();
    });

    res.status(201).json({ ok: true, data: toPublic(created) });
  })
);

// ---- read one -----------------------------------------------------------
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const row = await db("items")
      .where({ id: req.params.id, business_id: req.business.id })
      .whereNull("deleted_at")
      .first();
    if (!row) throw ApiError.notFound("No such item.");

    const batches = row.track_batches
      ? await db("item_batches")
          .where({ item_id: row.id })
          .where("quantity", ">", 0)
          .orderBy("expiry_date", "asc")
      : [];

    res.json({
      ok: true,
      data: {
        ...toPublic(row),
        batches: batches.map((b) => ({
          id: b.id,
          batchNo: b.batch_no,
          expiryDate: b.expiry_date,
          quantity: Number(b.quantity),
          mrp: b.mrp_paise == null ? null : toRupees(b.mrp_paise),
        })),
      },
    });
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
    const existing = await db("items")
      .where({ id: req.params.id, business_id: req.business.id })
      .whereNull("deleted_at")
      .first();
    if (!existing) throw ApiError.notFound("No such item.");

    const patch = toRow(req.body);

    // Stock is not editable here - it moves only through a sale, a purchase
    // or an explicit adjustment, each of which leaves a record saying why.
    // Use POST /items/:id/adjust-stock instead.
    delete patch.current_stock;
    delete patch.opening_stock;

    if (Object.keys(patch).length) {
      patch.updated_at = db.fn.now();
      await db("items").where({ id: existing.id }).update(patch);
    }

    const row = await db("items").where({ id: existing.id }).first();
    res.json({ ok: true, data: toPublic(row) });
  })
);

// ---- adjust stock by hand ------------------------------------------------
router.post(
  "/:id/adjust-stock",
  validate({
    body: z.object({
      // The quantity to add or remove, not the new total. "I found 3 more"
      // is what somebody actually knows; the new total is arithmetic they
      // would have to do first and might get wrong.
      change: z.number().refine((n) => n !== 0, "Change cannot be zero"),
      reason: z.enum(["adjustment", "damage", "expiry", "return_in", "return_out"]).default("adjustment"),
      notes: z.string().trim().max(500).optional(),
      batchId: z.number().int().optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const item = await db("items")
      .where({ id: req.params.id, business_id: req.business.id })
      .whereNull("deleted_at")
      .first();
    if (!item) throw ApiError.notFound("No such item.");

    const after = await db.transaction((trx) =>
      stock.move(trx, {
        businessId: req.business.id,
        itemId: item.id,
        batchId: req.body.batchId ?? null,
        change: req.body.change,
        reason: req.body.reason,
        refType: "adjustment",
        refId: null,
        notes: req.body.notes,
        userId: req.user.id,
      })
    );

    res.json({ ok: true, data: { id: item.id, currentStock: after } });
  })
);

// ---- stock history -------------------------------------------------------
router.get(
  "/:id/stock-history",
  validate({
    query: z.object({
      limit: z.coerce.number().int().min(1).max(200).default(50),
      offset: z.coerce.number().int().min(0).default(0),
    }),
  }),
  asyncHandler(async (req, res) => {
    const q = req.validatedQuery;
    const rows = await db("stock_moves")
      .where({ business_id: req.business.id, item_id: req.params.id })
      .orderBy("id", "desc")
      .limit(q.limit)
      .offset(q.offset);

    res.json({
      ok: true,
      data: rows.map((m) => ({
        id: m.id,
        change: Number(m.quantity_change),
        balanceAfter: Number(m.balance_after),
        reason: m.reason,
        refType: m.ref_type,
        refId: m.ref_id,
        notes: m.notes,
        at: m.created_at,
      })),
    });
  })
);

// ---- delete -------------------------------------------------------------
router.delete(
  "/:id",
  requireBusiness("manager"),
  asyncHandler(async (req, res) => {
    const existing = await db("items")
      .where({ id: req.params.id, business_id: req.business.id })
      .whereNull("deleted_at")
      .first();
    if (!existing) throw ApiError.notFound("No such item.");

    // Soft delete: past invoice lines point here.
    await db("items")
      .where({ id: existing.id })
      .update({ deleted_at: db.fn.now(), is_active: false });

    res.json({ ok: true, data: { id: existing.id, deleted: true } });
  })
);


// ---- batches -------------------------------------------------------------
// The reading side of batches was already here: a tracked item returns its
// batches, and a sale picks the one expiring soonest. What was missing was
// any way to put a batch in. These fill that gap.
//
// Quantity is never written directly, here or anywhere else. A new batch is
// inserted empty and its opening quantity goes in through stock.move, so the
// item total, the batch total and the stock history can never drift apart.

const batchBody = z.object({
  batchNo: z.string().trim().min(1).max(60),
  expiryDate: z.iso.date().optional(),
  manufactureDate: z.iso.date().optional(),
  quantity: z.number().min(0).default(0),
  purchasePrice: z.number().min(0).optional(),
  salePrice: z.number().min(0).optional(),
  mrp: z.number().min(0).optional(),
});

// Quantity is left out on purpose. Correcting a batch's count goes through
// adjust-stock with its batchId, the same as any other stock change, so it
// lands in the history with a reason attached.
const batchPatchBody = z.object({
  batchNo: z.string().trim().min(1).max(60).optional(),
  expiryDate: z.iso.date().nullable().optional(),
  manufactureDate: z.iso.date().nullable().optional(),
  purchasePrice: z.number().min(0).nullable().optional(),
  salePrice: z.number().min(0).nullable().optional(),
  mrp: z.number().min(0).nullable().optional(),
});

function batchPublic(b) {
  return {
    id: b.id,
    itemId: b.item_id,
    batchNo: b.batch_no,
    expiryDate: b.expiry_date,
    manufactureDate: b.manufacture_date,
    quantity: Number(b.quantity),
    purchasePrice: b.purchase_price_paise == null ? null : toRupees(b.purchase_price_paise),
    salePrice: b.sale_price_paise == null ? null : toRupees(b.sale_price_paise),
    mrp: b.mrp_paise == null ? null : toRupees(b.mrp_paise),
    createdAt: b.created_at,
  };
}

async function ownedItem(req) {
  const item = await db("items")
    .where({ id: req.params.id, business_id: req.business.id })
    .whereNull("deleted_at")
    .first();
  if (!item) throw ApiError.notFound("No such item.");
  return item;
}

// ---- what is about to expire ---------------------------------------------
// Declared before the per-item routes below only for readability; it cannot
// collide with /:id because it is two segments deep.
//
// The whole point of tracking batches is this screen. A chemist wants to know
// what to return to the distributor before it is worthless, and a grocer
// wants to move it while it still sells.
router.get(
  "/batches/expiring",
  validate({
    query: z.object({
      days: z.coerce.number().int().min(1).max(365).default(30),
      includeExpired: z.coerce.boolean().default(true),
    }),
  }),
  asyncHandler(async (req, res) => {
    const q = req.validatedQuery;
    const today = new Date().toISOString().slice(0, 10);
    const until = new Date(Date.now() + q.days * 86400000).toISOString().slice(0, 10);

    const rows = await db("item_batches as b")
      .join("items as i", "i.id", "b.item_id")
      .where({ "b.business_id": req.business.id })
      .whereNull("i.deleted_at")
      .where("b.quantity", ">", 0)
      .whereNotNull("b.expiry_date")
      .where("b.expiry_date", "<=", until)
      .modify((qb) => {
        if (!q.includeExpired) qb.where("b.expiry_date", ">=", today);
      })
      .orderBy("b.expiry_date", "asc")
      .select("b.*", "i.name as item_name", "i.unit as item_unit");

    res.json({
      ok: true,
      data: rows.map((r) => ({
        ...batchPublic(r),
        itemName: r.item_name,
        unit: r.item_unit,
        expired: String(r.expiry_date).slice(0, 10) < today,
      })),
      meta: { days: q.days, today, until },
    });
  })
);

// ---- list one item's batches ---------------------------------------------
router.get(
  "/:id/batches",
  validate({ query: z.object({ all: z.coerce.boolean().default(false) }) }),
  asyncHandler(async (req, res) => {
    await ownedItem(req);
    const rows = await db("item_batches")
      .where({ item_id: req.params.id, business_id: req.business.id })
      .modify((qb) => {
        // Finished batches are kept - they are part of the history - but they
        // are not what you want to look at by default.
        if (!req.validatedQuery.all) qb.where("quantity", ">", 0);
      })
      .orderByRaw("expiry_date IS NULL, expiry_date ASC, id ASC");

    res.json({ ok: true, data: rows.map(batchPublic) });
  })
);

// ---- add a batch ---------------------------------------------------------
router.post(
  "/:id/batches",
  validate({ body: batchBody }),
  asyncHandler(async (req, res) => {
    const item = await ownedItem(req);
    if (item.type === "service") throw ApiError.badRequest("A service has no batches.");

    const b = req.body;

    const created = await db.transaction(async (trx) => {
      // Two batches with the same number on one item would make the history
      // impossible to read, and a sale could not say which one it came from.
      const clash = await trx("item_batches")
        .where({ item_id: item.id, business_id: req.business.id, batch_no: b.batchNo })
        .first();
      if (clash) throw ApiError.badRequest(`Batch ${b.batchNo} is already on this item.`);

      const [id] = await trx("item_batches").insert({
        business_id: req.business.id,
        item_id: item.id,
        batch_no: b.batchNo,
        expiry_date: b.expiryDate ?? null,
        manufacture_date: b.manufactureDate ?? null,
        // Empty to begin with. The quantity arrives through stock.move below,
        // which is the only thing allowed to write it.
        quantity: 0,
        purchase_price_paise: b.purchasePrice === undefined ? null : toPaise(b.purchasePrice, "purchasePrice"),
        sale_price_paise: b.salePrice === undefined ? null : toPaise(b.salePrice, "salePrice"),
        mrp_paise: b.mrp === undefined ? null : toPaise(b.mrp, "mrp"),
      });

      if (b.quantity > 0) {
        await stock.move(trx, {
          businessId: req.business.id,
          itemId: item.id,
          batchId: id,
          change: b.quantity,
          reason: "opening",
          refType: "batch",
          refId: id,
          notes: `Batch ${b.batchNo}`,
          userId: req.user.id,
        });
      }

      // Somebody adding a batch is telling you this item has batches. Making
      // them go and tick a box elsewhere before it works would be pedantry.
      if (!item.track_batches) {
        await trx("items").where({ id: item.id }).update({ track_batches: true, updated_at: trx.fn.now() });
      }

      return trx("item_batches").where({ id }).first();
    });

    res.status(201).json({ ok: true, data: batchPublic(created) });
  })
);

// ---- correct a batch's details -------------------------------------------
router.patch(
  "/:id/batches/:batchId",
  validate({ body: batchPatchBody }),
  asyncHandler(async (req, res) => {
    await ownedItem(req);

    const existing = await db("item_batches")
      .where({ id: req.params.batchId, item_id: req.params.id, business_id: req.business.id })
      .first();
    if (!existing) throw ApiError.notFound("No such batch.");

    const b = req.body;
    const patch = {};
    if (b.batchNo !== undefined) patch.batch_no = b.batchNo;
    if (b.expiryDate !== undefined) patch.expiry_date = b.expiryDate;
    if (b.manufactureDate !== undefined) patch.manufacture_date = b.manufactureDate;
    if (b.purchasePrice !== undefined) {
      patch.purchase_price_paise = b.purchasePrice === null ? null : toPaise(b.purchasePrice, "purchasePrice");
    }
    if (b.salePrice !== undefined) {
      patch.sale_price_paise = b.salePrice === null ? null : toPaise(b.salePrice, "salePrice");
    }
    if (b.mrp !== undefined) patch.mrp_paise = b.mrp === null ? null : toPaise(b.mrp, "mrp");

    if (Object.keys(patch).length) {
      patch.updated_at = db.fn.now();
      await db("item_batches").where({ id: existing.id }).update(patch);
    }

    const row = await db("item_batches").where({ id: existing.id }).first();
    res.json({ ok: true, data: batchPublic(row) });
  })
);

// ---- remove an empty batch -----------------------------------------------
router.delete(
  "/:id/batches/:batchId",
  requireBusiness("manager"),
  asyncHandler(async (req, res) => {
    await ownedItem(req);

    const existing = await db("item_batches")
      .where({ id: req.params.batchId, item_id: req.params.id, business_id: req.business.id })
      .first();
    if (!existing) throw ApiError.notFound("No such batch.");

    // A batch with stock in it cannot simply disappear - the item total would
    // no longer be the sum of its batches. Write it off through adjust-stock
    // first, with a reason, and then it can go.
    if (Number(existing.quantity) !== 0) {
      throw ApiError.badRequest(
        `Batch ${existing.batch_no} still has ${existing.quantity} in it. Write it off first, then remove it.`
      );
    }

    await db("item_batches").where({ id: existing.id }).del();
    res.json({ ok: true, data: { id: existing.id, deleted: true } });
  })
);

module.exports = router;
