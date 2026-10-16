// ===========================================================================
// THE FIRST SHOP
// ---------------------------------------------------------------------------
// Two things are actually needed: what the shop is called, and which state it
// is in. The state is not paperwork - it decides whether every bill this shop
// issues carries CGST + SGST or IGST, and getting it wrong means every bill
// is wrong. So it is compulsory, and the screen says why rather than leaving
// it looking like one more field.
// ===========================================================================

import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Button, Card, Field, Note, Screen, T } from "../components/ui";
import { useSession } from "../lib/session";
import { GST_STATES } from "../lib/gst-states";
import { colors, radius, space } from "../lib/theme";

export default function Setup() {
  const { createBusiness } = useSession();
  const router = useRouter();

  const [name, setName] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [city, setCity] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [picking, setPicking] = useState(false);

  const stateName = GST_STATES.find((s) => s.code === stateCode)?.name;

  async function save() {
    setErr(null);
    if (!name.trim()) return setErr("Your shop needs a name.");
    if (!stateCode) return setErr("Choose the state your shop is in.");

    setBusy(true);
    try {
      await createBusiness({
        name: name.trim(),
        stateCode,
        ...(city.trim() ? { city: city.trim() } : {}),
      });
      router.replace("/(tabs)");
    } catch (e) {
      setErr(e.isOffline ? "Could not reach the server." : e.message);
    } finally {
      setBusy(false);
    }
  }

  if (picking) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.bg }}>
        {GST_STATES.map((s) => (
          <Pressable
            key={s.code}
            onPress={() => {
              setStateCode(s.code);
              setPicking(false);
            }}
            style={({ pressed }) => [st.stateRow, pressed && { backgroundColor: colors.sunken }]}
          >
            <T>{s.name}</T>
            <T variant="sub">{s.code}</T>
          </Pressable>
        ))}
      </ScrollView>
    );
  }

  return (
    <Screen>
      <T variant="h1">Set up your shop</T>
      <T variant="sub" style={{ marginTop: space(1), marginBottom: space(5) }}>
        This takes a minute, and every bill after it is quick.
      </T>

      {err ? <Note tone="bad" style={{ marginBottom: space(4) }}>{err}</Note> : null}

      <Card>
        <Field
          label="Shop name"
          required
          value={name}
          onChangeText={setName}
          placeholder="Sharma Kirana"
          autoFocus
          maxLength={160}
        />

        <T variant="label" style={{ marginTop: space(4), marginBottom: space(1.5) }}>
          State <T style={{ color: colors.danger }}>*</T>
        </T>
        <Pressable onPress={() => setPicking(true)} style={st.picker}>
          <T style={{ color: stateName ? colors.ink : "#9aa6b2" }}>
            {stateName || "Choose your state"}
          </T>
        </Pressable>
        <T variant="tiny" style={{ marginTop: space(1) }}>
          This decides whether your bills carry CGST + SGST or IGST, so it has to be right.
        </T>

        <Field
          label="City"
          style={{ marginTop: space(4) }}
          value={city}
          onChangeText={setCity}
          placeholder="Noida"
        />
      </Card>

      <Button
        title="Start billing"
        kind="primary"
        size="lg"
        onPress={save}
        busy={busy}
        full
        style={{ marginTop: space(5) }}
      />

      <T variant="tiny" style={{ marginTop: space(4), textAlign: "center" }}>
        GSTIN, address and the rest can be added later from Settings.
      </T>
    </Screen>
  );
}

const st = StyleSheet.create({
  picker: {
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.sm,
    backgroundColor: colors.panel,
    paddingHorizontal: space(3),
    justifyContent: "center",
    minHeight: 44,
  },
  stateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: space(4),
    paddingVertical: space(4),
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.panel,
  },
});
