// ===========================================================================
// CUSTOMERS AND SUPPLIERS
// ---------------------------------------------------------------------------
// The question this screen answers is "who owes me money", so that is what it
// is sorted by. Names nobody owes anything on sink to the bottom, where they
// belong until somebody searches for them.
//
// Phone numbers are searchable because at a counter the number is often the
// only thing anybody remembers about a customer.
// ===========================================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, TextInput, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Button, Card, Divider, ErrorState, Loading, Row, T } from "../../components/ui";
import { PartyQuickForm } from "../../components/forms";
import { Icon } from "../../components/icons";
import { useSession } from "../../lib/session";
import { listAllParties } from "../../lib/data";
import { rupees, rupeesShort } from "../../lib/money";
import { colors, radius, space, wide } from "../../lib/theme";

const TABS = [
  { value: "owing", label: "Owes you" },
  { value: "customers", label: "Customers" },
  { value: "suppliers", label: "Suppliers" },
  { value: "all", label: "Everyone" },
];

export default function Parties() {
  const router = useRouter();
  const { shop } = useSession();

  const [rows, setRows] = useState([]);
  const [state, setState] = useState({ loading: true, error: null });
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState("owing");
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, error: null }));
    try {
      const { rows: found } = await listAllParties();
      setRows(found);
      setState({ loading: false, error: null });
    } catch (e) {
      setState({ loading: false, error: e });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Coming back from a party's own screen after taking a payment: the
  // balances here are now wrong, so they are read again.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    let list = rows;
    if (tab === "owing") list = list.filter((p) => p.owesUs > 0 || p.weOwe > 0);
    if (tab === "customers") list = list.filter((p) => p.isCustomer);
    if (tab === "suppliers") list = list.filter((p) => p.isSupplier);
    if (term) {
      list = list.filter(
        (p) => p.name.toLowerCase().includes(term) || String(p.phone).includes(term)
      );
    }
    // Biggest debt first; everyone else alphabetically underneath.
    return [...list].sort((a, b) => b.balancePaise - a.balancePaise || a.name.localeCompare(b.name));
  }, [rows, tab, q]);

  const totals = useMemo(
    () => ({
      toCollect: rows.reduce((a, p) => a + p.owesUs, 0),
      toPay: rows.reduce((a, p) => a + p.weOwe, 0),
    }),
    [rows]
  );

  if (state.error) return <ErrorState error={state.error} onRetry={load} />;
  if (state.loading) return <Loading label="Loading your customers…" />;

  return (
    <View style={[{ flex: 1, backgroundColor: colors.bg }, wide]}>
      <View style={s.top}>
        <View style={s.search}>
          <Icon name="search" size={18} color={colors.ink3} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Name or phone number"
            placeholderTextColor="#9aa6b2"
            style={s.searchInput}
            autoCorrect={false}
            accessibilityLabel="Search customers"
          />
          <Pressable onPress={() => setAdding(true)} hitSlop={8} accessibilityLabel="Add a customer">
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
              <T style={{ fontSize: 13, fontWeight: "650", color: tab === t.value ? colors.brandInk : colors.ink2 }}>
                {t.label}
              </T>
            </Pressable>
          ))}
        </Row>
      </View>

      <FlatList
        data={shown}
        keyExtractor={(p) => String(p.id)}
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
          totals.toCollect || totals.toPay ? (
            <Row gap={3} style={{ padding: space(4), paddingBottom: space(2) }}>
              <Card style={{ flex: 1 }}>
                <T variant="tiny">To collect</T>
                <T style={{ fontSize: 20, fontWeight: "800", color: colors.danger }} num>
                  {rupeesShort(totals.toCollect)}
                </T>
              </Card>
              <Card style={{ flex: 1 }}>
                <T variant="tiny">You owe</T>
                <T style={{ fontSize: 20, fontWeight: "800" }} num>
                  {rupeesShort(totals.toPay)}
                </T>
              </Card>
            </Row>
          ) : null
        }
        ListEmptyComponent={
          <View style={{ padding: space(8), alignItems: "center" }}>
            <Icon name="users" size={34} color={colors.ink3} />
            <T variant="h2" style={{ marginTop: space(2), textAlign: "center" }}>
              {q.trim() ? "Nobody by that name" : tab === "owing" ? "Nobody owes you anything" : "No one saved yet"}
            </T>
            <T variant="sub" style={{ marginTop: space(1), textAlign: "center" }}>
              {tab === "owing" ? "That is the way it should be." : "Add them as you go — a name and a number is enough."}
            </T>
            <Button
              title="Add a customer"
              kind="primary"
              style={{ marginTop: space(4) }}
              icon={<Icon name="plus" size={18} color="#fff" />}
              onPress={() => setAdding(true)}
            />
          </View>
        }
        renderItem={({ item: p }) => (
          <Pressable
            onPress={() => router.push(`/parties/${p.id}`)}
            style={({ pressed }) => [s.row, pressed && { backgroundColor: colors.sunken }]}
          >
            <View style={s.avatar}>
              <T style={{ fontWeight: "700", color: colors.brandInk }}>
                {(p.name || "?").trim().charAt(0).toUpperCase()}
              </T>
            </View>
            <View style={{ flex: 1 }}>
              <T style={{ fontWeight: "650" }} numberOfLines={1}>
                {p.name}
              </T>
              <T variant="tiny">
                {p.phone || "No number"}
                {p.isSupplier && !p.isCustomer ? " · supplier" : ""}
              </T>
            </View>
            {p.owesUs ? (
              <View style={{ alignItems: "flex-end" }}>
                <T style={{ fontWeight: "700", color: colors.danger }} num>
                  {rupees(p.owesUs)}
                </T>
                <T variant="tiny">owes you</T>
              </View>
            ) : p.weOwe ? (
              <View style={{ alignItems: "flex-end" }}>
                <T style={{ fontWeight: "700" }} num>
                  {rupees(p.weOwe)}
                </T>
                <T variant="tiny">you owe</T>
              </View>
            ) : (
              <T variant="tiny">Settled</T>
            )}
            <Icon name="chevron" size={18} color={colors.ink3} />
          </Pressable>
        )}
      />

      <PartyQuickForm
        open={adding}
        initialName=""
        stateCode={shop?.stateCode || ""}
        onClose={() => setAdding(false)}
        onSaved={(p) => {
          setAdding(false);
          load();
          if (p?.id) router.push(`/parties/${p.id}`);
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
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: colors.brandSoft,
    alignItems: "center",
    justifyContent: "center",
  },
});
