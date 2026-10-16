// ===========================================================================
// MOVING STOCK
// ---------------------------------------------------------------------------
// Every change to a stock figure in the whole system goes through move().
// Nothing anywhere else writes items.current_stock directly.
//
// Why one function: a stock change is really two writes that must both
// happen or neither - update the running total, and append the row that
// explains it. Scattered around the codebase, somebody eventually does one
// without the other, and then the stock report and the stock history
// disagree with no way to tell which is lying.
//
// Every call must be inside a transaction. The row is locked FOR UPDATE, so
// two simultaneous sales of the last item cannot both read "1 in stock".
// ===========================================================================

const ApiError = require("../../utils/ApiError");

/**
 * Moves stock and records why.
 *
 * @param trx        an open knex transaction - required, not optional
 * @param change     negative takes stock out, positive puts it in
 * @param allowNegative  a shop that has not entered its opening stock yet
 *                       still has to be able to bill. Default is to allow
 *                       it rather than block the counter; pass false where
 *                       you would rather refuse the sale.
 * @returns the new running total
 */
async function move(
  trx,
  {
    businessId,
    itemId,
    batchId = null,
    change,
    reason,
    refType = null,
    refId = null,
    notes = null,
    userId = null,
    allowNegative = true,
  }
) {
  // Lock the item row for the rest of the transaction. Without this, two
  // sales at the same moment both read the same stock and both write back
  // their own idea of the new total - and one sale silently vanishes from
  // the count.
  const item = await trx("items")
    .where({ id: itemId, business_id: businessId })
    .forUpdate()
    .first();

  if (!item) throw ApiError.notFound("No such item.");

  // Services have no stock to move. Silently ignoring this would hide a bug
  // in the caller.
  if (item.type === "service") {
    return Number(item.current_stock);
  }

  const before = Number(item.current_stock);
  const after = Number((before + Number(change)).toFixed(3));

  if (!allowNegative && after < 0) {
    throw ApiError.badRequest(
      `Only ${before} ${item.unit} of ${item.name} left.`
    );
  }

  await trx("items").where({ id: itemId }).update({
    current_stock: after,
    updated_at: trx.fn.now(),
  });

  // Batches carry their own quantity, and the item total is the sum.
  if (batchId) {
    const batch = await trx("item_batches")
      .where({ id: batchId, item_id: itemId })
      .forUpdate()
      .first();

    if (!batch) throw ApiError.badRequest("No such batch for this item.");

    const batchAfter = Number((Number(batch.quantity) + Number(change)).toFixed(3));
    if (!allowNegative && batchAfter < 0) {
      throw ApiError.badRequest(
        `Only ${batch.quantity} left in batch ${batch.batch_no}.`
      );
    }

    await trx("item_batches").where({ id: batchId }).update({
      quantity: batchAfter,
      updated_at: trx.fn.now(),
    });
  }

  await trx("stock_moves").insert({
    business_id: businessId,
    item_id: itemId,
    batch_id: batchId,
    quantity_change: change,
    balance_after: after,
    reason,
    ref_type: refType,
    ref_id: refId,
    notes,
    created_by: userId,
  });

  return after;
}

/**
 * Picks which batches to sell from, oldest expiry first.
 *
 * This is FEFO - first expired, first out - which is what a chemist or a
 * food shop actually does. Selling the newest batch while an older one
 * quietly expires on the shelf is how stock turns into a write-off.
 *
 * Returns the batches to draw from and how much from each.
 */
async function pickBatches(trx, { itemId, quantity }) {
  const batches = await trx("item_batches")
    .where({ item_id: itemId })
    .where("quantity", ">", 0)
    .orderByRaw("expiry_date IS NULL, expiry_date ASC, id ASC")
    .forUpdate();

  const picks = [];
  let left = Number(quantity);

  for (const b of batches) {
    if (left <= 0) break;
    const take = Math.min(left, Number(b.quantity));
    picks.push({ batchId: b.id, batchNo: b.batch_no, expiryDate: b.expiry_date, quantity: take });
    left = Number((left - take).toFixed(3));
  }

  // Short is not an error here. The caller decides whether to refuse the
  // sale or let the stock go negative, because a counter that stops selling
  // because the stock entry is behind is worse than a stock count that is.
  return { picks, shortfall: left > 0 ? left : 0 };
}

module.exports = { move, pickBatches };
