// ===========================================================================
// /api/backup - the shop's own data, in one file
// ---------------------------------------------------------------------------
// A shopkeeper who cannot get their data out does not own it. This is the
// answer to "what if your company shuts down", and it is not a courtesy -
// without it the app is a place their books are held hostage.
//
// Deliberately NOT a database dump. It is the same JSON the app's own screens
// receive, which means it stays readable by a human, opens in any spreadsheet
// after a conversion, and does not leak the internal column names or any
// other shop's rows.
//
// Restore is deliberately NOT here. Writing a backup back over a live shop is
// the single most destructive thing this system could do, and getting it
// wrong silently - a half-finished restore, a duplicated year of sales -
// leaves no way back. A restore worth having needs to be a careful, staged
// import with the shopkeeper confirming what it is about to overwrite, and
// that belongs in its own piece of work rather than bolted onto the export.
// ===========================================================================

const express = require("express");
const { z } = require("zod");

const db = require("../../db");
const validate = require("../../middleware/validate");
const { requireAuth, requireBusiness } = require("../../middleware/auth");
const asyncHandler = require("../../utils/asyncHandler");
const { toRupees } = require("../../utils/money");

const router = express.Router();
// Owner only. A backup is every customer's phone number and every price the
// shop charges, in one file - the most sensitive single thing the system can
// produce, and not something a counter assistant needs.
router.use(requireAuth, requireBusiness("owner"));

/** Rows come out in pages so a shop with years of history cannot run the
 *  server out of memory on one request. */
async function allRows(table, businessId, order, { softDelete = true } = {}) {
  const out = [];
  const size = 1000;
  for (let offset = 0; ; offset += size) {
    const q = db(table).where({ business_id: businessId }).orderBy(order).limit(size).offset(offset);
    if (softDelete) q.whereNull("deleted_at");
    const page = await q;
    out.push(...page);
    if (page.length < size) break;
    // A hard ceiling, so a runaway loop cannot tie up the database. A shop
    // that genuinely exceeds this needs a date range, not a bigger number.
    if (out.length >= 100000) break;
  }
  return out;
}

const money = (v) => toRupees(v);

