// ===========================================================================
// MAKING A BILL
// ---------------------------------------------------------------------------
// The screen the product is judged on. The rule it is built to: a shopkeeper
// with four items and a queue gets from an empty screen to a printed bill in
// well under a minute, with one thumb, without waiting for the network
// between taps.
//
// So the totals are worked out on the device as you type, and the server is
// asked once, when you save. The server's answer is then what is shown and
// printed - the on-device arithmetic is a preview and never the record.
//
// One thing worth knowing about saving. The bill and the payment are two
// requests. The bill itself is atomic on the server: number, lines, stock and
// the customer's balance all commit together or not at all. The payment is
// recorded straight after. If the payment call fails the bill still exists
// and is simply unpaid, and the screen says so and offers to take it again.
// That is recoverable. Half a bill would not be.
// ===========================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Card, CardHead, Divider, Field, MoneyField, Note, Row, Screen, T } from "../../components/ui";
import { Choose, PickerButton, Sheet } from "../../components/sheet";
import { ItemPicker, PartyPicker, findByCode } from "../../components/pickers";
import { Scanner } from "../../components/scanner";
import { ItemQuickForm, PartyQuickForm } from "../../components/forms";
import { Icon } from "../../components/icons";
import PlanBanner from "../../components/plan-banner";
import { useSession } from "../../lib/session";
import { useShopDefaults } from "../../lib/shop-prefs";
import { computeTotals, isInterState, TAX_RATES } from "../../lib/gst-calc";
import { formatDate, formatQty, paiseToWords, rupees, today, toPaise } from "../../lib/money";
import { PAYMENT_MODES, modeLabel, unitShort } from "../../lib/units";
import { createInvoice, createPayment, getBusiness, getInvoice, getParty } from "../../lib/data";
import { openWhatsapp, printInvoice, shareInvoice } from "../../lib/print";
import { colors, radius, space, TAP, wide } from "../../lib/theme";

const DOC_TYPES = [
  { value: "sale", label: "Sale", note: "Stock goes down, the customer owes you." },
  { value: "purchase", label: "Purchase", note: "Stock goes up, you owe the supplier." },
  { value: "estimate", label: "Estimate", note: "A quote. Nothing moves until you turn it into a bill." },
  { value: "credit_note", label: "Sales return", note: "A customer returned something. Stock comes back." },
  { value: "debit_note", label: "Purchase return", note: "You returned something to a supplier." },
];

let keyCounter = 0;

function lineFromItem(item) {
  return {
    key: `l${++keyCounter}`,
    itemId: item.id,
    name: item.name,
    hsn: item.hsn,
    unit: item.unit,
    type: item.type,
    stock: item.type === "service" ? null : item.stock,
    quantity: "1",
    rate: item.salePaise ? String(item.salePaise / 100) : "",
    discountPercent: "",
    taxRate: item.taxRate ?? 0,
    taxIncluded: Boolean(item.taxIncluded),
  };
}

// Re-opening a saved line, which is what converting an estimate into a bill
// means. The one thing that cannot be read straight off it is whether the
// rate included the tax, because the server stores the result rather than the
// setting. So it is worked backwards: if the taxable value plus the tax comes
// to what was charged, the rate was inclusive; if the taxable value alone
// does, it was not. Getting this wrong would quietly change the total between
// the estimate the customer was given and the bill they are handed.
function lineFromSaved(l) {
  const gross = Math.round(l.ratePaise * l.quantity) - (l.discountPaise || 0);
  const tax = (l.cgstPaise || 0) + (l.sgstPaise || 0) + (l.igstPaise || 0);
  const inclusive = Math.abs(gross - ((l.taxablePaise || 0) + tax)) <= 2;

  return {
    key: `l${++keyCounter}`,
    itemId: l.itemId,
    name: l.name,
    hsn: l.hsn,
    unit: l.unit,
    type: "goods",
    // The saved line does not carry the item's stock, and a stale figure
    // would be worse than none.
    stock: null,
    quantity: String(l.quantity),
    rate: l.ratePaise ? String(l.ratePaise / 100) : "",
    discountPercent: "",
    taxRate: l.taxRate ?? 0,
    taxIncluded: inclusive,
  };
}

const numeric = (v) => String(v ?? "").replace(/[^\d.]/g, "");

