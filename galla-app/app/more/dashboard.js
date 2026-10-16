// ===========================================================================
// DASHBOARD
// ---------------------------------------------------------------------------
// The month at a glance. Home answers "what is happening today"; this answers
// "how is the shop doing", which is a different question and a different
// screen.
//
// Every figure here is worked out from bills the Bills screen would show, so
// the two can never disagree. Nothing is estimated and nothing is cached.
//
// The profit line is deliberately careful. It is sales less purchases less
// expenses over the period - a cash-flow figure, not an accountant's profit,
// because a proper one needs opening and closing stock valued at cost and
// this app does not ask a shopkeeper to do a stocktake every month. Calling
// it "money in less money out" is honest; calling it profit would not be.
// ===========================================================================

import { useCallback, useState } from "react";
import { Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Button, Card, CardHead, Divider, ErrorState, Loading, Note, Row, Screen, T } from "../../components/ui";
import { Icon } from "../../components/icons";
import {
  cashBankSummary,
  getInvoice,
  expensesByCategory,
  listAllInvoices,
  listAllItems,
  listAllParties,
} from "../../lib/data";
import { formatQty, rupees, rupeesShort } from "../../lib/money";
import { colors, radius, space } from "../../lib/theme";

// How many bills the "what sold best" card reads. The bill list does not
// carry its lines - one row per bill, which is what makes the list fast - so
// the only way to total by item is to fetch the bills themselves. Twenty-five
// is a real answer for most shops and a bounded cost on a phone; reading a
// year of bills one at a time would be hundreds of requests for a card.
const TOP_SAMPLE = 25;

const RANGES = [
  { value: "month", label: "This month" },
  { value: "30", label: "Last 30 days" },
  { value: "year", label: "This year" },
];

function rangeOf(which) {
  const d = new Date();
  const iso = (x) => x.toISOString().slice(0, 10);
  if (which === "30") {
    const from = new Date(d.getTime() - 29 * 86400000);
    return { from: iso(from), to: iso(d) };
  }
  if (which === "year") {
    // The Indian financial year, which is what every figure a shopkeeper is
    // asked for is measured against. April to March, not January.
    const y = d.getMonth() + 1 >= 4 ? d.getFullYear() : d.getFullYear() - 1;
    return { from: `${y}-04-01`, to: iso(d) };
  }
  return { from: `${iso(d).slice(0, 7)}-01`, to: iso(d) };
}

