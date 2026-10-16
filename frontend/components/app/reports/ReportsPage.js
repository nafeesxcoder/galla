"use client";

// ===========================================================================
// REPORTS
// ---------------------------------------------------------------------------
// Four questions a shopkeeper asks at the end of a day, a month, or a year,
// and this screen is only here to answer them:
//
//   how much did I sell       how much actually came in
//   what is still owed        what did I earn on it
//
// Plus the GST summary, which is the one thing an accountant will ask for by
// name. It is laid out the way GSTR-1 wants it - taxable value and tax
// split by rate - so it can be handed over as it is.
//
// The totals come from the bill list, which is one request. The GST split
// and the best-sellers need each bill's lines, so those bills are fetched as
// well, a handful at a time. Over a long range that is a lot of requests, so
// it stops at a sensible number and says so rather than hammering the server
// quietly. The CSV download has no such limit.
// ===========================================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { REPORTS, COMMON } from "../content";
import { useShop } from "../useShop";
import { Empty, ErrorState, Note, PageHead, Spinner } from "../ui/Bits";
import { IconChart, IconDownload, IconWarn } from "../Icons";
import { rupees, rupeesShort, formatQty, formatDate, today, daysAgo } from "../../../lib/money";
import { unitShort, modeLabel } from "../../../lib/units";
import { listInvoices, listItems, listPayments, getInvoice, listExpenses } from "../data";

// How many bills we will open to read their lines. Past this the summary is
// still exact - it comes from the list - but the item-level tables are built
// from the most recent ones only, and the screen says so.
const DETAIL_LIMIT = 150;