router.get(
  "/",
  validate({
    query: z.object({
      // Without a range this is the whole history, which is what "backup"
      // means. With one it is an export of a period, which is what an
      // accountant asks for.
      from: z.iso.date().optional(),
      to: z.iso.date().optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const id = req.business.id;
    const { from, to } = req.validatedQuery;
    const dated = (rows, field) =>
      rows.filter((r) => {
        const d = String(r[field] ?? "").slice(0, 10);
        if (from && d < from) return false;
        if (to && d > to) return false;
        return true;
      });

    const [business, parties, items, invoices, lines, payments, allocations, expenses, accounts, moves, loans, loanPays] =
      await Promise.all([
        db("businesses").where({ id }).first(),
        allRows("parties", id, "id"),
        allRows("items", id, "id"),
        allRows("invoices", id, "id", { softDelete: false }),
        allRows("invoice_lines", id, "id", { softDelete: false }),
        allRows("payments", id, "id", { softDelete: false }),
        allRows("payment_allocations", id, "id", { softDelete: false }),
        allRows("expenses", id, "id"),
        allRows("bank_accounts", id, "id"),
        allRows("cash_bank_moves", id, "id", { softDelete: false }),
        allRows("loan_accounts", id, "id"),
        allRows("loan_payments", id, "id", { softDelete: false }),
      ]);

    const linesByInvoice = new Map();
    for (const l of lines) {
      if (!linesByInvoice.has(Number(l.invoice_id))) linesByInvoice.set(Number(l.invoice_id), []);
      linesByInvoice.get(Number(l.invoice_id)).push(l);
    }
    const allocsByPayment = new Map();
    for (const a of allocations) {
      if (!allocsByPayment.has(Number(a.payment_id))) allocsByPayment.set(Number(a.payment_id), []);
      allocsByPayment.get(Number(a.payment_id)).push(a);
    }

    // The tax is stored as the three heads it has to be filed under, not as
    // one figure, so the file carries both: the three for anybody checking a
    // return, and the sum for anybody reading it as a bill.
    const taxOf = (r) =>
      Number(r.cgst_paise ?? 0) + Number(r.sgst_paise ?? 0) + Number(r.igst_paise ?? 0) + Number(r.cess_paise ?? 0);

    const bills = dated(invoices, "issue_date").map((v) => ({
      number: v.number,
      docType: v.doc_type,
      issueDate: v.issue_date,
      dueDate: v.due_date,
      partyId: v.party_id,
      partyName: v.party_name,
      partyGstin: v.party_gstin,
      placeOfSupply: v.place_of_supply,
      interState: Boolean(v.is_inter_state),
      gross: money(v.gross_paise),
      discount: money(v.discount_paise),
      taxable: money(v.taxable_paise),
      cgst: money(v.cgst_paise),
      sgst: money(v.sgst_paise),
      igst: money(v.igst_paise),
      cess: money(v.cess_paise),
      tax: money(taxOf(v)),
      roundOff: money(v.round_off_paise),
      total: money(v.total_paise),
      paid: money(v.paid_paise),
      balance: money(v.balance_paise),
      status: v.status,
      cancelledAt: v.cancelled_at,
      lines: (linesByInvoice.get(Number(v.id)) ?? []).map((l) => ({
        itemId: l.item_id,
        name: l.name,
        hsn: l.hsn_sac,
        quantity: Number(l.quantity),
        unit: l.unit,
        batchNo: l.batch_no,
        expiryDate: l.expiry_date,
        rate: money(l.rate_paise),
        discount: money(l.discount_paise),
        taxable: money(l.taxable_paise),
        taxRate: Number(l.tax_rate),
        tax: money(taxOf(l)),
        total: money(l.total_paise),
      })),
    }));

    res.json({
      ok: true,
      data: {
        // Stamped so a file found on a phone two years from now can be
        // identified without opening it in an editor.
        format: "mygallabook-backup",
        version: 1,
        takenAt: new Date().toISOString(),
        range: { from: from ?? null, to: to ?? null },
        business: {
          name: business.name,
          legalName: business.legal_name,
          gstin: business.gstin,
          pan: business.pan,
          stateCode: business.state_code,
          phone: business.phone,
          email: business.email,
          addressLine1: business.address_line1,
          addressLine2: business.address_line2,
          city: business.city,
          pincode: business.pincode,
          industry: business.industry,
          openingCash: money(business.opening_cash_paise),
        },
        parties: parties.map((p) => ({
          id: p.id,
          name: p.name,
          phone: p.phone,
          gstin: p.gstin,
          stateCode: p.state_code,
          isCustomer: Boolean(p.is_customer),
          isSupplier: Boolean(p.is_supplier),
          openingBalance: money(p.opening_balance_paise),
          balance: money(p.balance_paise),
          creditLimit: money(p.credit_limit_paise),
          creditDays: p.credit_days,
          addressLine1: p.address_line1,
          addressLine2: p.address_line2,
          city: p.city,
          pincode: p.pincode,
          notes: p.notes,
        })),
        items: items.map((i) => ({
          id: i.id,
          name: i.name,
          itemCode: i.item_code,
          barcode: i.barcode,
          hsn: i.hsn_sac,
          type: i.type,
          unit: i.unit,
          category: i.category,
          salePrice: money(i.sale_price_paise),
          purchasePrice: money(i.purchase_price_paise),
          taxRate: Number(i.tax_rate),
          cessRate: Number(i.cess_rate ?? 0),
          priceIncludesTax: Boolean(i.price_includes_tax),
          openingStock: Number(i.opening_stock),
          stock: Number(i.current_stock),
          lowStockAt: i.low_stock_level === null ? null : Number(i.low_stock_level),
          trackBatches: Boolean(i.track_batches),
          isActive: Boolean(i.is_active),
          description: i.description,
        })),
        bills,
        payments: dated(payments, "payment_date").map((p) => ({
          number: p.number,
          direction: p.direction,
          partyId: p.party_id,
          paymentDate: p.payment_date,
          amount: money(p.amount_paise),
          mode: p.mode,
          reference: p.reference,
          chequeStatus: p.cheque_status,
          chequeDueDate: p.cheque_due_date,
          bankAccountId: p.bank_account_id,
          cancelledAt: p.cancelled_at,
          against: (allocsByPayment.get(Number(p.id)) ?? []).map((a) => ({
            invoiceId: a.invoice_id,
            amount: money(a.amount_paise),
          })),
        })),
        expenses: dated(expenses, "expense_date").map((e) => ({
          category: e.category,
          expenseDate: e.expense_date,
          amount: money(e.amount_paise),
          taxRate: Number(e.tax_rate),
          total: money(e.total_paise),
          mode: e.mode,
          partyId: e.party_id,
          bankAccountId: e.bank_account_id,
          notes: e.notes,
        })),
        bankAccounts: accounts.map((a) => ({
          id: a.id,
          name: a.name,
          bankName: a.bank_name,
          accountNumber: a.account_number,
          ifsc: a.ifsc,
          openingBalance: money(a.opening_balance_paise),
        })),
        cashBankMoves: dated(moves, "move_date").map((m) => ({
          kind: m.kind,
          moveDate: m.move_date,
          amount: money(m.amount_paise),
          fromAccountId: m.from_account_id,
          toAccountId: m.to_account_id,
          notes: m.notes,
          cancelledAt: m.cancelled_at,
        })),
        loans: loans.map((l) => ({
          id: l.id,
          name: l.name,
          lender: l.lender,
          kind: l.kind,
          principal: money(l.principal_paise),
          openingBalance: money(l.opening_balance_paise),
          interestRate: Number(l.interest_rate),
          emi: money(l.emi_paise),
          isClosed: Boolean(l.is_closed),
        })),
        loanPayments: dated(loanPays, "payment_date").map((p) => ({
          loanId: p.loan_id,
          paymentDate: p.payment_date,
          amount: money(p.amount_paise),
          principal: money(p.principal_paise),
          interest: money(p.interest_paise),
          charges: money(p.charges_paise),
          mode: p.mode,
          cancelledAt: p.cancelled_at,
        })),
      },
    });
  })
);

module.exports = router;
