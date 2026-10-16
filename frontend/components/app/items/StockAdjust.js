"use client";

// ===========================================================================
// CORRECTING THE STOCK
// ---------------------------------------------------------------------------
// The shelf says eight, the app says ten. Something broke, or was given
// away, or was never entered properly. This is where that gets straightened
// out - and it asks for a reason, because a stock number nobody can explain
// is a stock number nobody trusts.
//
// The shopkeeper types what is actually there, not the difference. Working
// out "minus two" in their head is a step that can go wrong, and the whole
// point of the screen is that the two numbers end up matching.
// ===========================================================================

import { useMemo, useState } from "react";
import Modal from "../ui/Modal";
import { Text, Select, TextArea, numericOnly } from "../ui/Field";
import { Note } from "../ui/Bits";
import { ITEMS, COMMON } from "../content";
import { formatQty } from "../../../lib/money";
import { unitShort } from "../../../lib/units";
import { adjustStock } from "../data";
import { useToast } from "../ui/Toast";

export default function StockAdjust({ item, onClose, onSaved }) {
  const [actual, setActual] = useState(() => formatQty(item.stock));
  const [reason, setReason] = useState("correction");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const { toast } = useToast();

  const change = useMemo(() => {
    const target = Number(actual);
    if (!Number.isFinite(target)) return 0;
    return Number((target - Number(item.stock)).toFixed(3));
  }, [actual, item.stock]);

  async function submit(e) {
    e.preventDefault();
    setErr(null);
    if (!change) {
      setErr("The count already matches. Nothing to change.");
      return;
    }
    setBusy(true);
    try {
      const saved = await adjustStock(item.id, { quantity: change, reason, notes: notes.trim() || undefined });
      toast(ITEMS.stock.done);
      onSaved?.(saved);
    } catch (e2) {
      if (e2.code === "unsupported") {
        setErr(
          "This server does not have a stock correction route yet. Everything else works; tell the developer which path it should be and it will be pointed at it."
        );
      } else {
        setErr(e2.isOffline ? COMMON.offlineBody : e2.message || COMMON.genericError);
      }
    } finally {
      setBusy(false);
    }
  }

  const unit = unitShort(item.unit);

  return (
    <Modal
      title={ITEMS.stock.title}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="ap-btn" onClick={onClose} disabled={busy}>
            {COMMON.cancel}
          </button>
          <button type="submit" form="ap-stockform" className="ap-btn ap-btn-primary" disabled={busy}>
            {busy ? COMMON.saving : COMMON.save}
          </button>
        </>
      }
    >
      <form id="ap-stockform" onSubmit={submit} className="ap-stack">
        {err ? <Note kind="bad">{err}</Note> : null}

        <div>
          <span className="ap-sub">Item</span>
          <div className="ap-strong">{item.name}</div>
        </div>

        <p className="ap-hint" style={{ margin: 0 }}>
          {ITEMS.stock.note}
        </p>

        <div className="ap-grid3">
          <div>
            <span className="ap-label">{ITEMS.stock.current}</span>
            <div className="ap-strong ap-num" style={{ fontSize: 18, paddingTop: 6 }}>
              {formatQty(item.stock)} {unit}
            </div>
          </div>

          <Text
            label={ITEMS.stock.actual}
            value={actual}
            onChange={(e) => setActual(numericOnly(e.target.value))}
            inputMode="decimal"
            autoFocus
            required
          />

          <div>
            <span className="ap-label">{ITEMS.stock.change}</span>
            <div
              className="ap-strong ap-num"
              style={{
                fontSize: 18,
                paddingTop: 6,
                color: change < 0 ? "var(--ap-danger)" : change > 0 ? "var(--ap-brand-ink)" : "var(--ap-ink-3)",
              }}
            >
              {change > 0 ? "+" : ""}
              {formatQty(change)} {unit}
            </div>
          </div>
        </div>

        <Select label={ITEMS.stock.reason} value={reason} onChange={(e) => setReason(e.target.value)}>
          {ITEMS.stock.reasons.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </Select>

        <TextArea
          label={ITEMS.stock.notes}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Anything that would help explain this in six months"
        />
      </form>
    </Modal>
  );
}
