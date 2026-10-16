// ===========================================================================
// WHAT THE SHOP SPENT
// ---------------------------------------------------------------------------
// Rent, electricity, transport, staff, tea. Deliberately not a purchase: a
// purchase brings stock in and increases what a supplier is owed, an expense
// does neither. Mixing them is how a shop ends up thinking it has twelve
// thousand rupees of tea in stock.
//
// Categories are offered rather than demanded, because a shopkeeper who has
// to invent a taxonomy before recording the electricity bill records nothing.
// ===========================================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { Stack } from "expo-router";
import {
  Button,
  Card,
  Divider,
  ErrorState,
  Field,
  Loading,
  MoneyField,
  Note,
  Row,
  T,
} from "../../components/ui";
import { Choose, PickerButton, Sheet } from "../../components/sheet";
import { Icon } from "../../components/icons";
import { createExpense, listExpenses } from "../../lib/data";
import { relativeDay, rupees, rupeesShort, today, daysAgo } from "../../lib/money";
import { PAYMENT_MODES, modeLabel } from "../../lib/units";
import { colors, radius, space, wide } from "../../lib/theme";

const CATEGORIES = [
  "Rent",
  "Electricity",
  "Staff salary",
  "Transport",
  "Packing",
  "Phone and internet",
  "Repairs",
  "Tea and snacks",
  "Licence and fees",
  "Other",
];

const RANGES = [
  { value: 30, label: "Last 30 days" },
  { value: 7, label: "Last 7 days" },
  { value: 90, label: "Last 3 months" },
  { value: 365, label: "This year" },
];

export default function Expenses() {
  const [rows, setRows] = useState([]);
  const [state, setState] = useState({ loading: true, error: null });
  const [refreshing, setRefreshing] = useState(false);
  const [range, setRange] = useState(30);
  const [picking, setPicking] = useState(false);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, error: null }));
    try {
      const { rows: found } = await listExpenses({ from: daysAgo(range), to: today(), limit: 200 });
      setRows(found);
      setState({ loading: false, error: null });
    } catch (e) {
      setState({ loading: false, error: e });
    }
  }, [range]);

  useEffect(() => {
    load();
  }, [load]);

  const summary = useMemo(() => {
    const total = rows.reduce((a, r) => a + r.totalPaise, 0);
    const byCat = new Map();
    for (const r of rows) {
      const key = r.category || "Other";
      byCat.set(key, (byCat.get(key) || 0) + r.totalPaise);
    }
    return {
      total,
      top: [...byCat.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4),
    };
  }, [rows]);

  if (state.error) return <ErrorState error={state.error} onRetry={load} />;
  if (state.loading) return <Loading label="Loading your expenses…" />;

  return (
    <View style={[{ flex: 1, backgroundColor: colors.bg }, wide]}>
      <Stack.Screen options={{ title: "Expenses" }} />

      <FlatList
        data={rows}
        keyExtractor={(r) => String(r.id)}
        ItemSeparatorComponent={() => <Divider />}
        contentContainerStyle={{ paddingBottom: space(24) }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
            tintColor={colors.brand}
          />
        }
        ListHeaderComponent={
          <View style={{ padding: space(4) }}>
            <PickerButton
              label="Showing"
              value={RANGES.find((r) => r.value === range)?.label}
              onPress={() => setPicking(true)}
            />

            <Card style={{ marginTop: space(4) }}>
              <T variant="tiny">Spent in this period</T>
              <T style={{ fontSize: 28, fontWeight: "800" }} num>
                {rupees(summary.total)}
              </T>
              {summary.top.length ? (
                <View style={{ marginTop: space(3) }}>
                  {summary.top.map(([cat, paise]) => (
                    <Row key={cat} style={{ paddingVertical: 3 }}>
                      <T variant="sub" style={{ flex: 1 }}>
                        {cat}
                      </T>
                      <T num>{rupeesShort(paise)}</T>
                    </Row>
                  ))}
                </View>
              ) : null}
            </Card>
          </View>
        }
        ListEmptyComponent={
          <View style={{ padding: space(8), alignItems: "center" }}>
            <Icon name="wallet" size={34} color={colors.ink3} />
            <T variant="h2" style={{ marginTop: space(2), textAlign: "center" }}>
              Nothing recorded yet
            </T>
            <T variant="sub" style={{ marginTop: space(1), textAlign: "center" }}>
              Rent, electricity, transport. Without these the profit figure is only half the story.
            </T>
          </View>
        }
        renderItem={({ item: r }) => (
          <Row style={st.row}>
            <View style={{ flex: 1 }}>
              <T style={{ fontWeight: "650" }}>{r.category || "Other"}</T>
              <T variant="tiny">
                {relativeDay(r.date)} {"·"} {modeLabel(r.mode)}
                {r.notes ? ` · ${r.notes}` : ""}
              </T>
            </View>
            <T style={{ fontWeight: "700" }} num>
              {rupees(r.totalPaise)}
            </T>
          </Row>
        )}
      />

      <View style={st.bar}>
        <Button
          title="Record an expense"
          kind="primary"
          size="lg"
          full
          icon={<Icon name="plus" size={19} color="#fff" />}
          onPress={() => setAdding(true)}
        />
      </View>

      <Choose
        open={picking}
        onClose={() => setPicking(false)}
        title="Showing"
        value={range}
        options={RANGES}
        onPick={setRange}
      />

      <ExpenseSheet
        open={adding}
        onClose={() => setAdding(false)}
        onDone={async () => {
          setAdding(false);
          await load();
        }}
      />
    </View>
  );
}

