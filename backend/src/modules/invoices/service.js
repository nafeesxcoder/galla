// ===========================================================================
// INVOICES
// ---------------------------------------------------------------------------
// Creating one invoice touches five things:
//
//   1. the invoice number      must be unique and unbroken
//   2. the lines and the tax
//   3. the stock               goes down on a sale, up on a purchase
//   4. the party's balance     they now owe you, or you owe them
//   5. the stock history       a row saying why the stock moved
//
// All five happen in ONE transaction. A bill that took the stock out but did
// not record the sale - or recorded the sale but left the customer's balance
// alone - is worse than a bill that failed, because nobody notices until the
// books do not add up weeks later.
// ===========================================================================

const db = require("../../db");
const ApiError = require("../../utils/ApiError");
const { toPaise, toRupees } = require("../../utils/money");
const gst = require("../../utils/gst");
const settings = require("../businesses/settings");
const stock = require("../items/stock");

// Which documents move stock, and which way.
const STOCK_EFFECT = {
  sale: -1,
  purchase: +1,
  credit_note: +1, // a sale came back
  debit_note: -1, // a purchase went back
  estimate: 0, // nothing has moved yet
  challan: 0, // goods are out but not billed - see the note below
};

// Which documents change what a party owes.
const BALANCE_EFFECT = {
  sale: +1, // they owe us more
  purchase: -1, // we owe them more
  credit_note: -1,
  debit_note: +1,
  estimate: 0,
  challan: 0,
};

/**
 * The financial year a date falls in, as "2026-27".
 * India runs April to March, but the start month is per business so this
 * does not argue with an accountant who does it differently.
 */
function financialYear(dateStr, fyStartMonth = 4) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;

  const startYear = m >= fyStartMonth ? y : y - 1;
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
}

const DEFAULT_PREFIX = {
  sale: "INV",
  purchase: "PUR",
  estimate: "EST",
  challan: "CHL",
  credit_note: "CRN",
  debit_note: "DBN",
};

