// ===========================================================================
// SETTINGS
// ---------------------------------------------------------------------------
// Three things, and they are genuinely different:
//
//   Bill format     what a customer sees - terms, signature, which columns
//   Bill numbering  the series, which an accountant will ask about
//   Defaults        what a new bill and a new item start with
//
// Each card saves on its own. The server merges section by section, so
// saving the bill format cannot blank the item defaults - which is exactly
// what a single "Save everything" button would do to whichever section
// happened not to be loaded.
//
// The shop's name, address and GSTIN are NOT here. They are facts about the
// business rather than preferences, they have their own screen, and mixing
// them in makes a long screen longer.
// ===========================================================================

import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import {
  Button,
  Card,
  CardHead,
  Divider,
  ErrorState,
  Field,
  Loading,
  Note,
  Row,
  Screen,
  T,
  Toggle,
} from "../../components/ui";
import { Icon } from "../../components/icons";
import { Choose, PickerButton, Sheet } from "../../components/sheet";
import { useSession } from "../../lib/session";
import { getBusiness, listNumbering, updateNumbering, updateSettings } from "../../lib/data";
import { clearBillLook } from "../../lib/print";
import { colors, space } from "../../lib/theme";

const MODES = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "bank", label: "Bank transfer" },
  { value: "cheque", label: "Cheque" },
  { value: "other", label: "Something else" },
];

const UNITS = ["PCS", "KG", "GRAM", "LITRE", "ML", "METRE", "BAG", "BOX", "DOZEN", "PACKET"];

const SIZES = [
  { value: "a4", label: "A4 paper", note: "An ordinary printer" },
  { value: "thermal", label: "80mm roll", note: "A counter till printer" },
];

export default function Preferences() {
  const router = useRouter();
  const { businessId, reload } = useSession();

  const [bill, setBill] = useState(null);
  const [defaults, setDefaults] = useState(null);
  const [numbering, setNumbering] = useState(null);
  const [state, setState] = useState({ loading: true, error: null });

  const load = useCallback(async () => {
    try {
      const [shop, series] = await Promise.all([
        getBusiness(businessId),
        // Numbering is allowed to fail on its own: a shop should still be
        // able to set its terms on a server that does not have the
        // numbering endpoint yet.
        listNumbering().catch(() => null),
      ]);
      setBill(shop.settings.bill);
      setDefaults(shop.settings.defaults);
      setNumbering(series);
      setState({ loading: false, error: null });
    } catch (e) {
      setState({ loading: false, error: e });
    }
  }, [businessId]);

  useEffect(() => {
    load();
  }, [load]);

  if (state.error) return <ErrorState error={state.error} onRetry={load} />;
  if (state.loading || !bill) return <Loading label="Loading your settings…" />;

  return (
    <Screen>
      <BillFormat
        value={bill}
        onChange={setBill}
        businessId={businessId}
        onSaved={reload}
        onOpenAccounts={() => router.push("/cashbank")}
      />

      <Defaults value={defaults} onChange={setDefaults} businessId={businessId} onSaved={reload} />

      <Numbering data={numbering} onReload={load} />

      <Button
        title="Shop name, GSTIN and address"
        icon="shop"
        full
        style={{ marginTop: space(5) }}
        onPress={() => router.push("/more/settings")}
      />
    </Screen>
  );
}

// ---------------------------------------------------------------------------
// a card that saves one section
// ---------------------------------------------------------------------------
// The save state lives per card rather than per screen, so "Saved." appears
// next to the button that was pressed instead of somewhere up the page where
// nobody is looking. That exact mistake made the shop-details screen look
// broken for a week.
function useSection(businessId, section, onSaved) {
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState(null);

  async function save(value) {
    setErr(null);
    setSaved(false);
    setBusy(true);
    try {
      await updateSettings(businessId, { [section]: value });
      // The print code caches these. Without this, the next bill prints with
      // the terms the shopkeeper just changed away from - and they would
      // reasonably conclude the setting does not work.
      clearBillLook();
      setSaved(true);
      onSaved?.();
    } catch (e) {
      setErr(
        e?.fields
          ? Object.entries(e.fields)
              .map(([k, v]) => `${k.split(".").pop()}: ${v}`)
              .join(" · ")
          : e?.message || "Could not save that."
      );
    } finally {
      setBusy(false);
    }
  }

  return { busy, saved, err, save, touch: () => setSaved(false) };
}

