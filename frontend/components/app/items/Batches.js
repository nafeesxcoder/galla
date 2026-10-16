"use client";

// ===========================================================================
// BATCHES AND EXPIRY
// ---------------------------------------------------------------------------
// For a chemist this is the whole job. Stock that goes out of date is money
// on the shelf turning into a write-off, and the only way to catch it is to
// know which lot expires when.
//
// Two rules the screen is built around, both enforced on the server too:
//
//   quantity is never typed in here. A batch arriving adds stock, and stock
//   leaving is a write-off with a reason. Both go through the same door every
//   other stock change uses, so the item total, the batch totals and the
//   history can never disagree.
//
//   a batch with stock in it cannot be removed. Writing it off first is one
//   extra step and it leaves an explanation behind.
// ===========================================================================

import { useCallback, useEffect, useState } from "react";
import Modal from "../ui/Modal";
import { Text, Money, numericOnly } from "../ui/Field";
import { Empty, Note, Spinner } from "../ui/Bits";
import { BATCHES, COMMON } from "../content";
import { rupees, formatDate, formatQty, ageInDays, today } from "../../../lib/money";
import { unitShort } from "../../../lib/units";
import { listBatches, createBatch, deleteBatch, writeOffBatch } from "../data";
import { useToast } from "../ui/Toast";
import { IconPlus, IconTrash, IconWarn, IconBox } from "../Icons";

// How far off an expiry has to be before it stops being worth flagging.
const SOON_DAYS = 60;

function expiryState(date) {
  if (!date) return { kind: "none", days: 0 };
  const t = today();
  if (date < t) return { kind: "expired", days: ageInDays(date) };
  const days = Math.round((new Date(`${date}T00:00:00`) - new Date(`${t}T00:00:00`)) / 86400000);
  return { kind: days <= SOON_DAYS ? "soon" : "fine", days };
}

export function ExpiryPill({ date }) {
  const s = expiryState(date);
  if (s.kind === "none") return <span className="ap-sub">{"–"}</span>;
  if (s.kind === "expired") {
    return (
      <span className="ap-pill ap-pill-unpaid" title={BATCHES.expiredAgo.replace("{days}", s.days)}>
        {BATCHES.expired}
      </span>
    );
  }
  if (s.kind === "soon") {
    return (
      <span className="ap-pill ap-pill-part" title={BATCHES.daysLeft.replace("{days}", s.days)}>
        {s.days}d
      </span>
    );
  }
  return null;
}

