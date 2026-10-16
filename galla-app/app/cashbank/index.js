// ===========================================================================
// WHERE THE MONEY IS
// ---------------------------------------------------------------------------
// One screen that answers it: the drawer, every bank account, and the total.
// Cheques that have not cleared are shown too, and deliberately OUTSIDE the
// total - a shopkeeper who sees a promised ₹40,000 inside the figure will
// spend money that has not arrived.
// ===========================================================================

import { useCallback, useState } from "react";
import { Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import {
  Button,
  Card,
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
import { Sheet } from "../../components/sheet";
import { cashBankSummary, createBankAccount } from "../../lib/data";
import { rupees } from "../../lib/money";
import { colors, radius, space } from "../../lib/theme";

export default function CashAndBank() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [state, setState] = useState({ loading: true, error: null });
  const [refreshing, setRefreshing] = useState(false);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await cashBankSummary());
      setState({ loading: false, error: null });
    } catch (e) {
      setState({ loading: false, error: e });
    }
  }, []);

  // Reloaded on focus, not once on mount. Coming back from recording a
  // deposit to a screen still showing the old balance is the kind of thing
  // that makes somebody count the drawer twice.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (state.loading) return <Loading label="Adding it up" />;
  if (state.error) return <ErrorState error={state.error} onRetry={load} />;

  const accounts = data.accounts || [];
  const pending = data.cheques.toReceivePaise + data.cheques.toPayPaise;

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
        <T variant="label">Everything together</T>
        <T num style={{ fontSize: 30, fontWeight: "800", marginTop: space(1) }}>
          {rupees(data.totalPaise)}
        </T>
        <T variant="tiny" style={{ marginTop: space(1) }}>
          {`${rupees(data.cash.balancePaise)} in the drawer · ${rupees(data.bankTotalPaise)} in ${
            accounts.length === 1 ? "the bank" : `${accounts.length} accounts`
          }`}
        </T>
      </Card>

      {pending > 0 ? (
        <Pressable onPress={() => router.push("/cashbank/cheques")} style={{ marginTop: space(3) }}>
          <Note tone="warn" title="Cheques not cleared yet">
            {[
              data.cheques.toReceivePaise > 0
                ? `${rupees(data.cheques.toReceivePaise)} still to come in (${data.cheques.countToReceive})`
                : null,
              data.cheques.toPayPaise > 0
                ? `${rupees(data.cheques.toPayPaise)} still to go out (${data.cheques.countToPay})`
                : null,
            ]
              .filter(Boolean)
              .join(" · ") + ". None of it is counted above."}
          </Note>
        </Pressable>
      ) : null}

      <Pressable
        onPress={() => router.push("/cashbank/cash")}
        accessibilityRole="button"
        accessibilityLabel="Cash in hand"
        style={{ marginTop: space(4) }}
      >
        <Card>
          <Row>
            <View style={st.icon}>
              <Icon name="cash" size={20} color={colors.brandInk} />
            </View>
            <View style={{ flex: 1 }}>
              <T style={{ fontWeight: "700" }}>Cash in hand</T>
              <T variant="tiny">What should be in the drawer right now</T>
            </View>
            <T num style={{ fontWeight: "800", fontSize: 17 }}>
              {rupees(data.cash.balancePaise)}
            </T>
            <Icon name="chevron" size={18} color={colors.ink3} />
          </Row>
          {data.cash.balancePaise < 0 ? (
            <Note tone="warn" style={{ marginTop: space(3) }}>
              The drawer cannot hold less than nothing. Either an opening amount is missing, or something
              paid in cash was never recorded as coming in.
            </Note>
          ) : null}
        </Card>
      </Pressable>

      <Row style={{ marginTop: space(5), marginBottom: space(2), paddingHorizontal: space(1) }}>
        <T variant="label" style={{ flex: 1 }}>
          Bank accounts
        </T>
        <Pressable onPress={() => setAdding(true)} accessibilityRole="button" accessibilityLabel="Add an account">
          <T variant="tiny" style={{ color: colors.brandInk, fontWeight: "700" }}>
            + Add
          </T>
        </Pressable>
      </Row>

      <Card pad={false}>
        {accounts.length === 0 ? (
          <View style={{ padding: space(5) }}>
            <T variant="tiny" style={{ textAlign: "center" }}>
              No bank accounts yet. Add one and every UPI or transfer payment can say which account it
              landed in.
            </T>
            <Button
              title="Add a bank account"
              kind="primary"
              onPress={() => setAdding(true)}
              style={{ marginTop: space(3) }}
              full
            />
          </View>
        ) : (
          accounts.map((a, i) => (
            <View key={a.id}>
              {i ? <Divider /> : null}
              <Pressable
                onPress={() => router.push(`/cashbank/${a.id}`)}
                accessibilityRole="button"
                accessibilityLabel={a.name}
                style={({ pressed }) => [st.row, pressed && { backgroundColor: colors.sunken }]}
              >
                <View style={st.icon}>
                  <Icon name="bank" size={18} color={colors.brandInk} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Row gap={1.5}>
                    <T numberOfLines={1} style={{ fontWeight: "650" }}>
                      {a.name}
                    </T>
                    {a.isDefault ? (
                      <View style={st.tag}>
                        <T variant="tiny" style={{ color: colors.brandInk, fontWeight: "700" }}>
                          default
                        </T>
                      </View>
                    ) : null}
                  </Row>
                  <T variant="tiny" numberOfLines={1}>
                    {[a.bankName, a.accountNumber ? `…${a.accountNumber.slice(-4)}` : null]
                      .filter(Boolean)
                      .join(" · ") || "No bank details yet"}
                  </T>
                </View>
                <T
                  num
                  style={{ fontWeight: "700", color: a.balancePaise < 0 ? colors.danger : colors.ink }}
                >
                  {rupees(a.balancePaise)}
                </T>
                <Icon name="chevron" size={18} color={colors.ink3} />
              </Pressable>
            </View>
          ))
        )}
      </Card>

      <AddAccount
        open={adding}
        onClose={() => setAdding(false)}
        onDone={() => {
          setAdding(false);
          load();
        }}
      />
    </Screen>
  );
}

