"use client";

// ===========================================================================
// EXPENSES
// ---------------------------------------------------------------------------
// The other half of knowing whether the shop made money. Sales minus the cost
// of goods is gross profit; it is only the real thing once rent, electricity,
// transport and staff come out of it, and plenty of shops discover the
// difference the hard way.
//
// The grouped panel is the point of the screen. A list of forty payments
// tells you nothing; "rent 18,000, transport 4,200, tea 900" tells you where
// to look.
// ===========================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EXPENSES, COMMON } from "../content";
import { Empty, ErrorState, Note, PageHead, TableSkeleton } from "../ui/Bits";
import Modal from "../ui/Modal";
import { IconPlus, IconSearch, IconWallet, IconEdit, IconTrash } from "../Icons";
import { rupees, rupeesShort, formatDate, today, daysAgo } from "../../../lib/money";
import { modeLabel } from "../../../lib/units";
import { listExpenses, expensesByCategory, deleteExpense } from "../data";
import { useToast } from "../ui/Toast";
import { useShop } from "../useShop";
import ExpenseForm from "./ExpenseForm";

function rangeFor(filter) {
  const t = today();
  if (filter === "month") return { from: `${t.slice(0, 7)}-01`, to: t };
  if (filter === "lastMonth") {
    const d = new Date(`${t}T00:00:00`);
    d.setDate(1);
    d.setMonth(d.getMonth() - 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const last = new Date(y, d.getMonth() + 1, 0).getDate();
    return { from: `${y}-${m}-01`, to: `${y}-${m}-${String(last).padStart(2, "0")}` };
  }
  if (filter === "year") return { from: `${t.slice(0, 4)}-01-01`, to: t };
  return {};
}

export default function ExpensesPage() {
  const shop = useShop();
  const { toast } = useToast();

  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("month");
  const [rows, setRows] = useState([]);
  const [groups, setGroups] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);
  const seq = useRef(0);

  const load = useCallback(
    async (term, f) => {
      const mine = ++seq.current;
      setLoading(true);
      setError(null);
      try {
        const range = rangeFor(f);
        const [list, grouped] = await Promise.all([
          listExpenses({ search: term || undefined, ...range, limit: 200 }),
          expensesByCategory(rangeFor("month")).catch(() => null),
        ]);
        if (seq.current !== mine) return;
        setRows(list.rows);
        setGroups(grouped);
      } catch (e) {
        if (seq.current === mine) setError(e);
      } finally {
        if (seq.current === mine) setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!shop.businessId) return undefined;
    const timer = setTimeout(() => load(q.trim(), filter), q ? 220 : 0);
    return () => clearTimeout(timer);
  }, [q, filter, load, shop.businessId]);

  const totals = useMemo(
    () => ({
      total: rows.reduce((a, r) => a + r.totalPaise, 0),
      tax: rows.reduce((a, r) => a + r.taxPaise, 0),
    }),
    [rows]
  );

  function replaceRow(saved) {
    if (!saved) return;
    setRows((prev) => {
      const at = prev.findIndex((r) => r.id === saved.id);
      if (at < 0) return [saved, ...prev];
      const next = [...prev];
      next[at] = saved;
      return next;
    });
    // The grouped panel is server-side, so it needs a fresh read.
    expensesByCategory(rangeFor("month")).then(setGroups).catch(() => {});
  }

  return (
    <>
      <PageHead title={EXPENSES.title}>
        <button type="button" className="ap-btn ap-btn-primary" onClick={() => setAdding(true)}>
          <IconPlus size={17} /> {EXPENSES.add}
        </button>
      </PageHead>

      <div className="ap-tiles" style={{ marginBottom: 14, gridTemplateColumns: "repeat(3, minmax(0,1fr))" }}>
        <div className="ap-tile">
          <div className="ap-tile-label">{EXPENSES.tileMonth}</div>
          <div className="ap-tile-value">{groups ? rupeesShort(groups.totalPaise) : "–"}</div>
        </div>
        <div className="ap-tile">
          <div className="ap-tile-label">{EXPENSES.tileTotal}</div>
          <div className="ap-tile-value">{rupeesShort(totals.total)}</div>
          <div className="ap-tile-note">{rows.length} entries</div>
        </div>
        <div className="ap-tile">
          <div className="ap-tile-label">{EXPENSES.tileTax}</div>
          <div className="ap-tile-value">{rupeesShort(totals.tax)}</div>
          <div className="ap-tile-note">{EXPENSES.tileTaxNote}</div>
        </div>
      </div>

      <div className="ap-grid2" style={{ gap: 16, alignItems: "start", gridTemplateColumns: "minmax(0,2fr) minmax(0,1fr)" }}>
        <div className="ap-panel">
          <div className="ap-panel-head" style={{ flexWrap: "wrap" }}>
            <div className="ap-search">
              <span className="ap-search-ico">
                <IconSearch size={17} />
              </span>
              <input
                className="ap-input"
                placeholder={EXPENSES.searchPlaceholder}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label={EXPENSES.searchPlaceholder}
              />
            </div>
            <div className="ap-seg ap-spacer">
              {[
                ["month", EXPENSES.filterMonth],
                ["lastMonth", EXPENSES.filterLastMonth],
                ["year", EXPENSES.filterYear],
                ["all", EXPENSES.filterAll],
              ].map(([value, label]) => (
                <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {error ? (
            <div className="ap-panel-body">
              <ErrorState error={error} onRetry={() => load(q.trim(), filter)} />
            </div>
          ) : loading ? (
            <TableSkeleton rows={6} cols={4} />
          ) : rows.length ? (
            <div className="ap-tablewrap">
              <table className="ap-table">
                <thead>
                  <tr>
                    <th>{EXPENSES.colDate}</th>
                    <th>{EXPENSES.colCategory}</th>
                    <th>{EXPENSES.colMode}</th>
                    <th className="ap-right">{EXPENSES.colAmount}</th>
                    <th className="ap-right">{EXPENSES.colTax}</th>
                    <th className="ap-right">{EXPENSES.colTotal}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td className="ap-sub">{formatDate(r.date)}</td>
                      <td>
                        <span className="ap-strong">{r.category}</span>
                        {r.partyName || r.reference || r.notes ? (
                          <div className="ap-sub">
                            {[r.partyName, r.reference, r.notes].filter(Boolean).join(" · ")}
                          </div>
                        ) : null}
                      </td>
                      <td className="ap-sub">{modeLabel(r.mode)}</td>
                      <td className="ap-right ap-num">{rupees(r.amountPaise)}</td>
                      <td className="ap-right ap-num">
                        {r.taxPaise ? rupees(r.taxPaise) : <span className="ap-sub">{"–"}</span>}
                      </td>
                      <td className="ap-right ap-num ap-strong">{rupees(r.totalPaise)}</td>
                      <td className="ap-right">
                        <div className="ap-row" style={{ justifyContent: "flex-end", gap: 2 }}>
                          <button
                            type="button"
                            className="ap-btn ap-btn-ghost ap-btn-icon"
                            aria-label={`Edit ${r.category}`}
                            onClick={() => setEditing(r)}
                          >
                            <IconEdit size={16} />
                          </button>
                          <button
                            type="button"
                            className="ap-btn ap-btn-ghost ap-btn-icon"
                            aria-label={`Remove ${r.category}`}
                            onClick={() => setRemoving(r)}
                          >
                            <IconTrash size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty
              icon={<IconWallet size={34} />}
              title={q ? EXPENSES.emptySearchTitle : EXPENSES.emptyTitle}
              body={q ? EXPENSES.emptySearchBody : EXPENSES.emptyBody}
              action={
                <button type="button" className="ap-btn ap-btn-primary" onClick={() => setAdding(true)}>
                  <IconPlus size={17} /> {EXPENSES.add}
                </button>
              }
            />
          )}
        </div>

        <div className="ap-panel">
          <div className="ap-panel-head">
            <h2>{EXPENSES.byCategory}</h2>
            <span className="ap-sub ap-spacer">{EXPENSES.byCategoryNote}</span>
          </div>
          {groups && groups.categories.length ? (
            <div className="ap-panel-body" style={{ display: "grid", gap: 11 }}>
              {groups.categories.map((c) => {
                const pct = groups.totalPaise ? Math.round((c.totalPaise / groups.totalPaise) * 100) : 0;
                return (
                  <div key={c.category}>
                    <div className="ap-row" style={{ justifyContent: "space-between", marginBottom: 4 }}>
                      <span>{c.category}</span>
                      <span className="ap-num ap-strong">
                        {rupees(c.totalPaise)} <span className="ap-sub">({pct}%)</span>
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
            <div className="ap-panel-body ap-sub">{EXPENSES.byCategoryEmpty}</div>
          )}
          <div className="ap-panel-foot ap-sub">{EXPENSES.what}</div>
        </div>
      </div>

      {adding ? (
        <ExpenseForm
          onClose={() => setAdding(false)}
          onSaved={(saved) => {
            setAdding(false);
            replaceRow(saved);
          }}
        />
      ) : null}

      {editing ? (
        <ExpenseForm
          expense={editing}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setEditing(null);
            replaceRow(saved);
          }}
        />
      ) : null}

      {removing ? (
        <RemoveExpense
          expense={removing}
          onClose={() => setRemoving(null)}
          onDone={() => {
            const id = removing.id;
            setRemoving(null);
            setRows((prev) => prev.filter((r) => r.id !== id));
            toast(EXPENSES.deleted);
            expensesByCategory(rangeFor("month")).then(setGroups).catch(() => {});
          }}
        />
      ) : null}
    </>
  );
}

function RemoveExpense({ expense, onClose, onDone }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  async function go() {
    setBusy(true);
    setErr(null);
    try {
      await deleteExpense(expense.id);
      onDone();
    } catch (e) {
      // Only an owner or manager may do this, and the server says so with a
      // 403. Repeating that plainly is more use than "request failed".
      setErr(
        e.status === 403
          ? "Only an owner or a manager can remove an expense."
          : e.isOffline
          ? COMMON.offlineBody
          : e.message || COMMON.genericError
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title={EXPENSES.deleteTitle}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="ap-btn" onClick={onClose} disabled={busy}>
            Keep it
          </button>
          <button type="button" className="ap-btn ap-btn-danger" onClick={go} disabled={busy}>
            {busy ? COMMON.saving : EXPENSES.deleteConfirm}
          </button>
        </>
      }
    >
      <div className="ap-stack">
        {err ? <Note kind="bad">{err}</Note> : null}
        <p style={{ margin: 0 }}>
          <strong>{expense.category}</strong> {"—"} {rupees(expense.totalPaise)} on{" "}
          {formatDate(expense.date)}
        </p>
        <p style={{ margin: 0, color: "var(--ap-ink-3)" }}>{EXPENSES.deleteBody}</p>
      </div>
    </Modal>
  );
}
