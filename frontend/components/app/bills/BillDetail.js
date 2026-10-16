"use client";

// ===========================================================================
// ONE BILL
// ---------------------------------------------------------------------------
// Read-only, and that is deliberate. A bill that has gone to a customer and
// into the GST return is not a draft. If something is wrong with it, the
// right move is to cancel it and issue another, which is what the law
// expects and what leaves an explainable trail.
//
// So the actions here are: print it, send it, take money against it, or
// cancel it. Not edit it.
// ===========================================================================

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BILLS, COMMON, BILLING } from "../content";
import { ErrorState, Note, StatusPill, TableSkeleton, statusOf } from "../ui/Bits";
import Modal from "../ui/Modal";
import { TextArea } from "../ui/Field";
import { IconPrint, IconWhatsApp, IconRupee, IconTrash, IconChevron, IconBill } from "../Icons";
import { rupees, formatQty, formatDate, formatDateLong, paiseToWords } from "../../../lib/money";
import { unitShort, modeLabel } from "../../../lib/units";
import { stateName } from "../../../lib/gst-states";
import { getInvoice, getParty, getBusiness, cancelInvoice } from "../data";
import { useShop } from "../useShop";
import { useToast } from "../ui/Toast";
import PaymentForm from "../payments/PaymentForm";
import InvoicePrint from "../print/InvoicePrint";

