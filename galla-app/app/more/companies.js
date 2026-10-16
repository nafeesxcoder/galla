// ===========================================================================
// MY SHOPS
// ---------------------------------------------------------------------------
// One login, more than one business. A family running a kirana and a mobile
// repair counter keeps two sets of books, two GSTINs and two bill numbering
// series - and absolutely must not have a sale from one appearing in the
// other's return.
//
// Switching is instant because every screen already asks for data by business
// id; nothing is cached across shops.
// ===========================================================================

import { useCallback, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Button, Card, Divider, Field, Note, Row, Screen, T } from "../../components/ui";
import { Icon } from "../../components/icons";
import { Sheet, Choose, PickerButton } from "../../components/sheet";
import { useSession } from "../../lib/session";
import { GST_STATES } from "../../lib/gst-states";
import { colors, radius, space } from "../../lib/theme";

export default function Companies() {
  const router = useRouter();
  const { businesses, businessId, switchBusiness, createBusiness } = useSession();
  const [adding, setAdding] = useState(false);
  const [said, setSaid] = useState("");

  return (
    <Screen>
      <Card pad={false}>
        {businesses.map((b, i) => {
          const on = String(b.id) === String(businessId);
          return (
            <View key={b.id}>
              {i ? <Divider /> : null}
              <Pressable
                onPress={() => {
                  switchBusiness(b.id);
                  setSaid(`Now working in ${b.name}.`);
                }}
                accessibilityRole="button"
                accessibilityLabel={b.name}
                accessibilityState={{ selected: on }}
                style={({ pressed }) => [st.row, pressed && { backgroundColor: colors.sunken }]}
              >
                <View style={[st.mark, on && { backgroundColor: colors.brand }]}>
                  <T style={{ color: on ? "#fff" : colors.ink2, fontWeight: "800" }}>
                    {(b.name || "?").trim().charAt(0).toUpperCase()}
                  </T>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <T numberOfLines={1} style={{ fontWeight: on ? "750" : "600" }}>
                    {b.name}
                  </T>
                  <T variant="tiny" numberOfLines={1}>
                    {[b.city, b.gstin ? `GSTIN ${b.gstin}` : "no GSTIN"].filter(Boolean).join(" · ")}
                  </T>
                </View>
                {on ? <Icon name="check" size={20} color={colors.brand} /> : null}
              </Pressable>
            </View>
          );
        })}
      </Card>

      {said ? (
        <Note tone="good" style={{ marginTop: space(4) }}>
          {said}
        </Note>
      ) : null}

      <Button
        title="Add another shop"
        kind="primary"
        full
        icon="plus"
        style={{ marginTop: space(4) }}
        onPress={() => setAdding(true)}
      />

      <Button
        title="Edit this shop's details"
        full
        style={{ marginTop: space(3) }}
        onPress={() => router.push("/more/settings")}
      />

      <Note tone="info" style={{ marginTop: space(5) }}>
        Each shop keeps its own items, customers, bills and bill numbers. Nothing is shared between them,
        so a sale here can never turn up in another shop's return.
      </Note>

      <AddShop
        open={adding}
        onClose={() => setAdding(false)}
        onDone={(name) => {
          setAdding(false);
          setSaid(`${name} added, and you are now working in it.`);
        }}
        create={createBusiness}
      />
    </Screen>
  );
}

// ---------------------------------------------------------------------------
function AddShop({ open, onClose, onDone, create }) {
  const blank = { name: "", stateCode: "", city: "", gstin: "" };
  const [form, setForm] = useState(blank);
  const [picking, setPicking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const stateName = GST_STATES.find((s) => s.code === form.stateCode)?.name || "";

  async function save() {
    setErr(null);
    if (!form.name.trim()) {
      setErr("What is the shop called?");
      return;
    }
    if (!form.stateCode) {
      setErr("Which state? It decides whether a bill is CGST + SGST or IGST.");
      return;
    }
    setBusy(true);
    try {
      await create({
        name: form.name.trim(),
        stateCode: form.stateCode,
        ...(form.city.trim() ? { city: form.city.trim() } : {}),
        ...(form.gstin.trim() ? { gstin: form.gstin.trim().toUpperCase() } : {}),
      });
      const name = form.name.trim();
      setForm(blank);
      onDone?.(name);
    } catch (e) {
      setErr(e?.fields ? Object.values(e.fields).join(" ") : e?.message || "Could not add it.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={() => {
        setErr(null);
        onClose?.();
      }}
      title="Add a shop"
      footer={
        <Button
          title={busy ? "Adding…" : "Add it"}
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
        label="Shop name"
        required
        value={form.name}
        onChangeText={set("name")}
        placeholder="Mehra Mobile Repair"
        autoFocus
      />
      <PickerButton
        label="State"
        required
        value={stateName}
        placeholder="Choose a state"
        hint="This decides CGST + SGST against IGST on every bill."
        onPress={() => setPicking(true)}
        style={{ marginTop: space(4) }}
      />
      <Field label="City" value={form.city} onChangeText={set("city")} style={{ marginTop: space(4) }} />
      <Field
        label="GSTIN"
        value={form.gstin}
        onChangeText={(v) => set("gstin")(String(v).toUpperCase())}
        autoCapitalize="characters"
        hint="Leave it blank if this shop is not registered. Bills will print as Invoice rather than Tax Invoice."
        style={{ marginTop: space(4) }}
      />

      {err ? (
        <Note tone="bad" style={{ marginTop: space(4) }}>
          {err}
        </Note>
      ) : null}

      <Choose
        open={picking}
        onClose={() => setPicking(false)}
        title="State"
        options={GST_STATES.map((s) => ({ value: s.code, label: s.name, note: s.code }))}
        value={form.stateCode}
        onPick={set("stateCode")}
      />
    </Sheet>
  );
}

const st = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space(3),
    paddingHorizontal: space(4),
    paddingVertical: space(3.5),
  },
  mark: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.sunken,
    alignItems: "center",
    justifyContent: "center",
  },
});
