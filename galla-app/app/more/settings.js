// ===========================================================================
// THE SHOP ITSELF
// ---------------------------------------------------------------------------
// Everything here prints on the bill, which is the only reason it matters.
// So the screen says that rather than presenting a form.
//
// Two fields carry real weight. The state decides whether every bill carries
// CGST + SGST or IGST, and getting it wrong makes every bill wrong. The GSTIN
// decides whether the bill may call itself a Tax Invoice at all - without one
// it prints as a plain Invoice with no tax columns, which is correct and not
// a defect.
// ===========================================================================

import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { Button, Card, CardHead, ErrorState, Field, Loading, Note, Row, Screen, T } from "../../components/ui";
import { Choose, PickerButton } from "../../components/sheet";
import { useSession } from "../../lib/session";
import { getBusiness, updateBusiness } from "../../lib/data";
import { GST_STATES, stateName } from "../../lib/gst-states";
import { ServerSheet } from "../../components/server";
import { getApiUrl, apiUrlIsFixed } from "../../lib/api";
import { colors, space } from "../../lib/theme";

// What the server calls each field, in words a shopkeeper recognises.
const LABELS = {
  name: "Shop name",
  legalName: "Legal name",
  gstin: "GSTIN",
  stateCode: "State",
  phone: "Phone",
  email: "Email",
  addressLine1: "Address",
  addressLine2: "Address, second line",
  city: "City",
  pincode: "Pincode",
};

