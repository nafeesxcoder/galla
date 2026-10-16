// ===========================================================================
// ONE LOAN
// ---------------------------------------------------------------------------
// What is left, what has been paid, and the instalments that got it there.
//
// Recording an instalment is the only interesting thing here, and the split
// is the reason why. Pay 9,964 on a 12% loan with 3,00,000 outstanding and
// 3,000 of it is interest - gone - while 6,964 comes off the debt. Enter it
// as one figure and the app does that split; enter it by hand and the server
// checks the three add up to what actually left the account.
// ===========================================================================

import { useCallback, useState } from "react";
import { RefreshControl, StyleSheet, View } from "react-native";
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  Button,
  Card,
  CardHead,
  Divider,
  ErrorState,
  Field,
  Loading,
  MoneyField,
  Note,
  Row,
  Screen,
  T,
} from "../../components/ui";
import { Icon } from "../../components/icons";
import { Sheet, Choose, PickerButton } from "../../components/sheet";
import {
  addLoanPayment,
  deleteLoan,
  getLoan,
  listBankAccounts,
  listLoanPayments,
  updateLoan,
} from "../../lib/data";
import { formatDate, rupees } from "../../lib/money";
import { colors, radius, space } from "../../lib/theme";

const MODES = [
  { value: "bank", label: "Bank transfer" },
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "cheque", label: "Cheque" },
  { value: "card", label: "Card" },
  { value: "other", label: "Something else" },
];

