"use client";

// ===========================================================================
// DAY CLOSE
// ---------------------------------------------------------------------------
// The five minutes at the end of the evening when the drawer is counted and
// the day is shut. It answers one question the rest of the app cannot: does
// the cash in the till agree with what the books say it should be?
//
// Only CASH goes into that sum. UPI, card and bank transfers never touch the
// drawer, so counting them would guarantee a mismatch every single day and
// the check would stop meaning anything. They are still shown, because the
// shopkeeper wants to know the split - they are just not in the reconciling.
//
// Where the opening figure lives: nowhere on the server. There is no field
// for it, and inventing one would be a schema change for something that is
// re-entered in two seconds. It is kept in this browser, per shop and per
// day, so a page refresh does not lose it mid-count. On another device it
// starts empty, and the screen says so rather than pretending otherwise.
// ===========================================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { DAYCLOSE, COMMON } from "../content";
import { useShop } from "../useShop";
import { ErrorState, Note, PageHead, Spinner } from "../ui/Bits";
import { Money, numericOnly } from "../ui/Field";
import { IconPrint, IconWarn, IconCheck } from "../Icons";
import { rupees, formatDateLong, today, toPaise } from "../../../lib/money";
import { modeLabel } from "../../../lib/units";
import { dayClose, listInvoices, listExpenses, getBusiness } from "../data";

// Per shop and per day, so yesterday's figure never leaks into today.
function openingKey(businessId, date) {
  return `mygallabook.opening.${businessId || 0}.${date}`;
}

function readOpening(businessId, date) {
  try {
    return window.localStorage.getItem(openingKey(businessId, date)) || "";
  } catch {
    return "";
  }
}

function writeOpening(businessId, date, value) {
  try {
    if (value) window.localStorage.setItem(openingKey(businessId, date), value);
    else window.localStorage.removeItem(openingKey(businessId, date));
  } catch {
    /* a locked-down browser profile. Nothing worth breaking the page over. */
  }
}