export default function Settings() {
  const { businessId, reload } = useSession();

  const [form, setForm] = useState(null);
  const [state, setState] = useState({ loading: true, error: null });
  const [picking, setPicking] = useState(false);
  const [serverSheet, setServerSheet] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState(null);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, error: null }));
    try {
      const b = await getBusiness(businessId);
      setForm({
        name: b.name,
        legalName: b.legalName,
        gstin: b.gstin,
        stateCode: b.stateCode,
        phone: b.phone,
        email: b.email,
        addressLine1: b.raw?.addressLine1 || "",
        addressLine2: b.raw?.addressLine2 || "",
        city: b.city,
        pincode: b.pincode,
      });
      setState({ loading: false, error: null });
    } catch (e) {
      setState({ loading: false, error: e });
    }
  }, [businessId]);

  useEffect(() => {
    load();
  }, [load]);

  if (state.error) return <ErrorState error={state.error} onRetry={load} />;
  if (state.loading || !form) return <Loading label="Loading your shop…" />;

  const set = (k) => (v) => {
    setSaved(false);
    setForm((f) => ({ ...f, [k]: v }));
  };

  const gstinLooksWrong =
    Boolean(form.gstin) && !/^\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z][0-9A-Z]$/.test(form.gstin);
  const gstinStateMismatch =
    form.gstin.length >= 2 && form.stateCode && form.gstin.slice(0, 2) !== form.stateCode;

  async function save() {
    setErr(null);
    if (!form.name.trim()) return setErr("Your shop needs a name — it is the first line of every bill.");
    if (!form.stateCode) return setErr("Choose the state. It decides the tax on every bill.");
    if (gstinLooksWrong) return setErr("That GSTIN is not the right shape. Leave it blank if you do not have one.");

    setBusy(true);
    try {
      await updateBusiness(businessId, { ...form, name: form.name.trim() });
      await reload();
      setSaved(true);
    } catch (e) {
      // A 422 names the field it did not like. Saying only "some fields need
      // fixing" leaves somebody staring at nine boxes.
      const fields = e?.fields ? Object.entries(e.fields) : [];
      setErr(
        e.isOffline
          ? "Could not reach the server. Nothing was saved."
          : fields.length
          ? fields.map(([k, v]) => `${LABELS[k] || k}: ${v}`).join("\n")
          : e.message
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: "Shop details" }} />

      <T variant="sub" style={{ marginBottom: space(4) }}>
        All of this prints at the top of every bill you give a customer.
      </T>

      <Card>
        <CardHead title="Name and tax" />

        <Field label="Shop name" required value={form.name} onChangeText={set("name")} maxLength={160} />

        <Field
          label="Legal name"
          style={{ marginTop: space(4) }}
          value={form.legalName}
          onChangeText={set("legalName")}
          placeholder="If it differs from the shop name"
          hint="The name on the GST registration, if that is not the shop's own."
        />

        <View style={{ marginTop: space(4) }}>
          <PickerButton
            label="State"
            required
            value={stateName(form.stateCode)}
            placeholder="Choose your state"
            onPress={() => setPicking(true)}
          />
          <T variant="tiny" style={{ marginTop: space(1) }}>
            Decides whether your bills carry CGST + SGST or IGST.
          </T>
        </View>

        <Field
          label="GSTIN"
          style={{ marginTop: space(4) }}
          value={form.gstin}
          onChangeText={(v) => set("gstin")(v.toUpperCase().replace(/[^0-9A-Z]/g, "").slice(0, 15))}
          placeholder="09ABCDE1234F1Z5"
          autoCapitalize="characters"
          error={gstinLooksWrong ? "That is not the shape of a GSTIN" : undefined}
          hint={
            form.gstin
              ? undefined
              : "No GSTIN? Leave it blank. Your bills will print as “Invoice” instead of “Tax Invoice”, which is correct."
          }
        />

        {gstinStateMismatch ? (
          <Note tone="warn" style={{ marginTop: space(3) }}>
            {`Your GSTIN starts ${form.gstin.slice(0, 2)} but your state is ${form.stateCode}. The first two digits of a GSTIN are the state code, so one of them is wrong.`}
          </Note>
        ) : null}
      </Card>

      <Card style={{ marginTop: space(4) }}>
        <CardHead title="Where you are" />

        <Field label="Address" value={form.addressLine1} onChangeText={set("addressLine1")} placeholder="12 Sector 18 Market" />
        <Field
          label="Address, second line"
          style={{ marginTop: space(4) }}
          value={form.addressLine2}
          onChangeText={set("addressLine2")}
          placeholder="Near the bus stand"
        />
        <Row gap={3} style={{ marginTop: space(4), alignItems: "flex-start" }}>
          <Field label="City" style={{ flex: 1 }} value={form.city} onChangeText={set("city")} placeholder="Noida" />
          <Field
            label="Pincode"
            style={{ width: 130 }}
            value={form.pincode}
            onChangeText={(v) => set("pincode")(v.replace(/\D+/g, "").slice(0, 6))}
            keyboardType="number-pad"
            placeholder="201301"
          />
        </Row>
      </Card>

      <Card style={{ marginTop: space(4) }}>
        <CardHead title="How customers reach you" />
        <Field
          label="Phone on the bill"
          value={form.phone}
          onChangeText={(v) => set("phone")(v.replace(/[^\d+ ]/g, "").slice(0, 15))}
          keyboardType="phone-pad"
          placeholder="9876543210"
        />
        <Field
          label="Email"
          style={{ marginTop: space(4) }}
          value={form.email}
          onChangeText={set("email")}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="shop@example.com"
        />
      </Card>

      {err ? <Note tone="bad" style={{ marginTop: space(5) }}>{err}</Note> : null}
      {saved ? (
        <Note tone="good" style={{ marginTop: space(5) }}>
          Saved. Your next bill will carry this.
        </Note>
      ) : null}

      <Button
        title="Save"
        kind="primary"
        size="lg"
        full
        busy={busy}
        style={{ marginTop: space(4) }}
        onPress={save}
      />

      <T variant="tiny" style={{ marginTop: space(3), textAlign: "center" }}>
        A field you leave blank is left as it was. To change one, type the new value over it.
      </T>

      <T variant="tiny" style={{ marginTop: space(4), textAlign: "center", color: colors.ink3 }}>
        Bills already given out are not changed by this.
      </T>

      {!apiUrlIsFixed() ? (
        <Card style={{ marginTop: space(5) }}>
          <CardHead title="Server" />
          <T variant="sub">{getApiUrl() || "Not set yet"}</T>
          <Button
            title="Change the server address"
            style={{ marginTop: space(3), alignSelf: "flex-start" }}
            onPress={() => setServerSheet(true)}
          />
          <T variant="tiny" style={{ marginTop: space(2) }}>
            Only change this if your backend moved. Everything already saved stays on that server.
          </T>
        </Card>
      ) : null}

      <ServerSheet open={serverSheet} onClose={() => setServerSheet(false)} onSaved={() => setServerSheet(false)} />

      <Choose
        open={picking}
        onClose={() => setPicking(false)}
        title="State"
        value={form.stateCode}
        options={GST_STATES.map((s) => ({ value: s.code, label: s.name, note: s.code }))}
        onPick={set("stateCode")}
      />
    </Screen>
  );
}
