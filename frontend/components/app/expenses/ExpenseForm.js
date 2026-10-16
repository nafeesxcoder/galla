"use client";

// ===========================================================================
// ADD OR EDIT AN EXPENSE
// ---------------------------------------------------------------------------
// Two fields are needed: what it was for, and how much. Everything else has a
// sensible default.
//
// The category is free text with the common ones offered as suggestions,
// rather than a fixed dropdown. Every shop spends on something the list did
// not think of, and a shopkeeper forced to file the gas cylinder under
// "Other" loses the one thing the report was for. The suggestions exist so
// that "Shop rent" is spelt the same way every month and the grouping works.
// ===========================================================================

import { useEffect, useId, useState } from "react";
import Modal from "../ui/Modal";
import { Text, Select, Money, TextArea, numericOnly } from "../ui/Field";
import { Note } from "../ui/Bits";
import { EXPENSES, COMMON } from "../content";
import { PAYMENT_MODES } from "../../../lib/units";
import { TAX_RATES } from "../../../lib/gst-calc";
import { rupees, today, toPaise } from "../../../lib/money";
import { createExpense, updateExpense, listParties } from "../data";
import { useToast } from "../ui/Toast";

function blank() {
  return {
    category: "",
    amount: "",
    taxRate: "0",
    date: today(),
    mode: "cash",
    partyId: "",
    reference: "",
    notes: "",
  };
}

function fromExpense(e) {
  return {
    category: e.category,
    amount: e.amountPaise ? String(e.amountPaise / 100) : "",
    taxRate: String(e.taxRate ?? 0),
    date: e.date || today(),
    mode: e.mode || "cash",
    partyId: e.partyId ? String(e.partyId) : "",
    reference: e.reference || "",
    notes: e.notes || "",
  };
}

export default function ExpenseForm({ expense, onClose, onSaved }) {
  const editing = Boolean(expense);
  const [form, setForm] = useState(() => (editing ? fromExpense(expense) : blank()));
  const [parties, setParties] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [fieldErrs, setFieldErrs] = useState({});
  const { toast } = useToast();
  const listId = useId();

  useEffect(() => {
    let alive = true;
    listParties({ limit: 200 })
      .then(({ rows }) => alive && setParties(rows))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const amountPaise = toPaise(form.amount);
  const taxPaise = Math.round((amountPaise * (Number(form.taxRate) || 0)) / 100);

  async function submit(e) {
    e.preventDefault();
    setErr(null);

    const errs = {};
    if (!form.category.trim()) errs.category = COMMON.required;
    if (form.amount === "" || form.amount == null) errs.amount = COMMON.required;
    setFieldErrs(errs);
    if (Object.keys(errs).length) return;

    setBusy(true);
    try {
      const saved = editing ? await updateExpense(expense.id, form) : await createExpense(form);
      toast(editing ? EXPENSES.form.saved : EXPENSES.form.savedNew);
      onSaved?.(saved);
    } catch (e2) {
      if (e2.fields && typeof e2.fields === "object") {
        const map = {};
        for (const [k, v] of Object.entries(e2.fields)) map[k] = Array.isArray(v) ? v[0] : String(v);
        setFieldErrs(map);
      }
      setErr(e2.isOffline ? COMMON.offlineBody : e2.message || COMMON.genericError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title={editing ? EXPENSES.form.editTitle : EXPENSES.form.addTitle}
      onClose={onClose}
      wide
      footer={
        <>
          <button type="button" className="ap-btn" onClick={onClose} disabled={busy}>
            {COMMON.cancel}
          </button>
          <button type="submit" form="ap-expenseform" className="ap-btn ap-btn-primary" disabled={busy}>
            {busy ? COMMON.saving : COMMON.save}
          </button>
        </>
      }
    >
      <form id="ap-expenseform" onSubmit={submit} className="ap-stack">
        {err ? <Note kind="bad">{err}</Note> : null}

        <Text
          label={EXPENSES.form.category}
          placeholder={EXPENSES.form.categoryPlaceholder}
          hint={EXPENSES.form.categoryHint}
          value={form.category}
          onChange={set("category")}
          error={fieldErrs.category}
          required
          autoFocus
          autoComplete="off"
          list={listId}
          maxLength={80}
        />
        <datalist id={listId}>
          {EXPENSES.common.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>

        <div className="ap-grid3">
          <Money
            label={EXPENSES.form.amount}
            hint={EXPENSES.form.amountHint}
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: numericOnly(e.target.value) }))}
            error={fieldErrs.amount}
            placeholder="0.00"
            required
          />
          <Select
            label={EXPENSES.form.taxRate}
            hint={EXPENSES.form.taxRateHint}
            value={form.taxRate}
            onChange={set("taxRate")}
          >
            {TAX_RATES.map((t) => (
              <option key={t.value} value={String(t.value)}>
                {t.label}
              </option>
            ))}
          </Select>
          <div>
            <span className="ap-label">{EXPENSES.form.total}</span>
            <div className="ap-strong ap-num" style={{ fontSize: 19, paddingTop: 7 }}>
              {rupees(amountPaise + taxPaise)}
            </div>
            {taxPaise ? <p className="ap-hint">including {rupees(taxPaise)} GST</p> : null}
          </div>
        </div>

        <div className="ap-grid3">
          <Text label={EXPENSES.form.date} type="date" value={form.date} onChange={set("date")} />
          <Select label={EXPENSES.form.mode} value={form.mode} onChange={set("mode")}>
            {PAYMENT_MODES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </Select>
          <Select
            label={EXPENSES.form.party}
            hint={EXPENSES.form.partyHint}
            value={form.partyId}
            onChange={set("partyId")}
          >
            <option value="">{EXPENSES.form.partyNone}</option>
            {parties.map((p) => (
              <option key={p.id} value={String(p.id)}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="ap-grid2">
          <Text
            label={EXPENSES.form.reference}
            value={form.reference}
            onChange={set("reference")}
            autoComplete="off"
            maxLength={120}
          />
        </div>

        <TextArea label={EXPENSES.form.notes} value={form.notes} onChange={set("notes")} rows={2} />
      </form>
    </Modal>
  );
}