/** issueDate plus the shop's credit days, or null when there are none. */
function dueFrom(issueDate, days) {
  const n = Number(days) || 0;
  if (n <= 0) return null;
  const d = new Date(`${issueDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * Takes the next number for this business, document type and year.
 *
 * MUST be called inside a transaction. The counter row is locked FOR UPDATE,
 * which is the whole point: two tills billing in the same second queue up
 * here instead of both being handed number 42.
 */
async function nextNumber(trx, { businessId, docType, fy }) {
  let counter = await trx("invoice_counters")
    .where({ business_id: businessId, doc_type: docType, fy })
    .forUpdate()
    .first();

  if (!counter) {
    // First document of this type this year.
    try {
      await trx("invoice_counters").insert({
        business_id: businessId,
        doc_type: docType,
        fy,
        prefix: DEFAULT_PREFIX[docType] ?? "DOC",
        next_number: 1,
      });
    } catch (e) {
      // Another transaction created it a moment ago. Fine - read theirs.
      if (e.code !== "ER_DUP_ENTRY") throw e;
    }

    counter = await trx("invoice_counters")
      .where({ business_id: businessId, doc_type: docType, fy })
      .forUpdate()
      .first();
  }

  const serial = counter.next_number;

  await trx("invoice_counters")
    .where({ id: counter.id })
    .update({ next_number: serial + 1, updated_at: trx.fn.now() });

  const padded = String(serial).padStart(counter.padding, "0");
  const number = counter.prefix
    ? `${counter.prefix}-${fy}-${padded}`
    : `${fy}-${padded}`;

  return { number, serial, prefix: counter.prefix };
}

/**
 * Creates an invoice. Everything in one transaction.
 */
async function create({ business, user, input }) {
  const docType = input.docType;
  const issueDate = input.issueDate ?? new Date().toISOString().slice(0, 10);
  const fy = financialYear(issueDate, business.fy_start_month);

  return db.transaction(async (trx) => {
    // ---- the party ------------------------------------------------------
    let party = null;
    if (input.partyId) {
      party = await trx("parties")
        .where({ id: input.partyId, business_id: business.id })
        .whereNull("deleted_at")
        .forUpdate()
        .first();
      if (!party) throw ApiError.badRequest("No such customer or supplier.");
    }

    // Where the goods are going decides which tax applies. The party's
    // state, falling back to the business's own for a walk-in.
    const placeOfSupply =
      input.placeOfSupply ?? party?.state_code ?? business.state_code;
    const interState = gst.isInterState(business.state_code, placeOfSupply);

    // ---- the lines ------------------------------------------------------
    if (!input.lines?.length) {
      throw ApiError.badRequest("An invoice needs at least one line.");
    }

    const computed = [];

    for (const [i, line] of input.lines.entries()) {
      let item = null;

      if (line.itemId) {
        item = await trx("items")
          .where({ id: line.itemId, business_id: business.id })
          .whereNull("deleted_at")
          .first();
        if (!item) throw ApiError.badRequest(`Line ${i + 1}: no such item.`);
      } else if (!line.name) {
        throw ApiError.badRequest(`Line ${i + 1}: needs an item or a name.`);
      }

      // The rate on the line wins if given; otherwise the item's own price.
      // Shopkeepers negotiate, and the bill has to say what was agreed.
      const ratePaise =
        line.rate !== undefined
          ? toPaise(line.rate, `lines[${i}].rate`)
          : Number(docType === "purchase" ? item.purchase_price_paise : item.sale_price_paise);

      const taxRate = line.taxRate ?? (item ? Number(item.tax_rate) : 0);
      const inclusive = line.priceIncludesTax ?? Boolean(item?.price_includes_tax);

      const discount = line.discountPercent
        ? { type: "percent", value: line.discountPercent }
        : line.discountAmount
          ? { type: "amount", valuePaise: toPaise(line.discountAmount, `lines[${i}].discountAmount`) }
          : null;

      const calc = gst.computeLine({
        qty: line.quantity,
        ratePaise,
        discount,
        taxRate,
        interState,
        taxInclusive: inclusive,
      });

      computed.push({
        input: line,
        item,
        ratePaise,
        taxRate,
        ...calc,
      });
    }

    // ---- totals ---------------------------------------------------------
    // The shop's own preference, unless this particular bill says otherwise.
    // Most Indian invoices settle to a whole rupee and show the difference as
    // "Round off"; a shop that genuinely bills in paise turns it off once in
    // Settings rather than on every bill.
    const prefs = settings.read(business.settings);
    const roundOff = input.roundOff === undefined ? prefs.defaults.roundOff : input.roundOff !== false;
    const totals = gst.computeTotals(computed, { roundOff });

    // ---- the number -----------------------------------------------------
    const { number, serial, prefix } = await nextNumber(trx, {
      businessId: business.id,
      docType,
      fy,
    });

    // ---- the invoice row ------------------------------------------------
    const [invoiceId] = await trx("invoices").insert({
      business_id: business.id,
      doc_type: docType,
      number,
      prefix,
      serial,
      fy,
      issue_date: issueDate,
      // No date sent: work it out from the shop's default credit days. Zero
      // days means due on issue, which is what a cash counter wants, so it
      // is left blank rather than set to today - a due date equal to the
      // issue date reads as a deadline on a bill that was already paid.
      due_date: input.dueDate ?? dueFrom(issueDate, prefs.defaults.dueDays),
      party_id: party?.id ?? null,
      // Copied, not joined: renaming the customer next month must not
      // change what this bill says.
      party_name: party?.name ?? input.partyName ?? null,
      party_gstin: party?.gstin ?? null,
      place_of_supply: placeOfSupply,
      is_inter_state: interState,
      gross_paise: totals.grossPaise,
      discount_paise: totals.discountPaise,
      taxable_paise: totals.taxablePaise,
      cgst_paise: totals.cgstPaise,
      sgst_paise: totals.sgstPaise,
      igst_paise: totals.igstPaise,
      round_off_paise: totals.roundOffPaise,
      total_paise: totals.totalPaise,
      paid_paise: 0,
      balance_paise: totals.totalPaise,
      status: docType === "estimate" ? "draft" : "issued",
      notes: input.notes ?? null,
      terms: input.terms ?? null,
      converted_from_id: input.convertedFromId ?? null,
      created_by: user.id,
    });

    // ---- the lines, and the stock ---------------------------------------
    const direction = STOCK_EFFECT[docType] ?? 0;

    for (const [i, c] of computed.entries()) {
      let batchId = c.input.batchId ?? null;
      let batchNo = null;
      let expiryDate = null;

      // For a batch-tracked item on a sale with no batch named, pick the
      // one expiring soonest. See stock.pickBatches for why.
      if (c.item?.track_batches && direction === -1 && !batchId) {
        const { picks } = await stock.pickBatches(trx, {
          itemId: c.item.id,
          quantity: c.input.quantity,
        });
        if (picks.length === 1) {
          batchId = picks[0].batchId;
          batchNo = picks[0].batchNo;
          expiryDate = picks[0].expiryDate;
        }
        // Several batches for one line is left to the caller to split, so
        // the printed bill shows each batch on its own line - which is what
        // the rules want for medicines anyway.
      }

      if (batchId && !batchNo) {
        const b = await trx("item_batches").where({ id: batchId }).first();
        batchNo = b?.batch_no ?? null;
        expiryDate = b?.expiry_date ?? null;
      }

      await trx("invoice_lines").insert({
        business_id: business.id,
        invoice_id: invoiceId,
        item_id: c.item?.id ?? null,
        batch_id: batchId,
        line_no: i + 1,
        name: c.input.name ?? c.item.name,
        hsn_sac: c.input.hsnSac ?? c.item?.hsn_sac ?? null,
        unit: c.input.unit ?? c.item?.unit ?? "PCS",
        batch_no: batchNo,
        expiry_date: expiryDate,
        quantity: c.input.quantity,
        rate_paise: c.ratePaise,
        gross_paise: c.grossPaise,
        discount_paise: c.discountPaise,
        taxable_paise: c.taxablePaise,
        tax_rate: c.taxRate,
        cgst_paise: c.cgstPaise,
        sgst_paise: c.sgstPaise,
        igst_paise: c.igstPaise,
        total_paise: c.totalPaise,
      });

      if (direction !== 0 && c.item && c.item.type === "product") {
        await stock.move(trx, {
          businessId: business.id,
          itemId: c.item.id,
          batchId,
          change: direction * Number(c.input.quantity),
          reason:
            docType === "sale"
              ? "sale"
              : docType === "purchase"
                ? "purchase"
                : direction > 0
                  ? "return_in"
                  : "return_out",
          refType: "invoice",
          refId: invoiceId,
          userId: user.id,
          // The counter must not stop because the stock entry is behind.
          allowNegative: true,
        });
      }
    }

    // ---- the party's balance --------------------------------------------
    const balanceDir = BALANCE_EFFECT[docType] ?? 0;
    if (party && balanceDir !== 0) {
      await trx("parties")
        .where({ id: party.id })
        .update({
          balance_paise: Number(party.balance_paise) + balanceDir * totals.totalPaise,
          updated_at: trx.fn.now(),
        });
    }

    return get(trx, { businessId: business.id, id: invoiceId });
  });
}

/** One invoice with its lines. Works inside or outside a transaction. */
async function get(conn, { businessId, id }) {
  const q = conn ?? db;

  const inv = await q("invoices").where({ id, business_id: businessId }).first();
  if (!inv) throw ApiError.notFound("No such invoice.");

  const lines = await q("invoice_lines").where({ invoice_id: id }).orderBy("line_no", "asc");

  return toPublic(inv, lines);
}

function toPublic(inv, lines = []) {
  return {
    id: inv.id,
    docType: inv.doc_type,
    number: inv.number,
    serial: inv.serial,
    fy: inv.fy,
    issueDate: inv.issue_date,
    dueDate: inv.due_date,
    party: inv.party_id
      ? { id: inv.party_id, name: inv.party_name, gstin: inv.party_gstin }
      : inv.party_name
        ? { id: null, name: inv.party_name, gstin: null }
        : null,
    placeOfSupply: inv.place_of_supply,
    isInterState: Boolean(inv.is_inter_state),
    amounts: {
      gross: toRupees(inv.gross_paise),
      discount: toRupees(inv.discount_paise),
      taxable: toRupees(inv.taxable_paise),
      cgst: toRupees(inv.cgst_paise),
      sgst: toRupees(inv.sgst_paise),
      igst: toRupees(inv.igst_paise),
      roundOff: toRupees(inv.round_off_paise),
      total: toRupees(inv.total_paise),
      paid: toRupees(inv.paid_paise),
      balance: toRupees(inv.balance_paise),
    },
    status: inv.status,
    irn: inv.irn,
    ewbNumber: inv.ewb_number,
    notes: inv.notes,
    terms: inv.terms,
    cancelledAt: inv.cancelled_at,
    createdAt: inv.created_at,
    lines: lines.map((l) => ({
      id: l.id,
      lineNo: l.line_no,
      itemId: l.item_id,
      name: l.name,
      hsnSac: l.hsn_sac,
      unit: l.unit,
      batchNo: l.batch_no,
      expiryDate: l.expiry_date,
      quantity: Number(l.quantity),
      rate: toRupees(l.rate_paise),
      gross: toRupees(l.gross_paise),
      discount: toRupees(l.discount_paise),
      taxable: toRupees(l.taxable_paise),
      taxRate: Number(l.tax_rate),
      cgst: toRupees(l.cgst_paise),
      sgst: toRupees(l.sgst_paise),
      igst: toRupees(l.igst_paise),
      total: toRupees(l.total_paise),
    })),
  };
}

/**
 * Cancels an invoice. It is NEVER deleted - a gap in the numbering is
 * exactly what the rules do not allow, and a missing invoice number is what
 * gets asked about at assessment.
 *
 * Cancelling undoes what the invoice did: stock goes back, the party's
 * balance goes back.
 */
async function cancel({ business, user, id, reason }) {
  return db.transaction(async (trx) => {
    const inv = await trx("invoices")
      .where({ id, business_id: business.id })
      .forUpdate()
      .first();

    if (!inv) throw ApiError.notFound("No such invoice.");
    if (inv.cancelled_at) throw ApiError.conflict("That invoice is already cancelled.");

    if (Number(inv.paid_paise) > 0) {
      throw ApiError.conflict(
        "Money has been received against this invoice. Remove the payment first, or raise a credit note instead."
      );
    }

    const lines = await trx("invoice_lines").where({ invoice_id: id });
    const direction = STOCK_EFFECT[inv.doc_type] ?? 0;

    // Put the stock back the other way.
    if (direction !== 0) {
      for (const l of lines) {
        if (!l.item_id) continue;
        await stock.move(trx, {
          businessId: business.id,
          itemId: l.item_id,
          batchId: l.batch_id,
          change: -direction * Number(l.quantity),
          reason: "adjustment",
          refType: "invoice_cancel",
          refId: inv.id,
          notes: `Cancelled ${inv.number}`,
          userId: user.id,
        });
      }
    }

    // And the party's balance.
    const balanceDir = BALANCE_EFFECT[inv.doc_type] ?? 0;
    if (inv.party_id && balanceDir !== 0) {
      const party = await trx("parties").where({ id: inv.party_id }).forUpdate().first();
      if (party) {
        await trx("parties")
          .where({ id: party.id })
          .update({
            balance_paise: Number(party.balance_paise) - balanceDir * Number(inv.total_paise),
            updated_at: trx.fn.now(),
          });
      }
    }

    await trx("invoices").where({ id: inv.id }).update({
      status: "cancelled",
      cancelled_at: trx.fn.now(),
      cancel_reason: reason ?? null,
      balance_paise: 0,
      updated_at: trx.fn.now(),
    });

    return get(trx, { businessId: business.id, id: inv.id });
  });
}

module.exports = { create, get, cancel, toPublic, financialYear, nextNumber };
