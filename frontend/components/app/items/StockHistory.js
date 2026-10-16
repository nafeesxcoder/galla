"use client";

// ===========================================================================
// WHERE THE STOCK WENT
// ---------------------------------------------------------------------------
// Every change to an item's stock is written down as it happens, with the
// running balance after it and what caused it. So when the shelf and the app
// disagree, there is a trail to walk back through rather than an argument.
//
// Nothing in here can be edited. That is the point of it.
// ===========================================================================

import { useEffect, useState } from "react";
import Link from "next/link";
import Modal from "../ui/Modal";
import { Empty, Note, Spinner } from "../ui/Bits";
import { ITEMS, COMMON } from "../content";
import { formatQty, formatDate } from "../../../lib/money";
import { unitShort } from "../../../lib/units";
import { listStockMoves } from "../data";
import { IconHistory } from "../Icons";

const REASON_LABEL = {
  sale: "Sold",
  purchase: "Bought in",
  credit_note: "Returned by customer",
  debit_note: "Returned to supplier",
  opening: "Opening stock",
  correction: "Count correction",
  damage: "Damaged",
  expired: "Expired",
  lost: "Lost or stolen",
  sample: "Given free",
  other: "Other",
  cancel: "Bill cancelled",
};

export default function StockHistory({ item, onClose }) {
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let alive = true;
    listStockMoves(item.id, { limit: 60 })
      .then((r) => alive && setRows(r))
      .catch((e) => alive && setErr(e));
    return () => {
      alive = false;
    };
  }, [item.id]);

  const unit = unitShort(item.unit);

  return (
    <Modal
      title={`${ITEMS.history} · ${item.name}`}
      onClose={onClose}
      wide
      footer={
        <button type="button" className="ap-btn" onClick={onClose}>
          {COMMON.close}
        </button>
      }
    >
      {err ? (
        <Note kind={err.code === "unsupported" ? "info" : "bad"} icon={false}>
          {err.code === "unsupported"
            ? "This server does not expose the stock history yet. The movements are being recorded — they just are not readable from here until that route exists."
            : err.isOffline
            ? COMMON.offlineBody
            : err.message}
        </Note>
      ) : rows === null ? (
        <Spinner />
      ) : rows.length ? (
        <div className="ap-tablewrap" style={{ maxHeight: 420, overflowY: "auto" }}>
          <table className="ap-table">
            <thead>
              <tr>
                <th>When</th>
                <th>What happened</th>
                <th className="ap-right">Change</th>
                <th className="ap-right">Left</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id}>
                  <td className="ap-sub">{formatDate(m.createdAt)}</td>
                  <td>
                    <span>{REASON_LABEL[m.reason] || m.reason || "Change"}</span>
                    {m.refType === "invoice" && m.refId ? (
                      <div className="ap-sub">
                        <Link href={`/app/bills/${m.refId}`}>Open the bill</Link>
                      </div>
                    ) : null}
                    {m.notes ? <div className="ap-sub">{m.notes}</div> : null}
                  </td>
                  <td
                    className="ap-right ap-num ap-strong"
                    style={{ color: m.change < 0 ? "var(--ap-danger)" : "var(--ap-brand-ink)" }}
                  >
                    {m.change > 0 ? "+" : ""}
                    {formatQty(m.change)}
                  </td>
                  <td className="ap-right ap-num">
                    {formatQty(m.balanceAfter)} {unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty icon={<IconHistory size={32} />} title={ITEMS.historyEmpty} />
      )}
    </Modal>
  );
}
