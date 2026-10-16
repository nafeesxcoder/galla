// ===========================================================================
// LicenceBox - the "0 Active Licences" panel with its Hide toggle
// ---------------------------------------------------------------------------
// The count is the server's, not a guess. It is the number of licence keys
// currently attached to a shop on this account - which is also the number
// the person is paying for, so it had better match what the server thinks.
// ===========================================================================

"use client";
import { useState } from "react";
import Link from "next/link";
import { useAccount } from "./useAccount";
import { CONTENT } from "./content";

/** "2027-10-12T00:00:00Z" -> "12 Oct 2027" */
function shortDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function LicenceBox() {
  const { licences, activeLicences, loading } = useAccount();
  const [open, setOpen] = useState(true);

  const c = CONTENT.licences;

  return (
    <section className="ac-lic">
      <div className="ac-lic__head">
        <h2>
          {/* While it loads, no number at all rather than a 0 that turns into
              a 3 a moment later - somebody reading quickly would take the 0
              as the answer and go looking for their licence. */}
          {loading && !licences.length ? "" : `${activeLicences} `}
          {activeLicences === 1 ? c.titleOne : c.title}
        </h2>
        <button
          type="button"
          className="ac-lic__toggle"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? c.hide : c.show}
          <span className={`ac-lic__caret ${open ? "up" : ""}`} aria-hidden="true" />
        </button>
      </div>

      {open && (
        <div className="ac-lic__body">
          {licences.length === 0 ? (
            <>
              <p>{c.none}</p>
              <Link href="/pricing" className="btn btn--ghost btn--small">
                {c.noneCta}
              </Link>
            </>
          ) : (
            <ul className="ac-lic__list">
              {licences.map((l) => (
                <li key={l.id}>
                  <span className="ac-lic__code">{l.code}</span>
                  <span className="ac-lic__meta">
                    {[l.planName, l.businessName].filter(Boolean).join(" · ")}
                    {l.expiresAt ? ` · till ${shortDate(l.expiresAt)}` : ""}
                  </span>
                  <span className={`ac-pill ac-pill--${l.status}`}>{l.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
