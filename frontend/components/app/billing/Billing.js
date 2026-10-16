"use client";

// ===========================================================================
// MAKING A BILL
// ---------------------------------------------------------------------------
// The screen the whole product is judged on. The rule it is built to is:
// a shopkeeper with four items and a queue should get from an empty screen
// to a printed bill without touching the mouse, and without waiting for the
// network between keystrokes.
//
// So the totals are worked out in the browser as you type, and the server is
// only asked once, when you save. The server's answer is then what is shown
// and printed - the browser's arithmetic is a preview and never the record.
//
// One thing worth knowing about saving: the bill and the payment are two
// requests. The bill itself is atomic on the server - number, lines, stock
// and the customer's balance all commit together or not at all. The payment
// is recorded straight after. If the payment call fails, the bill still
// exists and is simply unpaid, and the screen says so and offers to record
// the payment again. That is recoverable; a half-written bill would not be.
// ===========================================================================

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BILLING, COMMON, PAYMENT } from "../content";
import { useShop } from "../useShop";
import { useToast } from "../ui/Toast";
import { Note } from "../ui/Bits";
import { Select, Text, Money, Check, numericOnly } from "../ui/Field";
import ItemSearch from "./ItemSearch";
import PartyPicker from "./PartyPicker";
import Lines from "./Lines";
import ItemForm from "../items/ItemForm";
import PartyForm from "../parties/PartyForm";
import { computeTotals, isInterState } from "../../../lib/gst-calc";
import { rupees, paiseToWords, today, toPaise } from "../../../lib/money";
import { PAYMENT_MODES } from "../../../lib/units";
import { createInvoice, createPayment, getParty, getBusiness, getInvoice } from "../data";
import InvoicePrint from "../print/InvoicePrint";
import {
  IconCheck,
  IconPrint,
  IconWhatsApp,
  IconPlus,
  IconKeyboard,
  IconWarn,
} from "../Icons";

let keyCounter = 0;

// ---------------------------------------------------------------------------
// turning a saved line back into an editable one
// ---------------------------------------------------------------------------
// Converting an estimate into a bill means re-opening lines that were already
// worked out once. The one thing that cannot be read straight off them is
// whether the rate included the tax, because the server stores the result
// rather than the setting. So it is worked backwards: if the taxable value
// plus the tax comes to what was charged, the rate was inclusive; if the
// taxable value alone does, it was not.
//
// Getting this wrong would quietly change the total between the estimate the
// customer was given and the bill they are handed.
function lineFromSaved(l) {
  const gross = Math.round(l.ratePaise * l.quantity) - (l.discountPaise || 0);
  const tax = l.cgstPaise + l.sgstPaise + l.igstPaise;
  const inclusive = Math.abs(gross - (l.taxablePaise + tax)) <= 2;

  return {
    key: `l${++keyCounter}`,
    itemId: l.itemId,
    name: l.name,
    hsn: l.hsn,
    unit: l.unit,
    type: "goods",
    // The saved line does not carry the item's stock, and showing a stale
    // figure would be worse than showing none.
    stock: null,
    quantity: String(l.quantity),
    rate: l.ratePaise ? String(l.ratePaise / 100) : "",
    discountPercent: "",
    taxRate: l.taxRate ?? 0,
    taxIncluded: inclusive,
  };
}

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

