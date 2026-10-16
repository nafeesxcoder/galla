"use client";

// ===========================================================================
// TALKING TO THE BACKEND, IN THE APP'S OWN WORDS
// ---------------------------------------------------------------------------
// Two jobs.
//
// 1. Normalising. The server answers in camelCase, but a list endpoint may
//    hand back a bare array or an object with a count for paging, and a
//    field may arrive as salePrice or salePricePaise depending on which
//    endpoint built it. Every screen reading those variations itself would
//    be a slow leak of bugs. They are flattened here, once.
//
// 2. Keeping money in paise. Whatever the server sends - rupees as a
//    number, or paise as a string - comes out of here as integer paise, and
//    goes back as whatever that endpoint expects.
//
// If a shape below turns out not to match the backend, this is the only file
// that has to change.
// ===========================================================================

// Through app-client, never straight at lib/api.js. That module belongs to
// the login and account screens and is left exactly as they expect it.
import { api, qs, rowsOf, totalOf, ApiError } from "../../lib/app-client";
import { toPaise } from "../../lib/money";

// ---------------------------------------------------------------------------
// reading a money field
// ---------------------------------------------------------------------------
// A field named *Paise is already paise. Anything else is rupees and has to
// be multiplied. Getting this backwards would be a hundredfold error on
// every screen, so it is one function and nothing else does it.
function paiseFrom(row, base) {
  const paiseKey = `${base}Paise`;
  if (row[paiseKey] !== undefined && row[paiseKey] !== null) return Math.round(Number(row[paiseKey])) || 0;
  const snake = `${base.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)}_paise`;
  if (row[snake] !== undefined && row[snake] !== null) return Math.round(Number(row[snake])) || 0;
  if (row[base] !== undefined && row[base] !== null) return toPaise(row[base]);
  return 0;
}

function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

// ---------------------------------------------------------------------------
// items
// ---------------------------------------------------------------------------
// The server calls goods "product". Everything on screen only ever asks
// "is this a service?", so both are folded to one of two words here and the
// server's own word is put back on the way out.
export function normItem(row) {
  if (!row) return null;
  const salePaise = paiseFrom(row, "salePrice");
  const costPaise = paiseFrom(row, "purchasePrice");
  const stock = num(row.currentStock ?? row.current_stock, 0);

  // lowStockLevel is 0 by default, which means "do not warn me", not "warn
  // me the moment it hits zero". Zero is treated as no alert set.
  const rawLow = row.lowStockLevel ?? row.lowStockAlert ?? row.low_stock_level ?? null;
  const low = rawLow === null || rawLow === "" || Number(rawLow) === 0 ? null : num(rawLow, 0);

  const isService = row.type === "service";
  const isOut = !isService && stock <= 0;

  return {
    id: row.id,
    name: row.name || "",
    type: isService ? "service" : "goods",
    code: row.itemCode || row.code || row.barcode || "",
    hsn: row.hsnSac || row.hsn || row.hsnCode || "",
    unit: row.unit || "PCS",
    taxRate: num(row.taxRate ?? row.tax_rate, 0),
    taxIncluded: Boolean(row.priceIncludesTax ?? row.taxIncluded ?? row.tax_included),
    trackBatches: Boolean(row.trackBatches),
    salePaise,
    costPaise,
    stock,
    lowStockAlert: low,
    description: row.description || "",
    // The server works this out itself. Trust its answer over ours when it
    // gives one, so the list and the server never disagree.
    isLow:
      !isService &&
      !isOut &&
      (row.isLowStock !== undefined ? Boolean(row.isLowStock) : low !== null && stock <= low),
    isOut,
    stockValuePaise: isService ? 0 : Math.round(stock * (costPaise || salePaise)),
    raw: row,
  };
}

export async function listItems(params = {}) {
  const res = await api.get(`/api/items${qs(params)}`);
  return { rows: rowsOf(res).map(normItem), total: totalOf(res) };
}

export async function getItem(id) {
  return normItem(await api.get(`/api/items/${id}`));
}

