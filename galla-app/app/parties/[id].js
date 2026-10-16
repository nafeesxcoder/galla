// ===========================================================================
// ONE CUSTOMER
// ---------------------------------------------------------------------------
// The whole point of this screen is the one number at the top: what this
// person owes, or what you owe them. Everything under it is the evidence for
// that number - bills and payments on one timeline, newest first, so an
// argument about "I paid you last month" settles in about four seconds.
//
// The running balance beside each row is deliberately absent. The server owns
// the balance, and a column of numbers worked out on the phone that disagrees
// with the headline by a rupee is worse than no column at all.
// ===========================================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { Linking, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  Button,
  Card,
  CardHead,
  Divider,
  ErrorState,
  Field,
  Loading,
  Note,
  Pill,
  Row,
  Screen,
  T,
} from "../../components/ui";
import { Choose, PickerButton, Sheet } from "../../components/sheet";
import { Icon } from "../../components/icons";
import { useSession } from "../../lib/session";
import { createPayment, getParty, listInvoices, listPayments } from "../../lib/data";
import { formatDate, relativeDay, rupees, today, toPaise } from "../../lib/money";
import { PAYMENT_MODES, modeLabel } from "../../lib/units";
import { stateName } from "../../lib/gst-states";
import { billTone } from "../../lib/bill-status";
import { colors, space } from "../../lib/theme";

export default function PartyDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { shop } = useSession();

  const [party, setParty] = useState(null);
  const [bills, setBills] = useState([]);
  const [payments, setPayments] = useState([]);
  const [state, setState] = useState({ loading: true, error: null });
  const [paying, setPaying] = useState(false);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, error: null }));
    try {
      const [p, inv, pay] = await Promise.all([
        getParty(id),
        listInvoices({ partyId: id, limit: 100 }),
        listPayments({ partyId: id, limit: 100 }).catch(() => ({ rows: [] })),
      ]);
      setParty(p);
      setBills(inv.rows);
      setPayments(pay.rows);
      setState({ loading: false, error: null });
    } catch (e) {
      setState({ loading: false, error: e });
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // Bills and payments on one timeline. Both carry a date and nothing else in
  // common, so they are tagged on the way in and sorted together.
  const ledger = useMemo(() => {
    const entries = [
      ...bills.map((b) => ({ kind: "bill", date: b.date, data: b })),
      ...payments.map((p) => ({ kind: "payment", date: p.date, data: p })),
    ];
    return entries.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  }, [bills, payments]);

  if (state.error) return <ErrorState error={state.error} onRetry={load} />;
  if (state.loading || !party) return <Loading label="Opening their account…" />;

  const phone = String(party.phone || "").replace(/\D+/g, "").slice(-10);

  return (
    <Screen>
      <Stack.Screen options={{ title: party.name }} />

      {/* ---- the number ---- */}
      <Card>
        <Row>
          <View style={{ flex: 1 }}>
            <T variant="h2">{party.name}</T>
            <T variant="tiny">
              {party.phone || "No number"}
              {party.stateCode ? ` · ${stateName(party.stateCode)}` : ""}
            </T>
          </View>
          <Pill tone={party.isSupplier && !party.isCustomer ? "info" : "paid"}>
            {party.type === "both" ? "Both" : party.isSupplier && !party.isCustomer ? "Supplier" : "Customer"}
          </Pill>
        </Row>

        <View style={{ marginTop: space(4) }}>
          <T variant="tiny">{party.weOwe ? "You owe them" : "They owe you"}</T>
          <T
            style={{
              fontSize: 32,
              fontWeight: "800",
              color: party.owesUs ? colors.danger : party.weOwe ? colors.ink : colors.brandInk,
            }}
            num
          >
            {rupees(party.owesUs || party.weOwe || 0)}
          </T>
          {!party.owesUs && !party.weOwe ? (
            <T variant="tiny">Nothing outstanding either way.</T>
          ) : null}
        </View>

        {party.gstin ? (
          <T variant="tiny" style={{ marginTop: space(3) }}>
            GSTIN {party.gstin}
          </T>
        ) : null}
        {party.address || party.city ? (
          <T variant="tiny">{[party.address, party.city, party.pincode].filter(Boolean).join(", ")}</T>
        ) : null}
      </Card>

      {/* ---- what you came to do ---- */}
      <View style={{ marginTop: space(4), gap: space(2) }}>
        {party.owesUs || party.weOwe ? (
          <Button
            title={party.weOwe ? "Pay them" : "Take a payment"}
            kind="primary"
            size="lg"
            full
            icon={<Icon name="rupee" size={19} color="#fff" />}
            onPress={() => setPaying(true)}
          />
        ) : null}

        <Row gap={2}>
          <Button
            title="New bill"
            style={{ flex: 1 }}
            icon={<Icon name="plus" size={17} />}
            onPress={() => router.push("/(tabs)/billing")}
          />
          {phone.length === 10 ? (
            <>
              <Button
                title="Call"
                style={{ flex: 1 }}
                icon={<Icon name="phone" size={17} />}
                onPress={() => Linking.openURL(`tel:+91${phone}`)}
              />
              <Button
                title="Remind"
                style={{ flex: 1 }}
                icon={<Icon name="share" size={17} />}
                onPress={() => Linking.openURL(reminderUrl(shop?.name, party))}
              />
            </>
          ) : null}
        </Row>
      </View>

      {/* ---- the timeline ---- */}
      <Card style={{ marginTop: space(5) }} pad={false}>
        <View style={{ padding: space(4), paddingBottom: space(2) }}>
          <CardHead title="Everything so far" />
          <T variant="tiny" style={{ marginTop: -space(2) }}>
            {`${bills.length} ${bills.length === 1 ? "bill" : "bills"}, ${payments.length} ${
              payments.length === 1 ? "payment" : "payments"
            }`}
          </T>
        </View>

        {ledger.length ? (
          ledger.map((e, i) =>
            e.kind === "bill" ? (
              <BillRow key={`b${e.data.id}`} bill={e.data} first={i === 0} onPress={() => router.push(`/bills/${e.data.id}`)} />
            ) : (
              <PaymentRow key={`p${e.data.id}`} payment={e.data} first={i === 0} />
            )
          )
        ) : (
          <View style={{ padding: space(6), alignItems: "center" }}>
            <T variant="sub">Nothing on their account yet.</T>
          </View>
        )}
      </Card>

      <PaySheet
        open={paying}
        party={party}
        openBills={bills}
        onClose={() => setPaying(false)}
        onDone={async () => {
          setPaying(false);
          await load();
        }}
      />
    </Screen>
  );
}