// ===========================================================================
export default function Billing() {
  const { shop, businessId } = useSession();
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const convertFrom = params?.from ? String(params.from) : null;

  // The menu opens this screen for a particular kind of document - a
  // purchase, a sales return - so the type has to come from the link rather
  // than always starting at "sale" and making the shopkeeper change it.
  //
  // Read once, as the initial state, NOT in an effect. An effect that set it
  // from the params would fight the picker: change the type by hand, the
  // params are still on the URL, and the next render puts it back.
  const [docType, setDocType] = useState(() => {
    const wanted = String(params?.docType || "");
    return DOC_TYPES.some((d) => d.value === wanted) ? wanted : "sale";
  });
  const [party, setParty] = useState(null);
  const [date, setDate] = useState(() => today());
  const [lines, setLines] = useState([]);
  const [extraDiscount, setExtraDiscount] = useState("");
  const [notes, setNotes] = useState("");
  const [showExtras, setShowExtras] = useState(false);

  const [received, setReceived] = useState("");
  const [touchedReceived, setTouchedReceived] = useState(false);
  // Seeded from the shop's usual way of being paid. A shop paid by UPI nine
  // times out of ten should not change this on every bill.
  const shopDefaults = useShopDefaults();
  const [mode, setMode] = useState("cash");
  const [modeTouched, setModeTouched] = useState(false);

  const [sheet, setSheet] = useState(null); // items | party | doctype | date | mode | line
  const [newItemName, setNewItemName] = useState(null);
  const [newPartyName, setNewPartyName] = useState(null);
  const [editing, setEditing] = useState(null); // index of the line being edited

  const [busy, setBusy] = useState(false);
  const [convertedFrom, setConvertedFrom] = useState(null);
  const [saved, setSaved] = useState(null);
  const [paymentFailed, setPaymentFailed] = useState(false);
  const [err, setErr] = useState(null);

  // Below every piece of state it reads, not beside the one it writes. Put
  // next to setMode it referenced `saved` before the line that declares it -
  // a temporal dead zone, and a ReferenceError on every single render.
  useEffect(() => {
    // Only until somebody picks a mode by hand. After that the preference
    // has had its say and must not override the person at the till.
    if (!modeTouched && !saved && shopDefaults.paymentMode) setMode(shopDefaults.paymentMode);
  }, [shopDefaults.paymentMode, modeTouched, saved]);

  const isPurchaseSide = docType === "purchase" || docType === "debit_note";

  // The tab bar only knows the shop's name. A printed tax invoice needs its
  // address and GSTIN too, so the full record is fetched once.
  const [shopFull, setShopFull] = useState(null);
  useEffect(() => {
    if (!businessId) return undefined;
    let alive = true;
    getBusiness(businessId)
      .then((b) => alive && setShopFull(b))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [businessId]);

  // Arriving from "make this estimate a bill".
  useEffect(() => {
    if (!convertFrom) return undefined;
    let alive = true;
    (async () => {
      try {
        const src = await getInvoice(convertFrom);
        if (!alive || !src) return;
        setLines((src.lines || []).map(lineFromSaved));
        setNotes(src.notes || "");
        setConvertedFrom({ id: src.id, number: src.number });
        if (src.partyId) {
          try {
            setParty(await getParty(src.partyId));
          } catch {
            /* it still converts without the customer's balance */
          }
        }
      } catch (e) {
        setErr(e.isOffline ? "Could not reach the server." : e.message);
      }
    })();
    return () => {
      alive = false;
    };
  }, [convertFrom]);

  // Coming back to the tab after a finished bill should offer a blank one,
  // not the receipt for the last sale.
  //
  // The saved bill is read through a ref rather than listed as a dependency.
  // As a dependency it wipes the receipt the instant it appears: saving sets
  // the state, the dependency changes, the effect runs again and resets the
  // screen. Through a ref the effect only ever runs when the tab is actually
  // focused again, which is what was meant.
  const savedRef = useRef(null);
  savedRef.current = saved;
  useFocusEffect(
    useCallback(() => {
      if (savedRef.current) reset();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  // ---- the arithmetic ----------------------------------------------------
  const interState = useMemo(
    () => isInterState(shop?.stateCode || shopFull?.stateCode, party?.stateCode),
    [shop?.stateCode, shopFull?.stateCode, party]
  );

  const computed = useMemo(
    () =>
      computeTotals(
        lines.map((l) => ({
          quantity: Number(l.quantity) || 0,
          ratePaise: toPaise(l.rate),
          taxRate: Number(l.taxRate) || 0,
          discountPercent: Number(l.discountPercent) || 0,
          taxIncluded: l.taxIncluded,
        })),
        { interState, extraDiscountPaise: toPaise(extraDiscount) }
      ),
    [lines, interState, extraDiscount]
  );

  // A sale is taken as paid in full unless the shopkeeper says otherwise.
  // That is what happens at a counter nine times out of ten, and the one
  // time it does not, one tap on "Credit" fixes it.
  useEffect(() => {
    if (touchedReceived || saved || docType === "estimate") return;
    setReceived(computed.total ? String(computed.total / 100) : "");
  }, [computed.total, touchedReceived, saved, docType]);

  const receivedPaise = Math.max(0, toPaise(received));
  const duePaise = Math.max(0, computed.total - receivedPaise);
  const overpaid = receivedPaise > computed.total;

  // ---- lines -------------------------------------------------------------
  function addItem(item) {
    setLines((prev) => {
      // The same item twice means "two of them", not two lines. Scanning a
      // barcode three times should read as quantity 3.
      const at = prev.findIndex((l) => l.itemId === item.id);
      if (at >= 0) {
        const next = [...prev];
        next[at] = { ...next[at], quantity: String((Number(next[at].quantity) || 0) + 1) };
        return next;
      }
      return [...prev, lineFromItem(item)];
    });
  }

  // A scanned code goes through exactly the same lookup as a typed one. If
  // nothing matches, the code itself becomes the name of a new item - which
  // is right, because the shopkeeper is holding the thing and can fill in the
  // rest in ten seconds.
  async function scanned(code) {
    const hit = await findByCode(code);
    if (hit) {
      addItem(hit);
      return;
    }
    setSheet(null);
    setNewItemName(code);
  }

  function changeLine(i, patch) {
    setLines((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], ...patch };
      return next;
    });
  }

  function removeLine(i) {
    setLines((prev) => prev.filter((_, x) => x !== i));
  }

  function reset() {
    setLines([]);
    setParty(null);
    setExtraDiscount("");
    setNotes("");
    setReceived("");
    setTouchedReceived(false);
    setSaved(null);
    setConvertedFrom(null);
    setPaymentFailed(false);
    setErr(null);
    setShowExtras(false);
    setDate(today());
    setDocType("sale");
  }

  // ---- saving ------------------------------------------------------------
  async function save(thenPrint) {
    if (busy || saved) return;
    setErr(null);

    if (!lines.length) return setErr("Add something to the bill first.");
    if (overpaid) return setErr("That is more than the bill. Check the amount received.");
    // Credit with nobody's name against it is money you will never see
    // again, so this one is worth refusing.
    if (!party && duePaise > 0 && docType !== "estimate") {
      setErr("A bill left unpaid needs a name against it. Choose a customer, or mark it paid.");
      return;
    }

    setBusy(true);
    try {
      // Two things worth knowing about this payload.
      //
      // The date field is issueDate. Sent as `date` it is silently ignored
      // and every bill quietly gets today's date instead.
      //
      // There is no bill-level discount on the server, and there should not
      // be: a flat amount knocked off after tax would make the GST on the
      // bill wrong, and that is the number the department checks. So the
      // bill discount is spread across the lines in proportion to their
      // value - exactly as the preview on screen already did it - and sent
      // per line. A line carries a percentage or an amount but never both,
      // so everything goes as an amount.
      const payload = {
        docType,
        issueDate: date,
        lines: lines.map((l, i) => {
          // c.discount already carries this line's own discount plus its
          // share of the bill discount.
          const c = computed.lines[i] || {};
          const line = {
            itemId: l.itemId,
            quantity: Number(l.quantity) || 0,
            rate: Number(l.rate) || 0,
            taxRate: Number(l.taxRate) || 0,
            priceIncludesTax: Boolean(l.taxIncluded),
          };
          if ((c.discount || 0) > 0) line.discountAmount = c.discount / 100;
          return line;
        }),
      };
      if (party) payload.partyId = party.id;
      if (notes.trim()) payload.notes = notes.trim();
      if (convertedFrom) payload.convertedFromId = Number(convertedFrom.id);

      const invoice = await createInvoice(payload);

      let failed = false;
      if (receivedPaise > 0 && docType !== "estimate") {
        try {
          await createPayment({
            direction: isPurchaseSide ? "out" : "in",
            partyId: party ? party.id : undefined,
            amountRupees: receivedPaise / 100,
            mode,
            date,
            allocations: [{ invoiceId: invoice.id, amount: receivedPaise / 100 }],
          });
        } catch {
          failed = true;
        }
      }

      // From here on the screen and the paper show the server's own total,
      // not the preview. The paid figure is folded in because the payment
      // was a second call and the invoice handed back predates it.
      const paid = failed ? 0 : Math.min(receivedPaise, invoice.amounts.total);
      setPaymentFailed(failed);
      setSaved({
        ...invoice,
        amounts: { ...invoice.amounts, paid, balance: Math.max(0, invoice.amounts.total - paid) },
      });

      if (thenPrint && !failed) {
        try {
          await printInvoice(printArgs(invoice, paid));
        } catch {
          /* the bill is saved either way; the receipt can be printed again */
        }
      }
    } catch (e) {
      setErr(e.isOffline ? "Could not reach the server. The bill has not been saved." : e.message);
    } finally {
      setBusy(false);
    }
  }

  // What the printer gets. If the server sent the lines back with the saved
  // bill those are used; otherwise the amounts come from the same
  // computation the screen showed, so paper and screen cannot disagree.
  const printArgs = (invoice, paid) => ({
    invoice: {
      ...invoice,
      amounts: {
        ...invoice.amounts,
        paid: paid ?? invoice.amounts.paid,
        balance: Math.max(0, invoice.amounts.total - (paid ?? invoice.amounts.paid ?? 0)),
      },
    },
    shop: shopFull || shop,
    party,
    lines: lines.map((l, i) => {
      const c = computed.lines[i] || {};
      return {
        name: l.name,
        hsn: l.hsn,
        unit: l.unit,
        quantity: Number(l.quantity) || 0,
        ratePaise: toPaise(l.rate),
        taxRate: Number(l.taxRate) || 0,
        taxablePaise: c.taxable || 0,
        cgstPaise: c.cgst || 0,
        sgstPaise: c.sgst || 0,
        igstPaise: c.igst || 0,
        totalPaise: c.total || 0,
      };
    }),
    copyLabel: "Customer copy",
  });

  const doc = DOC_TYPES.find((d) => d.value === docType);
  const partyNoun = isPurchaseSide ? "Supplier" : "Customer";

  // ========================================================================
  return (
    <View style={[{ flex: 1, backgroundColor: colors.bg }, wide]}>
      <Screen style={{ paddingBottom: 140 }}>
        {/* The screen where the refusal would land, so the warning belongs
            here most of all. */}
        <PlanBanner />
        {err ? (
          <Note tone="bad" style={{ marginBottom: space(4) }}>
            {err}
          </Note>
        ) : null}

        {convertedFrom ? (
          <Note tone="info" style={{ marginBottom: space(4) }}>
            {`Made from estimate ${convertedFrom.number}. Change anything before saving — the estimate itself is left alone.`}
          </Note>
        ) : null}

        {/* ---- what kind of bill, and when ---- */}
        <Row gap={3} style={{ marginBottom: space(2) }}>
          <PickerButton
            style={{ flex: 1 }}
            label="Bill type"
            value={doc?.label}
            onPress={() => setSheet("doctype")}
          />
          <PickerButton
            style={{ width: 132 }}
            label="Date"
            value={date === today() ? "Today" : formatDate(date)}
            onPress={() => setSheet("date")}
          />
        </Row>
        <T variant="tiny" style={{ marginBottom: space(4) }}>
          {doc?.note}
        </T>

        {/* ---- who ---- */}
        <PickerButton
          label={partyNoun}
          value={party?.name}
          placeholder="Walk-in — tap to choose"
          onPress={() => setSheet("party")}
          right={
            party ? (
              <Pressable onPress={() => setParty(null)} hitSlop={10} accessibilityLabel="Clear">
                <Icon name="close" size={18} color={colors.ink3} />
              </Pressable>
            ) : undefined
          }
          hint={
            party?.owesUs
              ? `Already owes you ${rupees(party.owesUs)}`
              : party?.weOwe
              ? `You owe them ${rupees(party.weOwe)}`
              : undefined
          }
        />

        {/* ---- the lines ---- */}
        <View style={{ marginTop: space(5) }}>
          {lines.length ? (
            <Card pad={false}>
              {lines.map((l, i) => (
                <LineRow
                  key={l.key}
                  line={l}
                  computed={computed.lines[i] || {}}
                  first={i === 0}
                  takesStock={docType === "sale" || docType === "debit_note"}
                  onQty={(q) => changeLine(i, { quantity: q })}
                  onOpen={() => setEditing(i)}
                  onRemove={() => removeLine(i)}
                />
              ))}
            </Card>
          ) : (
            <Card style={{ alignItems: "center", paddingVertical: space(8) }}>
              <Icon name="box" size={34} color={colors.ink3} />
              <T variant="h2" style={{ marginTop: space(2) }}>
                Nothing on the bill yet
              </T>
              <T variant="sub" style={{ textAlign: "center", marginTop: space(1) }}>
                Search for an item, or scan it.
              </T>
            </Card>
          )}

          <Row gap={2} style={{ marginTop: space(3) }}>
            <Button
              title={lines.length ? "Add another item" : "Add an item"}
              kind={lines.length ? "default" : "primary"}
              size="lg"
              style={{ flex: 1 }}
              icon={<Icon name="plus" size={20} color={lines.length ? colors.ink : "#fff"} />}
              onPress={() => setSheet("items")}
            />
            <Button
              title="Scan"
              size="lg"
              icon={<Icon name="camera" size={19} />}
              onPress={() => setSheet("scan")}
            />
          </Row>
        </View>

        {/* ---- discount and note ---- */}
        {lines.length ? (
          <>
            <Button
              title={showExtras ? "Hide discount and note" : "Discount or a note on the bill"}
              kind="ghost"
              icon={<Icon name={showExtras ? "down" : "chevron"} size={16} />}
              onPress={() => setShowExtras((v) => !v)}
              style={{ marginTop: space(3), alignSelf: "flex-start" }}
            />
            {showExtras ? (
              <Card>
                <MoneyField
                  label="Discount on the whole bill"
                  value={extraDiscount}
                  onChangeText={(v) => setExtraDiscount(numeric(v))}
                  hint="Spread across the lines so the GST stays right."
                />
                <Field
                  label="Note on the bill"
                  style={{ marginTop: space(4) }}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Anything you want printed on it"
                  maxLength={300}
                />
              </Card>
            ) : null}
          </>
        ) : null}

        {/* ---- the totals ---- */}
        {lines.length ? (
          <Card style={{ marginTop: space(5) }}>
            <TotRow label="Subtotal" value={rupees(computed.gross)} />
            {computed.discount ? (
              <TotRow label="Discount" value={`- ${rupees(computed.discount)}`} tone="bad" />
            ) : null}
            <TotRow label="Taxable value" value={rupees(computed.taxable)} />
            {interState
              ? computed.igst ? <TotRow label="IGST" value={rupees(computed.igst)} /> : null
              : (
                <>
                  {computed.cgst ? <TotRow label="CGST" value={rupees(computed.cgst)} /> : null}
                  {computed.sgst ? <TotRow label="SGST" value={rupees(computed.sgst)} /> : null}
                </>
              )}
            {computed.roundOff ? (
              <TotRow
                label="Round off"
                value={`${computed.roundOff > 0 ? "+" : "-"} ${rupees(Math.abs(computed.roundOff))}`}
              />
            ) : null}

            <Divider style={{ marginVertical: space(2.5) }} />
            <Row>
              <T variant="h2" style={{ flex: 1 }}>
                Total
              </T>
              <T style={{ fontSize: 24, fontWeight: "800" }} num>
                {rupees(computed.total)}
              </T>
            </Row>
            {computed.total ? (
              <T variant="tiny" style={{ marginTop: space(1) }}>
                {paiseToWords(computed.total)}
              </T>
            ) : null}
            {computed.tax ? (
              <T variant="tiny" style={{ marginTop: space(2) }}>
                {interState
                  ? "A different state, so this bill carries IGST."
                  : "Same state, so the GST is split into CGST and SGST."}
              </T>
            ) : null}
          </Card>
        ) : null}

        {/* ---- the money ---- */}
        {lines.length && docType !== "estimate" ? (
          <Card style={{ marginTop: space(4) }}>
            <CardHead title={isPurchaseSide ? "Paid to them" : "Received"} />

            <Row gap={2} style={{ marginBottom: space(3) }}>
              <Chip
                label="Full amount"
                on={receivedPaise === computed.total && computed.total > 0}
                onPress={() => {
                  setTouchedReceived(true);
                  setReceived(computed.total ? String(computed.total / 100) : "");
                }}
              />
              <Chip
                label="On credit"
                on={receivedPaise === 0}
                onPress={() => {
                  setTouchedReceived(true);
                  setReceived("");
                }}
              />
            </Row>

            <Row gap={3} style={{ alignItems: "flex-start" }}>
              <MoneyField
                label="Amount"
                style={{ flex: 1 }}
                value={received}
                onChangeText={(v) => {
                  setTouchedReceived(true);
                  setReceived(numeric(v));
                }}
                error={overpaid ? "More than the bill" : undefined}
              />
              <PickerButton
                label="How"
                style={{ width: 140 }}
                value={modeLabel(mode)}
                onPress={() => setSheet("mode")}
              />
            </Row>

            {duePaise > 0 ? (
              <Row style={{ marginTop: space(3) }}>
                <T style={{ flex: 1, fontWeight: "600", color: colors.danger }}>Balance left</T>
                <T style={{ fontWeight: "700", color: colors.danger }} num>
                  {rupees(duePaise)}
                </T>
              </Row>
            ) : null}
          </Card>
        ) : null}
      </Screen>

      {/* ---- the bar that stays put ---- */}
      {lines.length ? (
        <View style={[st.bar, { paddingBottom: insets.bottom + space(3) }]}>
          <View style={{ flex: 1 }}>
            <T variant="tiny">{`${lines.length} ${lines.length === 1 ? "item" : "items"}`}</T>
            <T style={{ fontSize: 21, fontWeight: "800" }} num>
              {rupees(computed.total)}
            </T>
          </View>
          <Button title="Save" onPress={() => save(false)} busy={busy} size="lg" />
          <Button
            title="Save & print"
            kind="primary"
            size="lg"
            onPress={() => save(true)}
            disabled={busy}
            icon={<Icon name="print" size={18} color="#fff" />}
          />
        </View>
      ) : null}

      {/* ==================== sheets ==================== */}
      <ItemPicker
        open={sheet === "items"}
        addedCount={lines.length}
        onClose={() => setSheet(null)}
        onPick={addItem}
        onScanPress={() => setSheet("scan")}
        onCreate={(name) => {
          setSheet(null);
          setNewItemName(name || "");
        }}
      />

      <Scanner
        open={sheet === "scan"}
        addedCount={lines.length}
        onClose={() => setSheet(null)}
        onScan={scanned}
      />

      <PartyPicker
        open={sheet === "party"}
        forSupplier={isPurchaseSide}
        onClose={() => setSheet(null)}
        onPick={setParty}
        onCreate={(name) => {
          setSheet(null);
          setNewPartyName(name || "");
        }}
      />

      <Choose
        open={sheet === "doctype"}
        onClose={() => setSheet(null)}
        title="What kind of bill?"
        value={docType}
        options={DOC_TYPES}
        onPick={(v) => {
          setDocType(v);
          setTouchedReceived(false);
        }}
      />

      <Choose
        open={sheet === "mode"}
        onClose={() => setSheet(null)}
        title="How was it paid?"
        value={mode}
        options={PAYMENT_MODES}
        onPick={(v) => {
          setModeTouched(true);
          setMode(v);
        }}
      />

      <DateSheet open={sheet === "date"} value={date} onClose={() => setSheet(null)} onPick={setDate} />

      <LineSheet
        open={editing !== null}
        line={editing !== null ? lines[editing] : null}
        computed={editing !== null ? computed.lines[editing] || {} : {}}
        onClose={() => setEditing(null)}
        onChange={(patch) => changeLine(editing, patch)}
        onRemove={() => {
          removeLine(editing);
          setEditing(null);
        }}
      />

      <ItemQuickForm
        open={newItemName !== null}
        initialName={newItemName || ""}
        onClose={() => setNewItemName(null)}
        onSaved={(item) => {
          setNewItemName(null);
          if (item) addItem(item);
          setSheet("items");
        }}
      />

      <PartyQuickForm
        open={newPartyName !== null}
        initialName={newPartyName || ""}
        type={isPurchaseSide ? "supplier" : "customer"}
        stateCode={shop?.stateCode || shopFull?.stateCode || ""}
        onClose={() => setNewPartyName(null)}
        onSaved={async (p) => {
          setNewPartyName(null);
          // Re-read so the balance shown next to the name is the server's,
          // not an assumption.
          try {
            setParty(p?.id ? await getParty(p.id) : p);
          } catch {
            setParty(p);
          }
        }}
      />

      <SavedSheet
        invoice={saved}
        paymentFailed={paymentFailed}
        party={party}
        shopName={shop?.name}
        onNew={reset}
        onPrint={(size) => printInvoice({ ...printArgs(saved, saved?.amounts?.paid), size })}
        onShare={() => shareInvoice(printArgs(saved, saved?.amounts?.paid))}
        onWhatsapp={() => openWhatsapp({ shopName: shop?.name, invoice: saved, party })}
        onOpen={() => {
          const id = saved?.id;
          reset();
          router.push(`/bills/${id}`);
        }}
      />
    </View>
  );
}

// ===========================================================================
// one line on the bill
// ---------------------------------------------------------------------------
// Quantity has its own minus and plus, because that is the one number that
// changes constantly and typing into a small box with a queue waiting is a
// nuisance. Everything else - the rate, the discount, the GST rate - is a tap
// away on the line itself, which keeps the row readable while still letting
// every number be argued with at the counter.
function LineRow({ line, computed, first, takesStock, onQty, onOpen, onRemove }) {
  const qty = Number(line.quantity) || 0;

  // A warning, never a block. A shop sells the last bag before the delivery
  // arrives all the time, and the stock count is frequently behind reality.
  // Stopping the sale would be the wrong call.
  const short = takesStock && line.type !== "service" && line.stock != null && qty > Number(line.stock);

  return (
    <View>
      {first ? null : <Divider />}
      <View style={{ padding: space(3.5) }}>
        <Row style={{ alignItems: "flex-start" }}>
          <Pressable onPress={onOpen} style={{ flex: 1 }} accessibilityLabel={`Edit ${line.name}`}>
            <T style={{ fontWeight: "650" }}>{line.name}</T>
            <T variant="tiny">
              {line.hsn ? `HSN ${line.hsn} · ` : ""}
              {`${rupees(toPaise(line.rate))} / ${unitShort(line.unit)}`}
              {Number(line.discountPercent) ? ` · ${line.discountPercent}% off` : ""}
              {line.taxRate ? ` · ${line.taxRate}% GST` : ""}
            </T>
          </Pressable>

          <Pressable onPress={onRemove} hitSlop={8} accessibilityLabel={`Remove ${line.name}`} style={st.x}>
            <Icon name="close" size={16} color={colors.ink3} />
          </Pressable>
        </Row>

        {short ? (
          <Row gap={1} style={{ marginTop: space(1.5) }}>
            <Icon name="warn" size={13} color={colors.warn} />
            <T variant="tiny" style={{ color: colors.warn }}>
              {`Only ${formatQty(line.stock)} ${unitShort(line.unit)} in stock`}
            </T>
          </Row>
        ) : null}

        <Row style={{ marginTop: space(3) }}>
          <Stepper
            value={line.quantity}
            unit={unitShort(line.unit)}
            onChange={onQty}
          />
          <View style={{ flex: 1 }} />
          <Pressable onPress={onOpen} style={{ alignItems: "flex-end" }}>
            <T style={{ fontSize: 17, fontWeight: "750" }} num>
              {rupees(computed.total || 0)}
            </T>
            {computed.tax ? (
              <T variant="tiny" num>
                {`${rupees(computed.taxable || 0)} + ${rupees(computed.tax)} GST`}
              </T>
            ) : null}
          </Pressable>
        </Row>
      </View>
    </View>
  );
}

function Stepper({ value, unit, onChange }) {
  const n = Number(value) || 0;
  return (
    <Row gap={0} style={st.stepper}>
      <Pressable
        onPress={() => onChange(String(Math.max(1, +(n - 1).toFixed(3))))}
        style={st.stepBtn}
        accessibilityLabel="One less"
        hitSlop={4}
      >
        <T style={{ fontSize: 20, fontWeight: "700", color: colors.ink2 }}>−</T>
      </Pressable>
      <Field
        value={String(value)}
        onChangeText={(v) => onChange(numeric(v))}
        keyboardType="decimal-pad"
        inputMode="decimal"
        style={{ width: 74 }}
        inputStyle={{ textAlign: "center", fontWeight: "700" }}
        accessibilityLabel="Quantity"
      />
      <Pressable
        onPress={() => onChange(String(+(n + 1).toFixed(3)))}
        style={st.stepBtn}
        accessibilityLabel="One more"
        hitSlop={4}
      >
        <T style={{ fontSize: 18, fontWeight: "700", color: colors.ink2 }}>+</T>
      </Pressable>
      <T variant="tiny" style={{ marginLeft: space(1.5) }}>
        {unit}
      </T>
    </Row>
  );
}

// ---------------------------------------------------------------------------
// everything else about a line
// ---------------------------------------------------------------------------
// Changing the rate or the GST rate here changes this bill only, never the
// item in the list. A regular customer gets a different price without the
// shop's own price being rewritten.
function LineSheet({ open, line, computed, onClose, onChange, onRemove }) {
  const [picking, setPicking] = useState(false);
  if (!line) return <Sheet open={false} onClose={onClose} title="" />;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={line.name}
      subtitle="Only on this bill — your item list is untouched"
      footer={<Button title="Done" kind="primary" size="lg" full onPress={onClose} />}
    >
      <Card>
        <Row gap={3} style={{ alignItems: "flex-start" }}>
          <Field
            label="Quantity"
            required
            style={{ flex: 1 }}
            value={String(line.quantity)}
            onChangeText={(v) => onChange({ quantity: numeric(v) })}
            keyboardType="decimal-pad"
            inputMode="decimal"
            hint={unitShort(line.unit)}
          />
          <MoneyField
            label="Rate"
            required
            style={{ flex: 1 }}
            value={String(line.rate)}
            onChangeText={(v) => onChange({ rate: numeric(v) })}
          />
        </Row>

        <Row gap={3} style={{ alignItems: "flex-start", marginTop: space(4) }}>
          <Field
            label="Discount"
            style={{ flex: 1 }}
            value={String(line.discountPercent)}
            onChangeText={(v) => onChange({ discountPercent: numeric(v) })}
            keyboardType="decimal-pad"
            inputMode="decimal"
            placeholder="0"
            hint="Per cent off this line"
          />
          <PickerButton
            label="GST"
            style={{ flex: 1 }}
            value={`${line.taxRate}%`}
            onPress={() => setPicking(true)}
            hint={line.taxIncluded ? "Rate includes GST" : "GST added on top"}
          />
        </Row>
      </Card>

      <Card style={{ marginTop: space(4) }}>
        <TotRow label="Taxable value" value={rupees(computed.taxable || 0)} />
        {computed.discount ? <TotRow label="Discount" value={`- ${rupees(computed.discount)}`} tone="bad" /> : null}
        {computed.tax ? <TotRow label={`GST at ${line.taxRate}%`} value={rupees(computed.tax)} /> : null}
        <Divider style={{ marginVertical: space(2) }} />
        <Row>
          <T style={{ flex: 1, fontWeight: "650" }}>Line total</T>
          <T style={{ fontSize: 19, fontWeight: "800" }} num>
            {rupees(computed.total || 0)}
          </T>
        </Row>
      </Card>

      <Button
        title="Take this off the bill"
        kind="danger"
        onPress={onRemove}
        icon={<Icon name="trash" size={17} color={colors.danger} />}
        style={{ marginTop: space(5) }}
        full
      />

      <Choose
        open={picking}
        onClose={() => setPicking(false)}
        title="GST rate on this line"
        value={String(line.taxRate)}
        options={TAX_RATES.map((t) => ({ value: String(t.value), label: t.label }))}
        onPick={(v) => onChange({ taxRate: Number(v) })}
      />
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// the date
// ---------------------------------------------------------------------------
// Almost every bill is today's. The three taps cover nearly all of the rest,
// and typing a date is there for the shop catching up on last week's
// purchases.
function DateSheet({ open, value, onClose, onPick }) {
  const [typed, setTyped] = useState("");
  const d = (n) => {
    const x = new Date();
    x.setDate(x.getDate() - n);
    return x.toISOString().slice(0, 10);
  };
  const quick = [
    { value: d(0), label: "Today" },
    { value: d(1), label: "Yesterday" },
    { value: d(2), label: formatDate(d(2)) },
  ];
  const ok = /^\d{4}-\d{2}-\d{2}$/.test(typed) && !Number.isNaN(Date.parse(typed));

  return (
    <Sheet open={open} onClose={onClose} title="Date on the bill">
      <Card pad={false}>
        {quick.map((q, i) => (
          <View key={q.value}>
            {i ? <Divider /> : null}
            <Pressable
              onPress={() => {
                onPick(q.value);
                onClose();
              }}
              style={({ pressed }) => [
                { padding: space(4), flexDirection: "row", alignItems: "center" },
                pressed && { backgroundColor: colors.sunken },
              ]}
            >
              <T style={{ flex: 1, fontWeight: value === q.value ? "700" : "400" }}>{q.label}</T>
              {value === q.value ? <Icon name="check" size={20} color={colors.brand} /> : null}
            </Pressable>
          </View>
        ))}
      </Card>

      <Card style={{ marginTop: space(4) }}>
        <Field
          label="Or type a date"
          value={typed}
          onChangeText={(v) => setTyped(v.replace(/[^\d-]/g, "").slice(0, 10))}
          placeholder="2026-04-18"
          keyboardType="numbers-and-punctuation"
          hint="Year, month, day"
          error={typed && !ok ? "That is not a date yet" : undefined}
        />
        <Button
          title="Use this date"
          kind="primary"
          disabled={!ok}
          full
          style={{ marginTop: space(3) }}
          onPress={() => {
            onPick(typed);
            setTyped("");
            onClose();
          }}
        />
      </Card>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// after saving
// ---------------------------------------------------------------------------
function SavedSheet({ invoice, paymentFailed, party, shopName, onNew, onPrint, onShare, onWhatsapp, onOpen }) {
  const [busy, setBusy] = useState(null);
  if (!invoice) return null;

  const run = async (what, fn) => {
    setBusy(what);
    try {
      await fn();
    } catch {
      /* nothing is lost; the bill is saved and can be printed again */
    } finally {
      setBusy(null);
    }
  };

  return (
    <Sheet
      open
      onClose={onNew}
      title="Bill saved"
      subtitle={shopName}
      footer={
        <Button
          title="Make the next bill"
          kind="primary"
          size="lg"
          full
          icon={<Icon name="plus" size={20} color="#fff" />}
          onPress={onNew}
        />
      }
    >
      <View style={{ alignItems: "center", paddingVertical: space(5) }}>
        <View style={st.tick}>
          <Icon name="check" size={30} color="#fff" />
        </View>
        <T variant="h2" style={{ marginTop: space(3) }}>
          {invoice.number}
        </T>
        <T style={{ fontSize: 34, fontWeight: "800", marginTop: space(1) }} num>
          {rupees(invoice.amounts.total)}
        </T>
        <T variant="tiny" style={{ textAlign: "center", marginTop: space(1), maxWidth: 300 }}>
          {paiseToWords(invoice.amounts.total)}
        </T>
        {invoice.amounts.balance > 0 ? (
          <T style={{ marginTop: space(2), color: colors.danger, fontWeight: "700" }} num>
            {`${rupees(invoice.amounts.balance)} still to collect`}
          </T>
        ) : null}
      </View>

      {paymentFailed ? (
        <Note tone="warn" title="The payment was not recorded" style={{ marginBottom: space(4) }}>
          The bill itself is saved. Open it and take the payment again — nothing has been counted twice.
        </Note>
      ) : null}

      <Button
        title="Print the bill"
        size="lg"
        full
        busy={busy === "a4"}
        icon={<Icon name="print" size={19} />}
        onPress={() => run("a4", () => onPrint("a4"))}
      />
      <Button
        title="Print on the counter roll"
        full
        style={{ marginTop: space(2) }}
        busy={busy === "thermal"}
        icon={<Icon name="print" size={17} />}
        onPress={() => run("thermal", () => onPrint("thermal"))}
      />
      <Button
        title="Send the PDF"
        full
        style={{ marginTop: space(2) }}
        busy={busy === "share"}
        icon={<Icon name="share" size={17} />}
        onPress={() => run("share", onShare)}
      />
      {party?.phone ? (
        <Button
          title="Message them on WhatsApp"
          full
          style={{ marginTop: space(2) }}
          icon={<Icon name="phone" size={17} />}
          onPress={onWhatsapp}
        />
      ) : null}
      <Button title="Open the bill" kind="ghost" full style={{ marginTop: space(2) }} onPress={onOpen} />
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
function TotRow({ label, value, tone }) {
  return (
    <Row style={{ paddingVertical: 3 }}>
      <T variant="sub" style={{ flex: 1 }}>
        {label}
      </T>
      <T style={tone === "bad" ? { color: colors.danger } : undefined} num>
        {value}
      </T>
    </Row>
  );
}

function Chip({ label, on, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      style={({ pressed }) => [
        st.chip,
        on && { backgroundColor: colors.brandSoft, borderColor: colors.brand },
        pressed && { opacity: 0.8 },
      ]}
    >
      <T style={{ fontWeight: "650", color: on ? colors.brandInk : colors.ink2, fontSize: 14 }}>{label}</T>
    </Pressable>
  );
}

const st = StyleSheet.create({
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: space(2),
    paddingHorizontal: space(4),
    paddingTop: space(3),
    backgroundColor: colors.panel,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  x: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  stepper: { alignItems: "center" },
  stepBtn: {
    width: TAP,
    height: TAP,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.sm,
    backgroundColor: colors.panel,
    alignItems: "center",
    justifyContent: "center",
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.pill,
    paddingHorizontal: space(3.5),
    minHeight: 38,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.panel,
  },
  tick: {
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
});
