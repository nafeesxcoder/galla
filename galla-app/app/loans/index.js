// ===========================================================================
// LOANS
// ---------------------------------------------------------------------------
// Two questions, and nothing else in the app can answer either: how much is
// still owed, and when is the next instalment.
//
// A loan is kept apart from suppliers on purpose. A supplier's balance moves
// when goods arrive; a loan's moves only when an instalment is paid, and only
// by the part of it that was principal. The rest is interest - the cost of
// having borrowed, and the only part that belongs near a profit figure.
// ===========================================================================

import { useCallback, useState } from "react";
import { Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import {
  Button,
  Card,
  Divider,
  Empty,
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
import { LOAN_KINDS, createLoan, listBankAccounts, listLoans } from "../../lib/data";
import { formatDate, rupees } from "../../lib/money";
import { colors, radius, space } from "../../lib/theme";

export default function Loans() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [state, setState] = useState({ loading: true, error: null });
  const [refreshing, setRefreshing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [showClosed, setShowClosed] = useState(false);

  const load = useCallback(async () => {
    try {
      const [loans, acc] = await Promise.all([
        listLoans({ includeClosed: showClosed }),
        listBankAccounts(),
      ]);
      setData(loans);
      setAccounts(acc);
      setState({ loading: false, error: null });
    } catch (e) {
      setState({ loading: false, error: e });
    }
  }, [showClosed]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (state.loading) return <Loading />;
  if (state.error) return <ErrorState error={state.error} onRetry={load} />;

  const rows = data.rows;

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
      {rows.length ? (
        <Card>
          <T variant="label">Still owed</T>
          <T num style={{ fontSize: 30, fontWeight: "800", marginTop: space(1) }}>
            {rupees(data.outstandingPaise)}
          </T>
          {data.monthlyPaise > 0 ? (
            <T variant="tiny" style={{ marginTop: space(1) }}>
              {`${rupees(data.monthlyPaise)} a month in instalments`}
            </T>
          ) : null}
        </Card>
      ) : null}

      <Row style={{ marginTop: space(5), marginBottom: space(2), paddingHorizontal: space(1) }}>
        <T variant="label" style={{ flex: 1 }}>
          {showClosed ? "All loans" : "Running loans"}
        </T>
        <Pressable onPress={() => setAdding(true)} accessibilityRole="button" accessibilityLabel="Add a loan">
          <T variant="tiny" style={{ color: colors.brandInk, fontWeight: "700" }}>
            + Add
          </T>
        </Pressable>
      </Row>

      {rows.length === 0 ? (
        <Empty
          icon="loan"
          title={showClosed ? "No loans recorded" : "No running loans"}
          body="Record a loan and the app keeps track of what is still owed, splits each instalment into interest and principal, and reminds you when the next one is due."
          action={<Button title="Add a loan" kind="primary" onPress={() => setAdding(true)} />}
        />
      ) : (
        <Card pad={false}>
          {rows.map((l, i) => (
            <View key={l.id}>
              {i ? <Divider /> : null}
              <Pressable
                onPress={() => router.push(`/loans/${l.id}`)}
                accessibilityRole="button"
                accessibilityLabel={l.name}
                style={({ pressed }) => [st.row, pressed && { backgroundColor: colors.sunken }]}
              >
                <View style={st.icon}>
                  <Icon name="loan" size={18} color={colors.brandInk} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Row gap={1.5}>
                    <T numberOfLines={1} style={{ fontWeight: "650" }}>
                      {l.name}
                    </T>
                    {l.isClosed ? (
                      <View style={st.tag}>
                        <T variant="tiny" style={{ color: colors.ink2, fontWeight: "700" }}>
                          closed
                        </T>
                      </View>
                    ) : null}
                  </Row>
                  <T variant="tiny" numberOfLines={1}>
                    {[l.lender || l.kindLabel, l.interestRate ? `${l.interestRate}%` : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </T>
                  {!l.isClosed && l.nextDueDate ? (
                    <T variant="tiny" style={{ color: colors.brandInk }}>
                      {`Next instalment ${formatDate(l.nextDueDate)}${
                        l.emiPaise ? ` · ${rupees(l.emiPaise)}` : ""
                      }`}
                    </T>
                  ) : null}
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <T num style={{ fontWeight: "700" }}>
                    {rupees(l.outstandingPaise)}
                  </T>
                  <T variant="tiny">left</T>
                </View>
                <Icon name="chevron" size={18} color={colors.ink3} />
              </Pressable>
            </View>
          ))}
        </Card>
      )}

      <Button
        title={showClosed ? "Hide closed loans" : "Show closed loans too"}
        kind="ghost"
        full
        style={{ marginTop: space(4) }}
        onPress={() => setShowClosed((v) => !v)}
      />

      <AddLoan
        open={adding}
        accounts={accounts}
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
function AddLoan({ open, accounts, onClose, onDone }) {
  const blank = {
    name: "",
    lender: "",
    kind: "bank",
    principal: "",
    openingBalance: "",
    interestRate: "",
    emi: "",
    tenureMonths: "",
    dueDay: "",
    startDate: "",
  };
  const [form, setForm] = useState(blank);
  const [picking, setPicking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const numeric = (v) => String(v).replace(/[^\d.]/g, "");

  async function save() {
    setErr(null);
    if (!form.name.trim()) {
      setErr("Give the loan a name you will recognise.");
      return;
    }
    setBusy(true);
    try {
      await createLoan(form);
      setForm(blank);
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
        setErr(null);
        onClose?.();
      }}
      title="Add a loan"
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
        placeholder="Shop vehicle loan"
        autoFocus
      />
      <Field
        label="Who you borrowed from"
        value={form.lender}
        onChangeText={set("lender")}
        placeholder="Bajaj Finance"
        style={{ marginTop: space(4) }}
      />
      <PickerButton
        label="What kind"
        value={LOAN_KINDS[form.kind]}
        onPress={() => setPicking(true)}
        style={{ marginTop: space(4) }}
      />
      <MoneyField
        label="How much you borrowed"
        value={form.principal}
        onChangeText={(v) => set("principal")(numeric(v))}
        placeholder="0"
        style={{ marginTop: space(4) }}
      />
      <MoneyField
        label="How much is still owed today"
        value={form.openingBalance}
        onChangeText={(v) => set("openingBalance")(numeric(v))}
        placeholder="same as above"
        hint="Leave it blank for a loan you have just taken. Fill it in if you are part way through."
        style={{ marginTop: space(4) }}
      />
      <Field
        label="Interest rate a year"
        value={form.interestRate}
        onChangeText={(v) => set("interestRate")(numeric(v))}
        keyboardType="decimal-pad"
        placeholder="12"
        hint="Used to split each instalment into interest and principal."
        style={{ marginTop: space(4) }}
      />
      <MoneyField
        label="Monthly instalment"
        value={form.emi}
        onChangeText={(v) => set("emi")(numeric(v))}
        placeholder="0"
        style={{ marginTop: space(4) }}
      />
      <Field
        label="Which day of the month it goes out"
        value={form.dueDay}
        onChangeText={(v) => set("dueDay")(numeric(v))}
        keyboardType="number-pad"
        placeholder="5"
        style={{ marginTop: space(4) }}
      />

      {err ? (
        <Note tone="bad" style={{ marginTop: space(4) }}>
          {err}
        </Note>
      ) : null}

      <Choose
        open={picking}
        onClose={() => setPicking(false)}
        title="What kind of loan"
        options={Object.entries(LOAN_KINDS).map(([value, label]) => ({ value, label }))}
        value={form.kind}
        onPick={set("kind")}
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
    backgroundColor: colors.sunken,
  },
});
