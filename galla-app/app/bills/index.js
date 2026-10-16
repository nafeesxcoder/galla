// ===========================================================================
// EVERY BILL
// ---------------------------------------------------------------------------
// What this screen is actually for is finding one bill: the customer is on
// the phone asking about something from last Tuesday. So search runs over the
// bill number and the customer's name, the date is on every row, and the
// unpaid ones are one tap away - because the other reason anybody opens this
// list is to work out who still owes money.
// ===========================================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, TextInput, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Divider, ErrorState, Loading, Note, Pill, Row, T } from "../../components/ui";
import { Icon } from "../../components/icons";
import { listAllInvoices } from "../../lib/data";
import { relativeDay, rupees } from "../../lib/money";
import { colors, radius, space, wide } from "../../lib/theme";
import { DOC_LABEL, billTone } from "../../lib/bill-status";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "unpaid", label: "Unpaid" },
  { value: "sale", label: "Sales" },
  { value: "purchase", label: "Purchases" },
  { value: "estimate", label: "Estimates" },
];

export default function Bills() {
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [state, setState] = useState({ loading: true, error: null });
  const [refreshing, setRefreshing] = useState(false);
  // Same reasoning as the billing screen: the menu links here already
  // filtered ("all purchase bills"), and the initial state is read from the
  // link rather than forced by an effect that would undo every tap.
  const params = useLocalSearchParams();
  const [filter, setFilter] = useState(() => {
    const wanted = String(params?.filter || "");
    return ["all", "unpaid", "sale", "purchase", "estimate"].includes(wanted) ? wanted : "all";
  });
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setState((s) => ({ ...s, error: null }));
    try {
      const { rows: found } = await listAllInvoices();
      setRows(found);
      setState({ loading: false, error: null });
    } catch (e) {
      setState({ loading: false, error: e });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((b) => {
      if (filter === "unpaid" && (b.amounts.balance <= 0 || b.status === "cancelled")) return false;
      if (["sale", "purchase", "estimate"].includes(filter) && b.docType !== filter) return false;
      if (!term) return true;
      return (b.number || "").toLowerCase().includes(term) || (b.partyName || "").toLowerCase().includes(term);
    });
  }, [rows, filter, q]);

  const owed = useMemo(
    () => shown.reduce((a, b) => a + (b.status === "cancelled" ? 0 : b.amounts.balance), 0),
    [shown]
  );

  if (state.error) return <ErrorState error={state.error} onRetry={load} />;
  if (state.loading) return <Loading label="Loading your bills…" />;

  return (
    <View style={[{ flex: 1, backgroundColor: colors.bg }, wide]}>
      <Stack.Screen options={{ title: "Bills" }} />

      <View style={s.top}>
        <View style={s.search}>
          <Icon name="search" size={18} color={colors.ink3} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Bill number or customer"
            placeholderTextColor="#9aa6b2"
            style={s.searchInput}
            autoCorrect={false}
            accessibilityLabel="Search bills"
          />
        </View>

        <FlatList
          horizontal
          data={FILTERS}
          keyExtractor={(f) => f.value}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: space(2), paddingTop: space(3) }}
          renderItem={({ item: f }) => (
            <Pressable
              onPress={() => setFilter(f.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: filter === f.value }}
              accessibilityLabel={`Show ${f.label}`}
              style={[s.chip, filter === f.value && { backgroundColor: colors.brandSoft, borderColor: colors.brand }]}
            >
              <T style={{ fontSize: 13.5, fontWeight: "650", color: filter === f.value ? colors.brandInk : colors.ink2 }}>
                {f.label}
              </T>
            </Pressable>
          )}
        />
      </View>

      <FlatList
        data={shown}
        keyExtractor={(b) => String(b.id)}
        ItemSeparatorComponent={() => <Divider />}
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
          owed > 0 ? (
            <Note tone="warn" style={{ margin: space(4), marginBottom: 0 }}>
              {`${rupees(owed)} still to collect across ${shown.filter((b) => b.amounts.balance > 0).length} bills.`}
            </Note>
          ) : null
        }
        ListEmptyComponent={
          <View style={{ padding: space(8), alignItems: "center" }}>
            <T variant="sub">{q.trim() ? "No bill by that name or number." : "Nothing here yet."}</T>
          </View>
        }
        contentContainerStyle={{ paddingBottom: space(10) }}
        renderItem={({ item: b }) => {
          const { tone, label } = billTone(b);
          return (
            <Pressable
              onPress={() => router.push(`/bills/${b.id}`)}
              style={({ pressed }) => [s.row, pressed && { backgroundColor: colors.sunken }]}
            >
              <View style={{ flex: 1 }}>
                <Row gap={2}>
                  <T style={{ fontWeight: "650" }}>{b.number}</T>
                  <Pill tone={tone}>{label}</Pill>
                </Row>
                <T variant="tiny" style={{ marginTop: 2 }}>
                  {b.partyName || "Walk-in"} {"·"} {relativeDay(b.date)}
                  {b.docType !== "sale" ? ` · ${DOC_LABEL[b.docType] || b.docType}` : ""}
                </T>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <T style={{ fontWeight: "700" }} num>
                  {rupees(b.amounts.total)}
                </T>
                {b.amounts.balance > 0 && b.status !== "cancelled" ? (
                  <T variant="tiny" style={{ color: colors.danger }} num>
                    {`${rupees(b.amounts.balance)} due`}
                  </T>
                ) : null}
              </View>
              <Icon name="chevron" size={18} color={colors.ink3} />
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  top: {
    paddingHorizontal: space(4),
    paddingTop: space(3),
    paddingBottom: space(3),
    backgroundColor: colors.panel,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: space(2),
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.sm,
    paddingHorizontal: space(3),
    minHeight: 44,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    outlineStyle: "none",
    fontSize: 16,
    color: colors.ink,
    paddingVertical: space(2.5),
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.pill,
    paddingHorizontal: space(3),
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.panel,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space(3),
    paddingHorizontal: space(4),
    paddingVertical: space(3.5),
    backgroundColor: colors.panel,
  },
});
