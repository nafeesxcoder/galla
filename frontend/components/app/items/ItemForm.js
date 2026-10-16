"use client";

// ===========================================================================
// ADD OR EDIT AN ITEM
// ---------------------------------------------------------------------------
// Used both from the Items page and straight out of the billing screen,
// where a shopkeeper is halfway through a bill and realises the thing in
// their hand was never entered. In that case the name is already typed, so
// it arrives as `initialName` and the cursor lands on the price instead.
// ===========================================================================

import { useState } from "react";
import Modal from "../ui/Modal";
import { Text, Select, Money, Check, numericOnly } from "../ui/Field";
import { Note } from "../ui/Bits";
import { ITEMS, COMMON, BATCHES } from "../content";
import { UNITS } from "../../../lib/units";
import { TAX_RATES } from "../../../lib/gst-calc";
import { createItem, updateItem } from "../data";
import { useToast } from "../ui/Toast";

function blank(initialName = "") {
  return {
    name: initialName,
    type: "goods",
    code: "",
    hsn: "",
    unit: "PCS",
    salePrice: "",
    taxIncluded: false,
    purchasePrice: "",
    taxRate: "5",
    openingStock: "",
    lowStockAlert: "",
    trackBatches: false,
    description: "",
  };
}

function fromItem(item) {
  return {
    name: item.name,
    type: item.type,
    code: item.code,
    hsn: item.hsn,
    unit: item.unit,
    salePrice: item.salePaise ? String(item.salePaise / 100) : "",
    taxIncluded: item.taxIncluded,
    purchasePrice: item.costPaise ? String(item.costPaise / 100) : "",
    taxRate: String(item.taxRate ?? 0),
    openingStock: String(item.stock ?? ""),
    lowStockAlert: item.lowStockAlert == null ? "" : String(item.lowStockAlert),
    trackBatches: Boolean(item.trackBatches),
    description: item.description || "",
  };
}