// Prices go in as rupees. The server multiplies them up and stores paise,
// and hands rupees back, so this is the one place that converts either way.
function itemBody(form) {
  const body = {
    name: form.name.trim(),
    type: form.type === "service" ? "service" : "product",
    unit: form.unit || "PCS",
    salePrice: Number(form.salePrice) || 0,
    taxRate: Number(form.taxRate) || 0,
    priceIncludesTax: Boolean(form.taxIncluded),
    trackBatches: Boolean(form.trackBatches),
  };
  if (form.code) body.itemCode = form.code.trim();
  if (form.hsn) body.hsnSac = String(form.hsn).trim();
  if (form.purchasePrice !== "" && form.purchasePrice != null) {
    body.purchasePrice = Number(form.purchasePrice) || 0;
  }
  if (form.description) body.description = form.description.trim();
  return body;
}

export async function createItem(form) {
  const body = itemBody(form);
  if (form.type !== "service" && form.openingStock !== "" && form.openingStock != null) {
    body.openingStock = Number(form.openingStock) || 0;
  }
  if (form.lowStockAlert !== "" && form.lowStockAlert != null) {
    body.lowStockLevel = Number(form.lowStockAlert) || 0;
  }
  return normItem(await api.post("/api/items", body));
}

export async function updateItem(id, form) {
  const body = itemBody(form);
  body.itemCode = form.code ? form.code.trim() : null;
  body.hsnSac = form.hsn ? String(form.hsn).trim() : null;
  body.description = form.description || null;
  // Blank means no alert, and the server spells that as zero.
  body.lowStockLevel =
    form.lowStockAlert === "" || form.lowStockAlert == null ? 0 : Number(form.lowStockAlert) || 0;
  return normItem(await api.patch(`/api/items/${id}`, body));
}

// ---------------------------------------------------------------------------
// parties
// ---------------------------------------------------------------------------
// A positive balance means they owe the shop. Negative means the shop owes
// them. Every screen must agree on that sign or the dashboard will be
// nonsense, so it is settled here.
export function normParty(row) {
  if (!row) return null;

  // Rupees, like every other amount the API returns. An earlier version of
  // this file read it as paise and divided everything by a hundred, on the
  // strength of one balance that looked too big - it was simply a large
  // opening balance that had been typed in.
  //
  // Positive means they owe the shop; negative means the shop owes them.
  const balancePaise = paiseFrom(row, "balance");

  const isCustomer = row.isCustomer !== undefined ? Boolean(row.isCustomer) : true;
  const isSupplier = Boolean(row.isSupplier);
  const type = row.type || (isCustomer && isSupplier ? "both" : isSupplier ? "supplier" : "customer");

  return {
    id: row.id,
    name: row.name || "",
    type,
    isCustomer,
    isSupplier,
    phone: row.phone || "",
    dialCode: row.dialCode || "+91",
    email: row.email || "",
    gstin: row.gstin || "",
    stateCode: row.stateCode || row.state_code || "",
    stateName: row.stateName || row.state_name || "",
    address: [row.addressLine1, row.addressLine2].filter(Boolean).join(", ") || row.address || "",
    city: row.city || "",
    pincode: row.pincode || "",
    balancePaise,
    owesUs: balancePaise > 0 ? balancePaise : 0,
    weOwe: balancePaise < 0 ? -balancePaise : 0,
    creditDays: num(row.creditDays, 0),
    creditLimitPaise: paiseFrom(row, "creditLimit"),
    raw: row,
  };
}

export async function listParties(params = {}) {
  const res = await api.get(`/api/parties${qs(params)}`);
  return { rows: rowsOf(res).map(normParty), total: totalOf(res) };
}

export async function getParty(id) {
  return normParty(await api.get(`/api/parties/${id}`));
}