export default function BillDetail({ id }) {
  const shop = useShop();
  const { toast } = useToast();

  const [invoice, setInvoice] = useState(null);
  const [party, setParty] = useState(null);
  const [biz, setBiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paying, setPaying] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [printSize, setPrintSize] = useState("a4");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const inv = await getInvoice(id);
      setInvoice(inv);
      const [p, b] = await Promise.all([
        inv.partyId ? getParty(inv.partyId).catch(() => null) : Promise.resolve(null),
        shop.businessId ? getBusiness(shop.businessId).catch(() => null) : Promise.resolve(null),
      ]);
      setParty(p);
      setBiz(b);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [id, shop.businessId]);

  useEffect(() => {
    load();
  }, [load]);

  function printAs(size) {
    setPrintSize(size);
    // Let the layout swap before the print dialog captures the page.
    setTimeout(() => window.print(), 120);
  }

  if (error) return <ErrorState error={error} onRetry={load} />;

  if (loading || !invoice) {
    return (
      <div className="ap-panel">
        <TableSkeleton rows={6} cols={4} />
      </div>
    );
  }

  const a = invoice.amounts;
  const status = statusOf(invoice);
  const cancelled = status === "cancelled";
  const interState = invoice.interState || a.igst > 0;

  const waText = [
    biz?.name || shop.shop?.name || "",
    `Bill ${invoice.number}`,
    `Amount ${rupees(a.total)}`,
    a.balance > 0 ? `Pending ${rupees(a.balance)}` : "Paid. Thank you.",
  ]
    .filter(Boolean)
    .join("\n");
  const waHref = party?.phone
    ? `https://wa.me/91${String(party.phone).slice(-10)}?text=${encodeURIComponent(waText)}`
    : null;

  return (
    <>
      <div className="ap-screenonly">
        <div className="ap-row" style={{ marginBottom: 6 }}>
          <Link href="/app/bills" className="ap-btn ap-btn-ghost ap-btn-sm">
            <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}>
              <IconChevron size={15} />
            </span>
            {BILLS.title}
          </Link>
        </div>

        <div className="ap-row" style={{ marginBottom: 14, alignItems: "flex-start" }}>
          <div>
            <h1 className="ap-title" style={{ fontSize: 21, fontFamily: "var(--ap-mono)" }}>
              {invoice.number}
            </h1>
            <p className="ap-sub" style={{ margin: "2px 0 0" }}>
              {formatDateLong(invoice.date)}
              {invoice.partyName ? ` · ${invoice.partyName}` : " · Walk-in"}
            </p>
          </div>
          <div className="ap-row" style={{ marginLeft: "auto" }}>
            <StatusPill invoice={invoice} />
            <button type="button" className="ap-btn" onClick={() => printAs("a4")}>
              <IconPrint size={16} /> {BILLS.detail.print}
            </button>
            <button type="button" className="ap-btn" onClick={() => printAs("thermal")}>
              {BILLS.detail.thermal}
            </button>
            {waHref ? (
              <a className="ap-btn" href={waHref} target="_blank" rel="noopener noreferrer">
                <IconWhatsApp size={16} /> {BILLS.detail.share}
              </a>
            ) : null}
            {!cancelled && invoice.docType === "estimate" ? (
              <Link href={`/app/billing?from=${invoice.id}`} className="ap-btn ap-btn-primary">
                <IconBill size={16} /> Make it a bill
              </Link>
            ) : null}
            {!cancelled && invoice.docType !== "estimate" && a.balance > 0 ? (
              <button type="button" className="ap-btn ap-btn-primary" onClick={() => setPaying(true)}>
                <IconRupee size={16} /> {BILLS.detail.collect}
              </button>
            ) : null}
            {!cancelled ? (
              <button type="button" className="ap-btn ap-btn-danger" onClick={() => setCancelling(true)}>
                <IconTrash size={16} /> {BILLS.detail.cancelBill}
              </button>
            ) : null}
          </div>
        </div>

        {cancelled ? (
          <div style={{ marginBottom: 14 }}>
            <Note kind="bad">{BILLS.detail.cancelled}</Note>
          </div>
        ) : null}

        <div className="ap-panel" style={{ marginBottom: 16 }}>
          <div className="ap-panel-head">
            <h2>{BILLS.detail.lines}</h2>
            <span className="ap-sub ap-spacer">
              {interState ? BILLING.igstNote : BILLING.gstNote}
            </span>
          </div>
          <div className="ap-tablewrap">
            <table className="ap-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th className="ap-right">Qty</th>
                  <th className="ap-right">Rate</th>
                  <th className="ap-right">Taxable</th>
                  <th className="ap-right">GST</th>
                  <th className="ap-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lines.map((l, i) => (
                  <tr key={l.id || i}>
                    <td>
                      <span className="ap-strong">{l.name}</span>
                      {l.batchNo ? (
                        <div className="ap-sub">
                          Batch <span style={{ fontFamily: "var(--ap-mono)" }}>{l.batchNo}</span>
                          {l.expiryDate ? ` \u00b7 expires ${formatDate(l.expiryDate)}` : ""}
                        </div>
                      ) : null}
                      {l.hsn ? <div className="ap-sub">HSN {l.hsn}</div> : null}
                    </td>
                    <td className="ap-right ap-num">
                      {formatQty(l.quantity)} {unitShort(l.unit)}
                    </td>
                    <td className="ap-right ap-num">{rupees(l.ratePaise)}</td>
                    <td className="ap-right ap-num">{rupees(l.taxablePaise)}</td>
                    <td className="ap-right ap-num">
                      {rupees(l.cgstPaise + l.sgstPaise + l.igstPaise)}
                      <span className="ap-sub"> ({l.taxRate}%)</span>
                    </td>
                    <td className="ap-right ap-num ap-strong">{rupees(l.totalPaise)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="ap-grid2" style={{ gap: 16, alignItems: "start" }}>
          <div className="ap-panel">
            <div className="ap-panel-head">
              <h2>{BILLS.detail.paymentsOn}</h2>
            </div>
            {invoice.payments && invoice.payments.length ? (
              <div className="ap-tablewrap">
                <table className="ap-table">
                  <tbody>
                    {invoice.payments.map((p) => (
                      <tr key={p.id}>
                        <td className="ap-sub">{formatDateLong(p.date)}</td>
                        <td>{modeLabel(p.mode)}</td>
                        <td className="ap-right ap-num ap-strong">{rupees(p.amountPaise)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="ap-panel-body ap-sub">
                {a.paid > 0
                  ? `${rupees(a.paid)} received. The individual payments are on the customer's page.`
                  : BILLS.detail.noPayments}
              </div>
            )}

            {party ? (
              <div className="ap-panel-foot ap-sub">
                <Link href={`/app/parties/${party.id}`}>{party.name}</Link>
                {party.gstin ? ` · ${party.gstin}` : ""}
                {party.stateCode ? ` · ${stateName(party.stateCode)}` : ""}
              </div>
            ) : null}
          </div>

          <div className="ap-panel">
            <div className="ap-panel-head">
              <h2>{BILLS.detail.totalsTitle}</h2>
            </div>
            <div className="ap-panel-body ap-tot">
              <div className="ap-tot-row">
                <span>Taxable value</span>
                <span>{rupees(a.taxable)}</span>
              </div>
              {a.discount ? (
                <div className="ap-tot-row">
                  <span>Discount</span>
                  <span>- {rupees(a.discount)}</span>
                </div>
              ) : null}
              {interState ? (
                <div className="ap-tot-row">
                  <span>IGST</span>
                  <span>{rupees(a.igst)}</span>
                </div>
              ) : (
                <>
                  <div className="ap-tot-row">
                    <span>CGST</span>
                    <span>{rupees(a.cgst)}</span>
                  </div>
                  <div className="ap-tot-row">
                    <span>SGST</span>
                    <span>{rupees(a.sgst)}</span>
                  </div>
                </>
              )}
              {a.roundOff ? (
                <div className="ap-tot-row">
                  <span>Round off</span>
                  <span>{rupees(a.roundOff)}</span>
                </div>
              ) : null}
              <div className="ap-tot-grand">
                <span>Total</span>
                <span className="ap-tot-amt">{rupees(a.total)}</span>
              </div>
              <div className="ap-tot-words">{paiseToWords(a.total)}</div>

              {a.paid ? (
                <div className="ap-tot-row" style={{ marginTop: 8 }}>
                  <span>Paid</span>
                  <span>{rupees(a.paid)}</span>
                </div>
              ) : null}
              {a.balance > 0 && !cancelled ? (
                <div className="ap-tot-row" style={{ fontWeight: 650, color: "var(--ap-danger)" }}>
                  <span>Pending</span>
                  <span>{rupees(a.balance)}</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {invoice.notes ? (
          <p className="ap-hint" style={{ marginTop: 12 }}>
            Note on the bill: {invoice.notes}
          </p>
        ) : null}
      </div>

      <InvoicePrint
        invoice={invoice}
        shop={biz || shop.shop}
        party={party}
        size={printSize}
        copyLabel={printSize === "a4" ? "Customer copy" : undefined}
      />

      {paying ? (
        <PaymentForm
          party={party}
          invoice={invoice}
          direction={invoice.docType === "purchase" ? "out" : "in"}
          onClose={() => setPaying(false)}
          onSaved={() => {
            setPaying(false);
            load();
          }}
        />
      ) : null}

      {cancelling ? (
        <CancelBill
          invoice={invoice}
          onClose={() => setCancelling(false)}
          onDone={() => {
            setCancelling(false);
            toast(BILLS.detail.cancelDone);
            load();
          }}
        />
      ) : null}
    </>
  );
}

// ---------------------------------------------------------------------------
// cancelling
// ---------------------------------------------------------------------------
function CancelBill({ invoice, onClose, onDone }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const hasMoney = invoice.amounts.paid > 0;

  async function go() {
    setBusy(true);
    setErr(null);
    try {
      await cancelInvoice(invoice.id, reason.trim() || undefined);
      onDone();
    } catch (e) {
      setErr(
        e.code === "unsupported"
          ? "This server does not have a cancel route yet."
          : e.isOffline
          ? COMMON.offlineBody
          : e.message || COMMON.genericError
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title={BILLS.detail.cancelTitle}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="ap-btn" onClick={onClose} disabled={busy}>
            Keep it
          </button>
          <button
            type="button"
            className="ap-btn ap-btn-danger"
            onClick={go}
            disabled={busy || hasMoney}
          >
            {busy ? COMMON.saving : BILLS.detail.cancelConfirm}
          </button>
        </>
      }
    >
      <div className="ap-stack">
        {err ? <Note kind="bad">{err}</Note> : null}
        {hasMoney ? <Note kind="warn">{BILLS.detail.cancelPaid}</Note> : null}
        <p style={{ margin: 0 }}>{BILLS.detail.cancelBody}</p>
        <TextArea
          label={BILLS.detail.cancelReason}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          placeholder="Wrong customer, wrong item, entered twice"
          disabled={hasMoney}
        />
      </div>
    </Modal>
  );
}
