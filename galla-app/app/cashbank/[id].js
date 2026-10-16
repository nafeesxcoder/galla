// ===========================================================================
// ONE BANK ACCOUNT
// ---------------------------------------------------------------------------
// Its balance, how it got there, and the details that print on a bill so a
// customer can transfer into it.
//
// The balance is the opening figure plus every payment, expense, instalment
// and move that points at this account - worked out by the server, never
// stored, so it cannot drift away from the transactions behind it.
// ===========================================================================

import { useCallback, useState } from "react";
import { RefreshControl, View } from "react-native";
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  Button,
  Card,
  CardHead,
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
import { Sheet } from "../../components/sheet";
import { Actions, MoveSheet, Statement } from "../../components/money-moves";
import { bankStatement, deleteBankAccount, listBankAccounts, updateBankAccount } from "../../lib/data";
import { rupees } from "../../lib/money";
import { colors, space } from "../../lib/theme";

export default function BankAccount() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [state, setState] = useState({ loading: true, error: null });
  const [refreshing, setRefreshing] = useState(false);
  const [moving, setMoving] = useState(null);
  const [editing, setEditing] = useState(false);
  const [said, setSaid] = useState("");

  const load = useCallback(async () => {
    try {
      const [st, acc] = await Promise.all([bankStatement(id), listBankAccounts()]);
      setData(st);
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

  const a = data.account;
  const others = accounts.filter((x) => String(x.id) !== String(id));

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
      <Stack.Screen options={{ title: a.name }} />

      <Card>
        <Row>
          <View style={{ flex: 1 }}>
            <T variant="label">Balance</T>
            <T
              num
              style={{
                fontSize: 30,
                fontWeight: "800",
                marginTop: space(1),
                color: data.balancePaise < 0 ? colors.danger : colors.ink,
              }}
            >
              {rupees(data.balancePaise)}
            </T>
          </View>
          <Button icon="edit" title="Edit" onPress={() => setEditing(true)} size="sm" />
        </Row>
        <T variant="tiny" style={{ marginTop: space(2) }}>
          {`Started at ${rupees(data.openingPaise)}${a.openingDate ? ` on ${a.openingDate}` : ""}`}
        </T>
      </Card>

      <Actions
        items={[
          { icon: "bank", label: "Cash in", onPress: () => setMoving("cash-to-bank") },
          { icon: "cash", label: "Cash out", onPress: () => setMoving("bank-to-cash") },
          ...(others.length ? [{ icon: "swap", label: "Transfer", onPress: () => setMoving("bank-to-bank") }] : []),
          { icon: "minus", label: "Charges", onPress: () => setMoving("bank-charge") },
          { icon: "plus", label: "Interest", onPress: () => setMoving("bank-interest") },
        ]}
      />

      {said ? (
        <Note tone="bad" style={{ marginTop: space(3) }}>
          {said}
        </Note>
      ) : null}

      {a.accountNumber || a.ifsc || a.upiId ? (
        <Card style={{ marginTop: space(5) }}>
          <T variant="label" style={{ marginBottom: space(2) }}>
            The details
          </T>
          {a.bankName ? <Detail label="Bank" value={a.bankName} /> : null}
          {a.accountHolder ? <Detail label="In the name of" value={a.accountHolder} /> : null}
          {a.accountNumber ? <Detail label="Account number" value={a.accountNumber} /> : null}
          {a.ifsc ? <Detail label="IFSC" value={a.ifsc} /> : null}
          {a.branch ? <Detail label="Branch" value={a.branch} /> : null}
          {a.upiId ? <Detail label="UPI id" value={a.upiId} /> : null}
          <Row style={{ marginTop: space(3) }} gap={2}>
            <Icon
              name={a.printOnInvoice ? "check" : "close"}
              size={15}
              color={a.printOnInvoice ? colors.brand : colors.ink3}
            />
            <T variant="tiny" style={{ flex: 1 }}>
              {a.printOnInvoice
                ? "These print at the bottom of every bill, so a customer can transfer into it."
                : "Not printed on bills. Turn it on under Edit if you want customers to transfer into this account."}
            </T>
          </Row>
        </Card>
      ) : null}

      <Card pad={false} style={{ marginTop: space(5) }}>
        <CardHead title="Everything that moved" />
        <Statement
          rows={data.rows}
          balancePaise={data.balancePaise}
          emptyLabel="Nothing has gone through this account yet."
        />
      </Card>

      <Button
        title="Delete this account"
        kind="danger"
        full
        style={{ marginTop: space(6) }}
        onPress={async () => {
          setSaid("");
          try {
            await deleteBankAccount(id);
            router.back();
          } catch (e) {
            // The server refuses when payments point at it, and says how
            // many. That is the answer worth showing, not "failed".
            setSaid(e?.message || "Could not delete it.");
          }
        }}
      />

      <MoveSheet
        open={Boolean(moving)}
        kind={moving || "cash-to-bank"}
        accounts={accounts}
        fixedAccountId={a.id}
        onClose={() => setMoving(null)}
        onDone={load}
      />

      <EditAccount
        open={editing}
        account={a}
        onClose={() => setEditing(false)}
        onDone={() => {
          setEditing(false);
          load();
        }}
      />
    </Screen>
  );
}

function Detail({ label, value }) {
  return (
    <Row style={{ paddingVertical: space(1) }}>
      <T variant="sub" style={{ flex: 1 }}>
        {label}
      </T>
      <T variant="sub" style={{ fontWeight: "600" }}>
        {value}
      </T>
    </Row>
  );
}

// ---------------------------------------------------------------------------
function EditAccount({ open, account, onClose, onDone }) {
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  // Filled from the account the first time the sheet opens, and not reset on
  // every render - otherwise typing would be undone by the next one.
  const f =
    form ?? {
      name: account.name,
      bankName: account.bankName,
      accountNumber: account.accountNumber,
      ifsc: account.ifsc,
      accountHolder: account.accountHolder,
      branch: account.branch,
      upiId: account.upiId,
      isDefault: account.isDefault,
      printOnInvoice: account.printOnInvoice,
    };
  const set = (k) => (v) => setForm({ ...f, [k]: v });

  async function save() {
    setErr(null);
    if (!String(f.name).trim()) {
      setErr("It needs a name.");
      return;
    }
    setBusy(true);
    try {
      // The opening balance is deliberately not editable here. Changing it
      // silently rewrites every balance this account has ever shown,
      // including on days that have been closed.
      await updateBankAccount(account.id, f);
      setForm(null);
      onDone?.();
    } catch (e) {
      setErr(e?.fields ? Object.values(e.fields).join(" ") : e?.message || "Could not save that.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={() => {
        setForm(null);
        setErr(null);
        onClose?.();
      }}
      title="Edit the account"
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
      <Field label="What you call it" required value={f.name} onChangeText={set("name")} />
      <Field label="Bank" value={f.bankName} onChangeText={set("bankName")} style={{ marginTop: space(4) }} />
      <Field
        label="In the name of"
        value={f.accountHolder}
        onChangeText={set("accountHolder")}
        style={{ marginTop: space(4) }}
      />
      <Field
        label="Account number"
        value={f.accountNumber}
        onChangeText={set("accountNumber")}
        keyboardType="number-pad"
        style={{ marginTop: space(4) }}
      />
      <Field
        label="IFSC"
        value={f.ifsc}
        onChangeText={(v) => set("ifsc")(String(v).toUpperCase())}
        autoCapitalize="characters"
        style={{ marginTop: space(4) }}
      />
      <Field label="Branch" value={f.branch} onChangeText={set("branch")} style={{ marginTop: space(4) }} />
      <Field label="UPI id" value={f.upiId} onChangeText={set("upiId")} style={{ marginTop: space(4) }} />

      <Toggle
        label="Offer this account first when taking a payment"
        on={Boolean(f.isDefault)}
        onPress={() => set("isDefault")(!f.isDefault)}
      />
      <Toggle
        label="Print these details on every bill"
        on={Boolean(f.printOnInvoice)}
        onPress={() => set("printOnInvoice")(!f.printOnInvoice)}
      />

      <Note tone="info" style={{ marginTop: space(4) }}>
        {`The opening balance stays at ${rupees(account.openingPaise)} and cannot be changed here — moving it would rewrite every balance this account has ever shown, including days already closed. Use "Cash in" or "Charges" to correct it instead.`}
      </Note>

      {err ? (
        <Note tone="bad" style={{ marginTop: space(4) }}>
          {err}
        </Note>
      ) : null}
    </Sheet>
  );
}

function Toggle({ label, on, onPress }) {
  return (
    <Button
      title={label}
      icon={on ? "check" : "close"}
      kind={on ? "primary" : "default"}
      full
      style={{ marginTop: space(4) }}
      onPress={onPress}
    />
  );
}