function SaveRow({ section, onPress }) {
  return (
    <View style={{ marginTop: space(4) }}>
      <Button
        title={section.busy ? "Saving…" : "Save"}
        kind="primary"
        full
        busy={section.busy}
        disabled={section.busy}
        onPress={onPress}
      />
      {section.saved ? (
        <Row gap={2} style={{ marginTop: space(2), justifyContent: "center" }}>
          <Icon name="check" size={15} color={colors.brand} />
          <T variant="tiny" style={{ color: colors.brandInk, fontWeight: "700" }}>
            Saved.
          </T>
        </Row>
      ) : null}
      {section.err ? (
        <Note tone="bad" style={{ marginTop: space(2) }}>
          {section.err}
        </Note>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// BILL FORMAT
// ---------------------------------------------------------------------------
function BillFormat({ value, onChange, businessId, onSaved, onOpenAccounts }) {
  const section = useSection(businessId, "bill", onSaved);
  const [picking, setPicking] = useState(false);

  const set = (k) => (v) => {
    section.touch();
    onChange({ ...value, [k]: v });
  };

  return (
    <Card>
      <CardHead title="What the bill looks like" />
      <T variant="tiny" style={{ marginBottom: space(3) }}>
        This is what your customer reads. Everything here prints on every bill.
      </T>

      <Field
        label="Terms and conditions"
        value={value.terms}
        onChangeText={set("terms")}
        placeholder="Goods once sold will not be taken back."
        multiline
        numberOfLines={3}
        maxLength={2000}
        inputStyle={{ minHeight: 68, textAlignVertical: "top" }}
      />

      <Field
        label="One line at the very bottom"
        value={value.footer}
        onChangeText={set("footer")}
        placeholder="Thank you for your business"
        maxLength={300}
        style={{ marginTop: space(4) }}
      />

      <Field
        label="Signature line"
        value={value.signatureLabel}
        onChangeText={set("signatureLabel")}
        placeholder="For Mehra Store"
        maxLength={80}
        hint="Printed above the space where you sign."
        style={{ marginTop: space(4) }}
      />

      <PickerButton
        label="Which paper to print on"
        value={SIZES.find((x) => x.value === value.defaultSize)?.label}
        onPress={() => setPicking(true)}
        hint="The print button offers this first. You can still change it on the day."
        style={{ marginTop: space(4) }}
      />

      <Divider style={{ marginVertical: space(4) }} />
      <T variant="label" style={{ marginBottom: space(1) }}>
        What to show
      </T>

      <Toggle
        label="HSN / SAC column"
        hint="Required on a tax invoice above the turnover limit."
        value={value.showHsn}
        onChange={set("showHsn")}
      />
      <Toggle
        label="Amount in words"
        hint="Four thousand two hundred and fifty rupees only."
        value={value.showAmountInWords}
        onChange={set("showAmountInWords")}
      />
      <Toggle
        label="Paid or still due"
        hint="Shows what was received and what is left."
        value={value.showPaymentStatus}
        onChange={set("showPaymentStatus")}
      />
      <Toggle label="Signature space" value={value.showSignature} onChange={set("showSignature")} />
      <Toggle
        label="Your bank details"
        hint="So a customer can transfer into the account."
        value={value.showBankDetails}
        onChange={set("showBankDetails")}
      />

      {/* One <T> around the whole thing rather than a bare string sitting
          next to an element. Note now wraps loose strings itself, but the
          link still has to live inside a Text for it to flow with the
          sentence instead of dropping onto its own line.

          The comment belongs HERE, above the expression: a {/* ... *​/} block
          placed inside the ternary is not valid JSX and Metro refuses the
          whole file. */}
      {value.showBankDetails ? (
        <Note tone="info" style={{ marginTop: space(2) }}>
          <T variant="tiny">
            Only the accounts you have marked &quot;print on bills&quot; are shown.{" "}
            <T
              variant="tiny"
              style={{ color: colors.brandInk, fontWeight: "700" }}
              onPress={onOpenAccounts}
            >
              Open bank accounts
            </T>
          </T>
        </Note>
      ) : null}

      <SaveRow section={section} onPress={() => section.save(value)} />

      <Choose
        open={picking}
        onClose={() => setPicking(false)}
        title="Which paper"
        options={SIZES}
        value={value.defaultSize}
        onPick={set("defaultSize")}
      />
    </Card>
  );
}

// ---------------------------------------------------------------------------
// DEFAULTS
// ---------------------------------------------------------------------------
function Defaults({ value, onChange, businessId, onSaved }) {
  const section = useSection(businessId, "defaults", onSaved);
  const [picking, setPicking] = useState(null);

  const set = (k) => (v) => {
    section.touch();
    onChange({ ...value, [k]: v });
  };
  const numeric = (v) => String(v).replace(/[^\d.]/g, "");

  return (
    <Card style={{ marginTop: space(5) }}>
      <CardHead title="What a new bill starts with" />

      <Field
        label="Credit days"
        value={String(value.dueDays)}
        onChangeText={(v) => set("dueDays")(Number(numeric(v)) || 0)}
        keyboardType="number-pad"
        hint="0 means due on the day. 15 puts a due date a fortnight out on every bill."
      />

      <Toggle
        label="Round to the whole rupee"
        hint="The difference prints as Round off, the way most Indian invoices do it."
        value={value.roundOff}
        onChange={set("roundOff")}
      />

      <PickerButton
        label="Usual way you are paid"
        value={MODES.find((m) => m.value === value.paymentMode)?.label}
        onPress={() => setPicking("mode")}
        style={{ marginTop: space(3) }}
      />

      <Divider style={{ marginVertical: space(4) }} />
      <T variant="label" style={{ marginBottom: space(1) }}>
        What a new item starts with
      </T>

      <PickerButton
        label="Unit"
        value={value.itemUnit}
        onPress={() => setPicking("unit")}
        style={{ marginTop: space(2) }}
      />

      <Field
        label="GST rate"
        value={String(value.itemTaxRate)}
        onChangeText={(v) => set("itemTaxRate")(Number(numeric(v)) || 0)}
        keyboardType="decimal-pad"
        hint="Most shops sell mostly at one rate. Set that here and stop typing it."
        style={{ marginTop: space(4) }}
      />

      <Toggle
        label="Prices include GST"
        hint="On for MRP goods, off if you quote before tax. Getting this wrong on every item is how a shop's totals come out eighteen per cent adrift."
        value={value.itemPriceIncludesTax}
        onChange={set("itemPriceIncludesTax")}
      />

      <SaveRow section={section} onPress={() => section.save(value)} />

      <Choose
        open={picking === "mode"}
        onClose={() => setPicking(null)}
        title="Usual payment"
        options={MODES}
        value={value.paymentMode}
        onPick={set("paymentMode")}
      />
      <Choose
        open={picking === "unit"}
        onClose={() => setPicking(null)}
        title="Unit"
        options={UNITS.map((u) => ({ value: u, label: u }))}
        value={value.itemUnit}
        onPick={set("itemUnit")}
      />
    </Card>
  );
}

// ---------------------------------------------------------------------------
// NUMBERING
// ---------------------------------------------------------------------------
function Numbering({ data, onReload }) {
  const [editing, setEditing] = useState(null);

  if (!data) {
    return (
      <Card style={{ marginTop: space(5) }}>
        <CardHead title="Bill numbering" />
        <Note tone="info">
          Your server does not have the numbering settings yet. Update the backend and this will appear.
        </Note>
      </Card>
    );
  }

  return (
    <Card pad={false} style={{ marginTop: space(5) }}>
      <CardHead title="Bill numbering" />
      <View style={{ paddingHorizontal: space(4), paddingBottom: space(2) }}>
        <T variant="tiny">
          {`A separate series for each kind of bill, restarting every April. Financial year ${data.fy}.`}
        </T>
      </View>

      {data.series.map((s, i) => (
        <View key={s.docType}>
          {i ? <Divider /> : null}
          <Row style={{ paddingHorizontal: space(4), paddingVertical: space(3), gap: space(3) }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <T style={{ fontWeight: "650" }}>{s.label}</T>
              <T variant="tiny" num>
                {s.example}
              </T>
              <T variant="tiny">
                {s.issued ? `${s.issued} issued this year` : "none issued yet"}
              </T>
            </View>
            <Button title="Change" size="sm" onPress={() => setEditing(s)} />
          </Row>
        </View>
      ))}

      <EditSeries
        series={editing}
        onClose={() => setEditing(null)}
        onDone={() => {
          setEditing(null);
          onReload();
        }}
      />
    </Card>
  );
}

function EditSeries({ series, onClose, onDone }) {
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  // Filled from the series the first time it opens, and not on every render,
  // or typing would be undone by the next one.
  const f =
    form ?? {
      prefix: series?.prefix ?? "",
      nextNumber: String(series?.nextNumber ?? 1),
      padding: String(series?.padding ?? 4),
    };
  const set = (k) => (v) => setForm({ ...f, [k]: v });

  const preview = (() => {
    const n = Number(f.nextNumber) || 1;
    const pad = Math.max(1, Math.min(8, Number(f.padding) || 4));
    const padded = String(n).padStart(pad, "0");
    const fy = series?.example?.match(/\d{4}-\d{2}/)?.[0] || "";
    return f.prefix ? `${f.prefix}-${fy}-${padded}` : `${fy}-${padded}`;
  })();

  async function save() {
    setErr(null);
    setBusy(true);
    try {
      await updateNumbering(series.docType, f);
      setForm(null);
      onDone?.();
    } catch (e) {
      setErr(e?.fields ? Object.values(e.fields).join(" ") : e?.message || "Could not save that.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet
      open={Boolean(series)}
      onClose={() => {
        setForm(null);
        setErr(null);
        onClose?.();
      }}
      title={series ? `${series.label} numbers` : ""}
      footer={
        <Button
          title={busy ? "Saving…" : "Save"}
          kind="primary"
          size="lg"
          full
          busy={busy}
          disabled={busy}
          onPress={save}
        />
      }
    >
      <Field
        label="Prefix"
        value={f.prefix}
        onChangeText={(v) => set("prefix")(String(v).toUpperCase().replace(/[^A-Z0-9/-]/g, ""))}
        placeholder="INV"
        maxLength={10}
        autoCapitalize="characters"
        hint="Letters, numbers, - and / only. Leave it blank for just the year and a number."
      />

      <Field
        label="Next bill gets this number"
        value={f.nextNumber}
        onChangeText={(v) => set("nextNumber")(String(v).replace(/[^\d]/g, ""))}
        keyboardType="number-pad"
        hint={
          series
            ? `Cannot be below ${series.lowestAllowed} — ${series.lowestAllowed - 1} is already used.`
            : undefined
        }
        style={{ marginTop: space(4) }}
      />

      <Field
        label="How many digits"
        value={f.padding}
        onChangeText={(v) => set("padding")(String(v).replace(/[^\d]/g, ""))}
        keyboardType="number-pad"
        hint="4 gives 0001. Only changes how it looks, not the count."
        style={{ marginTop: space(4) }}
      />

      <Note tone="info" style={{ marginTop: space(4) }} title="The next bill will be">
        {preview}
      </Note>

      <Note tone="warn" style={{ marginTop: space(3) }}>
        Numbers can move forward but never back onto one already used. Two bills with the same number
        cannot be told apart in a GST return.
      </Note>

      {err ? (
        <Note tone="bad" style={{ marginTop: space(3) }}>
          {err}
        </Note>
      ) : null}
    </Sheet>
  );
}
