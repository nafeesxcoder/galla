// ===========================================================================
// ONE BILL
// ---------------------------------------------------------------------------
// Opened for three reasons: to print it again, to take the money that is
// still owed on it, or to find out what went wrong. So those are the three
// things on the screen, in that order, and everything else is detail below.
//
// A bill is never deleted or edited. It is cancelled, which leaves the number
// in the book with a line through it and puts the stock back. That is what
// the GST rules expect and it is also the only version a shopkeeper can
// defend six months later.
// ===========================================================================

import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
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
import { Sheet, Choose, PickerButton } from "../../components/sheet";
import { Icon } from "../../components/icons";
import { useSession } from "../../lib/session";
import { cancelInvoice, createPayment, getBusiness, getInvoice, getParty } from "../../lib/data";
import { formatDateLong, formatQty, paiseToWords, rupees, today, toPaise } from "../../lib/money";
import { PAYMENT_MODES, modeLabel, unitShort } from "../../lib/units";
import { openWhatsapp, printInvoice, shareInvoice } from "../../lib/print";
import { colors, space } from "../../lib/theme";
import { DOC_LABEL, billTone } from "../../lib/bill-status";

export default function BillDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { shop, businessId } = useSession();

  const [bill, setBill] = useState(null);
  const [party, setParty] = useState(null);
  const [shopFull, setShopFull] = useState(null);
  const [state, setState] = useState({ loading: true, error: null });
  const [sheet, setSheet] = useState(null); // pay | cancel
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, error: null }));
    try {
      const b = await getInvoice(id);
      setBill(b);
      setState({ loading: false, error: null });
      if (b?.partyId) getParty(b.partyId).then(setParty).catch(() => {});
    } catch (e) {
      setState({ loading: false, error: e });
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!businessId) return;
    getBusiness(businessId).then(setShopFull).catch(() => {});
  }, [businessId]);

  if (state.error) return <ErrorState error={state.error} onRetry={load} />;
  if (state.loading || !bill) return <Loading label="Opening the bill…" />;

  const { tone, label } = billTone(bill);
  const cancelled = bill.status === "cancelled" || Boolean(bill.cancelledAt);
  const a = bill.amounts;

  const paperArgs = (size = "a4") => ({
    invoice: bill,
    shop: shopFull || shop,
    party,
    lines: bill.lines,
    size,
    copyLabel: "Customer copy",
  });

  const run = async (what, fn) => {
    setBusy(what);
    try {
      await fn();
    } catch {
      /* the bill is unchanged; nothing to undo */
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: bill.number || "Bill" }} />

      {/* ---- the headline ---- */}
      <Card>
        <Row>
          <View style={{ flex: 1 }}>
            <T variant="h2">{bill.number}</T>
            <T variant="tiny">
              {formatDateLong(bill.date)}
              {bill.docType !== "sale" ? ` · ${DOC_LABEL[bill.docType] || bill.docType}` : ""}
            </T>
          </View>
          <Pill tone={tone}>{label}</Pill>
        </Row>

        <T style={{ fontSize: 30, fontWeight: "800", marginTop: space(3) }} num>
          {rupees(a.total)}
        </T>
        <T variant="tiny">{paiseToWords(a.total)}</T>

        {a.balance > 0 && !cancelled ? (
          <Note tone="warn" style={{ marginTop: space(3) }}>
            {`${rupees(a.balance)} still to collect${party?.name ? ` from ${party.name}` : ""}.`}
          </Note>
        ) : null}
        {cancelled ? (
          <Note tone="bad" style={{ marginTop: space(3) }}>
            This bill was cancelled. The stock went back and the customer no longer owes it.
          </Note>
        ) : null}
      </Card>

      {/* ---- what you came here to do ---- */}
      {!cancelled ? (
        <View style={{ marginTop: space(4), gap: space(2) }}>
          {a.balance > 0 ? (
            <Button
              title={`Take ${rupees(a.balance)}`}
              kind="primary"
              size="lg"
              full
              icon={<Icon name="rupee" size={19} color="#fff" />}
              onPress={() => setSheet("pay")}
            />
          ) : null}

          <Row gap={2}>
            <Button
              title="Print"
              style={{ flex: 1 }}
              busy={busy === "print"}
              icon={<Icon name="print" size={17} />}
              onPress={() => run("print", () => printInvoice(paperArgs("a4")))}
            />
            <Button
              title="Counter roll"
              style={{ flex: 1 }}
              busy={busy === "roll"}
              icon={<Icon name="print" size={17} />}
              onPress={() => run("roll", () => printInvoice(paperArgs("thermal")))}
            />
          </Row>

          <Row gap={2}>
            <Button
              title="Send the PDF"
              style={{ flex: 1 }}
              busy={busy === "share"}
              icon={<Icon name="share" size={17} />}
              onPress={() => run("share", () => shareInvoice(paperArgs("a4")))}
            />
            {party?.phone ? (
              <Button
                title="WhatsApp"
                style={{ flex: 1 }}
                icon={<Icon name="phone" size={17} />}
                onPress={() => openWhatsapp({ shopName: shop?.name, invoice: bill, party })}
              />
            ) : null}
          </Row>

          {bill.docType === "estimate" ? (
            <Button
              title="Turn this into a bill"
              size="lg"
              full
              icon={<Icon name="bill" size={18} />}
              onPress={() => router.push(`/(tabs)/billing?from=${bill.id}`)}
            />
          ) : null}
        </View>
      ) : null}

      {/* ---- who ---- */}
      <Card style={{ marginTop: space(5) }}>
        <CardHead title={bill.docType === "purchase" ? "Supplier" : "Customer"} />
        <T style={{ fontWeight: "650" }}>{bill.partyName || "Walk-in customer"}</T>
        {bill.partyPhone ? <T variant="tiny">{bill.partyPhone}</T> : null}
        {bill.partyGstin ? <T variant="tiny">GSTIN {bill.partyGstin}</T> : null}
        {party ? (
          <Button
            title="Open their account"
            kind="ghost"
            size="sm"
            style={{ alignSelf: "flex-start", marginTop: space(2) }}
            onPress={() => router.push(`/parties/${party.id}`)}
          />
        ) : null}
      </Card>

      {/* ---- the lines ---- */}
      <Card style={{ marginTop: space(4) }} pad={false}>
        <View style={{ padding: space(4), paddingBottom: space(2) }}>
          <T variant="h2">{`${bill.lines.length} ${bill.lines.length === 1 ? "item" : "items"}`}</T>
        </View>
        {bill.lines.map((l, i) => (
          <View key={l.id || i}>
            {i ? <Divider /> : null}
            <View style={{ paddingHorizontal: space(4), paddingVertical: space(3) }}>
              <Row style={{ alignItems: "flex-start" }}>
                <View style={{ flex: 1 }}>
                  <T style={{ fontWeight: "600" }}>{l.name}</T>
                  <T variant="tiny">
                    {`${formatQty(l.quantity)} ${unitShort(l.unit)} × ${rupees(l.ratePaise)}`}
                    {l.taxRate ? ` · ${l.taxRate}% GST` : ""}
                  </T>
                  {l.batchNo ? (
                    <T variant="tiny">
                      {`Batch ${l.batchNo}`}
                      {l.expiryDate ? ` · expires ${l.expiryDate}` : ""}
                    </T>
                  ) : null}
                </View>
                <T style={{ fontWeight: "700" }} num>
                  {rupees(l.totalPaise)}
                </T>
              </Row>
            </View>
          </View>
        ))}
      </Card>

      {/* ---- the arithmetic ---- */}
      <Card style={{ marginTop: space(4) }}>
        <Line label="Taxable value" value={rupees(a.taxable)} />
        {a.discount ? <Line label="Discount" value={`- ${rupees(a.discount)}`} /> : null}
        {bill.interState ? (
          a.igst ? <Line label="IGST" value={rupees(a.igst)} /> : null
        ) : (
          <>
            {a.cgst ? <Line label="CGST" value={rupees(a.cgst)} /> : null}
            {a.sgst ? <Line label="SGST" value={rupees(a.sgst)} /> : null}
          </>
        )}
        {a.roundOff ? <Line label="Round off" value={rupees(a.roundOff)} /> : null}
        <Divider style={{ marginVertical: space(2) }} />
        <Row>
          <T style={{ flex: 1, fontWeight: "700" }}>Total</T>
          <T style={{ fontSize: 19, fontWeight: "800" }} num>
            {rupees(a.total)}
          </T>
        </Row>
        {a.paid ? <Line label="Paid" value={rupees(a.paid)} /> : null}
        {a.balance > 0 ? <Line label="Pending" value={rupees(a.balance)} bad /> : null}
      </Card>

      {bill.notes ? (
        <Card style={{ marginTop: space(4) }}>
          <CardHead title="Note" />
          <T>{bill.notes}</T>
        </Card>
      ) : null}

      {!cancelled ? (
        <Button
          title="Cancel this bill"
          kind="danger"
          full
          style={{ marginTop: space(6) }}
          icon={<Icon name="close" size={17} color={colors.danger} />}
          onPress={() => setSheet("cancel")}
        />
      ) : null}

      <PaySheet
        open={sheet === "pay"}
        bill={bill}
        party={party}
        onClose={() => setSheet(null)}
        onDone={async () => {
          setSheet(null);
          await load();
        }}
      />

      <CancelSheet
        open={sheet === "cancel"}
        bill={bill}
        onClose={() => setSheet(null)}
        onDone={async () => {
          setSheet(null);
          await load();
        }}
      />
    </Screen>
  );
}