function rangeDates(kind) {
  const t = today();
  if (kind === "today") return { from: t, to: t };
  if (kind === "yesterday") return { from: daysAgo(1), to: daysAgo(1) };
  if (kind === "week") return { from: daysAgo(6), to: t };
  if (kind === "month") return { from: `${t.slice(0, 7)}-01`, to: t };
  if (kind === "lastMonth") {
    const d = new Date(`${t}T00:00:00`);
    d.setDate(1);
    d.setMonth(d.getMonth() - 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const last = new Date(y, d.getMonth() + 1, 0).getDate();
    return { from: `${y}-${m}-01`, to: `${y}-${m}-${String(last).padStart(2, "0")}` };
  }
  return { from: daysAgo(30), to: t };
}

// Small batches rather than one big Promise.all. Firing two hundred requests
// at a shop's laptop at once is how you get a wall of timeouts.
async function inBatches(list, size, fn) {
  const out = [];
  for (let i = 0; i < list.length; i += size) {
    const chunk = list.slice(i, i + size);
    out.push(...(await Promise.all(chunk.map(fn))));
  }
  return out;
}

function csvCell(v) {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadCsv(filename, rows) {
  const body = rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
  // The BOM is what makes Excel open a rupee sign and Devanagari correctly
  // instead of mojibake. Without it the file looks broken to most people.
  const blob = new Blob([`﻿${body}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const shop = useShop();
  const [kind, setKind] = useState("month");
  const [custom, setCustom] = useState(() => rangeDates("month"));
  const [state, setState] = useState({ loading: true, error: null });
  const [bills, setBills] = useState([]);
  const [detailed, setDetailed] = useState([]);
  const [items, setItems] = useState([]);
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [linesFailed, setLinesFailed] = useState(false);

  const range = kind === "custom" ? custom : rangeDates(kind);

  const load = useCallback(async () => {
    setState({ loading: true, error: null });
    setLinesFailed(false);
    try {
      const [inv, itm, pay, exp] = await Promise.all([
        listInvoices({ docType: "sale", limit: 500 }),
        listItems({ limit: 500 }).catch(() => ({ rows: [] })),
        listPayments({ limit: 500 }).catch(() => ({ rows: [] })),
        // Expenses may not be mounted on an older backend. Without them the
        // profit figure is gross rather than net, and the tile says so
        // rather than quietly overstating it.
        listExpenses({ limit: 500 }).catch(() => ({ rows: [] })),
      ]);
      setBills(inv.rows);
      setItems(itm.rows);
      setPayments(pay.rows);
      setExpenses(exp.rows);
      setState({ loading: false, error: null });
    } catch (e) {
      setState({ loading: false, error: e });
    }
  }, [shop.businessId]);

  useEffect(() => {
    if (shop.businessId) load();
  }, [shop.businessId, load]);

  const live = useMemo(
    () =>
      bills.filter(
        (b) => b.status !== "cancelled" && b.date >= range.from && b.date <= range.to
      ),
    [bills, range.from, range.to]
  );

  // Open the bills to read their lines. Only the ones in range, newest first,
  // and only once per range.
  useEffect(() => {
    if (state.loading || !live.length) {
      setDetailed([]);
      return undefined;
    }
    let alive = true;
    const wanted = live.slice(0, DETAIL_LIMIT);

    // A list endpoint that already sends the lines saves the whole round
    // trip, so check before asking again.
    if (wanted.every((b) => b.lines && b.lines.length)) {
      setDetailed(wanted);
      return undefined;
    }

    (async () => {
      try {
        const full = await inBatches(wanted, 6, (b) =>
          b.lines && b.lines.length ? Promise.resolve(b) : getInvoice(b.id).catch(() => null)
        );
        if (!alive) return;
        const ok = full.filter(Boolean);
        setDetailed(ok);
        setLinesFailed(ok.length === 0);
      } catch {
        if (alive) setLinesFailed(true);
      }
    })();

    return () => {
      alive = false;
    };
  }, [live, state.loading]);

  const summary = useMemo(() => {
    const sales = live.reduce((a, b) => a + b.amounts.total, 0);
    const received = live.reduce((a, b) => a + b.amounts.paid, 0);
    const due = live.reduce((a, b) => a + b.amounts.balance, 0);
    return {
      sales,
      received,
      due,
      count: live.length,
      average: live.length ? Math.round(sales / live.length) : 0,
    };
  }, [live]);

  // Profit needs the cost price off the item, which the bill line does not
  // carry - the line records what was charged, not what it cost. Items with
  // no cost saved are counted and called out, because silently treating them
  // as free would flatter the number.
  const costOf = useMemo(() => {
    const map = new Map();
    for (const i of items) map.set(i.id, i.costPaise);
    return map;
  }, [items]);

  const itemStats = useMemo(() => {
    const byItem = new Map();
    const byRate = new Map();
    let costKnown = 0;
    let costMissing = 0;
    let revenue = 0;
    let cost = 0;

    for (const b of detailed) {
      for (const l of b.lines || []) {
        const key = l.itemId ?? `name:${l.name}`;
        const row = byItem.get(key) || { name: l.name, unit: l.unit, qty: 0, value: 0 };
        row.qty += l.quantity;
        row.value += l.taxablePaise;
        byItem.set(key, row);

        const rate = l.taxRate || 0;
        const r = byRate.get(rate) || { rate, taxable: 0, cgst: 0, sgst: 0, igst: 0 };
        r.taxable += l.taxablePaise;
        r.cgst += l.cgstPaise;
        r.sgst += l.sgstPaise;
        r.igst += l.igstPaise;
        byRate.set(rate, r);

        revenue += l.taxablePaise;
        const unitCost = l.itemId != null ? costOf.get(l.itemId) : null;
        if (unitCost) {
          cost += Math.round(unitCost * l.quantity);
          costKnown++;
        } else {
          costMissing++;
        }
      }
    }

    return {
      top: [...byItem.values()].sort((a, b) => b.value - a.value),
      gst: [...byRate.values()].filter((r) => r.rate > 0).sort((a, b) => a.rate - b.rate),
      profit: revenue - cost,
      costKnown,
      costMissing,
    };
  }, [detailed, costOf]);

  const spend = useMemo(
    () =>
      expenses
        .filter((e) => e.date >= range.from && e.date <= range.to)
        .reduce((a, e) => a + e.totalPaise, 0),
    [expenses, range.from, range.to]
  );

  const byDay = useMemo(() => {
    const map = new Map();
    for (const b of live) map.set(b.date, (map.get(b.date) || 0) + b.amounts.total);
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([date, paise]) => ({ date, paise }));
  }, [live]);

  const byMode = useMemo(() => {
    const inRange = payments.filter(
      (p) => p.direction === "in" && p.date >= range.from && p.date <= range.to
    );
    const map = new Map();
    for (const p of inRange) map.set(p.mode, (map.get(p.mode) || 0) + p.amountPaise);
    const total = [...map.values()].reduce((a, b) => a + b, 0);
    return {
      total,
      rows: [...map.entries()].sort((a, b) => b[1] - a[1]).map(([mode, paise]) => ({ mode, paise })),
    };
  }, [payments, range.from, range.to]);

  if (state.error) return <ErrorState error={state.error} onRetry={load} />;

  const label = `${formatDate(range.from)} to ${formatDate(range.to)}`;
  const truncated = live.length > DETAIL_LIMIT;

  return (
    <>
      <PageHead title={REPORTS.title}>
        <button
          type="button"
          className="ap-btn"
          disabled={!live.length}
          onClick={() =>
            downloadCsv(`bills-${range.from}-to-${range.to}.csv`, [
              ["Bill no.", "Date", "Customer", "Taxable", "CGST", "SGST", "IGST", "Total", "Paid", "Due", "Status"],
              ...live.map((b) => [
                b.number,
                b.date,
                b.partyName || "Walk-in",
                (b.amounts.taxable / 100).toFixed(2),
                (b.amounts.cgst / 100).toFixed(2),
                (b.amounts.sgst / 100).toFixed(2),
                (b.amounts.igst / 100).toFixed(2),
                (b.amounts.total / 100).toFixed(2),
                (b.amounts.paid / 100).toFixed(2),
                (b.amounts.balance / 100).toFixed(2),
                b.status || "",
              ]),
            ])
          }
        >
          <IconDownload size={16} /> {REPORTS.downloadBills}
        </button>
      </PageHead>

      {/* the range */}
      <div className="ap-panel" style={{ marginBottom: 16 }}>
        <div className="ap-panel-head" style={{ flexWrap: "wrap", gap: 12 }}>
          <div className="ap-seg">
            {REPORTS.ranges.map((r) => (
              <button key={r.value} type="button" aria-pressed={kind === r.value} onClick={() => setKind(r.value)}>
                {r.label}
              </button>
            ))}
          </div>

          {kind === "custom" ? (
            <div className="ap-row" style={{ gap: 8 }}>
              <label className="ap-row" style={{ gap: 6 }}>
                <span className="ap-sub">{REPORTS.from}</span>
                <input
                  type="date"
                  className="ap-input"
                  style={{ width: 160 }}
                  value={custom.from}
                  max={custom.to}
                  onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))}
                />
              </label>
              <label className="ap-row" style={{ gap: 6 }}>
                <span className="ap-sub">{REPORTS.to}</span>
                <input
                  type="date"
                  className="ap-input"
                  style={{ width: 160 }}
                  value={custom.to}
                  min={custom.from}
                  onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))}
                />
              </label>
            </div>
          ) : (
            <span className="ap-sub ap-spacer">{label}</span>
          )}
        </div>
      </div>

      {state.loading ? (
        <div className="ap-panel">
          <div className="ap-panel-body">
            <Spinner label={REPORTS.loading} />
          </div>
        </div>
      ) : !live.length ? (
        <div className="ap-panel">
          <Empty icon={<IconChart size={34} />} title={REPORTS.emptyTitle} body={REPORTS.emptyBody} />
        </div>
      ) : (
        <>
          <div className="ap-tiles ap-tiles-5" style={{ marginBottom: 16 }}>
            <div className="ap-tile">
              <div className="ap-tile-label">{REPORTS.tiles.sales}</div>
              <div className="ap-tile-value">{rupeesShort(summary.sales)}</div>
              <div className="ap-tile-note">
                {REPORTS.tiles.salesNote
                  .replace("{count}", summary.count)
                  .replace("{bills}", summary.count === 1 ? "bill" : "bills")
                  .replace("{avg}", rupees(summary.average, { decimals: false }))}
              </div>
            </div>

            <div className="ap-tile ap-tile-good">
              <div className="ap-tile-label">{REPORTS.tiles.received}</div>
              <div className="ap-tile-value">{rupeesShort(summary.received)}</div>
              <div className="ap-tile-note">{REPORTS.tiles.receivedNote}</div>
            </div>

            <div className={summary.due ? "ap-tile ap-tile-bad" : "ap-tile"}>
              <div className="ap-tile-label">{REPORTS.tiles.due}</div>
              <div className="ap-tile-value">{rupeesShort(summary.due)}</div>
              <div className="ap-tile-note">{REPORTS.tiles.dueNote}</div>
            </div>

            <div className="ap-tile">
              <div className="ap-tile-label">{REPORTS.tiles.spend}</div>
              <div className="ap-tile-value">{rupeesShort(spend)}</div>
              <div className="ap-tile-note">{REPORTS.tiles.spendNote}</div>
            </div>

            <div className="ap-tile">
              <div className="ap-tile-label">{REPORTS.tiles.profit}</div>
              <div className="ap-tile-value">
                {detailed.length ? (
                  rupeesShort(itemStats.profit - spend)
                ) : (
                  <span className="ap-sub">{"–"}</span>
                )}
              </div>
              <div className="ap-tile-note">
                {detailed.length
                  ? REPORTS.tiles.profitNote
                      .replace("{gross}", rupeesShort(itemStats.profit))
                      .replace("{spend}", rupeesShort(spend))
                  : ""}
              </div>
            </div>
          </div>

          {truncated ? (
            <div style={{ marginBottom: 14 }}>
              <Note kind="info" icon={false}>
                {REPORTS.partial.replace("{shown}", DETAIL_LIMIT).replace("{total}", live.length)}
              </Note>
            </div>
          ) : null}

          {itemStats.costMissing ? (
            <div style={{ marginBottom: 14 }}>
              <Note kind="warn" icon={<IconWarn size={17} />}>
                {REPORTS.profitWarn.replace("{count}", itemStats.costMissing)}
              </Note>
            </div>
          ) : null}

          {linesFailed ? (
            <div style={{ marginBottom: 14 }}>
              <Note kind="warn">{REPORTS.linesMissing}</Note>
            </div>
          ) : null}

          <DayChart rows={byDay} />

          <section className="ap-panel" style={{ marginBottom: 16 }}>
            <div className="ap-panel-head">
              <h2>{REPORTS.gstTitle}</h2>
              <span className="ap-sub ap-spacer">{REPORTS.gstNote}</span>
              <button
                type="button"
                className="ap-btn ap-btn-sm"
                disabled={!itemStats.gst.length}
                onClick={() =>
                  downloadCsv(`gst-${range.from}-to-${range.to}.csv`, [
                    ["Rate %", "Taxable value", "CGST", "SGST", "IGST", "Total tax"],
                    ...itemStats.gst.map((r) => [
                      r.rate,
                      (r.taxable / 100).toFixed(2),
                      (r.cgst / 100).toFixed(2),
                      (r.sgst / 100).toFixed(2),
                      (r.igst / 100).toFixed(2),
                      ((r.cgst + r.sgst + r.igst) / 100).toFixed(2),
                    ]),
                  ])
                }
              >
                <IconDownload size={15} /> {REPORTS.downloadGst}
              </button>
            </div>
            {itemStats.gst.length ? (
              <div className="ap-tablewrap">
                <table className="ap-table">
                  <thead>
                    <tr>
                      <th>{REPORTS.gstRate}</th>
                      <th className="ap-right">{REPORTS.gstTaxable}</th>
                      <th className="ap-right">{REPORTS.gstCgst}</th>
                      <th className="ap-right">{REPORTS.gstSgst}</th>
                      <th className="ap-right">{REPORTS.gstIgst}</th>
                      <th className="ap-right">{REPORTS.gstTotal}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemStats.gst.map((r) => (
                      <tr key={r.rate}>
                        <td className="ap-strong">{r.rate}%</td>
                        <td className="ap-right ap-num">{rupees(r.taxable)}</td>
                        <td className="ap-right ap-num">{rupees(r.cgst)}</td>
                        <td className="ap-right ap-num">{rupees(r.sgst)}</td>
                        <td className="ap-right ap-num">{rupees(r.igst)}</td>
                        <td className="ap-right ap-num ap-strong">
                          {rupees(r.cgst + r.sgst + r.igst)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="ap-panel-body ap-sub">{REPORTS.gstEmpty}</div>
            )}
          </section>

          <div className="ap-grid2" style={{ gap: 16, alignItems: "start" }}>
            <section className="ap-panel">
              <div className="ap-panel-head">
                <h2>{REPORTS.topTitle}</h2>
                <button
                  type="button"
                  className="ap-btn ap-btn-sm ap-spacer"
                  disabled={!itemStats.top.length}
                  onClick={() =>
                    downloadCsv(`item-sales-${range.from}-to-${range.to}.csv`, [
                      ["Item", "Quantity", "Unit", "Value"],
                      ...itemStats.top.map((r) => [
                        r.name,
                        formatQty(r.qty),
                        unitShort(r.unit),
                        (r.value / 100).toFixed(2),
                      ]),
                    ])
                  }
                >
                  <IconDownload size={15} /> CSV
                </button>
              </div>
              {itemStats.top.length ? (
                <div className="ap-tablewrap">
                  <table className="ap-table">
                    <thead>
                      <tr>
                        <th>{REPORTS.topItem}</th>
                        <th className="ap-right">{REPORTS.topQty}</th>
                        <th className="ap-right">{REPORTS.topValue}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemStats.top.slice(0, 10).map((r) => (
                        <tr key={r.name}>
                          <td>{r.name}</td>
                          <td className="ap-right ap-num">
                            {formatQty(r.qty)} {unitShort(r.unit)}
                          </td>
                          <td className="ap-right ap-num ap-strong">{rupees(r.value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="ap-panel-body ap-sub">{REPORTS.topEmpty}</div>
              )}
            </section>

            <section className="ap-panel">
              <div className="ap-panel-head">
                <h2>{REPORTS.modeTitle}</h2>
                <span className="ap-sub ap-spacer">{REPORTS.modeNote}</span>
              </div>
              {byMode.rows.length ? (
                <div className="ap-panel-body" style={{ display: "grid", gap: 11 }}>
                  {byMode.rows.map((r) => {
                    const pct = byMode.total ? Math.round((r.paise / byMode.total) * 100) : 0;
                    return (
                      <div key={r.mode}>
                        <div className="ap-row" style={{ justifyContent: "space-between", marginBottom: 4 }}>
                          <span>{modeLabel(r.mode)}</span>
                          <span className="ap-num ap-strong">
                            {rupees(r.paise)} <span className="ap-sub">({pct}%)</span>
                          </span>
                        </div>
                        <div style={{ height: 7, background: "var(--ap-sunken)", borderRadius: 999 }}>
                          <div
                            style={{
                              width: `${pct}%`,
                              height: "100%",
                              background: "var(--ap-brand)",
                              borderRadius: 999,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="ap-panel-body ap-sub">{REPORTS.modeEmpty}</div>
              )}
            </section>
          </div>
        </>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// day by day
// ---------------------------------------------------------------------------
// Scrolls sideways rather than squeezing a month into the width of the
// panel. Thirty bars two pixels wide tell you nothing.
function DayChart({ rows }) {
  if (!rows.length) return null;
  const max = Math.max(1, ...rows.map((r) => r.paise));

  return (
    <section className="ap-panel" style={{ marginBottom: 16 }}>
      <div className="ap-panel-head">
        <h2>{REPORTS.dayTitle}</h2>
        <span className="ap-sub ap-spacer">{REPORTS.dayNote}</span>
      </div>
      <div className="ap-panel-body" style={{ overflowX: "auto" }}>
        {/* A single day's bar must not stretch to the full width of the
            panel - one enormous green slab says nothing. Each column is
            capped, and they start from the left rather than spreading. */}
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "flex-end",
            justifyContent: "flex-start",
            minWidth: Math.min(rows.length * 42, 2000),
          }}
        >
          {rows.map((r) => (
            <div key={r.date} style={{ flex: 1, minWidth: 34, maxWidth: 64, textAlign: "center" }}>
              <div style={{ height: 120, display: "flex", alignItems: "flex-end" }}>
                <div
                  title={`${formatDate(r.date)} — ${rupees(r.paise)}`}
                  style={{
                    width: "100%",
                    height: Math.max(4, Math.round((r.paise / max) * 120)),
                    background: "var(--ap-brand)",
                    borderRadius: "5px 5px 2px 2px",
                  }}
                />
              </div>
              <div className="ap-sub" style={{ marginTop: 6, fontSize: 11 }}>
                {r.date.slice(8)}/{r.date.slice(5, 7)}
              </div>
              <div className="ap-sub" style={{ fontSize: 11 }}>
                {rupeesShort(r.paise)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
