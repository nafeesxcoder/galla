// ===========================================================================
// STEP 3  -  the "Login with Email" route
// ===========================================================================

"use client";
import { useState } from "react";

export default function EmailStep({ c, onBack }) {
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e) {
    e.preventDefault();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setErr(c.email.error);
      return;
    }

    setErr("");
    setBusy(true);

    // ---- BACKEND CALL GOES HERE ------------------------------------------
    // await fetch("/api/auth/email-link", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ email }),
    // });
    // ----------------------------------------------------------------------

    setBusy(false);
    setDone(true);
  }

  if (done) {
    return (
      <div className="lg-done">
        <span className="lg-done__tick" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 13l4 4L19 7" />
          </svg>
        </span>
        <p>{c.email.done}</p>
        <button type="button" className="lg-link" onClick={onBack}>
          {c.email.back}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <label className="lg-label" htmlFor="lg-email">
        {c.email.label}
      </label>

      <input
        id="lg-email"
        type="email"
        autoComplete="email"
        className={`lg-input ${err ? "is-bad" : ""}`}
        value={email}
        placeholder={c.email.placeholder}
        onChange={(e) => {
          setEmail(e.target.value);
          if (err) setErr("");
        }}
      />

      {err && <p className="lg-err">{err}</p>}

      <button type="submit" className="lg-primary" disabled={!email || busy}>
        {busy ? "Sending..." : c.email.cta}
      </button>

      <div className="lg-or">
        <span>{c.phone.or}</span>
      </div>

      <button type="button" className="lg-ghost" onClick={onBack}>
        {c.email.back}
      </button>
    </form>
  );
}