function partyBody(form) {
  const type = form.type || "customer";
  const body = {
    name: form.name.trim(),
    // The server keeps these as two flags rather than one word, which is the
    // better model: plenty of businesses buy from the same people they sell
    // to. Both are sent so "Both" actually means both.
    isCustomer: type === "customer" || type === "both",
    isSupplier: type === "supplier" || type === "both",
  };
  if (form.phone) body.phone = String(form.phone).replace(/\D+/g, "");
  if (form.email) body.email = form.email.trim();
  if (form.gstin) body.gstin = form.gstin.trim().toUpperCase();
  if (form.stateCode) body.stateCode = form.stateCode;
  if (form.address) body.addressLine1 = form.address.trim();
  if (form.city) body.city = form.city.trim();
  if (form.pincode) body.pincode = String(form.pincode).replace(/\D+/g, "");
  return body;
}

export async function createParty(form) {
  const body = partyBody(form);
  const opening = Number(form.openingBalance) || 0;
  if (opening) body.openingBalance = form.openingDirection === "owe" ? -opening : opening;
  return normParty(await api.post("/api/parties", body));
}

export async function updateParty(id, form) {
  return normParty(await api.patch(`/api/parties/${id}`, partyBody(form)));
}

// ---------------------------------------------------------------------------
// invoices
// ---------------------------------------------------------------------------
export function normInvoice(row) {
  if (!row) return null;
  const a = row.amounts || {};

  // The amounts block comes back in rupees - 1512 means one thousand five
  // hundred and twelve rupees, not fifteen rupees twelve paise. Anything
  // named *Paise is already paise and is taken as it is.
  const money = (key) => {
    if (a[`${key}Paise`] !== undefined && a[`${key}Paise`] !== null) {
      return Math.round(Number(a[`${key}Paise`])) || 0;
    }
    if (a[key] !== undefined && a[key] !== null) return toPaise(a[key]);
    return paiseFrom(row, key);
  };

  const total = money("total");
  const balance = a.balance !== undefined || a.balancePaise !== undefined
    ? money("balance")
    : total - money("paid");

  return {
    id: row.id,
    number: row.number || row.invoiceNumber || row.docNumber || "",
    docType: row.docType || row.doc_type || row.type || "sale",
    date: String(row.issueDate || row.date || row.invoiceDate || row.createdAt || "").slice(0, 10),
    dueDate: row.dueDate ? String(row.dueDate).slice(0, 10) : null,
    partyId: row.partyId ?? row.party_id ?? row.party?.id ?? null,
    partyName: row.partyName || row.party?.name || "",
    partyPhone: row.partyPhone || row.party?.phone || "",
    partyGstin: row.partyGstin || row.party?.gstin || "",
    partyStateCode: row.placeOfSupply || row.party?.stateCode || "",
    status: row.status || (row.isCancelled ? "cancelled" : ""),
    cancelledAt: row.cancelledAt || row.cancelled_at || null,
    notes: row.notes || "",
    interState: Boolean(row.interState ?? row.isInterState ?? (a.igst && toPaise(a.igst) > 0)),
    amounts: {
      taxable: money("taxable"),
      discount: money("discount"),
      cgst: money("cgst"),
      sgst: money("sgst"),
      igst: money("igst"),
      roundOff: money("roundOff"),
      total,
      paid: money("paid"),
      balance,
    },
    lines: (row.lines || row.items || []).map(normInvoiceLine),
    payments: (row.payments || []).map(normPayment),
    raw: row,
  };
}

// The line's own field names are spelled a few different ways depending on
// which endpoint built it, so each one is looked for under the names it
// plausibly has. Amounts on a line arrive in rupees like the rest of an
// invoice, so paiseFrom multiplies them up.
function firstOf(row, names, fallback = "") {
  for (const n of names) {
    if (row[n] !== undefined && row[n] !== null && row[n] !== "") return row[n];
  }
  return fallback;
}

