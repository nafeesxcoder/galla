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

import { api, qs, rowsOf, totalOf, metaOf, ApiError } from "./api";
import { toPaise } from "./money";

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
// asking for everything
// ---------------------------------------------------------------------------
// The server refuses a page larger than 200 rows, and it is right to. But a
// screen that shows "stock worth ₹4,20,000 across 340 items" has to have
// seen all 340 or the figure is a lie, so those screens page through here
// instead of asking for an impossible limit and getting a 400 back.
//
// The ceiling is real: beyond it the number shown is the first N and the
// screen says so rather than hanging on a shop with ten thousand items.
export const PAGE = 200;

async function pageThrough(fetchPage, { max = 2000 } = {}) {
  const rows = [];
  let offset = 0;
  let total = null;

  for (;;) {
    const page = await fetchPage({ limit: PAGE, offset });
    rows.push(...page.rows);
    if (total === null && Number.isFinite(page.total)) total = page.total;

    const done = page.rows.length < PAGE || rows.length >= (total ?? rows.length) || rows.length >= max;
    if (done) break;
    offset += PAGE;
  }

  return { rows, total: total ?? rows.length, capped: rows.length >= max };
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

// Every item in the shop, for the screens that add stock values up.
export function listAllItems(params = {}) {
  return pageThrough((page) => listItems({ ...params, ...page }));
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

/**
 * Changes ONLY the selling price.
 *
 * Deliberately not updateItem. That one rebuilds the whole body from a form -
 * name, unit, tax rate, code, HSN, description, the low-stock level - so
 * handing it a lone price would send undefined for the rest and either throw
 * or quietly blank them. The bulk price tool has nothing but an id and a
 * number, and this is the narrow patch that matches.
 */
export async function setSalePrice(id, rupeesValue) {
  return normItem(await api.patch(`/api/items/${id}`, { salePrice: Number(rupeesValue) }));
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

export function listAllParties(params = {}) {
  return pageThrough((page) => listParties({ ...params, ...page }));
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

export function listAllInvoices(params = {}) {
  return pageThrough((page) => listInvoices({ ...params, ...page }), { max: 1000 });
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
    // The server always sends these complete, so a screen never has to
    // decide what a missing preference means. The fallbacks here are only
    // for a response from an older server that has no settings at all.
    settings: {
      bill: {
        terms: "",
        footer: "",
        signatureLabel: "",
        showHsn: true,
        showAmountInWords: true,
        showPaymentStatus: true,
        showSignature: true,
        showBankDetails: false,
        defaultSize: "a4",
        ...(row.settings?.bill || {}),
      },
      defaults: {
        dueDays: 0,
        roundOff: true,
        paymentMode: "cash",
        itemUnit: "PCS",
        itemTaxRate: 0,
        itemPriceIncludesTax: false,
        ...(row.settings?.defaults || {}),
      },
    },
    raw: row,
  };
}

export async function getBusiness(id) {
  return normBusiness(await api.get(`/api/businesses/${id}`));
}

// Only what is actually filled in gets sent.
//
// An empty field is left out rather than sent as null or as "". The server
// validates each field it is given - a blank pincode fails the six-digit
// rule, a blank email fails the email rule, and null is not a string - so
// sending empties turns "I only wanted to add a phone number" into "some
// fields need fixing". The cost is that a field already saved cannot be
// cleared from here, which is the smaller of the two problems.
export async function updateBusiness(id, patch) {
  const body = {};
  const fields = [
    "name",
    "legalName",
    "gstin",
    "stateCode",
    "phone",
    "email",
    "addressLine1",
    "addressLine2",
    "city",
    "pincode",
    "industry",
  ];
  for (const f of fields) {
    const v = patch[f];
    if (v === undefined || v === null) continue;
    if (typeof v === "string" && v.trim() === "") continue;
    body[f] = typeof v === "string" ? v.trim() : v;
  }
  return normBusiness(await api.patch(`/api/businesses/${id}`, body));
}

// GST rate by rate, for the return. Worked out on the server, because the
// invoice list does not carry the lines and asking for every bill one at a
// time would be hundreds of requests to fill in one screen.
//
// A shop whose backend has not been updated yet simply does not get this
// section, rather than the whole Reports screen failing.
export async function gstReport({ from, to }) {
  const res = await api.get(`/api/invoices/reports/gst${qs({ from, to })}`);
  return {
    from: res?.from || from,
    to: res?.to || to,
    byRate: (res?.byRate || []).map((r) => ({
      taxRate: num(r.taxRate, 0),
      lines: num(r.lines, 0),
      taxablePaise: toPaise(r.taxable ?? 0),
      cgstPaise: toPaise(r.cgst ?? 0),
      sgstPaise: toPaise(r.sgst ?? 0),
      igstPaise: toPaise(r.igst ?? 0),
      taxPaise: toPaise(r.tax ?? 0),
    })),
    b2b: {
      count: num(res?.split?.b2b?.count, 0),
      taxablePaise: toPaise(res?.split?.b2b?.taxable ?? 0),
      totalPaise: toPaise(res?.split?.b2b?.total ?? 0),
    },
    b2c: {
      count: num(res?.split?.b2c?.count, 0),
      taxablePaise: toPaise(res?.split?.b2c?.taxable ?? 0),
      totalPaise: toPaise(res?.split?.b2c?.total ?? 0),
    },
  };
}

// The sales figures a shopkeeper actually asks for. These come from the bill
// list rather than a server report, so they always agree with what the Bills
// screen shows.
export async function salesReport({ from, to }) {
  const { rows, capped } = await listAllInvoices({ from, to });
  const live = rows.filter((r) => r.status !== "cancelled");

  const zero = () => ({ count: 0, total: 0, taxable: 0, tax: 0, outstanding: 0 });
  const byType = {};

  for (const r of live) {
    const t = (byType[r.docType] = byType[r.docType] || zero());
    t.count += 1;
    t.total += r.amounts.total;
    t.taxable += r.amounts.taxable;
    t.tax += r.amounts.cgst + r.amounts.sgst + r.amounts.igst;
    t.outstanding += r.amounts.balance;
  }

  return { from, to, count: live.length, byType, capped };
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


// ---------------------------------------------------------------------------
// preferences
// ---------------------------------------------------------------------------
// Sent as a nested patch and merged by the server section by section, so
// saving the bill format cannot blank the item defaults. Only the keys that
// changed go up.
export async function updateSettings(id, patch) {
  return normBusiness(await api.patch(`/api/businesses/${id}`, { settings: patch }));
}

// ---------------------------------------------------------------------------
// bill numbering
// ---------------------------------------------------------------------------
export async function listNumbering(params = {}) {
  const d = await api.get(`/api/invoices/numbering${qs(params)}`);
  return {
    fy: d?.fy || "",
    series: (d?.series || []).map((r) => ({
      docType: r.docType,
      label: r.label || r.docType,
      prefix: r.prefix || "",
      nextNumber: num(r.nextNumber, 1),
      padding: num(r.padding, 4),
      issued: num(r.issued, 0),
      // Below this a number would be reused, which the server refuses.
      lowestAllowed: num(r.lowestAllowed, 1),
      example: r.example || "",
    })),
  };
}

export async function updateNumbering(docType, form) {
  const body = {};
  // "" is a real choice - it drops the prefix - so an empty string is sent
  // where most of this file would skip it.
  if (form.prefix !== undefined) body.prefix = String(form.prefix).trim().toUpperCase();
  if (form.nextNumber !== undefined && form.nextNumber !== "") body.nextNumber = Math.round(Number(form.nextNumber));
  if (form.padding !== undefined && form.padding !== "") body.padding = Math.round(Number(form.padding));
  if (form.fy) body.fy = form.fy;
  return api.patch(`/api/invoices/numbering/${docType}`, body);
}

// ---------------------------------------------------------------------------
// cash and bank
// ---------------------------------------------------------------------------
// The drawer and the bank accounts. Every balance here is worked out by the
// server from the transactions behind it, so nothing is cached and nothing is
// recomputed on the phone - two places doing the same arithmetic is two
// answers to the same question.

export const MOVE_KINDS = {
  "cash-to-bank": "Deposited in the bank",
  "bank-to-cash": "Withdrawn from the bank",
  "bank-to-bank": "Moved between accounts",
  "bank-charge": "Bank charges",
  "bank-interest": "Bank interest",
  "cash-increase": "Cash adjusted up",
  "cash-decrease": "Cash adjusted down",
};

// Which side of a move needs a real account. The server checks this too and
// is the one that matters; the screen uses it to decide which pickers to
// show rather than offering a "from account" on a cash deposit.
export const MOVE_SHAPE = {
  "cash-to-bank": { from: "cash", to: "bank" },
  "bank-to-cash": { from: "bank", to: "cash" },
  "bank-to-bank": { from: "bank", to: "bank" },
  "bank-charge": { from: "bank", to: null },
  "bank-interest": { from: null, to: "bank" },
  "cash-increase": { from: null, to: "cash" },
  "cash-decrease": { from: "cash", to: null },
};

export function normAccount(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name || "",
    bankName: row.bankName || "",
    accountNumber: row.accountNumber || "",
    ifsc: row.ifsc || "",
    accountHolder: row.accountHolder || "",
    branch: row.branch || "",
    upiId: row.upiId || "",
    openingPaise: paiseFrom(row, "openingBalance"),
    openingDate: String(row.openingDate || "").slice(0, 10),
    isDefault: Boolean(row.isDefault),
    printOnInvoice: Boolean(row.printOnInvoice),
    notes: row.notes || "",
    // undefined rather than 0 when the server did not send one, so a screen
    // can tell "no transactions yet" from "not asked for".
    balancePaise: row.balance === undefined ? undefined : paiseFrom(row, "balance"),
    raw: row,
  };
}

export async function cashBankSummary() {
  const d = await api.get("/api/cashbank/summary");
  return {
    cash: {
      openingPaise: paiseFrom(d.cash, "opening"),
      receivedPaise: paiseFrom(d.cash, "received"),
      paidOutPaise: paiseFrom(d.cash, "paidOut"),
      spentPaise: paiseFrom(d.cash, "spent"),
      depositedPaise: paiseFrom(d.cash, "depositedToBank"),
      withdrawnPaise: paiseFrom(d.cash, "withdrawnFromBank"),
      loanPaise: paiseFrom(d.cash, "loanInstalments"),
      balancePaise: paiseFrom(d.cash, "balance"),
    },
    accounts: (d.accounts || []).map(normAccount),
    bankTotalPaise: paiseFrom(d, "bankTotal"),
    totalPaise: paiseFrom(d, "total"),
    cheques: {
      toReceivePaise: paiseFrom(d.chequesPending, "toReceive"),
      toPayPaise: paiseFrom(d.chequesPending, "toPay"),
      countToReceive: num(d.chequesPending?.countToReceive),
      countToPay: num(d.chequesPending?.countToPay),
    },
    raw: d,
  };
}

export async function listBankAccounts() {
  return rowsOf(await api.get("/api/cashbank/accounts")).map(normAccount);
}

function accountBody(form) {
  const body = {};
  const text = ["name", "bankName", "accountNumber", "ifsc", "accountHolder", "branch", "upiId", "notes"];
  for (const k of text) if (form[k]) body[k] = String(form[k]).trim();
  if (form.openingDate) body.openingDate = form.openingDate;
  if (form.openingBalance !== undefined && form.openingBalance !== "") {
    body.openingBalance = Number(form.openingBalance);
  }
  if (form.isDefault !== undefined) body.isDefault = Boolean(form.isDefault);
  if (form.printOnInvoice !== undefined) body.printOnInvoice = Boolean(form.printOnInvoice);
  return body;
}

export async function createBankAccount(form) {
  return normAccount(await api.post("/api/cashbank/accounts", accountBody(form)));
}

export async function updateBankAccount(id, form) {
  return normAccount(await api.patch(`/api/cashbank/accounts/${id}`, accountBody(form)));
}

export async function deleteBankAccount(id) {
  return api.delete(`/api/cashbank/accounts/${id}`);
}

function normStatement(d) {
  return {
    balancePaise: paiseFrom(d, "balance"),
    openingPaise: paiseFrom(d, "opening"),
    account: d.account ? normAccount(d.account) : null,
    rows: (d.rows || []).map((r) => ({
      id: r.id,
      kind: r.kind,
      date: String(r.date || "").slice(0, 10),
      label: r.label || "",
      detail: r.detail || "",
      inPaise: paiseFrom(r, "in"),
      outPaise: paiseFrom(r, "out"),
    })),
  };
}

export async function cashStatement(params = {}) {
  return normStatement(await api.get(`/api/cashbank/cash/statement${qs(params)}`));
}

export async function bankStatement(id, params = {}) {
  return normStatement(await api.get(`/api/cashbank/accounts/${id}/statement${qs(params)}`));
}

export async function setOpeningCash(rupees) {
  return api.patch("/api/cashbank/cash/opening", { openingCash: Number(rupees) });
}

export function normMove(row) {
  if (!row) return null;
  return {
    id: row.id,
    kind: row.kind,
    label: MOVE_KINDS[row.kind] || row.kind,
    fromName: row.fromName || "",
    toName: row.toName || "",
    date: String(row.moveDate || "").slice(0, 10),
    amountPaise: paiseFrom(row, "amount"),
    reference: row.reference || "",
    notes: row.notes || "",
  };
}

export async function listMoves(params = {}) {
  const res = await api.get(`/api/cashbank/moves${qs(params)}`);
  return { rows: rowsOf(res).map(normMove), total: totalOf(res) };
}

export async function createMove(form) {
  const body = { kind: form.kind, amount: Number(form.amount) };
  if (form.fromAccountId) body.fromAccountId = Number(form.fromAccountId);
  if (form.toAccountId) body.toAccountId = Number(form.toAccountId);
  if (form.date) body.moveDate = form.date;
  if (form.reference) body.reference = String(form.reference).trim();
  if (form.notes) body.notes = String(form.notes).trim();
  return normMove(await api.post("/api/cashbank/moves", body));
}

export async function cancelMove(id) {
  return api.delete(`/api/cashbank/moves/${id}`);
}

// ---------------------------------------------------------------------------
// cheques
// ---------------------------------------------------------------------------
export function normCheque(row) {
  if (!row) return null;
  return {
    id: row.id,
    direction: row.direction || "in",
    partyId: row.partyId ?? null,
    partyName: row.partyName || "",
    amountPaise: paiseFrom(row, "amount"),
    date: String(row.paymentDate || "").slice(0, 10),
    dueDate: String(row.dueDate || "").slice(0, 10),
    settledDate: String(row.settledDate || "").slice(0, 10),
    status: row.status || "pending",
    number: row.chequeNumber || "",
    bank: row.chequeBank || "",
    notes: row.notes || "",
    // The server works this out, because a phone with the wrong date set
    // would otherwise colour half the list red.
    overdue: Boolean(row.overdue),
  };
}

export async function listCheques(params = {}) {
  const res = await api.get(`/api/cashbank/cheques${qs(params)}`);
  return { rows: rowsOf(res).map(normCheque), total: totalOf(res) };
}

export async function setChequeStatus(id, status, { settledDate, bankAccountId, notes } = {}) {
  const body = { status };
  if (settledDate) body.settledDate = settledDate;
  if (bankAccountId) body.bankAccountId = Number(bankAccountId);
  if (notes !== undefined) body.notes = notes;
  const d = await api.patch(`/api/cashbank/cheques/${id}`, body);
  return {
    id: d.id,
    status: d.status,
    settledDate: String(d.settledDate || "").slice(0, 10),
    amountPaise: paiseFrom(d, "amount"),
    // Which bills are owed again. Named by the server so the screen can
    // say so instead of leaving it to be discovered at month end.
    billsBackToUnpaid: (d.billsBackToUnpaid || []).map((b) => ({
      invoiceId: b.invoiceId,
      number: b.invoiceNumber,
      amountPaise: paiseFrom(b, "amount"),
    })),
  };
}

// ---------------------------------------------------------------------------
// loans
// ---------------------------------------------------------------------------
export const LOAN_KINDS = {
  bank: "Bank loan",
  gold: "Gold loan",
  vehicle: "Vehicle loan",
  personal: "Personal / from family",
  "credit-card": "Credit card",
  other: "Something else",
};

export function normLoan(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name || "",
    lender: row.lender || "",
    accountNumber: row.accountNumber || "",
    kind: row.kind || "bank",
    kindLabel: LOAN_KINDS[row.kind] || "Loan",
    principalPaise: paiseFrom(row, "principal"),
    openingPaise: paiseFrom(row, "openingBalance"),
    interestRate: num(row.interestRate),
    tenureMonths: row.tenureMonths ?? null,
    emiPaise: paiseFrom(row, "emi"),
    startDate: String(row.startDate || "").slice(0, 10),
    dueDay: row.dueDay ?? null,
    nextDueDate: String(row.nextDueDate || "").slice(0, 10),
    bankAccountId: row.bankAccountId ?? null,
    bankAccountName: row.bankAccountName || "",
    notes: row.notes || "",
    isClosed: Boolean(row.isClosed),
    principalPaidPaise: paiseFrom(row, "principalPaid"),
    interestPaidPaise: paiseFrom(row, "interestPaid"),
    chargesPaidPaise: paiseFrom(row, "chargesPaid"),
    totalPaidPaise: paiseFrom(row, "totalPaid"),
    outstandingPaise: paiseFrom(row, "outstanding"),
    raw: row,
  };
}

export async function listLoans(params = {}) {
  const res = await api.get(`/api/loans${qs(params)}`);
  const meta = metaOf(res);
  return {
    rows: rowsOf(res).map(normLoan),
    outstandingPaise: paiseFrom(meta, "totalOutstanding"),
    monthlyPaise: paiseFrom(meta, "monthlyInstalments"),
  };
}

export async function getLoan(id) {
  return normLoan(await api.get(`/api/loans/${id}`));
}

function loanBody(form) {
  const body = {};
  if (form.name) body.name = String(form.name).trim();
  if (form.lender) body.lender = String(form.lender).trim();
  if (form.accountNumber) body.accountNumber = String(form.accountNumber).trim();
  if (form.kind) body.kind = form.kind;
  if (form.notes) body.notes = String(form.notes).trim();
  if (form.startDate) body.startDate = form.startDate;
  for (const k of ["principal", "openingBalance", "interestRate", "emi"]) {
    if (form[k] !== undefined && form[k] !== "") body[k] = Number(form[k]);
  }
  for (const k of ["tenureMonths", "dueDay"]) {
    if (form[k] !== undefined && form[k] !== "") body[k] = Math.round(Number(form[k]));
  }
  if (form.bankAccountId !== undefined) {
    body.bankAccountId = form.bankAccountId ? Number(form.bankAccountId) : null;
  }
  if (form.isClosed !== undefined) body.isClosed = Boolean(form.isClosed);
  return body;
}

export async function createLoan(form) {
  return normLoan(await api.post("/api/loans", loanBody(form)));
}

export async function updateLoan(id, form) {
  return normLoan(await api.patch(`/api/loans/${id}`, loanBody(form)));
}

export async function deleteLoan(id) {
  return api.delete(`/api/loans/${id}`);
}

export function normLoanPayment(row) {
  if (!row) return null;
  return {
    id: row.id,
    date: String(row.paymentDate || "").slice(0, 10),
    amountPaise: paiseFrom(row, "amount"),
    principalPaise: paiseFrom(row, "principal"),
    interestPaise: paiseFrom(row, "interest"),
    chargesPaise: paiseFrom(row, "charges"),
    mode: row.mode || "bank",
    bankAccountId: row.bankAccountId ?? null,
    bankAccountName: row.bankAccountName || "",
    reference: row.reference || "",
    notes: row.notes || "",
  };
}

export async function listLoanPayments(id, params = {}) {
  const res = await api.get(`/api/loans/${id}/payments${qs(params)}`);
  return { rows: rowsOf(res).map(normLoanPayment), total: totalOf(res) };
}

export async function addLoanPayment(id, form) {
  const body = { amount: Number(form.amount), mode: form.mode || "bank" };
  // Left out, the server splits it: one month's interest on what is still
  // owed, and the rest off the debt. Sent, the server checks the three add
  // up to the instalment rather than taking them on trust.
  for (const k of ["principal", "interest", "charges"]) {
    if (form[k] !== undefined && form[k] !== "") body[k] = Number(form[k]);
  }
  if (form.date) body.paymentDate = form.date;
  if (form.bankAccountId) body.bankAccountId = Number(form.bankAccountId);
  if (form.reference) body.reference = String(form.reference).trim();
  if (form.notes) body.notes = String(form.notes).trim();
  const d = await api.post(`/api/loans/${id}/payments`, body);
  return { payment: normLoanPayment(d.payment), loan: normLoan(d.loan) };
}

// ---------------------------------------------------------------------------
// the shops themselves, the plan, the staff, and getting the data out
// ---------------------------------------------------------------------------
export async function listBusinesses() {
  return rowsOf(await api.get("/api/businesses")).map(normBusiness);
}

export async function createBusiness(form) {
  const body = { name: String(form.name).trim(), stateCode: form.stateCode };
  for (const k of ["city", "industry", "gstin", "phone"]) if (form[k]) body[k] = String(form[k]).trim();
  return normBusiness(await api.post("/api/businesses", body));
}

export async function listPlans() {
  return rowsOf(await api.get("/api/plans")).map((p) => ({
    id: p.id,
    code: p.code || "",
    name: p.name || "",
    pricePaise: paiseFrom(p, "price"),
    // periodMonths is what the server actually sends. The other two names
    // were guesses, and because the fallback was 12 a monthly plan read as
    // yearly - a wrong price per month on the one screen about money.
    months: num(p.periodMonths ?? p.months ?? p.durationMonths, 12),
    features: p.features || [],
    limits: p.limits || {},
    // Every way the plan is sold: desktop + mobile, mobile only, desktop
    // only, for one year or three. The headline above is the one most people
    // buy; this is the full list, so a phone shows the mobile-only price
    // rather than the desktop-and-mobile one.
    prices: (p.prices || []).map((r) => ({
      device: r.device || "both",
      months: num(r.periodMonths, 12),
      pricePaise: paiseFrom(r, "price"),
    })),
    raw: p,
  }));
}

// ---------------------------------------------------------------------------
// the account desk: plan, expiry, licence keys
// ---------------------------------------------------------------------------
// Not business data, so no X-Business-Id: this is about the person, and it
// answers for every shop they own at once.
export async function myAccount() {
  const d = (await api.get("/api/account")) || {};
  return {
    user: d.user || null,
    shops: (d.shops || []).map((s) => ({
      id: s.id,
      name: s.name || "",
      role: s.role || "staff",
      plan: s.plan
        ? {
            code: s.plan.code || "",
            name: s.plan.name || "",
            status: s.plan.status || "",
            endsAt: s.plan.endsAt || null,
            // null means a plan with no end date, which is NOT the same as
            // zero days left. A screen that treats them alike tells a shop
            // on the free plan that it expires today.
            daysLeft: s.plan.daysLeft === null || s.plan.daysLeft === undefined ? null : num(s.plan.daysLeft),
            expiringSoon: Boolean(s.plan.expiringSoon),
            maxUsers: num(s.plan.maxUsers, 1),
            maxDevices: num(s.plan.maxDevices, 1),
          }
        : null,
    })),
    activeLicences: num(d.activeLicences, 0),
    licences: (d.licences || []).map((l) => ({
      id: l.id,
      code: l.code || "",
      planName: l.planName || "",
      status: l.status || "",
      businessName: l.businessName || "",
      months: num(l.periodMonths, 12),
      expiresAt: l.expiresAt || null,
      daysLeft: l.daysLeft === null || l.daysLeft === undefined ? null : num(l.daysLeft),
    })),
  };
}

export async function redeemLicence({ code, businessId }) {
  const d = await api.post("/api/account/licences/redeem", {
    code: String(code).trim(),
    businessId: Number(businessId),
  });
  return {
    code: d.code || "",
    planName: d.plan?.name || "",
    months: num(d.months, 12),
    // Whether time was ADDED to a plan still running, or a new one started.
    // Different news, and the screen says which.
    extended: Boolean(d.extended),
    expiresAt: d.expiresAt || null,
  };
}

export async function listMembers(businessId) {
  return rowsOf(await api.get(`/api/businesses/${businessId}/members`)).map((m) => ({
    id: m.id,
    userId: m.userId ?? m.user_id ?? null,
    name: m.name || m.user?.name || "",
    phone: m.phone || m.user?.phone || "",
    role: m.role || "staff",
    isActive: m.isActive === undefined ? true : Boolean(m.isActive),
    isYou: Boolean(m.isYou),
  }));
}

// The whole shop in one object, for the backup screen to write to a file.
// Deliberately not normalised: it is handed straight to the file, and the
// file has to be readable by something that is not this app.
export async function fetchBackup(params = {}) {
  return api.get(`/api/backup${qs(params)}`);
}
