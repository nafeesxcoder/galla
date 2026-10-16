"use client";

// ===========================================================================
// TAKING A PAYMENT
// ---------------------------------------------------------------------------
// Opened from a customer, or from one particular bill.
//
// The part worth getting right is what the money is put against. A customer
// handing over two thousand rupees against four old bills does not say which
// ones - and if the app guesses wrongly, the ageing is wrong and the shop
// chases the wrong bill. So:
//
//   - by default it clears the oldest bills first, which is what almost
//     every shop does and what an accountant expects
//   - the shopkeeper can override it and tick the bills themselves
//   - anything left over sits on the account rather than being forced onto
//     a bill it does not belong to
//
// Opened from a single bill, that bill is pre-ticked and the rest is hidden.
// ===========================================================================

import { useEffect, useMemo, useState } from "react";
import Modal from "../ui/Modal";
import { Money, Select, Text, TextArea, numericOnly } from "../ui/Field";
import { Note, Spinner } from "../ui/Bits";
import { PAYMENT, COMMON } from "../content";
import { PAYMENT_MODES } from "../../../lib/units";
import { rupees, today, toPaise, formatDate, ageInDays } from "../../../lib/money";
import { listInvoices, createPayment } from "../data";
import { useToast } from "../ui/Toast";

export default function PaymentForm({ party, invoice, direction = "in", onClose, onSaved }) {
  const { toast } = useToast();
  const singleBill = Boolean(invoice);

  const [amount, setAmount] = useState(() =>
    invoice ? String(Math.max(0, invoice.amounts.balance) / 100) : ""
  );
  const [mode, setMode] = useState("cash");
  const [date, setDate] = useState(() => today());
  const [notes, setNotes] = useState("");
  const [manual, setManual] = useState(false);
  const [ticked, setTicked] = useState(() => (invoice ? { [invoice.id]: true } : {}));

  const [pending, setPending] = useState(singleBill ? [invoice] : null);
  const [loading, setLoading] = useState(!singleBill);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  // Which bills are still open for this customer, oldest first - that is the
  // order the money is applied in.
  useEffect(() => {
    if (singleBill || !party?.id) return;
    let alive = true;
    (async () => {
      try {
        const { rows } = await listInvoices({
          partyId: party.id,
          docType: direction === "in" ? "sale" : "purchase",
          limit: 100,
        });
        if (!alive) return;
        setPending(
          rows
            .filter((r) => r.status !== "cancelled" && r.amounts.balance > 0)
            .sort((a, b) => String(a.date).localeCompare(String(b.date)))
        );
      } catch (e) {
        if (alive) setErr(e.isOffline ? COMMON.offlineBody : e.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [party, direction, singleBill]);

  const amountPaise = Math.max(0, toPaise(amount));

  // Work out the split. Either the ticked bills, or oldest first until the
  // money runs out.
  const split = useMemo(() => {
    const rows = pending || [];
    const chosen = manual ? rows.filter((r) => ticked[r.id]) : rows;
    let left = amountPaise;
    const out = [];
    for (const r of chosen) {
      if (left <= 0) break;
      const take = Math.min(left, r.amounts.balance);
      if (take <= 0) continue;
      out.push({ invoice: r, paise: take });
      left -= take;
    }
    return { allocations: out, leftover: left };
  }, [pending, manual, ticked, amountPaise]);

  const totalPending = (pending || []).reduce((a, r) => a + r.amounts.balance, 0);

  async function submit(e) {
    e.preventDefault();
    setErr(null);
    if (amountPaise <= 0) {
      setErr("Enter how much was received.");
      return;
    }
    setBusy(true);
    try {
      const saved = await createPayment({
        direction,
        partyId: party?.id,
        amountRupees: amountPaise / 100,
        mode,
        date,
        notes: notes.trim() || undefined,
        allocations: split.allocations.map((a) => ({
          invoiceId: a.invoice.id,
          amount: a.paise / 100,
        })),
      });
      toast(PAYMENT.done);
      onSaved?.(saved);
    } catch (e2) {
      setErr(e2.isOffline ? COMMON.offlineBody : e2.message || COMMON.genericError);
    } finally {
      setBusy(false);
    }
  }

  const title = direction === "in" ? PAYMENT.title : PAYMENT.titleOut;

  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="ap-btn" onClick={onClose} disabled={busy}>
            {COMMON.cancel}
          </button>
          <button type="submit" form="ap-payform" className="ap-btn ap-btn-primary" disabled={busy}>
            {busy ? COMMON.saving : PAYMENT.save}
          </button>
        </>
      }
    >
      <form id="ap-payform" onSubmit={submit} className="ap-stack">
        {err ? <Note kind="bad">{err}</Note> : null}

        <div className="ap-row" style={{ justifyContent: "space-between" }}>
          <div>
            <span className="ap-sub">{direction === "in" ? PAYMENT.party : PAYMENT.partyOut}</span>
            <div className="ap-strong">{party?.name || "Walk-in"}</div>
          </div>
          {!singleBill && pending ? (
            <div style={{ textAlign: "right" }}>
              <span className="ap-sub">{PAYMENT.outstanding}</span>
              <div className="ap-strong ap-num">{rupees(totalPending)}</div>
            </div>
          ) : null}
        </div>

        <div className="ap-grid2">
          <Money
            label={PAYMENT.amount}
            value={amount}
            onChange={(e) => setAmount(numericOnly(e.target.value))}
            placeholder="0.00"
            autoFocus
            required
          />
          <Select label={PAYMENT.mode} value={mode} onChange={(e) => setMode(e.target.value)}>
            {PAYMENT_MODES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="ap-grid2">
          <Text label={PAYMENT.date} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        {singleBill ? (
          <Note kind="info" icon={false}>
            Going against bill <strong>{invoice.number}</strong>, which has{" "}
            <strong>{rupees(invoice.amounts.balance)}</strong> pending.
          </Note>
        ) : loading ? (
          <Spinner />
        ) : pending && pending.length ? (
          <div>
            <div className="ap-label">{PAYMENT.against}</div>
            <div className="ap-seg" style={{ marginBottom: 9 }}>
              <button type="button" aria-pressed={!manual} onClick={() => setManual(false)}>
                {PAYMENT.oldestFirst}
              </button>
              <button type="button" aria-pressed={manual} onClick={() => setManual(true)}>
                {PAYMENT.pickBills}
              </button>
            </div>

            <div className="ap-tablewrap" style={{ maxHeight: 210, overflowY: "auto" }}>
              <table className="ap-table">
                <tbody>
                  {pending.map((r) => {
                    const alloc = split.allocations.find((a) => a.invoice.id === r.id);
                    const age = ageInDays(r.date);
                    return (
                      <tr key={r.id}>
                        {manual ? (
                          <td style={{ width: 34 }}>
                            <input
                              type="checkbox"
                              checked={Boolean(ticked[r.id])}
                              onChange={(e) =>
                                setTicked((t) => ({ ...t, [r.id]: e.target.checked }))
                              }
                              aria-label={`Put this payment against ${r.number}`}
                            />
                          </td>
                        ) : null}
                        <td>
                          <span className="ap-strong">{r.number}</span>
                          <div className="ap-sub">
                            {formatDate(r.date)}
                            {age > 30 ? ` · ${age} days old` : ""}
                          </div>
                        </td>
                        <td className="ap-right ap-num">{rupees(r.amounts.balance)}</td>
                        <td className="ap-right ap-num" style={{ color: "var(--ap-brand-ink)" }}>
                          {alloc ? rupees(alloc.paise) : ""}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {!manual ? <p className="ap-hint">{PAYMENT.oldestFirstHint}</p> : null}

            {split.leftover > 0 ? (
              <div style={{ marginTop: 9 }}>
                <Note kind="info" icon={false}>
                  <strong>{rupees(split.leftover)}</strong> {PAYMENT.unallocated.toLowerCase()} &mdash;{" "}
                  {PAYMENT.unallocatedHint}
                </Note>
              </div>
            ) : null}
          </div>
        ) : (
          <Note kind="info" icon={false}>
            {PAYMENT.nothingDue} It will be kept on their account.
          </Note>
        )}

        <TextArea
          label={PAYMENT.note}
          placeholder={PAYMENT.notePlaceholder}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />
      </form>
    </Modal>
  );
}