export function normInvoiceLine(row) {
  if (!row) return null;

  const money = (bases) => {
    for (const base of bases) {
      if (row[`${base}Paise`] !== undefined && row[`${base}Paise`] !== null) {
        return Math.round(Number(row[`${base}Paise`])) || 0;
      }
      if (row[base] !== undefined && row[base] !== null) return toPaise(row[base]);
    }
    return 0;
  };

  return {
    id: row.id,
    itemId: row.itemId ?? row.item_id ?? null,
    name: firstOf(row, ["itemName", "name", "description", "item_name"]),
    hsn: firstOf(row, ["hsnSac", "hsn", "hsnCode"]),
    // Which batch it came out of, recorded by the server when the item is
    // batch-tracked. A chemist's invoice has to carry both of these.
    batchNo: firstOf(row, ["batchNo", "batch_no"]),
    expiryDate: row.expiryDate ? String(row.expiryDate).slice(0, 10) : null,
    unit: firstOf(row, ["unit"], "PCS"),
    quantity: num(firstOf(row, ["quantity", "qty"], 0), 0),
    ratePaise: money(["rate", "price", "unitPrice", "salePrice"]),
    discountPaise: money(["discount", "discountAmount"]),
    taxRate: num(firstOf(row, ["taxRate", "tax_rate"], 0), 0),
    taxablePaise: money(["taxableValue", "taxable", "taxableAmount"]),
    cgstPaise: money(["cgstAmount", "cgst"]),
    sgstPaise: money(["sgstAmount", "sgst"]),
    igstPaise: money(["igstAmount", "igst"]),
    totalPaise: money(["total", "lineTotal", "amount", "netAmount"]),
    raw: row,
  };
}

export async function listInvoices(params = {}) {
  const res = await api.get(`/api/invoices${qs(params)}`);
  return { rows: rowsOf(res).map(normInvoice), total: totalOf(res) };
}

export async function getInvoice(id) {
  return normInvoice(await api.get(`/api/invoices/${id}`));
}

export async function createInvoice(payload) {
  return normInvoice(await api.post("/api/invoices", payload));
}

// ---------------------------------------------------------------------------
// cancelling a bill
// ---------------------------------------------------------------------------
export async function cancelInvoice(id, reason) {
  const out = await api.post(`/api/invoices/${id}/cancel`, reason ? { reason } : {});
  return normInvoice(out) || { id };
}

// The server only accepts these five words as a reason. The screen offers
// more than five, because "lost" and "given free" are different things to a
// shopkeeper even if the stock moves the same way - so the extra ones are
// mapped here and the real reason is written into the note, where it stays
// readable in the history.
const STOCK_REASON = {
  correction: "adjustment",
  adjustment: "adjustment",
  damage: "damage",
  expired: "expiry",
  expiry: "expiry",
  lost: "adjustment",
  sample: "adjustment",
  other: "adjustment",
  return_in: "return_in",
  return_out: "return_out",
};

const REASON_NOTE = {
  lost: "Lost or stolen",
  sample: "Given free",
  other: "Other",
};

export async function adjustStock(itemId, { quantity, reason, notes }) {
  const mapped = STOCK_REASON[reason] || "adjustment";
  const extra = REASON_NOTE[reason];
  const note = [extra, notes].filter(Boolean).join(" - ") || undefined;

  const out = await api.post(`/api/items/${itemId}/adjust-stock`, {
    change: quantity,
    reason: mapped,
    notes: note,
  });

  // The route answers with { id, currentStock } rather than the whole item,
  // so the caller reloads rather than trusting a half-filled row.
  return out && out.currentStock !== undefined ? { id: out.id, stock: Number(out.currentStock) } : null;
}

export async function listStockMoves(itemId, params = {}) {
  const out = await api.get(`/api/items/${itemId}/stock-history${qs(params)}`);
  return rowsOf(out).map((row) => ({
    id: row.id,
    change: num(row.change ?? row.quantityChange, 0),
    balanceAfter: num(row.balanceAfter, 0),
    reason: row.reason || "",
    refType: row.refType || "",
    refId: row.refId ?? null,
    notes: row.notes || "",
    createdAt: row.at || row.createdAt || null,
  }));
}

