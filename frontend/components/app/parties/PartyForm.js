"use client";

// ===========================================================================
// ADD OR EDIT A CUSTOMER OR SUPPLIER
// ---------------------------------------------------------------------------
// Opened from the Customers page and from the billing screen mid-bill. Only
// the name is compulsory: a shopkeeper adding a customer at the counter with
// a queue behind them should be able to type a name and get on with it.
//
// Two bits of quiet help worth keeping:
//   - typing a GSTIN fills in the state from its first two digits, because
//     that is exactly what those digits mean
//   - the state is what decides CGST+SGST versus IGST, so when it is missing
//     the form says so rather than leaving it looking optional
// ===========================================================================

import { useState } from "react";
import Modal from "../ui/Modal";
import { Text, Select, Money, TextArea, digitsOnly, numericOnly } from "../ui/Field";
import { Note } from "../ui/Bits";
import { PARTIES, COMMON } from "../content";
import { GST_STATES, isValidGstin, stateCodeFromGstin } from "../../../lib/gst-states";
import { createParty, updateParty } from "../data";
import { useToast } from "../ui/Toast";

function blank(initial = {}) {
  return {
    name: initial.name || "",
    type: initial.type || "customer",
    phone: initial.phone || "",
    email: "",
    gstin: "",
    stateCode: initial.stateCode || "",
    address: "",
    city: "",
    pincode: "",
    openingBalance: "",
    openingDirection: "owes",
  };
}

function fromParty(p) {
  return {
    name: p.name,
    type: p.type,
    phone: p.phone,
    email: p.email,
    gstin: p.gstin,
    stateCode: p.stateCode,
    address: p.address,
    city: p.city,
    pincode: p.pincode,
    openingBalance: "",
    openingDirection: "owes",
  };
}

export default function PartyForm({ party, initial, onClose, onSaved }) {
  const editing = Boolean(party);
  const [form, setForm] = useState(() => (editing ? fromParty(party) : blank(initial)));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [fieldErrs, setFieldErrs] = useState({});
  const { toast } = useToast();

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  function onGstin(e) {
    const value = e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, "").slice(0, 15);
    setForm((f) => {
      // The first two digits of a GSTIN are the state code. Filling it in
      // saves a step and removes a way to get the tax wrong.
      const fromGstin = stateCodeFromGstin(value);
      return { ...f, gstin: value, stateCode: fromGstin && !f.stateCode ? fromGstin : f.stateCode };
    });
  }

  async function submit(e) {
    e.preventDefault();
    setErr(null);
    const errs = {};
    if (!form.name.trim()) errs.name = COMMON.required;
    if (form.gstin && !isValidGstin(form.gstin)) errs.gstin = PARTIES.form.gstinBad;
    if (form.phone && form.phone.length !== 10) errs.phone = "A mobile number is 10 digits.";
    setFieldErrs(errs);
    if (Object.keys(errs).length) return;

    setBusy(true);
    try {
      const saved = editing ? await updateParty(party.id, form) : await createParty(form);
      toast(
        editing
          ? PARTIES.form.saved
          : PARTIES.form.savedNew.replace("{name}", saved?.name || form.name.trim())
      );
      onSaved?.(saved);
    } catch (e2) {
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

  return (
    <Modal
      title={editing ? PARTIES.form.editTitle : PARTIES.form.addTitle}
      onClose={onClose}
      wide
      footer={
        <>
          <button type="button" className="ap-btn" onClick={onClose} disabled={busy}>
            {COMMON.cancel}
          </button>
          <button type="submit" form="ap-partyform" className="ap-btn ap-btn-primary" disabled={busy}>
            {busy ? COMMON.saving : COMMON.save}
          </button>
        </>
      }
    >
      <form id="ap-partyform" onSubmit={submit} className="ap-stack">
        {err ? <Note kind="bad">{err}</Note> : null}

        <div className="ap-grid2">
          <Text
            label={PARTIES.form.name}
            placeholder={PARTIES.form.namePlaceholder}
            value={form.name}
            onChange={set("name")}
            error={fieldErrs.name}
            required
            autoFocus
            autoComplete="off"
            maxLength={160}
          />
          <Select label={PARTIES.form.type} value={form.type} onChange={set("type")}>
            <option value="customer">{PARTIES.form.typeCustomer}</option>
            <option value="supplier">{PARTIES.form.typeSupplier}</option>
            <option value="both">{PARTIES.form.typeBoth}</option>
          </Select>
        </div>

        <div className="ap-grid2">
          <Text
            label={PARTIES.form.phone}
            hint={PARTIES.form.phoneHint}
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: digitsOnly(e.target.value, 10) }))}
            inputMode="numeric"
            error={fieldErrs.phone}
            placeholder="98765 43210"
          />
          <Text
            label={PARTIES.form.email}
            type="email"
            value={form.email}
            onChange={set("email")}
            error={fieldErrs.email}
            autoComplete="off"
          />
        </div>

        <div className="ap-grid2">
          <Text
            label={PARTIES.form.gstin}
            hint={PARTIES.form.gstinHint}
            value={form.gstin}
            onChange={onGstin}
            error={fieldErrs.gstin}
            autoComplete="off"
            style={{ textTransform: "uppercase", fontFamily: "var(--ap-mono)" }}
            placeholder="09ABCDE1234F1Z5"
          />
          <Select
            label={PARTIES.form.stateCode}
            hint={PARTIES.form.stateHint}
            value={form.stateCode}
            onChange={set("stateCode")}
            error={fieldErrs.stateCode}
          >
            <option value="">Not set</option>
            {GST_STATES.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>

        <TextArea label={PARTIES.form.address} value={form.address} onChange={set("address")} rows={2} />

        <div className="ap-grid2">
          <Text label={PARTIES.form.city} value={form.city} onChange={set("city")} autoComplete="off" />
          <Text
            label={PARTIES.form.pincode}
            value={form.pincode}
            onChange={(e) => setForm((f) => ({ ...f, pincode: digitsOnly(e.target.value, 6) }))}
            inputMode="numeric"
          />
        </div>

        {!editing ? (
          <div className="ap-grid2">
            <Money
              label={PARTIES.form.openingBalance}
              hint={PARTIES.form.openingBalanceHint}
              value={form.openingBalance}
              onChange={(e) => setForm((f) => ({ ...f, openingBalance: numericOnly(e.target.value) }))}
              placeholder="0.00"
            />
            <Select
              label="Which way round"
              value={form.openingDirection}
              onChange={set("openingDirection")}
              disabled={!Number(form.openingBalance)}
            >
              <option value="owes">{PARTIES.form.openingOwesYou}</option>
              <option value="owe">{PARTIES.form.openingIOwe}</option>
            </Select>
          </div>
        ) : null}
      </form>
    </Modal>
  );
}