function ExpenseSheet({ open, onClose, onDone }) {
  const [form, setForm] = useState(blank);
  const [picking, setPicking] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (open) {
      setForm(blank());
      setErr(null);
    }
  }, [open]);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    setErr(null);
    if (!form.category.trim()) return setErr("Pick what it was spent on.");
    if (!form.amount || Number(form.amount) <= 0) return setErr("Enter the amount.");
    setBusy(true);
    try {
      await createExpense(form);
      onDone();
    } catch (e) {
      setErr(e.isOffline ? "Could not reach the server. Nothing was recorded." : e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Record an expense"
      subtitle="Money that went out, not stock that came in"
      footer={<Button title="Save it" kind="primary" size="lg" full busy={busy} onPress={save} />}
    >
      {err ? <Note tone="bad" style={{ marginBottom: space(4) }}>{err}</Note> : null}

      <Card>
        <PickerButton
          label="What for"
          required
          value={form.category}
          placeholder="Choose one"
          onPress={() => setPicking("category")}
        />

        <Row gap={3} style={{ marginTop: space(4), alignItems: "flex-start" }}>
          <MoneyField
            label="Amount"
            required
            style={{ flex: 1 }}
            value={form.amount}
            onChangeText={(v) => set("amount")(v.replace(/[^\d.]/g, ""))}
            autoFocus
          />
          <PickerButton
            label="Paid by"
            style={{ flex: 1 }}
            value={modeLabel(form.mode)}
            onPress={() => setPicking("mode")}
          />
        </Row>

        <Field
          label="GST on it"
          style={{ marginTop: space(4) }}
          value={String(form.taxRate)}
          onChangeText={(v) => set("taxRate")(v.replace(/[^\d.]/g, ""))}
          keyboardType="decimal-pad"
          inputMode="decimal"
          placeholder="0"
          hint="Only if the bill shows GST you can claim. Leave as 0 otherwise."
        />

        <Field
          label="Note"
          style={{ marginTop: space(4) }}
          value={form.notes}
          onChangeText={set("notes")}
          placeholder="October electricity"
          maxLength={200}
        />
      </Card>

      <Choose
        open={picking === "category"}
        onClose={() => setPicking(null)}
        title="What was it for?"
        value={form.category}
        options={CATEGORIES.map((c) => ({ value: c, label: c }))}
        onPick={set("category")}
      />
      <Choose
        open={picking === "mode"}
        onClose={() => setPicking(null)}
        title="How was it paid?"
        value={form.mode}
        options={PAYMENT_MODES}
        onPick={set("mode")}
      />
    </Sheet>
  );
}

function blank() {
  return { category: "", amount: "", taxRate: 0, mode: "cash", date: today(), notes: "" };
}

const st = StyleSheet.create({
  row: {
    paddingHorizontal: space(4),
    paddingVertical: space(3),
    backgroundColor: colors.panel,
  },
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: space(4),
    backgroundColor: colors.panel,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
});
