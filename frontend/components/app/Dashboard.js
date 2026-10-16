"use client";

// ===========================================================================
// HOME
// ---------------------------------------------------------------------------
// What a shopkeeper wants on opening the app: what sold today, what came in,
// who still owes, and what is about to run out. Four numbers and three short
// lists, and then out of the way.
//
// The figures are worked out from the last stretch of bills rather than from
// a reporting endpoint. For a shop doing tens of bills a day that is one
// request and it is instant. A shop doing thousands will want the server to
// total it instead, and that is the point to add a summary endpoint - not
// before, because the shape of what is worth totalling is still moving.
// ===========================================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { HOME, ITEMS, BATCHES } from "./content";
import { useShop } from "./useShop";
import { Empty, ErrorState, StatusPill, TableSkeleton } from "./ui/Bits";
import { IconPlus, IconBox, IconUsers, IconRupee, IconArrowDown, IconBill, IconCheck } from "./Icons";
import { rupees, rupeesShort, formatQty, formatDate, today, daysAgo, ageInDays, relativeDay } from "../../lib/money";
import { unitShort } from "../../lib/units";
import { listInvoices, listItems, listParties, getBusiness, expiringBatches } from "./data";

export default function Dashboard() {
  const shop = useShop();
  const [state, setState] = useState({ loading: true, error: null });
  const [bills, setBills] = useState([]);
  const [items, setItems] = useState([]);
  const [parties, setParties] = useState([]);
  const [biz, setBiz] = useState(null);
  const [expiring, setExpiring] = useState([]);

  const load = useCallback(async () => {
    setState({ loading: true, error: null });
    try {
      // Four calls at once rather than one after another - they do not
      // depend on each other, and a shop connection has more latency than
      // bandwidth.
      const [inv, itm, prt, business, batches] = await Promise.all([
        listInvoices({ docType: "sale", limit: 60 }),
        listItems({ limit: 200 }),
        listParties({ limit: 200 }),
        getBusiness(shop.businessId).catch(() => null),
        // Only shops that track batches have any of these. For everyone else
        // it comes back empty and the panel stays out of the way.
        expiringBatches({ days: 30 }).catch(() => []),
      ]);
      setBills(inv.rows);
      setItems(itm.rows);
      setParties(prt.rows);
      setBiz(business);
      setExpiring(batches);
      setState({ loading: false, error: null });
    } catch (e) {
      setState({ loading: false, error: e });
    }
  }, [shop.businessId]);

  useEffect(() => {
    if (shop.businessId) load();
  }, [shop.businessId, load]);

  const stats = useMemo(() => {
    const t = today();
    const live = bills.filter((b) => b.status !== "cancelled");
    const todays = live.filter((b) => b.date === t);

    const salesToday = todays.reduce((a, b) => a + b.amounts.total, 0);
    const receivedToday = todays.reduce((a, b) => a + b.amounts.paid, 0);

    const toCollect = parties.reduce((a, p) => a + p.owesUs, 0);
    const toPay = parties.reduce((a, p) => a + p.weOwe, 0);

    const low = items
      .filter((i) => i.type !== "service" && (i.isLow || i.isOut))
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 6);

    const owing = parties
      .filter((p) => p.owesUs > 0)
      // Biggest debt first. The API does not say when a party was last
      // billed, so there is no age to sort by here - the ageing that does
      // exist is on each customer's own page, from their bills.
      .sort((a, b) => b.owesUs - a.owesUs)
      .slice(0, 6);

    // Last seven days, oldest on the left, for the little bar chart.
    const week = [];
    for (let i = 6; i >= 0; i--) {
      const d = daysAgo(i);
      const sum = live.filter((b) => b.date === d).reduce((a, b) => a + b.amounts.total, 0);
      week.push({ date: d, paise: sum });
    }

    return {
      salesToday,
      billsToday: todays.length,
      receivedToday,
      toCollect,
      toPay,
      low,
      owing,
      week,
      recent: live.slice(0, 6),
    };
  }, [bills, items, parties]);

  if (state.error) return <ErrorState error={state.error} onRetry={load} />;

  const hour = new Date().getHours();
  const greet = hour < 12 ? HOME.greetMorning : hour < 17 ? HOME.greetAfternoon : HOME.greetEvening;
  const name = (shop.user?.name || "").split(" ")[0];

  const needsSetup = !state.loading && (items.length === 0 || !biz?.gstin || bills.length === 0);

  return (
    <div className="ap-stack" style={{ gap: 16 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 19, letterSpacing: "-0.02em" }}>
          {greet}
          {name ? `, ${name}` : ""}
        </h2>
        <p className="ap-sub" style={{ margin: "2px 0 0" }}>
          {shop.shop?.name}
          {biz?.stateName ? ` · ${biz.stateName}` : ""}
        </p>
      </div>

      <div className="ap-tiles">
        <div className="ap-tile">
          <div className="ap-tile-label">
            <IconRupee size={14} /> {HOME.tiles.sales}
          </div>
          <div className="ap-tile-value">
            {state.loading ? <span className="ap-skel" style={{ width: 90, height: 22, display: "block" }} /> : rupeesShort(stats.salesToday)}
          </div>
          <div className="ap-tile-note">
            {stats.billsToday} {stats.billsToday === 1 ? "bill today" : HOME.tiles.salesNote}
          </div>
        </div>

        <div className="ap-tile ap-tile-good">
          <div className="ap-tile-label">
            <IconArrowDown size={14} /> {HOME.tiles.received}
          </div>
          <div className="ap-tile-value">
            {state.loading ? <span className="ap-skel" style={{ width: 90, height: 22, display: "block" }} /> : rupeesShort(stats.receivedToday)}
          </div>
          <div className="ap-tile-note">{HOME.tiles.receivedNote}</div>
        </div>

        <Link href="/app/parties?filter=owing" className="ap-tile ap-tile-bad">
          <div className="ap-tile-label">
            <IconUsers size={14} /> {HOME.tiles.toCollect}
          </div>
          <div className="ap-tile-value">
            {state.loading ? <span className="ap-skel" style={{ width: 90, height: 22, display: "block" }} /> : rupeesShort(stats.toCollect)}
          </div>
          <div className="ap-tile-note">{HOME.tiles.toCollectNote}</div>
        </Link>

        <div className="ap-tile">
          <div className="ap-tile-label">
            <IconBox size={14} /> {HOME.tiles.toPay}
          </div>
          <div className="ap-tile-value">
            {state.loading ? <span className="ap-skel" style={{ width: 90, height: 22, display: "block" }} /> : rupeesShort(stats.toPay)}
          </div>
          <div className="ap-tile-note">{HOME.tiles.toPayNote}</div>
        </div>
      </div>

      <div className="ap-row">
        <Link href="/app/billing" className="ap-btn ap-btn-primary ap-btn-lg">
          <IconPlus size={18} /> {HOME.newBill}
        </Link>
        <Link href="/app/items" className="ap-btn">
          <IconBox size={17} /> {HOME.addItem}
        </Link>
        <Link href="/app/parties" className="ap-btn">
          <IconUsers size={17} /> {HOME.addParty}
        </Link>
      </div>

      {needsSetup ? (
        <SetupChecklist items={items} bills={bills} biz={biz} />
      ) : null}

      <WeekBars week={stats.week} loading={state.loading} />

      <div className="ap-grid2" style={{ gap: 16, alignItems: "start" }}>
        <section className="ap-panel">
          <div className="ap-panel-head">
            <h2>{HOME.recent}</h2>
            <Link href="/app/bills" className="ap-btn ap-btn-sm ap-btn-ghost ap-spacer">
              {HOME.seeAll}
            </Link>
          </div>
          {state.loading ? (
            <TableSkeleton rows={4} cols={3} />
          ) : stats.recent.length ? (
            <div className="ap-tablewrap">
              <table className="ap-table">
                <tbody>
                  {stats.recent.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <Link href={`/app/bills/${b.id}`}>{b.number}</Link>
                        <div className="ap-sub">
                          {b.partyName || "Walk-in"}
                          {" · "}
                          {relativeDay(b.date)}
                        </div>
                      </td>
                      <td className="ap-right ap-num ap-strong">{rupees(b.amounts.total)}</td>
                      <td className="ap-right">
                        <StatusPill invoice={b} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty icon={<IconBill size={32} />} title={HOME.recentEmpty} />
          )}
        </section>

        <section className="ap-panel">
          <div className="ap-panel-head">
            <h2>{HOME.owes}</h2>
            <Link href="/app/parties" className="ap-btn ap-btn-sm ap-btn-ghost ap-spacer">
              {HOME.seeAll}
            </Link>
          </div>
          {state.loading ? (
            <TableSkeleton rows={4} cols={2} />
          ) : stats.owing.length ? (
            <div className="ap-tablewrap">
              <table className="ap-table">
                <tbody>
                  {stats.owing.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <Link href={`/app/parties/${p.id}`}>{p.name}</Link>
                      </td>
                      <td className="ap-right ap-num ap-strong" style={{ color: "var(--ap-danger)" }}>
                        {rupees(p.owesUs)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty icon={<IconCheck size={32} />} title={HOME.owesEmpty} />
          )}
        </section>
      </div>

      {expiring.length ? (
        <section className="ap-panel">
          <div className="ap-panel-head">
            <h2>{BATCHES.expiringTitle}</h2>
            <span className="ap-sub ap-spacer">{BATCHES.expiringNote.replace("{days}", 30)}</span>
          </div>
          <div className="ap-tablewrap">
            <table className="ap-table">
              <tbody>
                {expiring.slice(0, 8).map((b) => (
                  <tr key={b.id}>
                    <td>
                      <Link href="/app/items">{b.itemName}</Link>
                      <div className="ap-sub" style={{ fontFamily: "var(--ap-mono)" }}>
                        {b.batchNo}
                      </div>
                    </td>
                    <td>
                      <span className={`ap-pill ${b.expired ? "ap-pill-unpaid" : "ap-pill-part"}`}>
                        {b.expired ? BATCHES.expired : formatDate(b.expiryDate)}
                      </span>
                    </td>
                    <td className="ap-right ap-num">
                      {formatQty(b.quantity)} {unitShort(b.unit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="ap-panel">
        <div className="ap-panel-head">
          <h2>{HOME.lowStock}</h2>
          <span className="ap-sub ap-spacer">{HOME.lowStockNote}</span>
        </div>
        {state.loading ? (
          <TableSkeleton rows={3} cols={3} />
        ) : stats.low.length ? (
          <div className="ap-tablewrap">
            <table className="ap-table">
              <tbody>
                {stats.low.map((i) => (
                  <tr key={i.id}>
                    <td>
                      <Link href="/app/items">{i.name}</Link>
                    </td>
                    <td>
                      {i.isOut ? (
                        <span className="ap-pill ap-pill-unpaid">{ITEMS.outTag}</span>
                      ) : (
                        <span className="ap-pill ap-pill-part">{ITEMS.lowTag}</span>
                      )}
                    </td>
                    <td className="ap-right ap-num">
                      {formatQty(i.stock)} {unitShort(i.unit)}
                      {i.lowStockAlert != null ? (
                        <span className="ap-sub"> / {formatQty(i.lowStockAlert)}</span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty icon={<IconCheck size={32} />} title={HOME.lowStockEmpty} />
        )}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// seven days, as bars
// ---------------------------------------------------------------------------
// Drawn with divs rather than a charting library. It is seven rectangles -
// pulling in a dependency for that would be sixty kilobytes to say the same
// thing, on a connection that cannot spare it.
const BAR_MAX = 104;

function WeekBars({ week, loading }) {
  const max = Math.max(1, ...week.map((d) => d.paise));
  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <section className="ap-panel">
      <div className="ap-panel-head">
        <h2>{HOME.weekTitle}</h2>
        <span className="ap-sub ap-spacer">{HOME.weekNote}</span>
      </div>
      <div className="ap-panel-body">
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
          {week.map((d) => {
            // Height in pixels, not a percentage. A percentage height inside
            // a column of automatic height resolves to nothing, and the bars
            // come out as hairlines.
            const h = loading ? 8 : Math.max(4, Math.round((d.paise / max) * BAR_MAX));
            const dow = DAYS[new Date(`${d.date}T00:00:00`).getDay()];
            return (
              <div key={d.date} style={{ flex: 1, textAlign: "center", minWidth: 0 }}>
                <div style={{ height: BAR_MAX, display: "flex", alignItems: "flex-end" }}>
                  <div
                    title={`${formatDate(d.date)} — ${rupees(d.paise)}`}
                    style={{
                      width: "100%",
                      height: h,
                      background: d.paise ? "var(--ap-brand)" : "var(--ap-line)",
                      borderRadius: "5px 5px 2px 2px",
                      transition: "height 0.25s",
                    }}
                  />
                </div>
                <div className="ap-sub" style={{ marginTop: 6, fontSize: 11 }}>
                  {dow}
                </div>
                <div className="ap-sub" style={{ fontSize: 11 }}>
                  {d.paise ? rupeesShort(d.paise) : "–"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// the three things worth doing first
// ---------------------------------------------------------------------------
function SetupChecklist({ items, bills, biz }) {
  const steps = [
    {
      done: items.length > 0,
      label: HOME.stepItems,
      note: HOME.stepItemsNote,
      href: "/app/items",
    },
    {
      done: Boolean(biz?.gstin),
      label: HOME.stepGst,
      note: HOME.stepGstNote,
      href: "/account",
    },
    {
      done: bills.length > 0,
      label: HOME.stepBill,
      note: HOME.stepBillNote,
      href: "/app/billing",
    },
  ];

  if (steps.every((s) => s.done)) return null;

  return (
    <section className="ap-panel">
      <div className="ap-panel-head">
        <h2>{HOME.setupTitle}</h2>
        <span className="ap-sub ap-spacer">{HOME.setupNote}</span>
      </div>
      <div className="ap-panel-body" style={{ display: "grid", gap: 10 }}>
        {steps.map((s) => (
          <div key={s.label} className="ap-row" style={{ gap: 11 }}>
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                flex: "0 0 auto",
                background: s.done ? "var(--ap-brand-soft)" : "var(--ap-sunken)",
                color: s.done ? "var(--ap-brand)" : "var(--ap-ink-3)",
                border: `1px solid ${s.done ? "var(--ap-brand-line)" : "var(--ap-line-strong)"}`,
              }}
            >
              {s.done ? <IconCheck size={14} /> : null}
            </span>
            <span style={{ minWidth: 0, flex: 1 }}>
              <span
                className="ap-strong"
                style={{ textDecoration: s.done ? "line-through" : "none", opacity: s.done ? 0.6 : 1 }}
              >
                {s.label}
              </span>
              <span className="ap-sub" style={{ display: "block" }}>
                {s.note}
              </span>
            </span>
            {!s.done ? (
              <Link href={s.href} className="ap-btn ap-btn-sm">
                Do it
              </Link>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
