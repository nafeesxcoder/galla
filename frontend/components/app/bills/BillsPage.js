"use client";

// ===========================================================================
// ALL THE BILLS
// ---------------------------------------------------------------------------
// Filters that match the questions actually asked: what went out today, what
// is still unpaid, how the month is going. The totals line at the top is of
// the filtered set, not of everything, because otherwise it answers a
// question nobody asked.
// ===========================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { BILLS, BILLING } from "../content";
import { Empty, ErrorState, PageHead, StatusPill, TableSkeleton } from "../ui/Bits";
import { IconPlus, IconSearch, IconBill } from "../Icons";
import { rupees, rupeesShort, formatDate, today, daysAgo, relativeDay } from "../../../lib/money";
import { listInvoices } from "../data";

const DOC_LABEL = {};
for (const d of BILLING.docTypes) DOC_LABEL[d.value] = d.label;

export default function BillsPage() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [docType, setDocType] = useState("sale");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const seq = useRef(0);

  const load = useCallback(
    async (term, type) => {
      const mine = ++seq.current;
      setLoading(true);
      setError(null);
      try {
        const { rows: found } = await listInvoices({
          docType: type || undefined,
          search: term || undefined,
          limit: 200,
        });
        if (seq.current !== mine) return;
        setRows(found);
      } catch (e) {
        if (seq.current === mine) setError(e);
      } finally {
        if (seq.current === mine) setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const timer = setTimeout(() => load(q.trim(), docType), q ? 220 : 0);
    return () => clearTimeout(timer);
  }, [q, docType, load]);

  const shown = useMemo(() => {
    const t = today();
    const week = daysAgo(6);
    const month = `${t.slice(0, 7)}-01`;
    let out = rows;
    if (filter === "unpaid") out = out.filter((r) => r.status !== "cancelled" && r.amounts.balance > 0);
    if (filter === "today") out = out.filter((r) => r.date === t);
    if (filter === "week") out = out.filter((r) => r.date >= week);
    if (filter === "month") out = out.filter((r) => r.date >= month);
    return out;
  }, [rows, filter]);

  const totals = useMemo(() => {
    const live = shown.filter((r) => r.status !== "cancelled");
    return {
      count: live.length,
      total: live.reduce((a, r) => a + r.amounts.total, 0),
      due: live.reduce((a, r) => a + r.amounts.balance, 0),
    };
  }, [shown]);

  return (
    <>
      <PageHead title={BILLS.title}>
        <Link href="/app/billing" className="ap-btn ap-btn-primary">
          <IconPlus size={17} /> {BILLS.add}
        </Link>
      </PageHead>

      {!loading && shown.length ? (
        <div className="ap-tiles" style={{ marginBottom: 14, gridTemplateColumns: "repeat(3, minmax(0,1fr))" }}>
          <div className="ap-tile">
            <div className="ap-tile-label">Bills shown</div>
            <div className="ap-tile-value">{totals.count}</div>
          </div>
          <div className="ap-tile">
            <div className="ap-tile-label">Their value</div>
            <div className="ap-tile-value">{rupeesShort(totals.total)}</div>
          </div>
          <div className="ap-tile ap-tile-bad">
            <div className="ap-tile-label">Still due</div>
            <div className="ap-tile-value">{rupeesShort(totals.due)}</div>
          </div>
        </div>
      ) : null}

      <div className="ap-panel">
        <div className="ap-panel-head" style={{ flexWrap: "wrap" }}>
          <div className="ap-search">
            <span className="ap-search-ico">
              <IconSearch size={17} />
            </span>
            <input
              className="ap-input"
              placeholder={BILLS.searchPlaceholder}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label={BILLS.searchPlaceholder}
            />
          </div>

          <select
            className="ap-select"
            style={{ width: "auto", minWidth: 140 }}
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            aria-label="Bill type"
          >
            {BILLING.docTypes.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>

          <div className="ap-seg ap-spacer">
            {[
              ["all", BILLS.filterAll],
              ["unpaid", BILLS.filterUnpaid],
              ["today", BILLS.filterToday],
              ["week", BILLS.filterWeek],
              ["month", BILLS.filterMonth],
            ].map(([value, label]) => (
              <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <div className="ap-panel-body">
            <ErrorState error={error} onRetry={() => load(q.trim(), docType)} />
          </div>
        ) : loading ? (
          <TableSkeleton rows={7} cols={5} />
        ) : shown.length ? (
          <div className="ap-tablewrap">
            <table className="ap-table">
              <thead>
                <tr>
                  <th>{BILLS.colNumber}</th>
                  <th>{BILLS.colDate}</th>
                  <th>{BILLS.colParty}</th>
                  <th className="ap-right">{BILLS.colTotal}</th>
                  <th className="ap-right">{BILLS.colBalance}</th>
                  <th className="ap-right">{BILLS.colStatus}</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <Link href={`/app/bills/${b.id}`}>{b.number}</Link>
                      {b.docType !== docType ? <div className="ap-sub">{DOC_LABEL[b.docType]}</div> : null}
                    </td>
                    <td className="ap-sub">{relativeDay(b.date)}</td>
                    <td>{b.partyName || <span className="ap-sub">Walk-in</span>}</td>
                    <td className="ap-right ap-num ap-strong">{rupees(b.amounts.total)}</td>
                    <td className="ap-right ap-num">
                      {b.status !== "cancelled" && b.amounts.balance > 0 ? (
                        <span style={{ color: "var(--ap-danger)" }}>{rupees(b.amounts.balance)}</span>
                      ) : (
                        <span className="ap-sub">{"–"}</span>
                      )}
                    </td>
                    <td className="ap-right">
                      <StatusPill invoice={b} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            icon={<IconBill size={34} />}
            title={q || filter !== "all" ? BILLS.emptyFilterTitle : BILLS.emptyTitle}
            body={q || filter !== "all" ? BILLS.emptyFilterBody : BILLS.emptyBody}
            action={
              <Link href="/app/billing" className="ap-btn ap-btn-primary">
                <IconPlus size={17} /> {BILLS.add}
              </Link>
            }
          />
        )}
      </div>

      <p className="ap-hint" style={{ marginTop: 10 }}>
        Dates shown as {formatDate(today())} format. Cancelled bills stay in the list on purpose: GST needs
        the numbering unbroken, so nothing is ever deleted.
      </p>
    </>
  );
}
