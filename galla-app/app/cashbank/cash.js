// ===========================================================================
// CASH IN HAND
// ---------------------------------------------------------------------------
// What should be in the drawer right now, and every line that got it there.
//
// The figure is not stored anywhere. It is the opening amount, plus cash
// taken in, less cash paid out, less cash spent, less whatever was walked to
// the bank. Which is also why the statement matters more than the headline:
// when the drawer does not match, the only useful question is which line is
// missing.
// ===========================================================================

import { useCallback, useState } from "react";
import { RefreshControl, View } from "react-native";
import { useFocusEffect } from "expo-router";
import {
  Button,
  Card,
  CardHead,
  ErrorState,
  Loading,
  MoneyField,
  Note,
  Row,
  Screen,
  T,
} from "../../components/ui";
import { Sheet } from "../../components/sheet";
import { Actions, MoveSheet, Statement } from "../../components/money-moves";
import { cashBankSummary, cashStatement, listBankAccounts, setOpeningCash } from "../../lib/data";
import { rupees } from "../../lib/money";
import { colors, space } from "../../lib/theme";

export default function CashInHand() {
  const [summary, setSummary] = useState(null);
  const [statement, setStatement] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [state, setState] = useState({ loading: true, error: null });
  const [refreshing, setRefreshing] = useState(false);
  const [moving, setMoving] = useState(null);
  const [opening, setOpening] = useState(false);

  const load = useCallback(async () => {
    try {
      // All three at once. Done one after another this screen would take
      // three round trips to appear, which on a shop's connection is the
      // difference between instant and sluggish.
      const [s, st, acc] = await Promise.all([cashBankSummary(), cashStatement(), listBankAccounts()]);
      setSummary(s);
      setStatement(st);
      setAccounts(acc);
      setState({ loading: false, error: null });
    } catch (e) {
      setState({ loading: false, error: e });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (state.loading) return <Loading label="Counting" />;
  if (state.error) return <ErrorState error={state.error} onRetry={load} />;

  const c = summary.cash;
  const hasBank = accounts.length > 0;

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
      <Card>
        <T variant="label">In the drawer</T>
        <T
          num
          style={{
            fontSize: 32,
            fontWeight: "800",
            marginTop: space(1),
            color: c.balancePaise < 0 ? colors.danger : colors.ink,
          }}
        >
          {rupees(c.balancePaise)}
        </T>

        <View style={{ marginTop: space(4) }}>
          <Line label="Opening amount" paise={c.openingPaise} />
          <Line label="Cash taken in" paise={c.receivedPaise} sign="+" />
          <Line label="Cash paid out" paise={c.paidOutPaise} sign="−" />
          <Line label="Spent on expenses" paise={c.spentPaise} sign="−" />
          <Line label="Taken to the bank" paise={c.depositedPaise} sign="−" />
          <Line label="Drawn from the bank" paise={c.withdrawnPaise} sign="+" />
          {c.loanPaise > 0 ? <Line label="Loan instalments in cash" paise={c.loanPaise} sign="−" /> : null}
        </View>

        {c.balancePaise < 0 ? (
          <Note tone="warn" style={{ marginTop: space(3) }}>
            A drawer cannot hold less than nothing. Usually this means the opening amount was never set,
            or cash went out before anything was recorded coming in.
          </Note>
        ) : null}
      </Card>

      <Actions
        items={[
          ...(hasBank
            ? [
                { icon: "bank", label: "To the bank", onPress: () => setMoving("cash-to-bank") },
                { icon: "cash", label: "From the bank", onPress: () => setMoving("bank-to-cash") },
              ]
            : []),
          { icon: "plus", label: "Cash found", onPress: () => setMoving("cash-increase") },
          { icon: "minus", label: "Cash short", onPress: () => setMoving("cash-decrease") },
          { icon: "edit", label: "Opening", onPress: () => setOpening(true) },
        ]}
      />

      {!hasBank ? (
        <Note tone="info" style={{ marginTop: space(3) }}>
          Add a bank account under Cash and bank, and you can record the day's takings going in.
        </Note>
      ) : null}

      <Card pad={false} style={{ marginTop: space(5) }}>
        <CardHead title="Every cash movement" />
        <Statement
          rows={statement.rows}
          balancePaise={statement.balancePaise}
          emptyLabel="No cash has moved yet."
        />
      </Card>

      <MoveSheet
        open={Boolean(moving)}
        kind={moving || "cash-to-bank"}
        accounts={accounts}
        onClose={() => setMoving(null)}
        onDone={load}
      />

      <OpeningSheet
        open={opening}
        current={c.openingPaise}
        onClose={() => setOpening(false)}
        onDone={() => {
          setOpening(false);
          load();
        }}
      />
    </Screen>
  );
}

function Line({ label, paise, sign }) {
  if (!paise && sign) return null;
  return (
    <Row style={{ paddingVertical: space(1) }}>
      <T variant="sub" style={{ flex: 1 }}>
        {label}
      </T>
      <T num variant="sub">
        {sign ? `${sign} ` : ""}
        {rupees(paise)}
      </T>
    </Row>
  );
}

// ---------------------------------------------------------------------------
function OpeningSheet({ open, current, onClose, onDone }) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  async function save() {
    setErr(null);
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) {
      setErr("A plain number, please.");
      return;
    }
    setBusy(true);
    try {
      await setOpeningCash(n);
      setValue("");
      onDone?.();
    } catch (e) {
      setErr(e?.message || "Could not save that.");
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
      title="Opening cash"
      subtitle="What was in the drawer on the day you started using this app"
      footer={
        <Button
          title={busy ? "Saving…" : "Save"}
          kind="primary"
          size="lg"
          full
          busy={busy}
          disabled={busy}
          onPress={save}
        />
      }
    >
      <Note tone="info">
        {`Right now it is set to ${rupees(current)}. Everything the app has recorded is counted on top of this, so it is a starting point rather than a correction — for a drawer that simply does not match today, use "Cash found" or "Cash short" instead.`}
      </Note>
      <MoneyField
        label="Opening amount"
        required
        value={value}
        onChangeText={(v) => setValue(String(v).replace(/[^\d.]/g, ""))}
        placeholder="0"
        autoFocus
        style={{ marginTop: space(4) }}
      />
      {err ? (
        <Note tone="bad" style={{ marginTop: space(4) }}>
          {err}
        </Note>
      ) : null}
    </Sheet>
  );
}