export default function Dashboard() {
  const router = useRouter();
  const [range, setRange] = useState("month");
  const [data, setData] = useState(null);
  const [state, setState] = useState({ loading: true, error: null });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { from, to } = rangeOf(range);
    try {
      // The cash and bank figure is allowed to fail on its own. A shop that
      // has not added a bank account should still see its sales, rather than
      // a whole blank screen because one of five calls was unhappy.
      const [bills, parties, items, spend, money] = await Promise.all([
        listAllInvoices({ from, to }),
        listAllParties(),
        listAllItems(),
        expensesByCategory({ from, to }).catch(() => null),
        cashBankSummary().catch(() => null),
      ]);

      const live = bills.rows.filter((b) => b.status !== "cancelled");
      const of = (type) => live.filter((b) => b.docType === type);

      const sum = (list, pick) => list.reduce((a, b) => a + pick(b), 0);
      const sales = sum(of("sale"), (b) => b.amounts.total);
      const returns = sum(of("credit_note"), (b) => b.amounts.total);
      const purchases = sum(of("purchase"), (b) => b.amounts.total);
      const spent = spend?.totalPaise ?? 0;

      // Day by day, for the bar chart. Built from the same bills, so a bar
      // and the headline can never tell different stories.
      const byDay = new Map();
      for (const b of of("sale")) {
        byDay.set(b.date, (byDay.get(b.date) || 0) + b.amounts.total);
      }
      const days = [];
      const end = new Date(to);
      for (let i = 13; i >= 0; i--) {
        const d = new Date(end.getTime() - i * 86400000).toISOString().slice(0, 10);
        days.push({ date: d, paise: byDay.get(d) || 0 });
      }

      setData({
        from,
        to,
        salesPaise: sales,
        returnsPaise: returns,
        netSalesPaise: sales - returns,
        purchasePaise: purchases,
        spentPaise: spent,
        leftPaise: sales - returns - purchases - spent,
        billCount: of("sale").length,
        owedToUsPaise: parties.rows.reduce((a, p) => a + Math.max(0, p.owesUs || 0), 0),
        weOwePaise: parties.rows.reduce((a, p) => a + Math.max(0, p.weOwe || 0), 0),
        unpaidPaise: sum(
          of("sale").filter((b) => b.amounts.balance > 0),
          (b) => b.amounts.balance
        ),
        stockValuePaise: items.rows.reduce((a, i) => a + (i.stockValuePaise || 0), 0),
        lowCount: items.rows.filter((i) => i.isLow || i.isOut).length,
        days,
        saleIds: of("sale")
          .slice(0, TOP_SAMPLE)
          .map((b) => b.id),
        money,
        capped: bills.capped,
      });
      setState({ loading: false, error: null });
    } catch (e) {
      setState({ loading: false, error: e });
    }
  }, [range]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (state.loading) return <Loading label="Adding it up" />;
  if (state.error) return <ErrorState error={state.error} onRetry={load} />;

  const peak = Math.max(1, ...data.days.map((d) => d.paise));

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
        />
      }
    >
      <Row style={{ gap: space(2), marginBottom: space(4) }}>
        {RANGES.map((r) => {
          const on = r.value === range;
          return (
            <Pressable
              key={r.value}
              onPress={() => setRange(r.value)}
              accessibilityRole="button"
              accessibilityLabel={r.label}
              accessibilityState={{ selected: on }}
              style={[st.tab, on && { backgroundColor: colors.brand, borderColor: colors.brand }]}
            >
              <T variant="tiny" style={{ fontWeight: "700", color: on ? "#fff" : colors.ink2 }}>
                {r.label}
              </T>
            </Pressable>
          );
        })}
      </Row>

      <Card>
        <T variant="label">Sales</T>
        <T num style={{ fontSize: 32, fontWeight: "800", marginTop: space(1) }}>
          {rupees(data.netSalesPaise)}
        </T>
        <T variant="tiny">
          {`${data.billCount} ${data.billCount === 1 ? "bill" : "bills"}${
            data.returnsPaise ? ` · ${rupees(data.returnsPaise)} returned` : ""
          }`}
        </T>

        {/* Fourteen bars. A month of them on a 360px phone is four pixels
            each, which is a texture rather than a chart. */}
        <View style={st.chart}>
          {data.days.map((d) => (
            <View key={d.date} style={st.col}>
              <View
                style={[
                  st.bar,
                  {
                    height: Math.max(2, Math.round((d.paise / peak) * 68)),
                    backgroundColor: d.paise ? colors.brand : colors.line,
                  },
                ]}
              />
            </View>
          ))}
        </View>
        <Row>
          <T variant="tiny" style={{ flex: 1 }}>
            {data.days[0].date.slice(8)} {monthShort(data.days[0].date)}
          </T>
          <T variant="tiny">{`peak ${rupeesShort(peak)}`}</T>
        </Row>
      </Card>

      <Row style={{ marginTop: space(4), gap: space(3) }}>
        <Tile label="Bought" paise={data.purchasePaise} icon="purchase" />
        <Tile label="Spent" paise={data.spentPaise} icon="wallet" />
      </Row>

      <Card style={{ marginTop: space(4) }}>
        <Row>
          <View style={{ flex: 1 }}>
            <T variant="label">Money in less money out</T>
            <T
              num
              style={{
                fontSize: 24,
                fontWeight: "800",
                color: data.leftPaise < 0 ? colors.danger : colors.ink,
              }}
            >
              {rupees(data.leftPaise)}
            </T>
          </View>
          <Icon name={data.leftPaise < 0 ? "loan" : "grow"} size={24} color={colors.brandInk} />
        </Row>
        <T variant="tiny" style={{ marginTop: space(2) }}>
          Sales less purchases less expenses. Not accounting profit — that needs a stock count at both
          ends of the period, which this does not ask you for.
        </T>
      </Card>

      <Row style={{ marginTop: space(4), gap: space(3) }}>
        <Pressable style={{ flex: 1 }} onPress={() => router.push("/parties")}>
          <Card>
            <T variant="label">People owe you</T>
            <T num style={{ fontSize: 20, fontWeight: "800" }}>
              {rupees(data.owedToUsPaise)}
            </T>
            <T variant="tiny">{`${rupees(data.unpaidPaise)} of it on this period's bills`}</T>
          </Card>
        </Pressable>
        <Pressable style={{ flex: 1 }} onPress={() => router.push("/parties")}>
          <Card>
            <T variant="label">You owe</T>
            <T num style={{ fontSize: 20, fontWeight: "800" }}>
              {rupees(data.weOwePaise)}
            </T>
            <T variant="tiny">to suppliers</T>
          </Card>
        </Pressable>
      </Row>

      {data.money ? (
        <Pressable onPress={() => router.push("/cashbank")} style={{ marginTop: space(4) }}>
          <Card>
            <Row>
              <View style={{ flex: 1 }}>
                <T variant="label">Cash and bank</T>
                <T num style={{ fontSize: 22, fontWeight: "800" }}>
                  {rupees(data.money.totalPaise)}
                </T>
                <T variant="tiny">
                  {`${rupees(data.money.cash.balancePaise)} in the drawer · ${rupees(
                    data.money.bankTotalPaise
                  )} in the bank`}
                </T>
              </View>
              <Icon name="chevron" size={18} color={colors.ink3} />
            </Row>
            {data.money.cheques.toReceivePaise > 0 ? (
              <T variant="tiny" style={{ marginTop: space(2), color: colors.warn }}>
                {`${rupees(data.money.cheques.toReceivePaise)} in cheques has not cleared, and is not counted above.`}
              </T>
            ) : null}
          </Card>
        </Pressable>
      ) : null}

      <Pressable onPress={() => router.push("/items")} style={{ marginTop: space(4) }}>
        <Card>
          <Row>
            <View style={{ flex: 1 }}>
              <T variant="label">Stock on the shelf</T>
              <T num style={{ fontSize: 22, fontWeight: "800" }}>
                {rupees(data.stockValuePaise)}
              </T>
              <T variant="tiny">
                {data.lowCount
                  ? `${data.lowCount} ${data.lowCount === 1 ? "item needs" : "items need"} reordering`
                  : "Nothing is running low"}
              </T>
            </View>
            <Icon name="chevron" size={18} color={colors.ink3} />
          </Row>
        </Card>
      </Pressable>

      <TopItems ids={data.saleIds} />

      {data.capped ? (
        <Note tone="warn" style={{ marginTop: space(4) }}>
          There are more bills in this period than the app reads at once, so these figures cover the most
          recent ones only. Pick a shorter period for an exact answer.
        </Note>
      ) : null}

      <T variant="tiny" style={{ textAlign: "center", marginTop: space(5) }}>
        {`${data.from} to ${data.to}`}
      </T>
    </Screen>
  );
}