export default function Billing() {
  const shop = useShop();
  const { toast, error } = useToast();
  const params = useSearchParams();
  const convertFrom = params?.get("from") || null;

  const [docType, setDocType] = useState("sale");
  const [party, setParty] = useState(null);
  const [date, setDate] = useState(() => today());
  const [lines, setLines] = useState([]);
  const [extraDiscount, setExtraDiscount] = useState("");
  const [notes, setNotes] = useState("");

  const [received, setReceived] = useState("");
  const [touchedReceived, setTouchedReceived] = useState(false);
  const [mode, setMode] = useState("cash");

  const [newItemName, setNewItemName] = useState(null);
  const [newPartyName, setNewPartyName] = useState(null);

  const [busy, setBusy] = useState(false);
  const [convertedFrom, setConvertedFrom] = useState(null);
  const [saved, setSaved] = useState(null);
  const [paymentFailed, setPaymentFailed] = useState(false);
  const [err, setErr] = useState(null);
  const [showKeys, setShowKeys] = useState(false);

  const itemInput = useRef(null);
  const partyInput = useRef(null);

  // Arriving from "make this estimate a bill". The estimate is re-opened,
  // its lines become editable again, and the new bill records which estimate
  // it came from so the two can be tied together later.
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
            /* the estimate still converts without the customer's balance */
          }
        }
      } catch (e) {
        setErr(e.isOffline ? COMMON.offlineBody : e.message || COMMON.genericError);
      }
    })();
    return () => {
      alive = false;
    };
  }, [convertFrom]);

  // The sidebar only knows the shop's name. A printed tax invoice needs its
  // address and GSTIN too, so the full record is fetched once.
  const [shopFull, setShopFull] = useState(null);
  useEffect(() => {
    if (!shop.businessId) return;
    let alive = true;
    getBusiness(shop.businessId)
      .then((b) => {
        if (alive) setShopFull(b);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [shop.businessId]);

  const isPurchaseSide = docType === "purchase" || docType === "debit_note";

  // --------------------------------------------------------------------
  // the arithmetic
  // --------------------------------------------------------------------
  const interState = useMemo(
    () => isInterState(shop.stateCode, party?.stateCode),
    [shop.stateCode, party]
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

  // A sale is assumed to be paid in full unless the shopkeeper says
  // otherwise. That is what happens at a counter nine times out of ten, and
  // the one time it does not, one tap on "Credit" fixes it.
  useEffect(() => {
    if (touchedReceived || saved) return;
    if (docType === "estimate") return;
    setReceived(computed.total ? String(computed.total / 100) : "");
  }, [computed.total, touchedReceived, saved, docType]);

  const receivedPaise = Math.max(0, toPaise(received));
  const duePaise = Math.max(0, computed.total - receivedPaise);
  const overpaid = receivedPaise > computed.total;

  // --------------------------------------------------------------------
  // line handling
  // --------------------------------------------------------------------
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
    setDate(today());
    setTimeout(() => itemInput.current?.focus(), 30);
  }

  // --------------------------------------------------------------------
  // shortcuts
  // --------------------------------------------------------------------
  useEffect(() => {
    itemInput.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "F2") {
        e.preventDefault();
        itemInput.current?.focus();
        return;
      }
      if (e.key === "F4") {
        e.preventDefault();
        partyInput.current?.focus();
        return;
      }
      if (e.altKey && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        save(false);
        return;
      }
      if (e.altKey && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        save(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // --------------------------------------------------------------------
  // saving
  // --------------------------------------------------------------------
  async function save(thenPrint) {
    if (busy || saved) return;
    setErr(null);

    if (!lines.length) {
      error(BILLING.needLines);
      itemInput.current?.focus();
      return;
    }
    if (overpaid) {
      error(BILLING.overpaid);
      return;
    }
    // Credit with nobody's name against it is money you will never see
    // again, so this one is worth refusing.
    if (!party && duePaise > 0 && docType !== "estimate") {
      error(BILLING.needPartyCredit);
      partyInput.current?.focus();
      return;
    }

    setBusy(true);
    try {
      // Two things worth knowing about this payload.
      //
      // The date field is issueDate. Sending it as `date` is silently
      // ignored, and every bill quietly gets today's date instead.
      //
      // There is no bill-level discount on the server, and there should not
      // be: a flat amount knocked off after tax would make the GST on the
      // bill wrong, and that is the number the department checks. So the
      // bill discount is spread across the lines in proportion to their
      // value - exactly as the preview on screen already did it - and sent
      // as a per-line amount. A line carries a percentage or an amount but
      // never both, so everything goes as an amount.
      const payload = {
        docType,
        issueDate: date,
        lines: lines.map((l, i) => {
          // c.discount already carries this line's own discount plus its
          // share of the bill discount - the totals rolled them together so
          // the line could be worked out in one go.
          const c = computed.lines[i] || {};
          const discountPaise = c.discount || 0;
          const line = {
            itemId: l.itemId,
            quantity: Number(l.quantity) || 0,
            rate: Number(l.rate) || 0,
            taxRate: Number(l.taxRate) || 0,
            priceIncludesTax: Boolean(l.taxIncluded),
          };
          if (discountPaise > 0) line.discountAmount = discountPaise / 100;
          return line;
        }),
      };
      if (party) payload.partyId = party.id;
      if (notes.trim()) payload.notes = notes.trim();
      if (convertedFrom) payload.convertedFromId = Number(convertedFrom.id);

      const invoice = await createInvoice(payload);

      // The payment, if any. Allocated against this bill so it shows as
      // paid rather than floating on the customer's account.
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

      // What the screen and the paper show from here on is the server's own
      // total, not the preview. If the two ever differ, the server is right.
      // The paid figure is folded in because the payment was a second call
      // and the invoice we were handed back predates it.
      const paid = failed ? 0 : Math.min(receivedPaise, invoice.amounts.total);
      setPaymentFailed(failed);
      setSaved({
        ...invoice,
        amounts: {
          ...invoice.amounts,
          paid,
          balance: Math.max(0, invoice.amounts.total - paid),
        },
      });
      toast(`${BILLING.savedTitle} · ${invoice.number || ""}`.trim());

      if (thenPrint && !failed) {
        // Let the panel paint before the print dialog takes over.
        setTimeout(() => window.print(), 220);
      }
    } catch (e) {
      setErr(e.isOffline ? COMMON.offlineBody : e.message || COMMON.genericError);
      error(e.isOffline ? COMMON.offlineTitle : e.message || COMMON.genericError);
    } finally {
      setBusy(false);
    }
  }

  // --------------------------------------------------------------------
  // WhatsApp
  // --------------------------------------------------------------------
  // A link, not an integration. It opens WhatsApp with the message ready,
  // and the shopkeeper presses send. No API, no fees, no approval, and it
  // works from a phone and a desktop alike.
  function whatsappHref(invoice) {
    const shopName = shop.shop?.name || "our shop";
    const text = [
      `${shopName}`,
      `Bill ${invoice.number}`,
      `Amount ${rupees(invoice.amounts.total)}`,
      duePaise > 0 ? `Pending ${rupees(duePaise)}` : "Paid. Thank you.",
    ].join("\n");
    const phone = party?.phone ? `91${String(party.phone).replace(/\D+/g, "").slice(-10)}` : "";
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  }

  // What the printer gets if the server did not send the lines back with the
  // saved bill. The amounts come from the same computation the screen showed,
  // so the paper and the screen cannot disagree.
  const printLines = useMemo(
    () =>
      lines.map((l, i) => {
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
    [lines, computed]
  );

  // --------------------------------------------------------------------
  return (
    <div className="ap-bill">
      <div className="ap-bill-left ap-screenonly">
        {err ? (
          <div style={{ marginBottom: 12 }}>
            <Note kind="bad">{err}</Note>
          </div>
        ) : null}

        {convertedFrom ? (
          <div style={{ marginBottom: 12 }}>
            <Note kind="info" icon={false}>
              Made from estimate <strong>{convertedFrom.number}</strong>. Change anything you like
              before saving &mdash; the estimate itself is left as it is.
            </Note>
          </div>
        ) : null}

        <div className="ap-bill-head">
          <div>
            <label className="ap-label">Bill type</label>
            <div className="ap-seg">
              {BILLING.docTypes.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  aria-pressed={docType === d.value}
                  onClick={() => {
                    setDocType(d.value);
                    setTouchedReceived(false);
                  }}
                  disabled={Boolean(saved)}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ width: 150 }}>
            <Text
              label={BILLING.dateLabel}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={Boolean(saved)}
            />
          </div>
        </div>

        <p className="ap-hint" style={{ marginTop: -8, marginBottom: 12 }}>
          {BILLING.docHelp[docType]}
        </p>

        <div style={{ maxWidth: 560, marginBottom: 14 }}>
          <PartyPicker
            value={party}
            forSupplier={isPurchaseSide}
            inputRef={partyInput}
            onPick={setParty}
            onClear={() => setParty(null)}
            onCreate={(name) => setNewPartyName(name || "")}
          />
        </div>

        {!saved ? (
          <ItemSearch
            inputRef={itemInput}
            onPick={addItem}
            onCreate={(name) => setNewItemName(name || "")}
          />
        ) : null}

        <Lines
          lines={lines}
          computed={computed}
          docType={docType}
          onChange={changeLine}
          onRemove={removeLine}
        />

        {lines.length ? (
          <div className="ap-row" style={{ marginTop: 12, alignItems: "flex-start", gap: 16 }}>
            <div style={{ width: 180 }}>
              <Money
                label={BILLING.extraDiscount}
                value={extraDiscount}
                onChange={(e) => setExtraDiscount(numericOnly(e.target.value))}
                placeholder="0.00"
                disabled={Boolean(saved)}
              />
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <Text
                label="Note on the bill"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything you want printed on it"
                disabled={Boolean(saved)}
                maxLength={300}
              />
            </div>
          </div>
        ) : null}

        <button
          type="button"
          className="ap-btn ap-btn-ghost ap-btn-sm ap-noprint"
          style={{ marginTop: 16, color: "var(--ap-ink-3)" }}
          onClick={() => setShowKeys((v) => !v)}
        >
          <IconKeyboard size={16} />
          {BILLING.shortcuts}
        </button>

        {showKeys ? (
          <div className="ap-panel" style={{ marginTop: 8, maxWidth: 420 }}>
            <div className="ap-panel-body ap-keys">
              {BILLING.keys.map((k) => (
                <div className="ap-keys-row" key={k.keys}>
                  <kbd className="ap-kbd">{k.keys}</kbd>
                  <span>{k.what}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* ---------------------------------------------------------------- */}
      <aside className="ap-bill-right ap-screenonly">
        {saved ? (
          <SavedPanel
            invoice={saved}
            paymentFailed={paymentFailed}
            onNew={reset}
            whatsappHref={whatsappHref}
            hasPhone={Boolean(party?.phone)}
          />
        ) : (
          <>
            <div className="ap-tot">
              <div className="ap-tot-row">
                <span>{BILLING.subtotal}</span>
                <span>{rupees(computed.gross)}</span>
              </div>

              {computed.discount ? (
                <div className="ap-tot-row">
                  <span>{BILLING.discount}</span>
                  <span style={{ color: "var(--ap-danger)" }}>- {rupees(computed.discount)}</span>
                </div>
              ) : null}

              <div className="ap-tot-row">
                <span>{BILLING.taxable}</span>
                <span>{rupees(computed.taxable)}</span>
              </div>

              {interState ? (
                computed.igst ? (
                  <div className="ap-tot-row">
                    <span>IGST</span>
                    <span>{rupees(computed.igst)}</span>
                  </div>
                ) : null
              ) : (
                <>
                  {computed.cgst ? (
                    <div className="ap-tot-row">
                      <span>CGST</span>
                      <span>{rupees(computed.cgst)}</span>
                    </div>
                  ) : null}
                  {computed.sgst ? (
                    <div className="ap-tot-row">
                      <span>SGST</span>
                      <span>{rupees(computed.sgst)}</span>
                    </div>
                  ) : null}
                </>
              )}

              {computed.roundOff ? (
                <div className="ap-tot-row">
                  <span>{BILLING.roundOff}</span>
                  <span>
                    {computed.roundOff > 0 ? "+" : "-"} {rupees(Math.abs(computed.roundOff))}
                  </span>
                </div>
              ) : null}

              <div className="ap-tot-grand">
                <span>{BILLING.total}</span>
                <span className="ap-tot-amt">{rupees(computed.total)}</span>
              </div>

              {computed.total ? (
                <div className="ap-tot-words">{paiseToWords(computed.total)}</div>
              ) : null}
            </div>

            {computed.tax ? (
              <p className="ap-hint" style={{ margin: 0 }}>
                {interState ? BILLING.igstNote : BILLING.gstNote}
              </p>
            ) : null}

            {docType !== "estimate" ? (
              <div style={{ borderTop: "1px solid var(--ap-line)", paddingTop: 13 }}>
                <div className="ap-label" style={{ marginBottom: 7 }}>
                  {BILLING.payTitle}
                </div>

                <div className="ap-paychips" style={{ marginBottom: 10 }}>
                  <button
                    type="button"
                    className="ap-paychip"
                    aria-pressed={receivedPaise === computed.total && computed.total > 0}
                    onClick={() => {
                      setTouchedReceived(true);
                      setReceived(computed.total ? String(computed.total / 100) : "");
                    }}
                  >
                    {BILLING.payFull}
                  </button>
                  <button
                    type="button"
                    className="ap-paychip"
                    aria-pressed={receivedPaise === 0}
                    onClick={() => {
                      setTouchedReceived(true);
                      setReceived("");
                    }}
                  >
                    {BILLING.payNone}
                  </button>
                </div>

                <div className="ap-grid2">
                  <Money
                    label={BILLING.payAmount}
                    value={received}
                    onChange={(e) => {
                      setTouchedReceived(true);
                      setReceived(numericOnly(e.target.value));
                    }}
                    placeholder="0.00"
                    error={overpaid ? BILLING.overpaid : undefined}
                  />
                  <Select
                    label={BILLING.payMode}
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                    disabled={receivedPaise <= 0}
                  >
                    {PAYMENT_MODES.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </Select>
                </div>

                {duePaise > 0 ? (
                  <div
                    className="ap-tot-row"
                    style={{ marginTop: 10, fontWeight: 650, color: "var(--ap-danger)" }}
                  >
                    <span>{BILLING.payBalance}</span>
                    <span>{rupees(duePaise)}</span>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="ap-sticky-save ap-noprint">
              <button
                type="button"
                className="ap-btn ap-btn-primary ap-btn-lg ap-btn-block"
                onClick={() => save(true)}
                disabled={busy || !lines.length}
              >
                {busy ? (
                  <>
                    <span className="ap-spin" /> {BILLING.savingBill}
                  </>
                ) : (
                  <>
                    <IconPrint size={18} /> {BILLING.saveAndPrint}
                  </>
                )}
              </button>
              <button
                type="button"
                className="ap-btn ap-btn-block"
                onClick={() => save(false)}
                disabled={busy || !lines.length}
              >
                {BILLING.saveOnly}
              </button>
            </div>
          </>
        )}
      </aside>

      {newItemName !== null ? (
        <ItemForm
          initialName={newItemName}
          onClose={() => setNewItemName(null)}
          onSaved={(item) => {
            setNewItemName(null);
            if (item) addItem(item);
            setTimeout(() => itemInput.current?.focus(), 30);
          }}
        />
      ) : null}

      {newPartyName !== null ? (
        <PartyForm
          initial={{
            name: newPartyName,
            type: isPurchaseSide ? "supplier" : "customer",
            stateCode: shop.stateCode || "",
          }}
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
      ) : null}

      {saved ? (
        <InvoicePrint
          invoice={saved}
          shop={shopFull || shop.shop}
          party={party}
          lines={printLines}
          copyLabel="Customer copy"
        />
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// after saving
// ---------------------------------------------------------------------------
function SavedPanel({ invoice, paymentFailed, onNew, whatsappHref, hasPhone }) {
  return (
    <>
      <div className="ap-done">
        <div className="ap-done-tick">
          <IconCheck size={26} />
        </div>
        <div className="ap-done-num">{invoice.number}</div>
        <div className="ap-done-amt">{rupees(invoice.amounts.total)}</div>
        <div className="ap-sub">{paiseToWords(invoice.amounts.total)}</div>
      </div>

      {paymentFailed ? (
        <Note kind="warn" icon={<IconWarn size={17} />}>
          The bill was saved, but the payment was not recorded. Open the bill and take the payment
          again &mdash; nothing has been double counted.
        </Note>
      ) : null}

      <div style={{ display: "grid", gap: 8 }}>
        <button type="button" className="ap-btn ap-btn-primary ap-btn-lg" onClick={onNew}>
          <IconPlus size={18} /> {BILLING.savedNext}
        </button>
        <button type="button" className="ap-btn" onClick={() => window.print()}>
          <IconPrint size={17} /> {BILLING.savedPrint}
        </button>
        {hasPhone ? (
          <a
            className="ap-btn"
            href={whatsappHref(invoice)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <IconWhatsApp size={17} /> {BILLING.savedShare}
          </a>
        ) : null}
        <Link className="ap-btn ap-btn-ghost" href={`/app/bills/${invoice.id}`}>
          {BILLING.savedOpen}
        </Link>
      </div>
    </>
  );
}
