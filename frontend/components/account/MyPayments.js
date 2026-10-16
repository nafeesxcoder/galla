// ===========================================================================
// Payments this person has made, and where each one stands
// ---------------------------------------------------------------------------
// Somebody who has sent money and heard nothing assumes it is lost. They
// then ring up, and the call is longer than this component took to write.
//
// Quotes they never paid are hidden. Most of them are people pricing things
// up and walking away, and a list of five "pending" rows reads like five
// failed payments.
// ===========================================================================

"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "./AuthProvider";

function money(n) {
  return Number(n ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function when(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * What the customer is told, which is not the same as the status in the
 * database.
 *
 * "claimed" means a human has not checked the bank yet. Saying that out loud
 * would be true and useless - so a claim that already started their plan
 * reads as running, and one that has not reads as being checked. Neither
 * pretends to be finished.
 */
function describe(p) {
  if (p.status === "approved") return { label: "Paid", tone: "ok" };
  if (p.status === "rejected")
    return {
      label: "Not found",
      tone: "bad",
      detail: p.decisionNote || "We could not find this payment. Please call us.",
    };
  if (p.status === "claimed" && p.planStarted)
    return { label: "Plan running", tone: "ok", detail: "We are matching it against our bank." };
  if (p.status === "claimed")
    return { label: "Being checked", tone: "wait", detail: "Usually the same working day." };
  return { label: "Not paid yet", tone: "wait" };
}

export default function MyPayments() {
  const { signedIn, ready } = useAuth();
  const [rows, setRows] = useState(null);

  useEffect(() => {
    if (!signedIn) return;
    api
      .get("/api/account/payments")
      .then((list) => setRows(list ?? []))
      .catch(() => setRows([]));
  }, [signedIn]);

  if (!ready || !signedIn) return null;
  if (!rows) return null;

  const shown = rows.filter((p) => p.status !== "pending");
  if (shown.length === 0) return null;

  return (
    <section className="ac-card">
      <h2>Your payments</h2>
      <ul className="ac-pays">
        {shown.map((p) => {
          const d = describe(p);
          return (
            <li key={p.reference} className="ac-pays__row">
              <div>
                <strong>{p.planName}</strong>
                <span className="ac-pays__meta">
                  {p.reference} &middot; {when(p.claimedAt || p.createdAt)}
                  {p.utr ? ` · UTR ${p.utr}` : ""}
                </span>
                {d.detail ? <span className="ac-pays__detail">{d.detail}</span> : null}
              </div>
              <div className="ac-pays__right">
                <span className="ac-pays__amount">&#8377; {money(p.amount)}</span>
                <span className={`ac-pays__tag ac-pays__tag--${d.tone}`}>{d.label}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
