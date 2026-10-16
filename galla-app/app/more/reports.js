// ===========================================================================
// WHAT THE PERIOD CAME TO
// ---------------------------------------------------------------------------
// Two different questions, and they are not the same screen for a reason.
//
// "How did the month go" is sales, outstanding, expenses - a shopkeeper's
// question, answered in rupees they recognise.
//
// "What do I file" is the GST return - taxable value and tax, rate by rate,
// with sales returns already subtracted, which is how it is filed. That part
// comes from the server, because the figures have to come off the bills
// themselves rather than be re-derived here.
// ===========================================================================

import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { Button, Card, CardHead, Divider, ErrorState, Loading, Note, Row, Screen, T } from "../../components/ui";
import { Choose, PickerButton } from "../../components/sheet";
import { expensesByCategory, gstReport, salesReport } from "../../lib/data";
import { formatDateLong, rupees, rupeesShort } from "../../lib/money";
import { colors, space } from "../../lib/theme";

// Ranges a shopkeeper actually asks for. "This month" is first because the
// return is monthly and that is what gets looked at most.
function ranges() {
  const now = new Date();
  const iso = (d) => d.toISOString().slice(0, 10);
  const firstOf = (y, m) => iso(new Date(Date.UTC(y, m, 1)));
  const lastOf = (y, m) => iso(new Date(Date.UTC(y, m + 1, 0)));
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();

  const back = (n) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - n);
    return iso(d);
  };

  return [
    { value: "month", label: "This month", from: firstOf(y, m), to: iso(now) },
    { value: "last", label: "Last month", from: firstOf(y, m - 1), to: lastOf(y, m - 1) },
    { value: "7", label: "Last 7 days", from: back(6), to: iso(now) },
    { value: "30", label: "Last 30 days", from: back(29), to: iso(now) },
  ];
}

const TYPE_LABEL = {
  sale: "Sales",
  purchase: "Purchases",
  estimate: "Estimates",
  credit_note: "Sales returns",
  debit_note: "Purchase returns",
};

