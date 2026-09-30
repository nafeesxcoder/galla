// ===========================================================================
// LicenceBox - the "0 Active Licences" panel with its Hide toggle
// ---------------------------------------------------------------------------
// The count comes from the session. Until the backend exists it is always 0.
// ===========================================================================

"use client";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { CONTENT } from "./content";

export default function LicenceBox() {
  const { user } = useAuth();
  const [open, setOpen] = useState(true);

  const count = user?.licences ?? 0;
  const c = CONTENT.licences;

  return (
    <section className="ac-lic">
      <div className="ac-lic__head">
        <h2>
          {count} {c.title}
        </h2>
        <button type="button" className="ac-lic__toggle" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          {open ? c.hide : c.show}
          <span className={`ac-lic__caret ${open ? "up" : ""}`} aria-hidden="true" />
        </button>
      </div>

      {open && (
        <div className="ac-lic__body">
          {count === 0 ? (
            <>
              <p>{c.none}</p>
              <Link href="/pricing" className="btn btn--ghost btn--small">
                {c.noneCta}
              </Link>
            </>
          ) : (
            // TODO: when the backend returns licences, list them here
            <p>Your licences will be listed here.</p>
          )}
        </div>
      )}
    </section>
  );
}
