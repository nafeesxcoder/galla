// ===========================================================================
// WHAT IS IN THE SHOP
// ---------------------------------------------------------------------------
// Two jobs. Finding one item to check its price or fix its stock, and seeing
// at a glance what is about to run out - which is the thing a shopkeeper
// opens the app for on the way to the wholesaler.
//
// So "Running low" is a tab rather than a badge, and the stock figure is the
// loudest thing on each row.
// ===========================================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, TextInput, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Button, Card, Divider, ErrorState, Loading, Pill, Row, T } from "../../components/ui";
import { ItemQuickForm } from "../../components/forms";
import { Icon } from "../../components/icons";
import { listAllItems } from "../../lib/data";
import { formatQty, rupees, rupeesShort } from "../../lib/money";
import { unitShort } from "../../lib/units";
import { colors, radius, space, wide } from "../../lib/theme";

const TABS = [
  { value: "all", label: "Everything" },
  { value: "low", label: "Running low" },
  { value: "out", label: "Out of stock" },
  { value: "service", label: "Services" },
];

export default function Items() {
  const router = useRouter();

  const [rows, setRows] = useState([]);
  const [state, setState] = useState({ loading: true, error: null });
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, error: null }));
    try {
      const { rows: found } = await listAllItems();
      setRows(found);
      setState({ loading: false, error: null });
    } catch (e) {
      setState({ loading: false, error: e });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Stock changes every time a bill is made, so the numbers here are read
  // again whenever the tab comes back into view.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    let list = rows;
    if (tab === "low") list = list.filter((i) => i.isLow && !i.isOut);
    if (tab === "out") list = list.filter((i) => i.isOut);
    if (tab === "service") list = list.filter((i) => i.type === "service");
    if (term) {
      list = list.filter(
        (i) => i.name.toLowerCase().includes(term) || String(i.code).toLowerCase().includes(term)
      );
    }
    return list;
  }, [rows, tab, q]);

  const summary = useMemo(
    () => ({
      count: rows.length,
      value: rows.reduce((a, i) => a + i.stockValuePaise, 0),
      needs: rows.filter((i) => i.isLow || i.isOut).length,
    }),
    [rows]
  );

  if (state.error) return <ErrorState error={state.error} onRetry={load} />;
  if (state.loading) return <Loading label="Loading your items…" />;

  return (
    <View style={[{ flex: 1, backgroundColor: colors.bg }, wide]}>
      <View style={s.top}>
        <View style={s.search}>
          <Icon name="search" size={18} color={colors.ink3} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Item name or code"
            placeholderTextColor="#9aa6b2"
            style={s.searchInput}
            autoCorrect={false}
            autoCapitalize="none"
            accessibilityLabel="Search items"
          />
          <Pressable onPress={() => setAdding(true)} hitSlop={8} accessibilityLabel="Add an item">
            <Icon name="plus" size={22} color={colors.brand} />
          </Pressable>
        </View>

        <Row gap={2} style={{ marginTop: space(3) }}>
          {TABS.map((t) => (
            <Pressable
              key={t.value}
              onPress={() => setTab(t.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: tab === t.value }}
              accessibilityLabel={`Show ${t.label}`}
              style={[s.chip, tab === t.value && { backgroundColor: colors.brandSoft, borderColor: colors.brand }]}
            >
              <T style={{ fontSize: 12.5, fontWeight: "650", color: tab === t.value ? colors.brandInk : colors.ink2 }}>
                {t.label}
              </T>
            </Pressable>
          ))}
        </Row>
      </View>

      <FlatList
        data={shown}
        keyExtractor={(i) => String(i.id)}
        ItemSeparatorComponent={() => <Divider />}
        contentContainerStyle={{ paddingBottom: space(12) }}
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
          rows.length ? (
            <Row gap={3} style={{ padding: space(4), paddingBottom: space(2) }}>
              <Card style={{ flex: 1 }}>
                <T variant="tiny">Stock on hand</T>
                <T style={{ fontSize: 20, fontWeight: "800" }} num>
                  {rupeesShort(summary.value)}
                </T>
                <T variant="tiny">{`${summary.count} items`}</T>
              </Card>
              <Card style={{ flex: 1 }}>
                <T variant="tiny">Need attention</T>
                <T
                  style={{ fontSize: 20, fontWeight: "800", color: summary.needs ? colors.danger : colors.ink }}
                  num
                >
                  {String(summary.needs)}
                </T>
                <T variant="tiny">low or finished</T>
              </Card>
            </Row>
          ) : null
        }
        ListEmptyComponent={
          <View style={{ padding: space(8), alignItems: "center" }}>
            <Icon name="box" size={34} color={colors.ink3} />
            <T variant="h2" style={{ marginTop: space(2), textAlign: "center" }}>
              {q.trim()
                ? "Nothing by that name"
                : tab === "low"
                ? "Nothing is running low"
                : tab === "out"
                ? "Nothing has run out"
                : "No items yet"}
            </T>
            <T variant="sub" style={{ marginTop: space(1), textAlign: "center" }}>
              {tab === "all" && !q.trim()
                ? "Add what you sell. You can also add items while making a bill."
                : "Good news, as far as it goes."}
            </T>
            {tab === "all" ? (
              <Button
                title="Add an item"
                kind="primary"
                style={{ marginTop: space(4) }}
                icon={<Icon name="plus" size={18} color="#fff" />}
                onPress={() => setAdding(true)}
              />
            ) : null}
          </View>
        }
        renderItem={({ item: i }) => (
          <Pressable
            onPress={() => router.push(`/items/${i.id}`)}
            style={({ pressed }) => [s.row, pressed && { backgroundColor: colors.sunken }]}
          >
            <View style={{ flex: 1 }}>
              <T style={{ fontWeight: "650" }} numberOfLines={1}>
                {i.name}
              </T>
              <T variant="tiny">
                {rupees(i.salePaise)}
                {i.code ? ` · ${i.code}` : ""}
                {i.taxRate ? ` · ${i.taxRate}% GST` : ""}
                {i.trackBatches ? " · batches" : ""}
              </T>
            </View>

            {i.type === "service" ? (
              <Pill tone="info">Service</Pill>
            ) : (
              <View style={{ alignItems: "flex-end" }}>
                <T
                  style={{
                    fontWeight: "700",
                    color: i.isOut ? colors.danger : i.isLow ? colors.warn : colors.ink,
                  }}
                  num
                >
                  {`${formatQty(i.stock)} ${unitShort(i.unit)}`}
                </T>
                {i.isOut ? (
                  <T variant="tiny" style={{ color: colors.danger }}>
                    Out of stock
                  </T>
                ) : i.isLow ? (
                  <T variant="tiny" style={{ color: colors.warn }}>
                    Running low
                  </T>
                ) : null}
              </View>
            )}
            <Icon name="chevron" size={18} color={colors.ink3} />
          </Pressable>
        )}
      />

      <ItemQuickForm
        open={adding}
        initialName=""
        onClose={() => setAdding(false)}
        onSaved={(item) => {
          setAdding(false);
          load();
          if (item?.id) router.push(`/items/${item.id}`);
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
    paddingHorizontal: space(2.5),
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.panel,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space(3),
    paddingHorizontal: space(4),
    paddingVertical: space(3),
    backgroundColor: colors.panel,
  },
});