export default function Reports() {
  const all = ranges();
  const [pick, setPick] = useState("month");
  const [picking, setPicking] = useState(false);

  const [sales, setSales] = useState(null);
  const [gst, setGst] = useState(null);
  const [gstMissing, setGstMissing] = useState(false);
  const [spend, setSpend] = useState(null);
  const [state, setState] = useState({ loading: true, error: null });

  const range = all.find((r) => r.value === pick) || all[0];

  const load = useCallback(async () => {
    setState((s) => ({ ...s, error: null }));
    setGstMissing(false);
    try {
      const args = { from: range.from, to: range.to };
      const [s, g, e] = await Promise.all([
        salesReport(args),
        // An older backend does not have this route yet. That costs the GST
        // section, not the whole screen.
        gstReport(args).catch((err) => {
          if (err?.isMissing) setGstMissing(true);
          return null;
        }),
        expensesByCategory(args).catch(() => null),
      ]);
      setSales(s);
      setGst(g);
      setSpend(e);
      setState({ loading: false, error: null });
    } catch (e) {
      setState({ loading: false, error: e });
    }
    // range is derived from pick; depending on pick keeps this stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pick]);

  useEffect(() => {
    load();
  }, [load]);

  if (state.error) return <ErrorState error={state.error} onRetry={load} />;
  if (state.loading || !sales) return <Loading label="Adding it up…" />;

  const sale = sales.byType.sale || { count: 0, total: 0, taxable: 0, tax: 0, outstanding: 0 };
  const purchase = sales.byType.purchase || { count: 0, total: 0 };
  const spent = spend?.totalPaise || 0;

  // Not profit. Profit needs the cost of what was sold, and a shop that has
  // not entered purchase prices does not have that. Calling this "profit"
  // would be a number people make decisions on, and it would be wrong.
  const takings = sale.total - (sales.byType.credit_note?.total || 0);

  return (
    <Screen>
      <Stack.Screen options={{ title: "Reports" }} />

      <PickerButton label="Period" value={range.label} onPress={() => setPicking(true)} />
      <T variant="tiny" style={{ marginTop: space(1) }}>
        {`${formatDateLong(range.from)} to ${formatDateLong(range.to)}`}
      </T>

      {sales.capped ? (
        <Note tone="warn" style={{ marginTop: space(4) }}>
          This period has more bills than the app reads in one go. The figures below cover the first thousand.
        </Note>
      ) : null}

      {/* ---- the shopkeeper's question ---- */}
      <Card style={{ marginTop: space(5) }}>
        <T variant="tiny">Sales</T>
        <T style={{ fontSize: 30, fontWeight: "800" }} num>
          {rupees(takings)}
        </T>
        <T variant="tiny">
          {`${sale.count} ${sale.count === 1 ? "bill" : "bills"}`}
          {sales.byType.credit_note ? ` · ${rupees(sales.byType.credit_note.total)} returned` : ""}
        </T>

        <Divider style={{ marginVertical: space(3.5) }} />

        <Row style={{ paddingVertical: 3 }}>
          <T variant="sub" style={{ flex: 1 }}>
            Still to collect
          </T>
          <T style={{ fontWeight: "700", color: sale.outstanding ? colors.danger : colors.ink }} num>
            {rupees(sale.outstanding)}
          </T>
        </Row>
        {purchase.count ? (
          <Row style={{ paddingVertical: 3 }}>
            <T variant="sub" style={{ flex: 1 }}>
              {`Bought in (${purchase.count})`}
            </T>
            <T num>{rupees(purchase.total)}</T>
          </Row>
        ) : null}
        <Row style={{ paddingVertical: 3 }}>
          <T variant="sub" style={{ flex: 1 }}>
            Expenses
          </T>
          <T num>{rupees(spent)}</T>
        </Row>
      </Card>

      {/* ---- the return ---- */}
      <Card style={{ marginTop: space(4) }}>
        <CardHead title="GST on these sales" />

        {gstMissing ? (
          <Note tone="info">
            Your server does not have the GST report yet. Run the small backend update and this fills in — nothing
            else on this screen is affected.
          </Note>
        ) : !gst || !gst.byRate.length ? (
          <T variant="sub">Nothing taxable in this period.</T>
        ) : (
          <>
            <Row style={{ paddingBottom: space(1.5) }}>
              <T variant="tiny" style={{ flex: 1 }}>
                RATE
              </T>
              <T variant="tiny" style={{ width: 96, textAlign: "right" }}>
                TAXABLE
              </T>
              <T variant="tiny" style={{ width: 82, textAlign: "right" }}>
                TAX
              </T>
            </Row>
            {gst.byRate.map((r) => (
              <View key={r.taxRate}>
                <Divider />
                <Row style={{ paddingVertical: space(2) }}>
                  <T style={{ flex: 1, fontWeight: "650" }}>{`${r.taxRate}%`}</T>
                  <T style={{ width: 96, textAlign: "right" }} num>
                    {rupeesShort(r.taxablePaise)}
                  </T>
                  <T style={{ width: 82, textAlign: "right", fontWeight: "700" }} num>
                    {rupeesShort(r.taxPaise)}
                  </T>
                </Row>
              </View>
            ))}

            <Divider style={{ marginTop: space(1) }} />
            <Row style={{ paddingTop: space(2.5) }}>
              <T style={{ flex: 1, fontWeight: "700" }}>Tax on your sales</T>
              <T style={{ fontSize: 18, fontWeight: "800" }} num>
                {rupees(gst.byRate.reduce((a, r) => a + r.taxPaise, 0))}
              </T>
            </Row>

            <Note tone="info" style={{ marginTop: space(4) }}>
              {`${gst.b2b.count} ${gst.b2b.count === 1 ? "bill" : "bills"} to customers with a GSTIN (filed one by one), ${
                gst.b2c.count
              } without (filed as one summary). Returns are already subtracted.`}
            </Note>
            <T variant="tiny" style={{ marginTop: space(2) }}>
              This is the tax you collected. What you can set off against it comes from your purchases, which your
              accountant will want the purchase bills for.
            </T>
          </>
        )}
      </Card>

      {/* ---- where the money went ---- */}
      {spend?.categories?.length ? (
        <Card style={{ marginTop: space(4) }}>
          <CardHead title="Where the money went" />
          {spend.categories
            .slice()
            .sort((a, b) => b.totalPaise - a.totalPaise)
            .slice(0, 8)
            .map((c, i) => (
              <View key={c.category || i}>
                {i ? <Divider style={{ marginVertical: space(1.5) }} /> : null}
                <Row style={{ paddingVertical: 2 }}>
                  <T style={{ flex: 1 }}>{c.category || "Other"}</T>
                  <T variant="tiny" style={{ marginRight: space(2) }}>
                    {`${c.count}×`}
                  </T>
                  <T style={{ fontWeight: "650" }} num>
                    {rupees(c.totalPaise)}
                  </T>
                </Row>
              </View>
            ))}
        </Card>
      ) : null}

      <Button title="Read it again" kind="ghost" full style={{ marginTop: space(5) }} onPress={load} />

      <Choose
        open={picking}
        onClose={() => setPicking(false)}
        title="Period"
        value={pick}
        options={all}
        onPick={setPick}
      />
    </Screen>
  );
}