function Line({ label, value, bad }) {
  return (
    <Row style={{ paddingVertical: 3 }}>
      <T variant="sub" style={{ flex: 1 }}>
        {label}
      </T>
      <T style={bad ? { color: colors.danger, fontWeight: "700" } : undefined} num>
        {value}
      </T>
    </Row>
  );
}

// ---------------------------------------------------------------------------
// taking the money
// ---------------------------------------------------------------------------
// Allocated against this bill rather than left floating on the customer's
// account, so the bill itself goes from unpaid to paid instead of the balance
// quietly moving somewhere else.
function PaySheet({ open, bill, party, onClose, onDone }) {
  const due = bill.amounts.balance;
  const [amount, setAmount] = useState(String(due / 100));
  const [mode, setMode] = useState("cash");
  const [date, setDate] = useState(() => today());
  const [picking, setPicking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (open) {
      setAmount(String(due / 100));
      setErr(null);
      setDate(today());
    }
  }, [open, due]);

  const paise = Math.max(0, toPaise(amount));
  const tooMuch = paise > due;

  async function save() {
    setErr(null);
    if (!paise) return setErr("Enter how much came in.");
    if (tooMuch) return setErr(`That is more than the ${rupees(due)} outstanding on this bill.`);

    setBusy(true);
    try {
      await createPayment({
        direction: bill.docType === "purchase" || bill.docType === "debit_note" ? "out" : "in",
        partyId: bill.partyId || undefined,
        amountRupees: paise / 100,
        mode,
        date,
        allocations: [{ invoiceId: bill.id, amount: paise / 100 }],
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
      title="Take a payment"
      subtitle={`${bill.number} · ${rupees(due)} outstanding`}
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
          error={tooMuch ? "More than what is owed on this bill" : undefined}
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
      </Card>

      {party ? (
        <T variant="tiny" style={{ marginTop: space(3) }}>
          {party.owesUs
            ? `${party.name} owes ${rupees(party.owesUs)} in total across all bills.`
            : `${party.name} has nothing else outstanding.`}
        </T>
      ) : null}

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

// ---------------------------------------------------------------------------
// cancelling
// ---------------------------------------------------------------------------
function CancelSheet({ open, bill, onClose, onDone }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (open) {
      setReason("");
      setErr(null);
    }
  }, [open]);

  async function go() {
    setBusy(true);
    setErr(null);
    try {
      await cancelInvoice(bill.id, reason.trim() || undefined);
      onDone();
    } catch (e) {
      setErr(e.isOffline ? "Could not reach the server. The bill is unchanged." : e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Cancel this bill"
      subtitle={bill.number}
      footer={
        <Button title="Yes, cancel it" kind="danger" size="lg" full busy={busy} onPress={go} />
      }
    >
      {err ? <Note tone="bad" style={{ marginBottom: space(4) }}>{err}</Note> : null}

      <Note tone="warn" title="What this does">
        The bill number stays in your books with a line through it, the stock goes back on the shelf, and the
        customer stops owing it. Nothing is deleted — that is what the GST rules expect, and it is the version you
        can show somebody six months from now.
      </Note>

      <Card style={{ marginTop: space(4) }}>
        <Field
          label="Why"
          value={reason}
          onChangeText={setReason}
          placeholder="Customer returned everything"
          maxLength={200}
          hint="Not compulsory, but your future self will want it."
        />
      </Card>
    </Sheet>
  );
}