export default function ItemForm({ item, initialName = "", onClose, onSaved }) {
  const editing = Boolean(item);
  const [form, setForm] = useState(() => (editing ? fromItem(item) : blank(initialName)));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [fieldErrs, setFieldErrs] = useState({});
  const { toast } = useToast();

  const set = (key) => (e) => {
    const value = e?.target?.type === "checkbox" ? e.target.checked : e?.target?.value ?? e;
    setForm((f) => ({ ...f, [key]: value }));
  };

  const setNum = (key, opts) => (e) =>
    setForm((f) => ({ ...f, [key]: numericOnly(e.target.value, opts) }));

  async function submit(e) {
    e.preventDefault();
    setErr(null);
    setFieldErrs({});

    // Only two things are actually needed to sell something: what it is and
    // what it costs. Everything else on this form has a sensible default or
    // can be filled in later, so nothing else is marked with a star.
    const errs = {};
    if (!form.name.trim()) errs.name = COMMON.required;
    if (form.salePrice === "" || form.salePrice == null) errs.salePrice = COMMON.required;
    if (Object.keys(errs).length) {
      setFieldErrs(errs);
      return;
    }

    setBusy(true);
    try {
      const saved = editing ? await updateItem(item.id, form) : await createItem(form);
      toast(
        editing
          ? ITEMS.form.saved
          : ITEMS.form.savedNew.replace("{name}", saved?.name || form.name.trim())
      );
      onSaved?.(saved);
    } catch (e2) {
      // The server's validator names the fields it did not like; show them
      // against the inputs rather than as one lump at the top.
      if (e2.fields && typeof e2.fields === "object") {
        const map = {};
        for (const [k, v] of Object.entries(e2.fields)) map[k] = Array.isArray(v) ? v[0] : String(v);
        setFieldErrs(map);
      }
      setErr(e2.isOffline ? COMMON.offlineBody : e2.message);
    } finally {
      setBusy(false);
    }
  }

  const isService = form.type === "service";

  return (
    <Modal
      title={editing ? ITEMS.form.editTitle : ITEMS.form.addTitle}
      onClose={onClose}
      wide
      footer={
        <>
          <button type="button" className="ap-btn" onClick={onClose} disabled={busy}>
            {COMMON.cancel}
          </button>
          <button type="submit" form="ap-itemform" className="ap-btn ap-btn-primary" disabled={busy}>
            {busy ? COMMON.saving : COMMON.save}
          </button>
        </>
      }
    >
      <form id="ap-itemform" onSubmit={submit} className="ap-stack">
        {err ? <Note kind="bad">{err}</Note> : null}

        <Text
          label={ITEMS.form.name}
          placeholder={ITEMS.form.namePlaceholder}
          value={form.name}
          onChange={set("name")}
          error={fieldErrs.name}
          required
          autoFocus={!initialName}
          autoComplete="off"
          maxLength={160}
        />

        <div className="ap-grid3">
          <Select label={ITEMS.form.type} value={form.type} onChange={set("type")} hint={ITEMS.form.typeHint}>
            <option value="goods">{ITEMS.form.typeGoods}</option>
            <option value="service">{ITEMS.form.typeService}</option>
          </Select>

          <Select label={ITEMS.form.unit} value={form.unit} onChange={set("unit")} disabled={isService}>
            {UNITS.map((u) => (
              <option key={u.code} value={u.code}>
                {u.label} ({u.short})
              </option>
            ))}
          </Select>

          <Select
            label={ITEMS.form.taxRate}
            value={form.taxRate}
            onChange={set("taxRate")}
            error={fieldErrs.taxRate}
          >
            {TAX_RATES.map((t) => (
              <option key={t.value} value={String(t.value)}>
                {t.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="ap-grid2">
          <Money
            label={ITEMS.form.salePrice}
            hint={ITEMS.form.salePriceHint}
            value={form.salePrice}
            onChange={setNum("salePrice")}
            error={fieldErrs.salePrice}
            autoFocus={Boolean(initialName)}
            placeholder="0.00"
            required
          />
          <Money
            label={ITEMS.form.purchasePrice}
            hint={ITEMS.form.purchasePriceHint}
            value={form.purchasePrice}
            onChange={setNum("purchasePrice")}
            error={fieldErrs.purchasePrice}
            placeholder="0.00"
          />
        </div>

        {!isService ? (
          <Check
            label={BATCHES.trackLabel}
            hint={BATCHES.trackHint}
            checked={form.trackBatches}
            onChange={set("trackBatches")}
          />
        ) : null}

        <Check
          label={ITEMS.form.taxIncluded}
          hint="Tick this if the price above is the MRP. The GST is then taken out of it rather than added on top."
          checked={form.taxIncluded}
          onChange={set("taxIncluded")}
        />

        {!isService ? (
          <div className="ap-grid2">
            <Text
              label={ITEMS.form.openingStock}
              hint={ITEMS.form.openingStockHint}
              value={form.openingStock}
              onChange={setNum("openingStock")}
              inputMode="decimal"
              placeholder="0"
              disabled={editing}
            />
            <Text
              label={ITEMS.form.lowStockAlert}
              hint={ITEMS.form.lowStockHint}
              value={form.lowStockAlert}
              onChange={setNum("lowStockAlert")}
              inputMode="decimal"
              placeholder="e.g. 5"
            />
          </div>
        ) : null}

        {editing && !isService ? (
          <Note kind="info" icon={false}>
            Stock cannot be edited here on purpose. Use <strong>Correct the stock</strong> on the item so
            the change is written down with a reason. That record is what makes the numbers trustworthy
            later.
          </Note>
        ) : null}

        <div className="ap-grid2">
          <Text
            label={ITEMS.form.code}
            placeholder={ITEMS.form.codePlaceholder}
            hint={ITEMS.form.codeHint}
            value={form.code}
            onChange={set("code")}
            autoComplete="off"
            maxLength={60}
          />
          <Text
            label={ITEMS.form.hsn}
            hint={ITEMS.form.hsnHint}
            value={form.hsn}
            onChange={(e) => setForm((f) => ({ ...f, hsn: numericOnly(e.target.value, { decimals: false }) }))}
            inputMode="numeric"
            maxLength={8}
            error={fieldErrs.hsn}
          />
        </div>
      </form>
    </Modal>
  );
}