// ---------------------------------------------------------------------------
function AddAccount({ open, onClose, onDone }) {
  const blank = { name: "", bankName: "", accountNumber: "", ifsc: "", openingBalance: "", upiId: "" };
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    setErr(null);
    if (!form.name.trim()) {
      setErr("What do you call this account?");
      return;
    }
    setBusy(true);
    try {
      await createBankAccount(form);
      setForm(blank);
      onDone?.();
    } catch (e) {
      // The server names the field it rejected; showing its words is more
      // use than "something went wrong", above all for the IFSC rule.
      setErr(e?.fields ? Object.values(e.fields).join(" ") : e?.message || "Could not save that.");
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
      title="Add a bank account"
      subtitle="Only the name is needed. The rest can wait."
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
      <Field
        label="What you call it"
        required
        value={form.name}
        onChangeText={set("name")}
        placeholder="HDFC current"
        autoFocus
      />
      <Field
        label="Bank"
        value={form.bankName}
        onChangeText={set("bankName")}
        placeholder="HDFC Bank"
        style={{ marginTop: space(4) }}
      />
      <Field
        label="Account number"
        value={form.accountNumber}
        onChangeText={set("accountNumber")}
        keyboardType="number-pad"
        style={{ marginTop: space(4) }}
      />
      <Field
        label="IFSC"
        value={form.ifsc}
        onChangeText={(v) => set("ifsc")(v.toUpperCase())}
        placeholder="HDFC0001234"
        autoCapitalize="characters"
        hint="Eleven characters. Printed on your cheque book."
        style={{ marginTop: space(4) }}
      />
      <Field
        label="UPI id"
        value={form.upiId}
        onChangeText={set("upiId")}
        placeholder="shop@okhdfcbank"
        style={{ marginTop: space(4) }}
      />
      <MoneyField
        label="What is in it today"
        value={form.openingBalance}
        onChangeText={(v) => set("openingBalance")(String(v).replace(/[^\d.-]/g, ""))}
        placeholder="0"
        hint="The app counts up from this. An overdraft can be a minus figure."
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

const st = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space(3),
    paddingHorizontal: space(4),
    paddingVertical: space(3.5),
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.brandSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  tag: {
    paddingHorizontal: space(1.5),
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: colors.brandSoft,
  },
});
