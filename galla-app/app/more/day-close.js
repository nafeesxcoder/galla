// ===========================================================================
// COUNTING THE DRAWER
// ---------------------------------------------------------------------------
// The last thing a shop does. The app knows what cash it thinks came in; the
// shopkeeper counts what is actually there. The difference is the whole point
// of the screen, and it is shown plainly rather than hidden - a shop that is
// forty rupees short every evening has something to find out.
//
// Nothing here is saved to the server. It is a reckoning, not a record: the
// payments already are the record.
// ===========================================================================

import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { Button, Card, CardHead, Divider, ErrorState, Field, Loading, Note, Row, Screen, T } from "../../components/ui";
import { Choose, PickerButton } from "../../components/sheet";
import { dayClose } from "../../lib/data";
import { formatDateLong, rupees, today, toPaise } from "../../lib/money";
import { modeLabel } from "../../lib/units";
import { colors, space } from "../../lib/theme";

export default function DayClose() {
  const [date, setDate] = useState(() => today());
  const [data, setData] = useState(null);
  const [state, setState] = useState({ loading: true, error: null });
  const [counted, setCounted] = useState("");
  const [picking, setPicking] = useState(false);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, error: null }));
    try {
      setData(await dayClose(date));
      setState({ loading: false, error: null });
    } catch (e) {
      setState({ loading: false, error: e });
    }
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  if (state.error) return <ErrorState error={state.error} onRetry={load} />;
  if (state.loading || !data) return <Loading label="Adding up the day…" />;

  const cashIn = data.in.find((r) => r.mode === "cash")?.paise || 0;
  const cashOut = data.out.find((r) => r.mode === "cash")?.paise || 0;
  const expectedCash = cashIn - cashOut;
  const countedPaise = counted === "" ? null : toPaise(counted);
  const diff = countedPaise === null ? null : countedPaise - expectedCash;

  const days = [0, 1, 2, 3, 4, 5, 6].map((n) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    const value = d.toISOString().slice(0, 10);
    return { value, label: n === 0 ? "Today" : n === 1 ? "Yesterday" : formatDateLong(value) };
  });

  return (
    <Screen>
      <Stack.Screen options={{ title: "Day close" }} />

      <PickerButton
        label="Which day"
        value={days.find((d) => d.value === date)?.label || formatDateLong(date)}
        onPress={() => setPicking(true)}
      />

      {/* ---- the cash reckoning, which is the reason anybody opens this ---- */}
      <Card style={{ marginTop: space(5) }}>
        <CardHead title="Cash in the drawer" />

        <Row style={{ paddingVertical: 3 }}>
          <T variant="sub" style={{ flex: 1 }}>
            Cash taken in
          </T>
          <T num>{rupees(cashIn)}</T>
        </Row>
        {cashOut ? (
          <Row style={{ paddingVertical: 3 }}>
            <T variant="sub" style={{ flex: 1 }}>
              Cash paid out
            </T>
            <T num>- {rupees(cashOut)}</T>
          </Row>
        ) : null}
        <Divider style={{ marginVertical: space(2) }} />
        <Row>
          <T style={{ flex: 1, fontWeight: "650" }}>The app expects</T>
          <T style={{ fontSize: 20, fontWeight: "800" }} num>
            {rupees(expectedCash)}
          </T>
        </Row>

        <Field
          label="What you actually counted"
          style={{ marginTop: space(4) }}
          prefix="₹"
          value={counted}
          onChangeText={(v) => setCounted(v.replace(/[^\d.]/g, ""))}
          keyboardType="decimal-pad"
          inputMode="decimal"
          placeholder="0.00"
          hint="Not saved anywhere — this is just for you to check against."
        />

        {diff !== null ? (
          <Note
            tone={diff === 0 ? "good" : Math.abs(diff) < 1000 ? "warn" : "bad"}
            style={{ marginTop: space(4) }}
            title={diff === 0 ? "It matches" : diff > 0 ? `${rupees(diff)} more than expected` : `${rupees(-diff)} short`}
          >
            {diff === 0
              ? "The drawer and the app agree. Nothing to chase."
              : diff > 0
              ? "Usually a sale taken in cash that was never billed, or change given wrong."
              : "Usually a bill marked paid that was not, or money taken out without a note."}
          </Note>
        ) : null}
      </Card>

      {/* ---- everything else that came in ---- */}
      <Card style={{ marginTop: space(4) }}>
        <CardHead title="Money in" />
        {data.in.length ? (
          data.in.map((r) => (
            <Row key={r.mode} style={{ paddingVertical: 4 }}>
              <T style={{ flex: 1 }}>{modeLabel(r.mode)}</T>
              <T variant="tiny" style={{ marginRight: space(2) }}>
                {`${r.count} ${r.count === 1 ? "payment" : "payments"}`}
              </T>
              <T style={{ fontWeight: "700" }} num>
                {rupees(r.paise)}
              </T>
            </Row>
          ))
        ) : (
          <T variant="sub">Nothing came in on this day.</T>
        )}
        <Divider style={{ marginVertical: space(2) }} />
        <Row>
          <T style={{ flex: 1, fontWeight: "700" }}>Total in</T>
          <T style={{ fontWeight: "800", color: colors.brandInk }} num>
            {rupees(data.totalInPaise)}
          </T>
        </Row>
      </Card>

      {data.out.length ? (
        <Card style={{ marginTop: space(4) }}>
          <CardHead title="Money out" />
          {data.out.map((r) => (
            <Row key={r.mode} style={{ paddingVertical: 4 }}>
              <T style={{ flex: 1 }}>{modeLabel(r.mode)}</T>
              <T variant="tiny" style={{ marginRight: space(2) }}>
                {`${r.count} ${r.count === 1 ? "payment" : "payments"}`}
              </T>
              <T style={{ fontWeight: "700" }} num>
                {rupees(r.paise)}
              </T>
            </Row>
          ))}
          <Divider style={{ marginVertical: space(2) }} />
          <Row>
            <T style={{ flex: 1, fontWeight: "700" }}>Total out</T>
            <T style={{ fontWeight: "800" }} num>
              {rupees(data.totalOutPaise)}
            </T>
          </Row>
        </Card>
      ) : null}

      <Button title="Read it again" kind="ghost" full style={{ marginTop: space(5) }} onPress={load} />

      <Choose
        open={picking}
        onClose={() => setPicking(false)}
        title="Which day"
        value={date}
        options={days}
        onPick={(v) => {
          setDate(v);
          setCounted("");
        }}
      />
    </Screen>
  );
}