// ---------------------------------------------------------------------------
// payments
// ---------------------------------------------------------------------------
export function normPayment(row) {
  if (!row) return null;
  return {
    id: row.id,
    direction: row.direction || "in",
    partyId: row.partyId ?? row.party_id ?? null,
    partyName: row.partyName || row.party?.name || "",
    amountPaise: paiseFrom(row, "amount"),
    mode: row.mode || "cash",
    date: String(row.date || row.createdAt || "").slice(0, 10),
    notes: row.notes || row.reference || "",
    allocations: row.allocations || [],
    raw: row,
  };
}

export async function listPayments(params = {}) {
  const res = await api.get(`/api/payments${qs(params)}`);
  return { rows: rowsOf(res).map(normPayment), total: totalOf(res) };
}

export async function createPayment({ direction, partyId, amountRupees, mode, date, notes, allocations }) {
  const body = { direction, partyId, amount: amountRupees, mode };
  if (date) body.date = date;
  if (notes) body.notes = notes;
  if (allocations && allocations.length) body.allocations = allocations;
  return normPayment(await api.post("/api/payments", body));
}

// ---------------------------------------------------------------------------
// the shop itself
// ---------------------------------------------------------------------------
export function normBusiness(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name || "",
    stateCode: row.stateCode || row.state_code || "",
    stateName: row.stateName || row.state_name || "",
    gstin: row.gstin || "",
    phone: row.phone || "",
    email: row.email || "",
    address: [row.addressLine1, row.addressLine2].filter(Boolean).join(", ") || row.address || "",
    city: row.city || "",
    pincode: row.pincode || "",
    industry: row.industry || "",
    legalName: row.legalName || "",
    fyStartMonth: num(row.fyStartMonth, 4),
    plan: row.plan || row.subscription?.plan || null,
    raw: row,
  };
}

export async function getBusiness(id) {
  return normBusiness(await api.get(`/api/businesses/${id}`));
}

export { ApiError };

// ---------------------------------------------------------------------------
// expenses
// ---------------------------------------------------------------------------
// Rent, electricity, transport, staff, tea for the shop. Deliberately not a
// purchase: a purchase brings stock in and increases what a supplier is owed,
// an expense does neither. Amounts are rupees in and rupees out, like
// everything else.
export function normExpense(row) {
  if (!row) return null;
  return {
    id: row.id,
    partyId: row.partyId ?? null,
    partyName: row.partyName || "",
    category: row.category || "",
    date: String(row.expenseDate || row.createdAt || "").slice(0, 10),
    amountPaise: paiseFrom(row, "amount"),
    taxRate: num(row.taxRate, 0),
    taxPaise: paiseFrom(row, "tax"),
    totalPaise: paiseFrom(row, "total"),
    mode: row.mode || "cash",
    reference: row.reference || "",
    notes: row.notes || "",
    raw: row,
  };
}

export async function listExpenses(params = {}) {
  const res = await api.get(`/api/expenses${qs(params)}`);
  return { rows: rowsOf(res).map(normExpense), total: totalOf(res) };
}

export async function expensesByCategory(params = {}) {
  const res = await api.get(`/api/expenses/reports/by-category${qs(params)}`);
  return {
    from: res?.from || null,
    to: res?.to || null,
    totalPaise: toPaise(res?.total ?? 0),
    categories: (res?.categories || []).map((c) => ({
      category: c.category,
      count: num(c.count, 0),
      totalPaise: toPaise(c.total ?? 0),
      taxPaise: toPaise(c.tax ?? 0),
    })),
  };
}

function expenseBody(form) {
  const body = {
    category: form.category.trim(),
    amount: Number(form.amount) || 0,
    taxRate: Number(form.taxRate) || 0,
    mode: form.mode || "cash",
  };
  if (form.date) body.expenseDate = form.date;
  if (form.partyId) body.partyId = Number(form.partyId);
  if (form.reference) body.reference = form.reference.trim();
  if (form.notes) body.notes = form.notes.trim();
  return body;
}

export async function createExpense(form) {
  return normExpense(await api.post("/api/expenses", expenseBody(form)));
}

