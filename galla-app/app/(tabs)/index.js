// ===========================================================================
// HOME
// ---------------------------------------------------------------------------
// What a shopkeeper wants on opening the app: what sold today, what came in,
// who still owes, what is running out. Four numbers and two short lists, then
// out of the way.
//
// Pull down to refresh, because that is the gesture people already try.
// ===========================================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, RefreshControl, View } from "react-native";
import { useRouter } from "expo-router";
import { Button, Card, CardHead, Divider, Empty, ErrorState, Loading, Pill, Row, Screen, T } from "../../components/ui";
import { Icon } from "../../components/icons";
import PlanBanner from "../../components/plan-banner";
import { useSession } from "../../lib/session";
import { listInvoices, listAllItems, listAllParties, expiringBatches } from "../../lib/data";
import { rupees, rupeesShort, formatQty, relativeDay, today } from "../../lib/money";
import { unitShort } from "../../lib/units";
import { colors, space } from "../../lib/theme";

export default function Home() {
  const { shop, user, businessId } = useSession();
  const router = useRouter();

  const [state, setState] = useState({ loading: true, error: null });
  const [bills, setBills] = useState([]);
  const [items, setItems] = useState([]);
  const [parties, setParties] = useState([]);
  const [expiring, setExpiring] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, error: null }));
    try {
      const [inv, itm, prt, exp] = await Promise.all([
        listInvoices({ docType: "sale", limit: 40 }),
        listAllItems(),
        listAllParties(),
        expiringBatches({ days: 30 }).catch(() => []),
      ]);
      setBills(inv.rows);
      setItems(itm.rows);
      setParties(prt.rows);
      setExpiring(exp);
      setState({ loading: false, error: null });
    } catch (e) {
      setState({ loading: false, error: e });
    }
  }, []);

  useEffect(() => {
    if (businessId) load();
  }, [businessId, load]);

  const stats = useMemo(() => {
    const t = today();
    const live = bills.filter((b) => b.status !== "cancelled");
    const todays = live.filter((b) => b.date === t);
    return {
      sales: todays.reduce((a, b) => a + b.amounts.total, 0),
      count: todays.length,
      received: todays.reduce((a, b) => a + b.amounts.paid, 0),
      toCollect: parties.reduce((a, p) => a + p.owesUs, 0),
      low: items.filter((i) => i.type !== "service" && (i.isLow || i.isOut)).slice(0, 5),
      recent: live.slice(0, 5),
    };
  }, [bills, items, parties]);

  if (state.error) return <ErrorState error={state.error} onRetry={load} />;
  if (state.loading) return <Loading label="Loading your shop…" />;

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = (user?.name || "").split(" ")[0];

  return (
    <Screen
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
    >
      <T variant="h1">
        {greet}
        {firstName ? `, ${firstName}` : ""}
      </T>
      <T variant="sub" style={{ marginTop: 2, marginBottom: space(5) }}>
        {shop?.name}
      </T>

      {/* Nothing is drawn unless the plan is near its end, so this is
          invisible on almost every morning. */}
      <PlanBanner />

      {/* ---- the four numbers ---- */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space(3) }}>
        {/* Today's takings open the month. This screen answers "what is
            happening today"; the dashboard answers "how is the shop doing",
            and the tile people tap first is the natural way in. */}
        <Tile
          label="Sales today"
          value={rupeesShort(stats.sales)}
          note={`${stats.count} ${stats.count === 1 ? "bill" : "bills"}`}
          onPress={() => router.push("/more/dashboard")}
        />
        <Tile label="Received today" value={rupeesShort(stats.received)} tone="good" />
        <Tile
          label="To collect"
          value={rupeesShort(stats.toCollect)}
          tone={stats.toCollect ? "bad" : undefined}
          onPress={() => router.push("/(tabs)/parties")}
        />
        <Tile label="Items" value={String(items.length)} note={`${stats.low.length} need attention`} onPress={() => router.push("/(tabs)/items")} />
      </View>

      <Button
        title="New bill"
        kind="primary"
        size="lg"
        full
        icon={<Icon name="plus" color="#fff" size={20} />}
        onPress={() => router.push("/(tabs)/billing")}
        style={{ marginTop: space(5) }}
      />

      {/* ---- expiring, only for shops that track batches ---- */}
      {expiring.length ? (
        <Card style={{ marginTop: space(5) }}>
          <CardHead title="Expiring soon" />
          {expiring.slice(0, 5).map((b, i) => (
            <View key={b.id}>
              {i ? <Divider style={{ marginVertical: space(2.5) }} /> : null}
              <Row>
                <View style={{ flex: 1 }}>
                  <T style={{ fontWeight: "600" }}>{b.itemName}</T>
                  <T variant="tiny">{b.batchNo}</T>
                </View>
                <Pill tone={b.expired ? "unpaid" : "partial"}>
                  {b.expired ? "Expired" : b.expiryDate}
                </Pill>
                <T variant="sub" num>
                  {formatQty(b.quantity)} {unitShort(b.unit)}
                </T>
              </Row>
            </View>
          ))}
        </Card>
      ) : null}

      {/* ---- recent bills ---- */}
      <Card style={{ marginTop: space(5) }}>
        <CardHead
          title="Recent bills"
          right={<Button title="All" kind="ghost" size="sm" onPress={() => router.push("/bills")} />}
        />
        {stats.recent.length ? (
          stats.recent.map((b, i) => (
            <Pressable key={b.id} onPress={() => router.push(`/bills/${b.id}`)}>
              {i ? <Divider style={{ marginVertical: space(2.5) }} /> : null}
              <Row>
                <View style={{ flex: 1 }}>
                  <T style={{ fontWeight: "600" }}>{b.number}</T>
                  <T variant="tiny">
                    {b.partyName || "Walk-in"} {"·"} {relativeDay(b.date)}
                  </T>
                </View>
                <T style={{ fontWeight: "700" }} num>
                  {rupees(b.amounts.total)}
                </T>
              </Row>
            </Pressable>
          ))
        ) : (
          <Empty title="No bills yet" body="The first one takes about thirty seconds." />
        )}
      </Card>

      {/* ---- running low ---- */}
      {stats.low.length ? (
        <Card style={{ marginTop: space(5) }}>
          <CardHead title="Running low" />
          {stats.low.map((i, n) => (
            <View key={i.id}>
              {n ? <Divider style={{ marginVertical: space(2.5) }} /> : null}
              <Row>
                <T style={{ flex: 1 }}>{i.name}</T>
                <Pill tone={i.isOut ? "unpaid" : "partial"}>{i.isOut ? "Out of stock" : "Low"}</Pill>
                <T variant="sub" num>
                  {formatQty(i.stock)} {unitShort(i.unit)}
                </T>
              </Row>
            </View>
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}

function Tile({ label, value, note, tone, onPress }) {
  const colour = tone === "good" ? colors.brandInk : tone === "bad" ? colors.danger : colors.ink;
  const body = (
    <Card style={{ flexGrow: 1, flexBasis: "46%", padding: space(3.5) }} pad={false}>
      <View style={{ padding: space(3.5) }}>
        <T variant="tiny">{label}</T>
        <T style={{ fontSize: 22, fontWeight: "700", color: colour, marginTop: 4 }} num>
          {value}
        </T>
        {note ? <T variant="tiny">{note}</T> : null}
      </View>
    </Card>
  );
  return onPress ? <Pressable onPress={onPress} style={{ flexGrow: 1, flexBasis: "46%" }}>{body}</Pressable> : body;
}
