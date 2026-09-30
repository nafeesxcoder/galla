// ===========================================================================
// The "already have a licence?" form
// ---------------------------------------------------------------------------
// FRONTEND ONLY. The API call goes where it says BACKEND CALL GOES HERE.
// ===========================================================================

"use client";
import { useState } from "react";

export default function LicenceForm() {
  const [key, setKey] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  // Licence keys are usually shown in groups of four or five characters.
  // This keeps what the person types tidy without fighting them.
  function clean(v) {
    return v
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 20)
      .replace(/(.{5})(?=.)/g, "$1-");
  }

  async function submit(e) {
    e.preventDefault();

    if (key.replace(/-/g, "").length < 12) {
      setErr("That does not look like a full licence key.");
      return;
    }

    setErr("");
    setBusy(true);

    // ---- BACKEND CALL GOES HERE ------------------------------------------
    // const res = await fetch("/api/licences/attach", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ key }),
    // });
    // if (!res.ok) { setBusy(false); setErr("We could not find that key."); return; }
    // ----------------------------------------------------------------------

    setBusy(false);
    setDone(true);
  }

  if (done) {
    return (
      <div className="ac-card ac-done">
        <span className="ac-done__tick" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 13l4 4L19 7" />
          </svg>
        </span>
        <h2>Key received</h2>
        <p>
          We have your licence key. Once the backend is connected this will attach it
          to your account straight away.
        </p>
      </div>
    );
  }

  return (
    <form className="ac-card" onSubmit={submit} noValidate>
      <label className="ac-field" htmlFor="ac-key">
        <span>Licence key</span>
        <input
          id="ac-key"
          value={key}
          placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
          onChange={(e) => {
            setKey(clean(e.target.value));
            if (err) setErr("");
          }}
          className={err ? "is-bad" : undefined}
          autoComplete="off"
          spellCheck="false"
        />
        {err && <strong className="ac-err">{err}</strong>}
      </label>

      <button type="submit" className="btn btn--primary" disabled={busy}>
        {busy ? "Checking..." : "Attach licence"}
      </button>
    </form>
  );
}