function BillRow({ bill, first, onPress }) {
  const { tone, label } = billTone(bill);
  return (
    <View>
      {first ? null : <Divider />}
      <Row style={{ paddingHorizontal: space(4), paddingVertical: space(3) }}>
        <View style={{ flex: 1 }}>
          <Row gap={2}>
            <T style={{ fontWeight: "650" }}>{bill.number}</T>
            <Pill tone={tone}>{label}</Pill>
          </Row>
          <T variant="tiny">{relativeDay(bill.date)}</T>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <T style={{ fontWeight: "700" }} num>
            {rupees(bill.amounts.total)}
          </T>
          {bill.amounts.balance > 0 && bill.status !== "cancelled" ? (
            <T variant="tiny" style={{ color: colors.danger }} num>
              {`${rupees(bill.amounts.balance)} due`}
            </T>
          ) : null}
        </View>
        <Button title="Open" kind="ghost" size="sm" onPress={onPress} />
      </Row>
    </View>
  );
}

function PaymentRow({ payment, first }) {
  const incoming = payment.direction === "in";
  return (
    <View>
      {first ? null : <Divider />}
      <Row style={{ paddingHorizontal: space(4), paddingVertical: space(3), backgroundColor: colors.brandSoft }}>
        <Icon name="check" size={18} color={colors.brandInk} />
        <View style={{ flex: 1 }}>
          <T style={{ fontWeight: "650", color: colors.brandInk }}>
            {incoming ? "Payment received" : "Payment made"}
          </T>
          <T variant="tiny">
            {formatDate(payment.date)} {"·"} {modeLabel(payment.mode)}
          </T>
        </View>
        <T style={{ fontWeight: "700", color: colors.brandInk }} num>
          {rupees(payment.amountPaise)}
        </T>
      </Row>
    </View>
  );
}

// A message, not an integration. It opens WhatsApp with the reminder typed
// out and the shopkeeper presses send - which is also the polite way round,
// because an app that sends payment reminders by itself will eventually send
// one to the wrong person.
function reminderUrl(shopName, party) {
  const text = [
    `${shopName || "Our shop"}`,
    party.weOwe
      ? `We owe you ${rupees(party.weOwe)}.`
      : `Your outstanding balance is ${rupees(party.owesUs)}.`,
    party.weOwe ? "We will settle it shortly." : "Please clear it when you can. Thank you.",
  ].join("\n");
  const digits = String(party.phone || "").replace(/\D+/g, "").slice(-10);
  return `https://wa.me/${digits.length === 10 ? `91${digits}` : ""}?text=${encodeURIComponent(text)}`;
}

