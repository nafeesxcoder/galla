"use client";

// ===========================================================================
// ITEMS
// ---------------------------------------------------------------------------
// The shop's list of what it sells, with the stock against each. The search
// goes to the server rather than filtering what is already loaded, because a
// kirana shop with two thousand items would otherwise be downloading all of
// them to find one.
//
// The totals strip along the top is the thing a shopkeeper actually looks at
// here: how much stock is sitting on the shelves, and how much of it has run
// out without anybody noticing.
// ===========================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ITEMS, COMMON } from "../content";
import { Empty, ErrorState, PageHead, TableSkeleton } from "../ui/Bits";
import { IconPlus, IconSearch, IconBox, IconEdit, IconHistory } from "../Icons";
import { rupees, rupeesShort, formatQty } from "../../../lib/money";
import { unitShort } from "../../../lib/units";
import { listItems } from "../data";
import ItemForm from "./ItemForm";
import StockAdjust from "./StockAdjust";
import StockHistory from "./StockHistory";
import Batches from "./Batches";

export default function ItemsPage() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [adjusting, setAdjusting] = useState(null);
  const [history, setHistory] = useState(null);
  const [batchesFor, setBatchesFor] = useState(null);

  const seq = useRef(0);

  const load = useCallback(async (term) => {
    const mine = ++seq.current;
    setLoading(true);
    setError(null);
    try {
      const { rows: found } = await listItems({ search: term || undefined, limit: 200 });
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
    if (filter === "low") return rows.filter((r) => r.type !== "service" && (r.isLow || r.isOut));
    if (filter === "services") return rows.filter((r) => r.type === "service");
    return rows;
  }, [rows, filter]);

  const totals = useMemo(() => {
    const goods = rows.filter((r) => r.type !== "service");
    return {
      count: rows.length,
      stockValue: goods.reduce((a, r) => a + r.stockValuePaise, 0),
      low: goods.filter((r) => r.isLow && !r.isOut).length,
      out: goods.filter((r) => r.isOut).length,
    };
  }, [rows]);

  function replaceRow(saved) {
    if (!saved) return;
    setRows((prev) => {
      const at = prev.findIndex((r) => r.id === saved.id);
      if (at < 0) return [saved, ...prev];
      const next = [...prev];
      next[at] = saved;
      return next;
    });
  }

  return (
    <>
      <PageHead title={ITEMS.title}>
        <button type="button" className="ap-btn ap-btn-primary" onClick={() => setAdding(true)}>
          <IconPlus size={17} /> {ITEMS.add}
        </button>
      </PageHead>

      {!loading && rows.length ? (
        <div className="ap-tiles" style={{ marginBottom: 14 }}>
          <div className="ap-tile">
            <div className="ap-tile-label">Items</div>
            <div className="ap-tile-value">{totals.count}</div>
          </div>
          <div className="ap-tile">
            <div className="ap-tile-label">Stock value</div>
            <div className="ap-tile-value">{rupeesShort(totals.stockValue)}</div>
            <div className="ap-tile-note">at cost where known</div>
          </div>
          <div className="ap-tile">
            <div className="ap-tile-label">Running low</div>
            <div className="ap-tile-value">{totals.low}</div>
          </div>
          {/* Red only when there is something to be red about. A zero in red
              reads as a problem when it is the opposite. */}
          <div className={totals.out ? "ap-tile ap-tile-bad" : "ap-tile"}>
            <div className="ap-tile-label">Out of stock</div>
            <div className="ap-tile-value">{totals.out}</div>
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
              placeholder={ITEMS.searchPlaceholder}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label={ITEMS.searchPlaceholder}
            />
          </div>
          <div className="ap-seg ap-spacer">
            <button type="button" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>
              {ITEMS.filterAll}
            </button>
            <button type="button" aria-pressed={filter === "low"} onClick={() => setFilter("low")}>
              {ITEMS.filterLow}
            </button>
            <button
              type="button"
              aria-pressed={filter === "services"}
              onClick={() => setFilter("services")}
            >
              {ITEMS.filterServices}
            </button>
          </div>
        </div>

        {error ? (
          <div className="ap-panel-body">
            <ErrorState error={error} onRetry={() => load(q.trim())} />
          </div>
        ) : loading ? (
          <TableSkeleton rows={6} cols={5} />
        ) : shown.length ? (
          <div className="ap-tablewrap">
            <table className="ap-table">
              <thead>
                <tr>
                  <th>{ITEMS.colName}</th>
                  <th className="ap-right">{ITEMS.colStock}</th>
                  <th className="ap-right">{ITEMS.colSale}</th>
                  <th className="ap-right">{ITEMS.colPurchase}</th>
                  <th className="ap-right">{ITEMS.colTax}</th>
                  <th className="ap-right">{ITEMS.colValue}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span className="ap-strong">{r.name}</span>
                      <div className="ap-sub">
                        {[r.code || null, r.hsn ? `HSN ${r.hsn}` : null, r.type === "service" ? ITEMS.service : null]
                          .filter(Boolean)
                          .join(" · ") || unitShort(r.unit)}
                      </div>
                    </td>

                    <td className="ap-right">
                      {r.type === "service" ? (
                        <span className="ap-sub">{"–"}</span>
                      ) : (
                        <>
                          <span className="ap-num ap-strong">
                            {formatQty(r.stock)} {unitShort(r.unit)}
                          </span>
                          {r.isOut ? (
                            <div>
                              <span className="ap-pill ap-pill-unpaid">{ITEMS.outTag}</span>
                            </div>
                          ) : r.isLow ? (
                            <div>
                              <span className="ap-pill ap-pill-part">{ITEMS.lowTag}</span>
                            </div>
                          ) : null}
                        </>
                      )}
                    </td>

                    <td className="ap-right ap-num">{rupees(r.salePaise)}</td>
                    <td className="ap-right ap-num">
                      {r.costPaise ? rupees(r.costPaise) : <span className="ap-sub">{"–"}</span>}
                    </td>
                    <td className="ap-right ap-num">{r.taxRate}%</td>
                    <td className="ap-right ap-num">
                      {r.type === "service" ? (
                        <span className="ap-sub">{"–"}</span>
                      ) : (
                        rupees(r.stockValuePaise)
                      )}
                    </td>

                    <td className="ap-right">
                      <div className="ap-row" style={{ justifyContent: "flex-end", gap: 4 }}>
                        <button
                          type="button"
                          className="ap-btn ap-btn-ghost ap-btn-icon"
                          title={COMMON.edit}
                          aria-label={`${COMMON.edit} ${r.name}`}
                          onClick={() => setEditing(r)}
                        >
                          <IconEdit size={16} />
                        </button>
                        {r.type !== "service" ? (
                          <>
                            <button
                              type="button"
                              className="ap-btn ap-btn-sm"
                              onClick={() => setAdjusting(r)}
                            >
                              Stock
                            </button>
                            {r.trackBatches ? (
                              <button
                                type="button"
                                className="ap-btn ap-btn-sm"
                                onClick={() => setBatchesFor(r)}
                              >
                                Batches
                              </button>
                            ) : null}
                            <button
                              type="button"
                              className="ap-btn ap-btn-ghost ap-btn-icon"
                              title={ITEMS.history}
                              aria-label={`${ITEMS.history} for ${r.name}`}
                              onClick={() => setHistory(r)}
                            >
                              <IconHistory size={16} />
                            </button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            icon={<IconBox size={34} />}
            title={q ? ITEMS.emptySearchTitle : ITEMS.emptyTitle}
            body={q ? ITEMS.emptySearchBody : ITEMS.emptyBody}
            action={
              <button
                type="button"
                className="ap-btn ap-btn-primary"
                onClick={() => (q ? setAdding(true) : setAdding(true))}
              >
                <IconPlus size={17} /> {ITEMS.add}
              </button>
            }
          />
        )}
      </div>

      {adding ? (
        <ItemForm
          initialName={q.trim()}
          onClose={() => setAdding(false)}
          onSaved={(saved) => {
            setAdding(false);
            replaceRow(saved);
          }}
        />
      ) : null}

      {editing ? (
        <ItemForm
          item={editing}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setEditing(null);
            replaceRow(saved);
          }}
        />
      ) : null}

      {adjusting ? (
        <StockAdjust
          item={adjusting}
          onClose={() => setAdjusting(null)}
          onSaved={(saved) => {
            setAdjusting(null);
            // The server may answer with the item, or with nothing useful.
            // Reloading is cheap and is certain to be right.
            if (saved && saved.id) replaceRow(saved);
            else load(q.trim());
          }}
        />
      ) : null}

      {history ? <StockHistory item={history} onClose={() => setHistory(null)} /> : null}

      {batchesFor ? (
        <Batches
          item={batchesFor}
          onClose={() => setBatchesFor(null)}
          // Adding a batch or writing one off moves the item's stock, so the
          // row behind the dialog is stale the moment it happens.
          onChanged={() => load(q.trim())}
        />
      ) : null}
    </>
  );
}
