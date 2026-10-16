// ===========================================================================
// CHEQUES
// ---------------------------------------------------------------------------
// A cheque is money you have been promised. Until it clears it counts towards
// nothing - not the drawer, not the bank, not the day's takings - and this is
// the screen where it stops being a promise.
//
// Marking one bounced does more than change a label: the bills it was against
// go back to unpaid and the customer owes it again. That is what actually
// happened, and the screen says which bills so nobody finds out at month end.
// ===========================================================================

import { useCallback, useState } from "react";
import { Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { useFocusEffect } from "expo-router";
import {
  Button,
  Card,
  Divider,
  Empty,
  ErrorState,
  Loading,
  Note,
  Row,
  Screen,
  T,
} from "../../components/ui";
import { Icon } from "../../components/icons";
import { Sheet, Choose, PickerButton } from "../../components/sheet";
import { listBankAccounts, listCheques, setChequeStatus } from "../../lib/data";
import { formatDate, rupees, today } from "../../lib/money";
import { colors, radius, space } from "../../lib/theme";

const TABS = [
  { value: "pending", label: "Not cleared" },
  { value: "cleared", label: "Cleared" },
  { value: "bounced", label: "Bounced" },
  { value: "all", label: "All" },
];

export default function Cheques() {
  const [tab, setTab] = useState("pending");
  const [rows, setRows] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [state, setState] = useState({ loading: true, error: null });
  const [refreshing, setRefreshing] = useState(false);
  const [acting, setActing] = useState(null);
  const [said, setSaid] = useState(null);

  const load = useCallback(async () => {
    try {
      const [cheques, acc] = await Promise.all([listCheques({ status: tab }), listBankAccounts()]);
      setRows(cheques.rows);
      setAccounts(acc);
      setState({ loading: false, error: null });
    } catch (e) {
      setState({ loading: false, error: e });
    }
  }, [tab]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const inbound = rows.filter((r) => r.direction === "in");
  const outbound = rows.filter((r) => r.direction === "out");
  const sum = (list) => list.reduce((a, r) => a + r.amountPaise, 0);

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
      <Row style={{ gap: space(2), flexWrap: "wrap" }}>
        {TABS.map((t) => {
          const on = t.value === tab;
          return (
            <Pressable
              key={t.value}
              onPress={() => {
                setSaid(null);
                setTab(t.value);
              }}
              accessibilityRole="button"
              accessibilityLabel={t.label}
              accessibilityState={{ selected: on }}
              style={[st.tab, on && { backgroundColor: colors.brand, borderColor: colors.brand }]}
            >
              <T variant="tiny" style={{ fontWeight: "700", color: on ? "#fff" : colors.ink2 }}>
                {t.label}
              </T>
            </Pressable>
          );
        })}
      </Row>

      {said ? (
        <Note
          tone={said.tone}
          title={said.title}
          style={{ marginTop: space(4) }}
        >
          {said.body}
        </Note>
      ) : null}

      {state.loading ? (
        <Loading />
      ) : state.error ? (
        <ErrorState error={state.error} onRetry={load} />
      ) : rows.length === 0 ? (
        <Empty
          icon="cheque"
          title={tab === "pending" ? "Nothing waiting" : "Nothing here"}
          body={
            tab === "pending"
              ? "When you take a payment by cheque it waits here until you mark it cleared."
              : "No cheques with that state."
          }
        />
      ) : (
        <>
          {tab === "pending" ? (
            <Card style={{ marginTop: space(4) }}>
              <Row>
                <View style={{ flex: 1 }}>
                  <T variant="label">Still to come in</T>
                  <T num style={{ fontSize: 20, fontWeight: "800" }}>
                    {rupees(sum(inbound))}
                  </T>
                </View>
                <View style={{ flex: 1 }}>
                  <T variant="label">Still to go out</T>
                  <T num style={{ fontSize: 20, fontWeight: "800" }}>
                    {rupees(sum(outbound))}
                  </T>
                </View>
              </Row>
              <T variant="tiny" style={{ marginTop: space(2) }}>
                None of this is counted in your cash or bank balance yet.
              </T>
            </Card>
          ) : null}

          <Card pad={false} style={{ marginTop: space(4) }}>
            {rows.map((c, i) => (
              <View key={c.id}>
                {i ? <Divider /> : null}
                <Pressable
                  onPress={() => (c.status === "pending" ? setActing(c) : null)}
                  accessibilityRole={c.status === "pending" ? "button" : undefined}
                  accessibilityLabel={`Cheque ${c.number || c.id}`}
                  style={({ pressed }) => [st.row, pressed && c.status === "pending" && { backgroundColor: colors.sunken }]}
                >
                  <View
                    style={[
                      st.icon,
                      {
                        backgroundColor:
                          c.status === "bounced"
                            ? colors.dangerSoft
                            : c.overdue
                            ? colors.warnSoft
                            : colors.brandSoft,
                      },
                    ]}
                  >
                    <Icon
                      name={c.direction === "in" ? "arrowIn" : "arrowOut"}
                      size={16}
                      color={c.status === "bounced" ? colors.danger : colors.brandInk}
                    />
                  </View>

                  <View style={{ flex: 1, minWidth: 0 }}>
                    <T numberOfLines={1} style={{ fontWeight: "650" }}>
                      {c.partyName || (c.direction === "in" ? "Walk-in customer" : "Paid out")}
                    </T>
                    <T variant="tiny" numberOfLines={1}>
                      {[
                        c.number ? `No. ${c.number}` : null,
                        c.bank || null,
                        c.dueDate ? `due ${formatDate(c.dueDate)}` : `taken ${formatDate(c.date)}`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </T>
                    {c.overdue ? (
                      <T variant="tiny" style={{ color: colors.warn, fontWeight: "700" }}>
                        Date has passed
                      </T>
                    ) : null}
                    {c.status === "bounced" ? (
                      <T variant="tiny" style={{ color: colors.danger, fontWeight: "700" }}>
                        {`Bounced${c.settledDate ? ` on ${formatDate(c.settledDate)}` : ""}`}
                      </T>
                    ) : null}
                    {c.status === "cleared" && tab !== "cleared" ? (
                      <T variant="tiny" style={{ color: colors.brandInk, fontWeight: "700" }}>
                        Cleared
                      </T>
                    ) : null}
                  </View>

                  <T num style={{ fontWeight: "700" }}>
                    {rupees(c.amountPaise)}
                  </T>
                  {c.status === "pending" ? <Icon name="chevron" size={18} color={colors.ink3} /> : null}
                </Pressable>
              </View>
            ))}
          </Card>
        </>
      )}

      <ActOnCheque
        cheque={acting}
        accounts={accounts}
        onClose={() => setActing(null)}
        onDone={(result) => {
          setActing(null);
          if (result.status === "cleared") {
            setSaid({ tone: "good", title: "Cleared", body: `${rupees(result.amountPaise)} is now in your balance.` });
          } else if (result.status === "bounced") {
            const bills = result.billsBackToUnpaid;
            setSaid({
              tone: "warn",
              title: "Marked bounced",
              body: bills.length
                ? `${rupees(result.amountPaise)} came back out of your balance, and ${
                    bills.length === 1 ? "this bill is" : "these bills are"
                  } owed again: ${bills.map((b) => b.number).join(", ")}.`
                : `${rupees(result.amountPaise)} came back out of your balance.`,
            });
          }
          load();
        }}
      />
    </Screen>
  );
}

// ---------------------------------------------------------------------------
function ActOnCheque({ cheque, accounts, onClose, onDone }) {
  const [account, setAccount] = useState(null);
  const [date, setDate] = useState(() => today());
  const [picking, setPicking] = useState(false);
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState(null);

  if (!cheque) {
    return <Sheet open={false} onClose={onClose} title="" />;
  }

  const nameOf = (id) => accounts.find((a) => String(a.id) === String(id))?.name || "";

  async function mark(status) {
    setErr(null);
    setBusy(status);
    try {
      const result = await setChequeStatus(cheque.id, status, {
        settledDate: date,
        bankAccountId: status === "cleared" ? account || undefined : undefined,
      });
      setAccount(null);
      onDone?.(result);
    } catch (e) {
      setErr(e?.message || "Could not do that.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Sheet
      open
      onClose={() => {
        setErr(null);
        setAccount(null);
        onClose?.();
      }}
      title={`${rupees(cheque.amountPaise)} ${cheque.direction === "in" ? "from" : "to"} ${
        cheque.partyName || "whoever"
      }`}
      subtitle={[cheque.number ? `Cheque no. ${cheque.number}` : null, cheque.bank]
        .filter(Boolean)
        .join(" · ")}
    >
      {cheque.direction === "in" && accounts.length ? (
        <PickerButton
          label="Which account did it go into"
          value={nameOf(account)}
          placeholder="Choose an account"
          hint="Leave it blank and the money counts towards your total but not towards one account."
          onPress={() => setPicking(true)}
        />
      ) : null}

      <Button
        title={busy === "cleared" ? "Marking…" : "It cleared"}
        kind="primary"
        size="lg"
        full
        icon="check"
        busy={busy === "cleared"}
        disabled={Boolean(busy)}
        onPress={() => mark("cleared")}
        style={{ marginTop: space(4) }}
      />

      <Button
        title={busy === "bounced" ? "Marking…" : "It bounced"}
        kind="danger"
        full
        icon="warn"
        busy={busy === "bounced"}
        disabled={Boolean(busy)}
        onPress={() => mark("bounced")}
        style={{ marginTop: space(3) }}
      />

      <Note tone="warn" style={{ marginTop: space(3) }}>
        A bounced cheque puts the bills it was against back to unpaid and the customer owes it again. It
        cannot be un-bounced — if they pay, record that as a new payment.
      </Note>

      {err ? (
        <Note tone="bad" style={{ marginTop: space(3) }}>
          {err}
        </Note>
      ) : null}

      <Choose
        open={picking}
        onClose={() => setPicking(false)}
        title="Which account"
        options={accounts.map((a) => ({
          value: a.id,
          label: a.name,
          note: a.bankName || undefined,
        }))}
        value={account}
        onPick={setAccount}
      />
    </Sheet>
  );
}

const st = StyleSheet.create({
  tab: {
    paddingHorizontal: space(3),
    paddingVertical: space(2),
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.panel,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space(3),
    paddingHorizontal: space(4),
    paddingVertical: space(3.5),
  },
  icon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
});