export default function DayClose() {
  const shop = useShop();
  const [date, setDate] = useState(() => today());
  const [state, setState] = useState({ loading: true, error: null });
  const [close, setClose] = useState(null);
  const [bills, setBills] = useState([]);
  const [spend, setSpend] = useState([]);
  const [biz, setBiz] = useState(null);

  const [opening, setOpening] = useState("");
  const [counted, setCounted] = useState("");

  const load = useCallback(async () => {
    setState({ loading: true, error: null });
    try {
      const [dc, inv, exp, business] = await Promise.all([
        dayClose(date),
        listInvoices({ docType: "sale", from: date, to: date, limit: 200 }).catch(() => ({ rows: [] })),
        listExpenses({ from: date, to: date, limit: 200 }).catch(() => ({ rows: [] })),
        shop.businessId ? getBusiness(shop.businessId).catch(() => null) : Promise.resolve(null),
      ]);
      setClose(dc);
      setBills(inv.rows.filter((b) => b.status !== "cancelled"));
      setSpend(exp.rows);
      setBiz(business);
      setState({ loading: false, error: null });
    } catch (e) {
      setState({ loading: false, error: e });
    }
  }, [date, shop.businessId]);

  useEffect(() => {
    if (shop.businessId) load();
  }, [shop.businessId, load]);

  // The opening figure follows the day being looked at, and the counted
  // figure is cleared with it - yesterday's count against today's drawer
  // would be worse than no count at all.
  useEffect(() => {
    setOpening(readOpening(shop.businessId, date));
    setCounted("");
  }, [shop.businessId, date]);

  const sold = useMemo(
    () => ({
      count: bills.length,
      billed: bills.reduce((a, b) => a + b.amounts.total, 0),
      collected: bills.reduce((a, b) => a + b.amounts.paid, 0),
      credit: bills.reduce((a, b) => a + b.amounts.balance, 0),
    }),
    [bills]
  );

  const spendTotal = useMemo(() => spend.reduce((a, e) => a + e.totalPaise, 0), [spend]);
  const spendCash = useMemo(
    () => spend.filter((e) => e.mode === "cash").reduce((a, e) => a + e.totalPaise, 0),
    [spend]
  );

  const cashIn = useMemo(() => close?.in.find((r) => r.mode === "cash")?.paise || 0, [close]);
  const cashOut = useMemo(() => close?.out.find((r) => r.mode === "cash")?.paise || 0, [close]);

  const openingPaise = toPaise(opening);
  const expected = openingPaise + cashIn - cashOut - spendCash;
  const countedPaise = toPaise(counted);
  const hasCount = counted !== "";
  const diff = countedPaise - expected;

  if (state.error) return <ErrorState error={state.error} onRetry={load} />;

  return (
    <>
      <PageHead title={DAYCLOSE.title}>
        <label className="ap-row" style={{ gap: 8 }}>
          <span className="ap-sub">{DAYCLOSE.date}</span>
          <input
            type="date"
            className="ap-input"
            style={{ width: 165 }}
            value={date}
            max={today()}
            onChange={(e) => setDate(e.target.value || today())}
          />
        </label>
        <button type="button" className="ap-btn" onClick={() => window.print()}>
          <IconPrint size={16} /> {DAYCLOSE.print}
        </button>
      </PageHead>

      <div className="ap-panel" style={{ marginBottom: 16 }}>
        <div className="ap-panel-body">
          <div className="ap-row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 18 }}>{biz?.name || shop.shop?.name}</h2>
              <p className="ap-sub" style={{ margin: "2px 0 0" }}>
                {formatDateLong(date)}
              </p>
            </div>
            <p className="ap-hint" style={{ margin: 0, maxWidth: 420, textAlign: "right" }}>
              {DAYCLOSE.intro}
            </p>
          </div>
        </div>
      </div>

      {state.loading ? (
        <div className="ap-panel">
          <div className="ap-panel-body">
            <Spinner />
          </div>
        </div>
      ) : (
        <>
          <div className="ap-tiles" style={{ marginBottom: 16 }}>
            <div className="ap-tile">
              <div className="ap-tile-label">{DAYCLOSE.soldValue}</div>
              <div className="ap-tile-value">{rupees(sold.billed, { decimals: false })}</div>
              <div className="ap-tile-note">
                {sold.count} {sold.count === 1 ? "bill" : "bills"}
              </div>
            </div>
            <div className="ap-tile ap-tile-good">
              <div className="ap-tile-label">{DAYCLOSE.inTitle}</div>
              <div className="ap-tile-value">{rupees(close?.totalInPaise || 0, { decimals: false })}</div>
              <div className="ap-tile-note">{DAYCLOSE.inNote}</div>
            </div>
            <div className={sold.credit ? "ap-tile ap-tile-bad" : "ap-tile"}>
              <div className="ap-tile-label">{DAYCLOSE.soldCredit}</div>
              <div className="ap-tile-value">{rupees(sold.credit, { decimals: false })}</div>
              <div className="ap-tile-note">{DAYCLOSE.soldNote}</div>
            </div>
            <div className="ap-tile">
              <div className="ap-tile-label">{DAYCLOSE.spendTitle}</div>
              <div className="ap-tile-value">{rupees(spendTotal, { decimals: false })}</div>
              <div className="ap-tile-note">{DAYCLOSE.spendNote}</div>
            </div>
          </div>

          {/* ---------------------------------------------------- the drawer */}
          <section className="ap-panel" style={{ marginBottom: 16 }}>
            <div className="ap-panel-head">
              <h2>{DAYCLOSE.drawerTitle}</h2>
              <span className="ap-sub ap-spacer">{DAYCLOSE.drawerNote}</span>
            </div>
            <div className="ap-panel-body">
              <div className="ap-grid2" style={{ gap: 24, alignItems: "start" }}>
                <div className="ap-tot">
                  <div style={{ marginBottom: 10 }}>
                    <Money
                      label={DAYCLOSE.opening}
                      hint={DAYCLOSE.openingHint}
                      value={opening}
                      onChange={(e) => {
                        const v = numericOnly(e.target.value);
                        setOpening(v);
                        writeOpening(shop.businessId, date, v);
                      }}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="ap-tot-row">
                    <span>{DAYCLOSE.cashIn}</span>
                    <span>+ {rupees(cashIn)}</span>
                  </div>
                  {cashOut ? (
                    <div className="ap-tot-row">
                      <span>{DAYCLOSE.cashOut}</span>
                      <span>- {rupees(cashOut)}</span>
                    </div>
                  ) : null}
                  {spendCash ? (
                    <div className="ap-tot-row">
                      <span>{DAYCLOSE.cashSpend}</span>
                      <span>- {rupees(spendCash)}</span>
                    </div>
                  ) : null}

                  <div className="ap-tot-grand">
                    <span>{DAYCLOSE.expected}</span>
                    <span className="ap-tot-amt">{rupees(expected)}</span>
                  </div>
                </div>

                <div>
                  <Money
                    label={DAYCLOSE.counted}
                    hint={DAYCLOSE.countedHint}
                    value={counted}
                    onChange={(e) => setCounted(numericOnly(e.target.value))}
                    placeholder="0.00"
                  />

                  <div style={{ marginTop: 14 }}>
                    {!hasCount ? (
                      <p className="ap-sub" style={{ margin: 0 }}>
                        {DAYCLOSE.countPrompt}
                      </p>
                    ) : diff === 0 ? (
                      <Note kind="good" icon={<IconCheck size={17} />}>
                        {DAYCLOSE.diffNone}
                      </Note>
                    ) : (
                      <Note kind={diff < 0 ? "bad" : "warn"} icon={<IconWarn size={17} />}>
                        <strong style={{ display: "block", marginBottom: 3 }}>
                          {diff < 0 ? DAYCLOSE.diffShort : DAYCLOSE.diffOver} {rupees(Math.abs(diff))}
                        </strong>
                        {diff < 0 ? DAYCLOSE.diffShortNote : DAYCLOSE.diffOverNote}
                      </Note>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ---------------------------------------------------- the split */}
          <div className="ap-grid2" style={{ gap: 16, alignItems: "start" }}>
            <ModeTable
              title={DAYCLOSE.inTitle}
              note={DAYCLOSE.inNote}
              rows={close?.in || []}
              total={close?.totalInPaise || 0}
              empty={DAYCLOSE.noneIn}
            />
            <ModeTable
              title={DAYCLOSE.outTitle}
              note={DAYCLOSE.outNote}
              rows={close?.out || []}
              total={close?.totalOutPaise || 0}
              empty={DAYCLOSE.noneOut}
            />
          </div>

          <p className="ap-hint" style={{ marginTop: 14 }}>
            {DAYCLOSE.signoff} {shop.user?.name || shop.user?.phone || ""} {DAYCLOSE.signoffOn}{" "}
            {formatDateLong(today())}
          </p>
        </>
      )}
    </>
  );
}

function ModeTable({ title, note, rows, total, empty }) {
  return (
    <section className="ap-panel">
      <div className="ap-panel-head">
        <h2>{title}</h2>
        <span className="ap-sub ap-spacer">{note}</span>
      </div>
      {rows.length ? (
        <div className="ap-tablewrap">
          <table className="ap-table">
            <tbody>
              {rows.map((r) => (
                <tr key={r.mode}>
                  <td className="ap-strong">{modeLabel(r.mode)}</td>
                  <td className="ap-sub">
                    {r.count} {r.count === 1 ? "payment" : "payments"}
                  </td>
                  <td className="ap-right ap-num ap-strong">{rupees(r.paise)}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={2} className="ap-strong">
                  Total
                </td>
                <td className="ap-right ap-num ap-strong">{rupees(total)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="ap-panel-body ap-sub">{empty}</div>
      )}
    </section>
  );
}