// ---------------------------------------------------------------------------
// money in or out, against the account rather than one bill
// ---------------------------------------------------------------------------
function PaySheet({ open, party, openBills = [], onClose, onDone }) {
  const due = party.owesUs || party.weOwe || 0;
  const outgoing = party.weOwe > 0;

  // Oldest unpaid bill first. Without this the money sits on the account as
  // an unallocated credit: the customer's balance drops, but every bill still
  // reads "₹473 due", and the shopkeeper quite reasonably concludes the app
  // has lost their money. Settling the oldest first is also what a shopkeeper
  // does on paper.
  const unpaid = useMemo(
    () =>
      openBills
        .filter((b) => b.status !== "cancelled" && b.docType !== "estimate" && b.amounts.balance > 0)
        // Same-day bills are common, so the id breaks the tie - a lower id
        // is the earlier bill. Without it "oldest first" quietly becomes
        // "whatever order the server listed them in", which is newest first.
        .sort((a, b) => String(a.date).localeCompare(String(b.date)) || a.id - b.id),
    [openBills]
  );

  const [amount, setAmount] = useState(String(due / 100));
  const [mode, setMode] = useState("cash");
  const [picking, setPicking] = useState(false);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (open) {
      setAmount(String(due / 100));
      setNotes("");
      setErr(null);
    }
  }, [open, due]);

  const paise = Math.max(0, toPaise(amount));

  async function save() {
    setErr(null);
    if (!paise) return setErr("Enter how much.");
    setBusy(true);
    try {
      // Spread it across the open bills, oldest first, until it runs out.
      // Anything left over stays on the account as credit, which is the right
      // answer for somebody paying in advance.
      const allocations = [];
      let left = paise;
      for (const b of unpaid) {
        if (left <= 0) break;
        const take = Math.min(left, b.amounts.balance);
        allocations.push({ invoiceId: b.id, amount: take / 100 });
        left -= take;
      }

      await createPayment({
        direction: outgoing ? "out" : "in",
        partyId: party.id,
        amountRupees: paise / 100,
        mode,
        date: today(),
        notes: notes.trim() || undefined,
        allocations: allocations.length ? allocations : undefined,
      });
      onDone();
    } catch (e) {
      setErr(e.isOffline ? "Could not reach the server. Nothing was recorded." : e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={outgoing ? "Pay them" : "Take a payment"}
      subtitle={`${party.name} · ${rupees(due)} outstanding`}
      footer={<Button title="Record it" kind="primary" size="lg" full busy={busy} onPress={save} />}
    >
      {err ? <Note tone="bad" style={{ marginBottom: space(4) }}>{err}</Note> : null}

      <Card>
        <Field
          label="Amount"
          required
          prefix="₹"
          value={amount}
          onChangeText={(v) => setAmount(v.replace(/[^\d.]/g, ""))}
          keyboardType="decimal-pad"
          inputMode="decimal"
          autoFocus
        />
        <Row gap={2} style={{ marginTop: space(3) }}>
          <Button title="All of it" size="sm" onPress={() => setAmount(String(due / 100))} />
          <Button title="Half" size="sm" onPress={() => setAmount(String(Math.round(due / 2) / 100))} />
        </Row>

        <PickerButton
          label="How"
          style={{ marginTop: space(4) }}
          value={modeLabel(mode)}
          onPress={() => setPicking(true)}
        />

        <Field
          label="Note"
          style={{ marginTop: space(4) }}
          value={notes}
          onChangeText={setNotes}
          placeholder="Against last month's bills"
          maxLength={200}
        />
      </Card>

      <Note tone="info" style={{ marginTop: space(4) }}>
        {unpaid.length
          ? `This clears their oldest bills first — ${unpaid
              .slice(0, 2)
              .map((b) => b.number)
              .join(", ")}${unpaid.length > 2 ? ` and ${unpaid.length - 2} more` : ""}. Anything left over stays on their account as credit.`
          : "There are no unpaid bills, so this stays on their account as credit."}
      </Note>

      <Choose
        open={picking}
        onClose={() => setPicking(false)}
        title="How was it paid?"
        value={mode}
        options={PAYMENT_MODES}
        onPick={setMode}
      />
    </Sheet>
  );
}