export default function Loan() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [loan, setLoan] = useState(null);
  const [payments, setPayments] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [state, setState] = useState({ loading: true, error: null });
  const [refreshing, setRefreshing] = useState(false);
  const [paying, setPaying] = useState(false);
  const [said, setSaid] = useState("");

  const load = useCallback(async () => {
    try {
      const [l, p, acc] = await Promise.all([getLoan(id), listLoanPayments(id), listBankAccounts()]);
      setLoan(l);
      setPayments(p.rows);
      setAccounts(acc);
      setState({ loading: false, error: null });
    } catch (e) {
      setState({ loading: false, error: e });
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (state.loading) return <Loading />;
  if (state.error) return <ErrorState error={state.error} onRetry={load} />;

  const paidOffFraction =
    loan.openingPaise > 0 ? Math.min(1, loan.principalPaidPaise / loan.openingPaise) : 0;

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
      <Stack.Screen options={{ title: loan.name }} />

      <Card>
        <T variant="label">Still owed</T>
        <T num style={{ fontSize: 30, fontWeight: "800", marginTop: space(1) }}>
          {rupees(loan.outstandingPaise)}
        </T>
        <T variant="tiny" style={{ marginTop: space(1) }}>
          {[loan.lender, loan.kindLabel, loan.interestRate ? `${loan.interestRate}% a year` : null]
            .filter(Boolean)
            .join(" · ")}
        </T>

        {/* A bar rather than a percentage, because "41% repaid" is a number
            to work out and a bar is a glance. */}
        <View style={st.track}>
          <View style={[st.fill, { width: `${Math.round(paidOffFraction * 100)}%` }]} />
        </View>
        <Row style={{ marginTop: space(1) }}>
          <T variant="tiny" style={{ flex: 1 }}>
            {`${rupees(loan.principalPaidPaise)} of ${rupees(loan.openingPaise)} repaid`}
          </T>
          <T variant="tiny">{`${Math.round(paidOffFraction * 100)}%`}</T>
        </Row>

        {!loan.isClosed && loan.nextDueDate ? (
          <Note tone="info" style={{ marginTop: space(3) }}>
            {`Next instalment ${formatDate(loan.nextDueDate)}${
              loan.emiPaise ? ` — ${rupees(loan.emiPaise)}` : ""
            }`}
          </Note>
        ) : null}
        {loan.isClosed ? (
          <Note tone="good" style={{ marginTop: space(3) }}>
            This loan is closed.
          </Note>
        ) : null}
      </Card>

      <Row style={{ marginTop: space(4), gap: space(3) }}>
        <Button
          title="Record an instalment"
          kind="primary"
          icon="rupee"
          onPress={() => setPaying(true)}
          style={{ flex: 1 }}
        />
        <Button
          title={loan.isClosed ? "Reopen" : "Close"}
          onPress={async () => {
            setSaid("");
            try {
              await updateLoan(id, { isClosed: !loan.isClosed });
              load();
            } catch (e) {
              setSaid(e?.message || "Could not do that.");
            }
          }}
        />
      </Row>

      {said ? (
        <Note tone="bad" style={{ marginTop: space(3) }}>
          {said}
        </Note>
      ) : null}

      <Card style={{ marginTop: space(5) }}>
        <T variant="label" style={{ marginBottom: space(2) }}>
          What it has cost so far
        </T>
        <Line label="Paid altogether" paise={loan.totalPaidPaise} />
        <Line label="Off the debt (principal)" paise={loan.principalPaidPaise} />
        <Line label="Interest — gone" paise={loan.interestPaidPaise} strong />
        {loan.chargesPaidPaise > 0 ? <Line label="Fees and penalties" paise={loan.chargesPaidPaise} /> : null}
        <T variant="tiny" style={{ marginTop: space(2) }}>
          Only the interest and the fees are a cost to the business. The principal is the debt shrinking.
        </T>
      </Card>

      <Card pad={false} style={{ marginTop: space(5) }}>
        <CardHead title={`Instalments (${payments.length})`} />
        {payments.length === 0 ? (
          <View style={{ padding: space(5) }}>
            <T variant="tiny" style={{ textAlign: "center" }}>
              Nothing paid yet.
            </T>
          </View>
        ) : (
          payments.map((p, i) => (
            <View key={p.id}>
              {i ? <Divider /> : null}
              <View style={st.row}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <T style={{ fontWeight: "600" }}>{formatDate(p.date)}</T>
                  <T variant="tiny">
                    {`${rupees(p.principalPaise)} off the debt · ${rupees(p.interestPaise)} interest${
                      p.chargesPaise ? ` · ${rupees(p.chargesPaise)} fees` : ""
                    }`}
                  </T>
                  <T variant="tiny">
                    {[MODES.find((m) => m.value === p.mode)?.label || p.mode, p.bankAccountName]
                      .filter(Boolean)
                      .join(" · ")}
                  </T>
                </View>
                <T num style={{ fontWeight: "700" }}>
                  {rupees(p.amountPaise)}
                </T>
              </View>
            </View>
          ))
        )}
      </Card>

      <Button
        title="Delete this loan"
        kind="danger"
        full
        style={{ marginTop: space(6) }}
        onPress={async () => {
          setSaid("");
          try {
            await deleteLoan(id);
            router.back();
          } catch (e) {
            // The server refuses once instalments exist, and says how many.
            setSaid(e?.message || "Could not delete it.");
          }
        }}
      />

      <PaySheet
        open={paying}
        loan={loan}
        accounts={accounts}
        onClose={() => setPaying(false)}
        onDone={() => {
          setPaying(false);
          load();
        }}
      />
    </Screen>
  );
}

function Line({ label, paise, strong }) {
  return (
    <Row style={{ paddingVertical: space(1) }}>
      <T variant="sub" style={{ flex: 1 }}>
        {label}
      </T>
      <T num variant="sub" style={strong ? { fontWeight: "700", color: colors.danger } : undefined}>
        {rupees(paise)}
      </T>
    </Row>
  );
}

// ---------------------------------------------------------------------------
function PaySheet({ open, loan, accounts, onClose, onDone }) {
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState("bank");
  const [account, setAccount] = useState(null);
  const [date, setDate] = useState("");
  const [split, setSplit] = useState(false);
  const [principal, setPrincipal] = useState("");
  const [interest, setInterest] = useState("");
  const [charges, setCharges] = useState("");
  const [picking, setPicking] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const numeric = (v) => String(v).replace(/[^\d.]/g, "");
  const nameOf = (id) => accounts.find((a) => String(a.id) === String(id))?.name || "";

  // What the app would do if left to itself: one month's interest on what is
  // still owed, and the rest off the debt. Shown before saving so there is no
  // surprise, and so an instalment that is mostly interest is obvious.
  const preview = (() => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return null;
    const fee = Number(charges) || 0;
    const monthly = loan.interestRate / 12 / 100;
    const int = Math.min(Math.round((loan.outstandingPaise / 100) * monthly * 100) / 100, Math.max(0, value - fee));
    return { interest: int, principal: Math.max(0, value - fee - int) };
  })();

  function reset() {
    setAmount("");
    setPrincipal("");
    setInterest("");
    setCharges("");
    setDate("");
    setSplit(false);
    setErr(null);
  }

  async function save() {
    setErr(null);
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setErr("How much went out?");
      return;
    }
    setBusy(true);
    try {
      await addLoanPayment(loan.id, {
        amount: value,
        mode,
        date: date || undefined,
        bankAccountId: mode === "bank" || mode === "upi" ? account || undefined : undefined,
        charges: charges || undefined,
        ...(split ? { principal: principal || undefined, interest: interest || undefined } : {}),
      });
      reset();
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
        reset();
        onClose?.();
      }}
      title="Record an instalment"
      subtitle={`${rupees(loan.outstandingPaise)} still owed`}
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
      <MoneyField
        label="How much went out"
        required
        value={amount}
        onChangeText={(v) => setAmount(numeric(v))}
        placeholder={loan.emiPaise ? String(loan.emiPaise / 100) : "0"}
        autoFocus
      />

      <PickerButton
        label="How it was paid"
        value={MODES.find((m) => m.value === mode)?.label}
        onPress={() => setPicking("mode")}
        style={{ marginTop: space(4) }}
      />

      {(mode === "bank" || mode === "upi") && accounts.length ? (
        <PickerButton
          label="Out of which account"
          value={nameOf(account)}
          placeholder="Choose an account"
          onPress={() => setPicking("account")}
          style={{ marginTop: space(4) }}
        />
      ) : null}

      <MoneyField
        label="Fees or penalty, if any"
        value={charges}
        onChangeText={(v) => setCharges(numeric(v))}
        placeholder="0"
        hint="Part of what went out, but it does not reduce the debt."
        style={{ marginTop: space(4) }}
      />

      <Field
        label="Date"
        value={date}
        onChangeText={setDate}
        placeholder="today"
        style={{ marginTop: space(4) }}
      />

      {!split && preview ? (
        <Note tone="info" style={{ marginTop: space(4) }}>
          {`This will count ${rupees(Math.round(preview.interest * 100))} as interest and take ${rupees(
            Math.round(preview.principal * 100)
          )} off the debt, worked out at ${loan.interestRate}% a year.`}
        </Note>
      ) : null}

      <Button
        title={split ? "Let the app work out the split" : "I know the split — enter it myself"}
        kind="ghost"
        full
        style={{ marginTop: space(3) }}
        onPress={() => setSplit((v) => !v)}
      />

      {split ? (
        <>
          <MoneyField
            label="Interest part"
            value={interest}
            onChangeText={(v) => setInterest(numeric(v))}
            placeholder="0"
            style={{ marginTop: space(3) }}
          />
          <MoneyField
            label="Principal part"
            value={principal}
            onChangeText={(v) => setPrincipal(numeric(v))}
            placeholder="the rest"
            hint="Leave one of the two blank and it is worked out as the remainder."
            style={{ marginTop: space(4) }}
          />
        </>
      ) : null}

      {err ? (
        <Note tone="bad" style={{ marginTop: space(4) }}>
          {err}
        </Note>
      ) : null}

      <Choose
        open={picking === "mode"}
        onClose={() => setPicking(null)}
        title="How it was paid"
        options={MODES}
        value={mode}
        onPick={setMode}
      />
      <Choose
        open={picking === "account"}
        onClose={() => setPicking(null)}
        title="Out of which account"
        options={accounts.map((a) => ({ value: a.id, label: a.name, note: a.bankName || undefined }))}
        value={account}
        onPick={setAccount}
      />
    </Sheet>
  );
}

const st = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space(3),
    paddingHorizontal: space(4),
    paddingVertical: space(3),
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.sunken,
    marginTop: space(4),
    overflow: "hidden",
  },
  fill: { height: 8, borderRadius: 4, backgroundColor: colors.brand },
});
