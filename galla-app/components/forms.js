// ===========================================================================
// ADDING SOMETHING MID-BILL
// ---------------------------------------------------------------------------
// A customer is at the counter with something that is not in the item list
// yet. The bill cannot be abandoned to go and set the item up properly, so
// both of these ask for the two or three things a bill genuinely needs and
// hide the rest behind "More details".
//
// Only the compulsory fields carry the red star, and they really are
// compulsory: a name, and for an item a price. Everything else can be filled
// in later from the Items screen without anything being wrong in the
// meantime.
// ===========================================================================

import { useEffect, useState } from "react";
import { View } from "react-native";
import { Button, Card, Field, MoneyField, Note, T } from "./ui";
import { Sheet, Choose, PickerButton } from "./sheet";
import { Icon } from "./icons";
import { createItem, createParty } from "../lib/data";
import { UNITS, unitLabel } from "../lib/units";
import { TAX_RATES } from "../lib/gst-calc";
import { GST_STATES } from "../lib/gst-states";
import { useShopDefaults } from "../lib/shop-prefs";
import { space } from "../lib/theme";

function digits(v) {
  return String(v ?? "").replace(/[^\d.]/g, "");
}

// ---------------------------------------------------------------------------
// an item
// ---------------------------------------------------------------------------
export function ItemQuickForm({ open, initialName = "", onClose, onSaved }) {
  const prefs = useShopDefaults();
  const [form, setForm] = useState(() => blankItem(initialName));
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [picking, setPicking] = useState(null);

  // Every opening starts from a clean form, with whatever was typed into the
  // search box already in the name.
  useEffect(() => {
    if (!open) return;
    setForm(blankItem(initialName, prefs));
    setMore(false);
    setErr(null);
    setPicking(null);
    // prefs is deliberately NOT a dependency. It arrives a moment after the
    // first render, and reacting to it would re-blank a form somebody had
    // already started typing into.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialName]);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const isService = form.type === "service";

  async function save() {
    setErr(null);
    if (!form.name.trim()) return setErr("The item needs a name.");
    if (form.salePrice === "") return setErr("Enter what you sell it for.");

    setBusy(true);
    try {
      const item = await createItem(form);
      onSaved(item);
    } catch (e) {
      setErr(e.isOffline ? "Could not reach the server." : e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="New item"
      subtitle="Two things now, the rest whenever you like"
      footer={<Button title="Save and add to the bill" kind="primary" size="lg" full busy={busy} onPress={save} />}
    >
      {err ? <Note tone="bad" style={{ marginBottom: space(4) }}>{err}</Note> : null}

      <Card>
        <Field
          label="Item name"
          required
          value={form.name}
          onChangeText={set("name")}
          placeholder="Basmati rice 5kg"
          autoFocus
          maxLength={160}
        />

        <View style={{ flexDirection: "row", gap: space(3), marginTop: space(4) }}>
          <MoneyField
            label="Sale price"
            required
            style={{ flex: 1 }}
            value={form.salePrice}
            onChangeText={(v) => set("salePrice")(digits(v))}
          />
          <PickerButton
            label="GST"
            style={{ width: 104 }}
            value={`${form.taxRate}%`}
            onPress={() => setPicking("tax")}
          />
        </View>

        <PickerButton
          label="Sold by"
          style={{ marginTop: space(4) }}
          value={unitLabel(form.unit)}
          onPress={() => setPicking("unit")}
          hint={isService ? "Services are counted in pieces." : undefined}
        />

        {!isService ? (
          <View style={{ flexDirection: "row", gap: space(3), marginTop: space(4) }}>
            <Field
              label="Stock in hand"
              style={{ flex: 1 }}
              value={form.openingStock}
              onChangeText={(v) => set("openingStock")(digits(v))}
              keyboardType="decimal-pad"
              inputMode="decimal"
              placeholder="0"
              hint="How many you have right now"
            />
            <Field
              label="Warn me at"
              style={{ flex: 1 }}
              value={form.lowStockAlert}
              onChangeText={(v) => set("lowStockAlert")(digits(v))}
              keyboardType="decimal-pad"
              inputMode="decimal"
              placeholder="0"
              hint="Leave blank for no warning"
            />
          </View>
        ) : null}
      </Card>

      <Button
        title={more ? "Hide the extra details" : "More details"}
        kind="ghost"
        icon={<Icon name={more ? "down" : "chevron"} size={16} />}
        onPress={() => setMore((v) => !v)}
        style={{ marginTop: space(3), alignSelf: "flex-start" }}
      />

      {more ? (
        <Card style={{ marginTop: space(1) }}>
          <PickerButton
            label="This is"
            value={isService ? "A service" : "Goods"}
            onPress={() => setPicking("type")}
            hint="A service has no stock to keep count of."
          />

          <View style={{ flexDirection: "row", gap: space(3), marginTop: space(4) }}>
            <MoneyField
              label="Cost price"
              style={{ flex: 1 }}
              value={form.purchasePrice}
              onChangeText={(v) => set("purchasePrice")(digits(v))}
              hint="For your profit figures"
            />
            <Field
              label="Code or barcode"
              style={{ flex: 1 }}
              value={form.code}
              onChangeText={set("code")}
              placeholder="RICE5"
              autoCapitalize="characters"
            />
          </View>

          <Field
            label="HSN or SAC"
            style={{ marginTop: space(4) }}
            value={form.hsn}
            onChangeText={(v) => set("hsn")(v.replace(/\D+/g, ""))}
            keyboardType="number-pad"
            placeholder="1006"
            maxLength={8}
            hint="Needed on a GST bill above ₹5 crore turnover."
          />

          <PickerButton
            label="Price already includes GST"
            style={{ marginTop: space(4) }}
            value={form.taxIncluded ? "Yes, it is an MRP" : "No, GST is added on top"}
            onPress={() => setPicking("incl")}
          />

          <PickerButton
            label="Keep batch and expiry"
            style={{ marginTop: space(4) }}
            value={form.trackBatches ? "Yes" : "No"}
            onPress={() => setPicking("batch")}
            hint="For medicines and anything that expires."
          />
        </Card>
      ) : null}

      <Choose
        open={picking === "tax"}
        onClose={() => setPicking(null)}
        title="GST rate"
        value={String(form.taxRate)}
        options={TAX_RATES.map((t) => ({ value: String(t.value), label: t.label }))}
        onPick={(v) => set("taxRate")(Number(v))}
      />
      <Choose
        open={picking === "unit"}
        onClose={() => setPicking(null)}
        title="Sold by"
        value={form.unit}
        options={UNITS.map((u) => ({ value: u.code, label: u.label, note: u.code }))}
        onPick={set("unit")}
      />
      <Choose
        open={picking === "type"}
        onClose={() => setPicking(null)}
        title="This is"
        value={form.type}
        options={[
          { value: "goods", label: "Goods", note: "Stock is counted" },
          { value: "service", label: "A service", note: "No stock" },
        ]}
        onPick={set("type")}
      />
      <Choose
        open={picking === "incl"}
        onClose={() => setPicking(null)}
        title="Does the price include GST?"
        value={form.taxIncluded ? "1" : "0"}
        options={[
          { value: "0", label: "No, GST is added on top", note: "Usual for wholesale" },
          { value: "1", label: "Yes, it is an MRP", note: "GST is worked out backwards" },
        ]}
        onPick={(v) => set("taxIncluded")(v === "1")}
      />
      <Choose
        open={picking === "batch"}
        onClose={() => setPicking(null)}
        title="Keep batch and expiry"
        value={form.trackBatches ? "1" : "0"}
        options={[
          { value: "0", label: "No" },
          { value: "1", label: "Yes", note: "Medicines, food, anything dated" },
        ]}
        onPick={(v) => set("trackBatches")(v === "1")}
      />
    </Sheet>
  );
}

// The shop's own starting point, not the code's. A chemist selling at 12%
// on MRP should not retype the unit and the rate on every one of four
// hundred items because "PCS at 0%, tax extra" is what the file happened to
// say.
function blankItem(name, prefs) {
  return {
    name: name || "",
    type: "goods",
    unit: prefs?.itemUnit || "PCS",
    salePrice: "",
    purchasePrice: "",
    taxRate: Number(prefs?.itemTaxRate) || 0,
    taxIncluded: Boolean(prefs?.itemPriceIncludesTax),
    trackBatches: false,
    openingStock: "",
    lowStockAlert: "",
    code: "",
    hsn: "",
  };
}

// ---------------------------------------------------------------------------
// a customer or a supplier
// ---------------------------------------------------------------------------
export function PartyQuickForm({ open, initialName = "", type = "customer", stateCode = "", onClose, onSaved }) {
  const [form, setForm] = useState(() => blankParty(initialName, type, stateCode));
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [picking, setPicking] = useState(null);

  useEffect(() => {
    if (!open) return;
    setForm(blankParty(initialName, type, stateCode));
    setMore(false);
    setErr(null);
    setPicking(null);
  }, [open, initialName, type, stateCode]);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const stName = GST_STATES.find((s) => s.code === form.stateCode)?.name;

  async function save() {
    setErr(null);
    if (!form.name.trim()) return setErr("A name is needed, even a short one.");
    if (form.phone && !/^[6-9]\d{9}$/.test(form.phone)) {
      return setErr("That does not look like a 10 digit mobile number.");
    }
    setBusy(true);
    try {
      onSaved(await createParty(form));
    } catch (e) {
      setErr(e.isOffline ? "Could not reach the server." : e.message);
    } finally {
      setBusy(false);
    }
  }

  const noun = type === "supplier" ? "supplier" : "customer";

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`New ${noun}`}
      subtitle="A name is enough to get the bill out"
      footer={<Button title={`Save and use this ${noun}`} kind="primary" size="lg" full busy={busy} onPress={save} />}
    >
      {err ? <Note tone="bad" style={{ marginBottom: space(4) }}>{err}</Note> : null}

      <Card>
        <Field
          label="Name"
          required
          value={form.name}
          onChangeText={set("name")}
          placeholder="Ramesh Traders"
          autoFocus
          maxLength={160}
        />

        <Field
          label="Mobile number"
          style={{ marginTop: space(4) }}
          value={form.phone}
          onChangeText={(v) => set("phone")(v.replace(/\D+/g, "").slice(0, 10))}
          keyboardType="number-pad"
          inputMode="numeric"
          prefix="+91"
          placeholder="98765 43210"
          maxLength={10}
          hint="So you can send the bill on WhatsApp."
        />

        <PickerButton
          label="State"
          style={{ marginTop: space(4) }}
          value={stName}
          placeholder="Same as your shop"
          onPress={() => setPicking("state")}
          hint="A different state means IGST instead of CGST + SGST."
        />
      </Card>

      <Button
        title={more ? "Hide the extra details" : "More details"}
        kind="ghost"
        icon={<Icon name={more ? "down" : "chevron"} size={16} />}
        onPress={() => setMore((v) => !v)}
        style={{ marginTop: space(3), alignSelf: "flex-start" }}
      />

      {more ? (
        <Card style={{ marginTop: space(1) }}>
          <Field
            label="GSTIN"
            value={form.gstin}
            onChangeText={(v) => set("gstin")(v.toUpperCase().replace(/[^0-9A-Z]/g, "").slice(0, 15))}
            placeholder="09ABCDE1234F1Z5"
            autoCapitalize="characters"
            hint="Needed only if they claim input credit."
          />
          <Field
            label="Address"
            style={{ marginTop: space(4) }}
            value={form.address}
            onChangeText={set("address")}
            placeholder="Shop 4, Main Market"
          />
          <View style={{ flexDirection: "row", gap: space(3), marginTop: space(4) }}>
            <Field label="City" style={{ flex: 1 }} value={form.city} onChangeText={set("city")} placeholder="Noida" />
            <Field
              label="Pincode"
              style={{ width: 120 }}
              value={form.pincode}
              onChangeText={(v) => set("pincode")(v.replace(/\D+/g, "").slice(0, 6))}
              keyboardType="number-pad"
              placeholder="201301"
            />
          </View>

          <View style={{ flexDirection: "row", gap: space(3), marginTop: space(4) }}>
            <MoneyField
              label="Opening balance"
              style={{ flex: 1 }}
              value={form.openingBalance}
              onChangeText={(v) => set("openingBalance")(digits(v))}
              hint="What is already outstanding"
            />
            <PickerButton
              label="Which way"
              style={{ flex: 1 }}
              value={form.openingDirection === "owe" ? "You owe them" : "They owe you"}
              onPress={() => setPicking("dir")}
            />
          </View>

          <PickerButton
            label="They are"
            style={{ marginTop: space(4) }}
            value={form.type === "both" ? "Both" : form.type === "supplier" ? "A supplier" : "A customer"}
            onPress={() => setPicking("type")}
          />
        </Card>
      ) : null}

      <Choose
        open={picking === "state"}
        onClose={() => setPicking(null)}
        title="State"
        value={form.stateCode}
        options={GST_STATES.map((s) => ({ value: s.code, label: s.name, note: s.code }))}
        onPick={set("stateCode")}
      />
      <Choose
        open={picking === "dir"}
        onClose={() => setPicking(null)}
        title="Which way does it go?"
        value={form.openingDirection}
        options={[
          { value: "owes", label: "They owe you", note: "Money you have to collect" },
          { value: "owe", label: "You owe them", note: "Money you have to pay" },
        ]}
        onPick={set("openingDirection")}
      />
      <Choose
        open={picking === "type"}
        onClose={() => setPicking(null)}
        title="They are"
        value={form.type}
        options={[
          { value: "customer", label: "A customer", note: "You sell to them" },
          { value: "supplier", label: "A supplier", note: "You buy from them" },
          { value: "both", label: "Both" },
        ]}
        onPick={set("type")}
      />
    </Sheet>
  );
}

function blankParty(name, type, stateCode) {
  return {
    name: name || "",
    type: type || "customer",
    phone: "",
    gstin: "",
    stateCode: stateCode || "",
    address: "",
    city: "",
    pincode: "",
    openingBalance: "",
    openingDirection: "owes",
  };
}