export default function Batches({ item, onClose, onChanged }) {
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState(null);
  const [adding, setAdding] = useState(false);
  const [writingOff, setWritingOff] = useState(null);
  const { toast, error } = useToast();

  const load = useCallback(async () => {
    setErr(null);
    try {
      setRows(await listBatches(item.id));
    } catch (e) {
      setErr(e);
    }
  }, [item.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(b) {
    try {
      await deleteBatch(item.id, b.id);
      toast(`Batch ${b.batchNo} removed`);
      load();
      onChanged?.();
    } catch (e) {
      error(e.status === 400 ? BATCHES.removeOnlyEmpty : e.message || COMMON.genericError);
    }
  }

  return (
    <Modal
      title={`${BATCHES.title} · ${item.name}`}
      onClose={onClose}
      wide
      footer={
        <>
          <button type="button" className="ap-btn" onClick={onClose}>
            {COMMON.close}
          </button>
          <button type="button" className="ap-btn ap-btn-primary" onClick={() => setAdding(true)}>
            <IconPlus size={16} /> {BATCHES.add}
          </button>
        </>
      }
    >
      {err ? (
        <Note kind="bad">{err.isOffline ? COMMON.offlineBody : err.message}</Note>
      ) : rows === null ? (
        <Spinner />
      ) : rows.length ? (
        <div className="ap-tablewrap">
          <table className="ap-table">
            <thead>
              <tr>
                <th>{BATCHES.colBatch}</th>
                <th>{BATCHES.colExpiry}</th>
                <th className="ap-right">{BATCHES.colQty}</th>
                <th className="ap-right">{BATCHES.colMrp}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id}>
                  <td className="ap-strong" style={{ fontFamily: "var(--ap-mono)" }}>
                    {b.batchNo}
                  </td>
                  <td>
                    <span className="ap-row" style={{ gap: 7 }}>
                      <span>{b.expiryDate ? formatDate(b.expiryDate) : "–"}</span>
                      <ExpiryPill date={b.expiryDate} />
                    </span>
                  </td>
                  <td className="ap-right ap-num">
                    {formatQty(b.quantity)} {unitShort(item.unit)}
                  </td>
                  <td className="ap-right ap-num">
                    {b.mrpPaise ? rupees(b.mrpPaise) : <span className="ap-sub">{"–"}</span>}
                  </td>
                  <td className="ap-right">
                    <div className="ap-row" style={{ justifyContent: "flex-end", gap: 4 }}>
                      {b.quantity > 0 ? (
                        <button
                          type="button"
                          className="ap-btn ap-btn-sm"
                          onClick={() => setWritingOff(b)}
                        >
                          {BATCHES.writeOff}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="ap-btn ap-btn-ghost ap-btn-icon"
                          aria-label={`${BATCHES.remove} ${b.batchNo}`}
                          onClick={() => remove(b)}
                        >
                          <IconTrash size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty icon={<IconBox size={32} />} title={BATCHES.empty} body={BATCHES.emptyBody} />
      )}

      {adding ? (
        <AddBatch
          item={item}
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            load();
            onChanged?.();
          }}
        />
      ) : null}

      {writingOff ? (
        <WriteOff
          item={item}
          batch={writingOff}
          onClose={() => setWritingOff(null)}
          onDone={() => {
            setWritingOff(null);
            load();
            onChanged?.();
          }}
        />
      ) : null}
    </Modal>
  );
}

// ---------------------------------------------------------------------------
function AddBatch({ item, onClose, onSaved }) {
  const [form, setForm] = useState({
    batchNo: "",
    quantity: "",
    expiryDate: "",
    manufactureDate: "",
    mrp: "",
    purchasePrice: "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [fieldErrs, setFieldErrs] = useState({});
  const { toast } = useToast();

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setNum = (key) => (e) => setForm((f) => ({ ...f, [key]: numericOnly(e.target.value) }));

  async function submit(e) {
    e.preventDefault();
    setErr(null);
    const errs = {};
    if (!form.batchNo.trim()) errs.batchNo = COMMON.required;
    if (form.quantity === "") errs.quantity = COMMON.required;
    setFieldErrs(errs);
    if (Object.keys(errs).length) return;

    setBusy(true);
    try {
      await createBatch(item.id, form);
      toast(BATCHES.form.saved);
      onSaved?.();
    } catch (e2) {
      setErr(e2.isOffline ? COMMON.offlineBody : e2.message || COMMON.genericError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title={BATCHES.form.title}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="ap-btn" onClick={onClose} disabled={busy}>
            {COMMON.cancel}
          </button>
          <button type="submit" form="ap-batchform" className="ap-btn ap-btn-primary" disabled={busy}>
            {busy ? COMMON.saving : COMMON.save}
          </button>
        </>
      }
    >
      <form id="ap-batchform" onSubmit={submit} className="ap-stack">
        {err ? <Note kind="bad">{err}</Note> : null}

        <div className="ap-grid2">
          <Text
            label={BATCHES.form.batchNo}
            placeholder={BATCHES.form.batchNoPlaceholder}
            value={form.batchNo}
            onChange={set("batchNo")}
            error={fieldErrs.batchNo}
            required
            autoFocus
            autoComplete="off"
            style={{ fontFamily: "var(--ap-mono)" }}
          />
          <Text
            label={`${BATCHES.form.quantity} (${unitShort(item.unit)})`}
            value={form.quantity}
            onChange={setNum("quantity")}
            error={fieldErrs.quantity}
            inputMode="decimal"
            required
            placeholder="0"
          />
        </div>

        <div className="ap-grid2">
          <Text label={BATCHES.form.expiryDate} type="date" value={form.expiryDate} onChange={set("expiryDate")} />
          <Text
            label={BATCHES.form.manufactureDate}
            type="date"
            value={form.manufactureDate}
            onChange={set("manufactureDate")}
            max={form.expiryDate || undefined}
          />
        </div>

        <div className="ap-grid2">
          <Money label={BATCHES.form.mrp} value={form.mrp} onChange={setNum("mrp")} placeholder="0.00" />
          <Money
            label={BATCHES.form.purchasePrice}
            value={form.purchasePrice}
            onChange={setNum("purchasePrice")}
            placeholder="0.00"
          />
        </div>

        <Note kind="info" icon={false}>
          {BATCHES.form.note}
        </Note>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
function WriteOff({ item, batch, onClose, onDone }) {
  const [qty, setQty] = useState(() => formatQty(batch.quantity));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const { toast } = useToast();

  async function go(e) {
    e.preventDefault();
    setErr(null);
    const n = Number(qty);
    if (!n || n <= 0) {
      setErr("Enter how much to write off.");
      return;
    }
    if (n > batch.quantity) {
      setErr(`There is only ${formatQty(batch.quantity)} in this batch.`);
      return;
    }
    setBusy(true);
    try {
      await writeOffBatch(item.id, batch.id, n, `Batch ${batch.batchNo} past expiry`);
      toast(BATCHES.writeOffDone);
      onDone?.();
    } catch (e2) {
      setErr(e2.isOffline ? COMMON.offlineBody : e2.message || COMMON.genericError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title={BATCHES.writeOffTitle}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="ap-btn" onClick={onClose} disabled={busy}>
            {COMMON.cancel}
          </button>
          <button type="submit" form="ap-writeoff" className="ap-btn ap-btn-danger" disabled={busy}>
            {busy ? COMMON.saving : BATCHES.writeOff}
          </button>
        </>
      }
    >
      <form id="ap-writeoff" onSubmit={go} className="ap-stack">
        {err ? <Note kind="bad">{err}</Note> : null}

        <div>
          <span className="ap-sub">{BATCHES.colBatch}</span>
          <div className="ap-strong" style={{ fontFamily: "var(--ap-mono)" }}>
            {batch.batchNo}
          </div>
          <div className="ap-sub">
            {formatQty(batch.quantity)} {unitShort(item.unit)}
            {batch.expiryDate ? ` · expires ${formatDate(batch.expiryDate)}` : ""}
          </div>
        </div>

        <Text
          label={`${BATCHES.writeOffQty} (${unitShort(item.unit)})`}
          value={qty}
          onChange={(e) => setQty(numericOnly(e.target.value))}
          inputMode="decimal"
          autoFocus
        />

        <Note kind="warn" icon={<IconWarn size={17} />}>
          {BATCHES.writeOffBody}
        </Note>
      </form>
    </Modal>
  );
}
