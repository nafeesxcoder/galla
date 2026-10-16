"use client";

// ===========================================================================
// THE SMALL SHARED PIECES
// ---------------------------------------------------------------------------
// Empty states, loading states, status pills, notices. Small enough that a
// file each would be more trouble than it saves.
// ===========================================================================

import Link from "next/link";
import { BILLS, COMMON } from "../content";
import { IconWarn } from "../Icons";

export function Spinner({ label }) {
  return (
    <span className="ap-row" style={{ gap: 9, color: "var(--ap-ink-3)" }}>
      <span className="ap-spin" />
      <span>{label || COMMON.loading}</span>
    </span>
  );
}

// A table-shaped placeholder rather than a spinner. The page does not jump
// when the real rows arrive, which matters on a slow shop connection.
export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <table className="ap-table" aria-hidden="true">
      <tbody>
        {Array.from({ length: rows }).map((_, r) => (
          <tr key={r}>
            {Array.from({ length: cols }).map((__, c) => (
              <td key={c}>
                <div className="ap-skel" style={{ width: c === 0 ? "62%" : "40%" }} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function Empty({ icon, title, body, action }) {
  return (
    <div className="ap-empty">
      {icon ? <div>{icon}</div> : null}
      <h3>{title}</h3>
      {body ? <p>{body}</p> : null}
      {action}
    </div>
  );
}

export function Note({ kind = "info", children, icon }) {
  return (
    <div className={`ap-note ap-note-${kind}`}>
      {icon === false ? null : icon || <IconWarn size={17} />}
      <div>{children}</div>
    </div>
  );
}

// The one place that decides what a bill's state is called and what colour
// it gets. Left to each screen it would drift.
export function statusOf(invoice) {
  if (!invoice) return "unpaid";
  if (invoice.status === "cancelled" || invoice.cancelledAt) return "cancelled";
  if (invoice.status === "draft") return "draft";
  const total = Number(invoice.amounts?.total ?? invoice.totalPaise ?? 0);
  const balance = Number(invoice.amounts?.balance ?? invoice.balancePaise ?? total);
  if (balance <= 0) return "paid";
  if (balance < total) return "partial";
  return "unpaid";
}

export function StatusPill({ invoice, status }) {
  const s = status || statusOf(invoice);
  return <span className={`ap-pill ap-pill-${s === "draft" ? "info" : s}`}>{BILLS.statuses[s] || s}</span>;
}

// A failure the user can do something about. Offline gets its own words
// because "try again" is the right advice there and nowhere else.
export function ErrorState({ error, onRetry }) {
  const offline = error?.isOffline;
  return (
    <div className="ap-panel">
      <div className="ap-panel-body">
        <Note kind={offline ? "warn" : "bad"}>
          <strong style={{ display: "block", marginBottom: 3 }}>
            {offline ? COMMON.offlineTitle : COMMON.genericError}
          </strong>
          {offline ? COMMON.offlineBody : error?.message || ""}
        </Note>
        {onRetry ? (
          <div style={{ marginTop: 12 }}>
            <button type="button" className="ap-btn" onClick={onRetry}>
              {COMMON.retry}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// The top bar already shows the page's name, so printing it again here would
// just be the same word twice. The heading stays in the markup for screen
// readers and for anybody landing on the page with styles off.
export function PageHead({ title, children }) {
  return (
    <div className="ap-row" style={{ marginBottom: 14, justifyContent: "flex-end" }}>
      <h1 className="ap-sronly">{title}</h1>
      {children}
    </div>
  );
}

export function LinkButton({ href, children, variant = "", ...rest }) {
  return (
    <Link href={href} className={`ap-btn ${variant}`} {...rest}>
      {children}
    </Link>
  );
}