export async function updateExpense(id, form) {
  return normExpense(await api.patch(`/api/expenses/${id}`, expenseBody(form)));
}

export async function deleteExpense(id) {
  return api.del(`/api/expenses/${id}`);
}

// ---------------------------------------------------------------------------
// the day's collection
// ---------------------------------------------------------------------------
// Grouped by direction and mode on the server, which is the right place for
// it - a shop with two hundred payments in a day should not be sending all
// two hundred to the browser to add up four numbers.
export async function dayClose(date) {
  const res = await api.get(`/api/payments/reports/day-close${qs({ date })}`);
  const side = (obj) => {
    const rows = Object.entries(obj || {}).map(([mode, v]) => ({
      mode,
      count: num(v?.count, 0),
      paise: toPaise(v?.amount ?? 0),
    }));
    rows.sort((a, b) => b.paise - a.paise);
    return rows;
  };
  return {
    date: res?.date || date,
    in: side(res?.in),
    out: side(res?.out),
    totalInPaise: toPaise(res?.totalIn ?? 0),
    totalOutPaise: toPaise(res?.totalOut ?? 0),
  };
}

// ---------------------------------------------------------------------------
// batches and expiry
// ---------------------------------------------------------------------------
// Only for items marked as tracked. A chemist needs this; a hardware shop
// selling nuts and bolts does not, and making every item carry batch numbers
// would be a tax on the shops that do not need it.
export function normBatch(row) {
  if (!row) return null;
  return {
    id: row.id,
    itemId: row.itemId ?? null,
    itemName: row.itemName || "",
    unit: row.unit || "PCS",
    batchNo: row.batchNo || "",
    expiryDate: row.expiryDate ? String(row.expiryDate).slice(0, 10) : null,
    manufactureDate: row.manufactureDate ? String(row.manufactureDate).slice(0, 10) : null,
    quantity: num(row.quantity, 0),
    purchasePaise: row.purchasePrice == null ? null : toPaise(row.purchasePrice),
    salePaise: row.salePrice == null ? null : toPaise(row.salePrice),
    mrpPaise: row.mrp == null ? null : toPaise(row.mrp),
    expired: Boolean(row.expired),
    raw: row,
  };
}

export async function listBatches(itemId, params = {}) {
  const res = await api.get(`/api/items/${itemId}/batches${qs(params)}`);
  return rowsOf(res).map(normBatch);
}

export async function createBatch(itemId, form) {
  const body = { batchNo: form.batchNo.trim(), quantity: Number(form.quantity) || 0 };
  if (form.expiryDate) body.expiryDate = form.expiryDate;
  if (form.manufactureDate) body.manufactureDate = form.manufactureDate;
  if (form.purchasePrice !== "" && form.purchasePrice != null) body.purchasePrice = Number(form.purchasePrice);
  if (form.salePrice !== "" && form.salePrice != null) body.salePrice = Number(form.salePrice);
  if (form.mrp !== "" && form.mrp != null) body.mrp = Number(form.mrp);
  return normBatch(await api.post(`/api/items/${itemId}/batches`, body));
}

export async function updateBatch(itemId, batchId, patch) {
  return normBatch(await api.patch(`/api/items/${itemId}/batches/${batchId}`, patch));
}

export async function deleteBatch(itemId, batchId) {
  return api.del(`/api/items/${itemId}/batches/${batchId}`);
}

// Writing a batch off goes through the ordinary stock route with the batch
// named, so it lands in the stock history with a reason like anything else.
export async function writeOffBatch(itemId, batchId, quantity, notes) {
  return api.post(`/api/items/${itemId}/adjust-stock`, {
    change: -Math.abs(Number(quantity)),
    reason: "expiry",
    batchId: Number(batchId),
    ...(notes ? { notes } : {}),
  });
}

export async function expiringBatches(params = {}) {
  const res = await api.get(`/api/items/batches/expiring${qs(params)}`);
  return rowsOf(res).map(normBatch);
}