function TopItems({ ids }) {
  const [rows, setRows] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  async function work() {
    setErr(null);
    setBusy(true);
    try {
      // Five at a time. All twenty-five at once is a burst a shop's
      // connection handles badly and the server has no reason to absorb.
      const bills = [];
      for (let i = 0; i < ids.length; i += 5) {
        const batch = await Promise.all(ids.slice(i, i + 5).map((id) => getInvoice(id)));
        bills.push(...batch);
      }

      const byItem = new Map();
      for (const b of bills) {
        for (const l of b.lines || []) {
          const key = l.itemId ?? l.name;
          const cur = byItem.get(key) || { name: l.name || "Item", qty: 0, paise: 0 };
          cur.qty += l.quantity || 0;
          cur.paise += l.amounts?.total ?? 0;
          byItem.set(key, cur);
        }
      }
      setRows([...byItem.values()].sort((a, b) => b.paise - a.paise).slice(0, 8));
    } catch (e) {
      setErr(e?.message || "Could not work that out.");
    } finally {
      setBusy(false);
    }
  }

  if (!ids.length) return null;

  return (
    <Card pad={false} style={{ marginTop: space(4) }}>
      <CardHead title="What is selling best" />
      {rows === null ? (
        <View style={{ padding: space(4), paddingTop: 0 }}>
          <T variant="tiny">
            {`Worked out from the ${Math.min(ids.length, TOP_SAMPLE)} most recent ${
              ids.length === 1 ? "bill" : "bills"
            }, by value rather than by count — twenty packets of chewing gum are not your best line.`}
          </T>
          <Button
            title={busy ? "Reading the bills…" : "Work it out"}
            kind="primary"
            full
            busy={busy}
            disabled={busy}
            onPress={work}
            style={{ marginTop: space(3) }}
          />
          {err ? (
            <Note tone="bad" style={{ marginTop: space(3) }}>
              {err}
            </Note>
          ) : null}
        </View>
      ) : rows.length === 0 ? (
        <View style={{ padding: space(4), paddingTop: 0 }}>
          <T variant="tiny">Nothing sold in this period.</T>
        </View>
      ) : (
        rows.map((t, i) => (
          <View key={String(t.name) + i}>
            {i ? <Divider /> : null}
            <Row style={st.row}>
              <T style={{ width: 20, color: colors.ink3, fontWeight: "700" }}>{i + 1}</T>
              <View style={{ flex: 1, minWidth: 0 }}>
                <T numberOfLines={1} style={{ fontWeight: "600" }}>
                  {t.name}
                </T>
                <T variant="tiny">{`${formatQty(t.qty)} sold`}</T>
              </View>
              <T num style={{ fontWeight: "700" }}>
                {rupees(t.paise)}
              </T>
            </Row>
          </View>
        ))
      )}
    </Card>
  );
}

function Tile({ label, paise, icon }) {
  return (
    <View style={{ flex: 1 }}>
      <Card>
        <Row gap={2}>
          <Icon name={icon} size={16} color={colors.ink2} />
          <T variant="label" style={{ flex: 1 }}>
            {label}
          </T>
        </Row>
        <T num style={{ fontSize: 20, fontWeight: "800", marginTop: space(1) }}>
          {rupees(paise)}
        </T>
      </Card>
    </View>
  );
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monthShort = (iso) => MONTHS[Number(String(iso).slice(5, 7)) - 1] || "";

const st = StyleSheet.create({
  tab: {
    paddingHorizontal: space(3),
    paddingVertical: space(2),
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.panel,
  },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 3,
    height: 72,
    marginTop: space(4),
    marginBottom: space(2),
  },
  col: { flex: 1, justifyContent: "flex-end", height: 72 },
  bar: { width: "100%", borderRadius: 3 },
  row: {
    paddingHorizontal: space(4),
    paddingVertical: space(3),
    gap: space(3),
  },
});
