"use client";

// ===========================================================================
// CUSTOMERS AND SUPPLIERS
// ---------------------------------------------------------------------------
// The list is sorted by who owes the most, not alphabetically. A shopkeeper
// opening this screen is almost always here to find out who to chase, and
// an A-to-Z list buries that.
// ===========================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PARTIES } from "../content";
import { Empty, ErrorState, PageHead, TableSkeleton } from "../ui/Bits";
import { IconPlus, IconSearch, IconUsers, IconPhone } from "../Icons";
import { rupees, rupeesShort } from "../../../lib/money";
import { listParties } from "../data";
import PartyForm from "./PartyForm";

export default function PartiesPage() {
  const params = useSearchParams();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState(() => (params?.get("filter") === "owing" ? "owing" : "all"));
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);
  const seq = useRef(0);

  const load = useCallback(async (term) => {
    const mine = ++seq.current;
    setLoading(true);
    setError(null);
    try {
      const { rows: found } = await listParties({ search: term || undefined, limit: 200 });
      if (seq.current !== mine) return;
      setRows(found);
    } catch (e) {
      if (seq.current === mine) setError(e);
    } finally {
      if (seq.current === mine) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => load(q.trim()), q ? 220 : 0);
    return () => clearTimeout(timer);
  }, [q, load]);

  const shown = useMemo(() => {
    let out = rows;
    if (filter === "customers") out = out.filter((r) => r.type === "customer" || r.type === "both");
    if (filter === "suppliers") out = out.filter((r) => r.type === "supplier" || r.type === "both");
    if (filter === "owing") out = out.filter((r) => r.owesUs > 0);
    return [...out].sort((a, b) => b.owesUs - a.owesUs || a.name.localeCompare(b.name));
  }, [rows, filter]);

  const totals = useMemo(
    () => ({
      toCollect: rows.reduce((a, r) => a + r.owesUs, 0),
      toPay: rows.reduce((a, r) => a + r.weOwe, 0),
      owing: rows.filter((r) => r.owesUs > 0).length,
    }),
    [rows]
  );

  return (
    <>
      <PageHead title={PARTIES.title}>
        <button type="button" className="ap-btn ap-btn-primary" onClick={() => setAdding(true)}>
          <IconPlus size={17} /> {PARTIES.add}
        </button>
      </PageHead>

      {!loading && rows.length ? (
        <div className="ap-tiles" style={{ marginBottom: 14, gridTemplateColumns: "repeat(3, minmax(0,1fr))" }}>
          <div className="ap-tile ap-tile-bad">
            <div className="ap-tile-label">{PARTIES.filterOwing}</div>
            <div className="ap-tile-value">{rupeesShort(totals.toCollect)}</div>
            <div className="ap-tile-note">across {totals.owing} customers</div>
          </div>
          <div className="ap-tile">
            <div className="ap-tile-label">You owe</div>
            <div className="ap-tile-value">{rupeesShort(totals.toPay)}</div>
          </div>
          <div className="ap-tile">
            <div className="ap-tile-label">On the books</div>
            <div className="ap-tile-value">{rows.length}</div>
          </div>
        </div>
      ) : null}

      <div className="ap-panel">
        <div className="ap-panel-head">
          <div className="ap-search">
            <span className="ap-search-ico">
              <IconSearch size={17} />
            </span>
            <input
              className="ap-input"
              placeholder={PARTIES.searchPlaceholder}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label={PARTIES.searchPlaceholder}
            />
          </div>
          <div className="ap-seg ap-spacer">
            {[
              ["all", PARTIES.filterAll],
              ["customers", PARTIES.filterCustomers],
              ["suppliers", PARTIES.filterSuppliers],
              ["owing", PARTIES.filterOwing],
            ].map(([value, label]) => (
              <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <div className="ap-panel-body">
            <ErrorState error={error} onRetry={() => load(q.trim())} />
          </div>
        ) : loading ? (
          <TableSkeleton rows={6} cols={4} />
        ) : shown.length ? (
          <div className="ap-tablewrap">
            <table className="ap-table">
              <thead>
                <tr>
                  <th>{PARTIES.colName}</th>
                  <th>{PARTIES.colPhone}</th>
                  <th className="ap-right">{PARTIES.colBalance}</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link href={`/app/parties/${p.id}`}>{p.name}</Link>
                      <div className="ap-sub">
                        {[
                          p.type === "supplier" ? "Supplier" : p.type === "both" ? "Customer and supplier" : null,
                          p.city || null,
                          p.gstin || null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                    </td>
                    <td>
                      {p.phone ? (
                        <a href={`tel:+91${p.phone}`} className="ap-row" style={{ gap: 6 }}>
                          <IconPhone size={14} /> {p.phone}
                        </a>
                      ) : (
                        <span className="ap-sub">{"–"}</span>
                      )}
                    </td>
                    <td className="ap-right">
                      {p.balancePaise === 0 ? (
                        <span className="ap-sub">{PARTIES.settled}</span>
                      ) : (
                        <>
                          <span
                            className="ap-strong ap-num"
                            style={{ color: p.owesUs ? "var(--ap-danger)" : "var(--ap-brand-ink)" }}
                          >
                            {rupees(Math.abs(p.balancePaise))}
                          </span>
                          <div className="ap-sub">{p.owesUs ? PARTIES.owesYou : PARTIES.youOwe}</div>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            icon={<IconUsers size={34} />}
            title={q ? PARTIES.emptySearchTitle : PARTIES.emptyTitle}
            body={q ? PARTIES.emptySearchBody : PARTIES.emptyBody}
            action={
              <button type="button" className="ap-btn ap-btn-primary" onClick={() => setAdding(true)}>
                <IconPlus size={17} /> {PARTIES.add}
              </button>
            }
          />
        )}
      </div>

      {adding ? (
        <PartyForm
          initial={{ name: q.trim() }}
          onClose={() => setAdding(false)}
          onSaved={(saved) => {
            setAdding(false);
            if (saved) setRows((prev) => [saved, ...prev.filter((r) => r.id !== saved.id)]);
          }}
        />
      ) : null}
    </>
  );
}
