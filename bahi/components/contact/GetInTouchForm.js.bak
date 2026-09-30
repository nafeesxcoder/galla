// ===========================================================================
// SECTION 2 (right column)  -  the "Get In Touch" form
// ---------------------------------------------------------------------------
// FRONTEND ONLY right now - nothing is sent to a server. When the backend
// exists, put the fetch() where it says "BACKEND CALL GOES HERE".
//
// Every field is validated before submit and the first bad field gets the
// focus, so nobody has to hunt for what went wrong.
// ===========================================================================

"use client";
import { useRef, useState } from "react";

const EMPTY = { name: "", phone: "", email: "", company: "", message: "" };

export default function GetInTouchForm({ form }) {
  const [v, setV] = useState(EMPTY);
  const [err, setErr] = useState({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const refs = useRef({});

  function set(key, value) {
    setV((old) => ({ ...old, [key]: value }));
    if (err[key]) setErr((old) => ({ ...old, [key]: "" }));
  }

  function check() {
    const next = {};
    if (!v.name.trim()) next.name = form.errors.name;
    if (!/^[6-9]\d{9}$/.test(v.phone)) next.phone = form.errors.phone;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email)) next.email = form.errors.email;
    if (v.message.trim().length < 5) next.message = form.errors.message;
    return next;
  }

  async function submit(e) {
    e.preventDefault();

    const bad = check();
    setErr(bad);

    const first = Object.keys(bad)[0];
    if (first) {
      refs.current[first]?.focus();
      return;
    }

    setBusy(true);

    // ---- BACKEND CALL GOES HERE ------------------------------------------
    // await fetch("/api/contact", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(v),
    // });
    // ----------------------------------------------------------------------

    setBusy(false);
    setDone(true);
  }

  if (done) {
    return (
      <div className="ct-form ct-form--done">
        <span className="ct-tick" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 13l4 4L19 7" />
          </svg>
        </span>
        <h2>{form.done.title}</h2>
        <p>{form.done.text}</p>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => {
            setV(EMPTY);
            setErr({});
            setDone(false);
          }}
        >
          {form.done.again}
        </button>
      </div>
    );
  }

  const field = (key, type = "text", extra = {}) => {
    const f = form[key];
    return (
      <label className={`ct-field ${err[key] ? "is-bad" : ""}`} htmlFor={`ct-${key}`}>
        <span>
          {f.label}
          {f.required ? <i aria-hidden="true">*</i> : f.optional ? <b>({f.optional})</b> : null}
        </span>

        {type === "textarea" ? (
          <textarea
            id={`ct-${key}`}
            ref={(el) => (refs.current[key] = el)}
            rows={4}
            value={v[key]}
            placeholder={f.placeholder}
            onChange={(e) => set(key, e.target.value)}
            {...extra}
          />
        ) : (
          <input
            id={`ct-${key}`}
            ref={(el) => (refs.current[key] = el)}
            type={type}
            value={v[key]}
            placeholder={f.placeholder}
            onChange={(e) => set(key, e.target.value)}
            {...extra}
          />
        )}

        {err[key] && <strong className="ct-err">{err[key]}</strong>}
      </label>
    );
  };

  return (
    <form className="ct-form" onSubmit={submit} noValidate>
      <h2>{form.title}</h2>
      <p className="ct-form__sub">{form.sub}</p>

      {field("name", "text", { autoComplete: "name" })}

      <div className="ct-two">
        {field("phone", "tel", {
          inputMode: "numeric",
          autoComplete: "tel",
          onChange: (e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10)),
        })}
        {field("email", "email", { autoComplete: "email" })}
      </div>

      {field("company", "text", { autoComplete: "organization" })}
      {field("message", "textarea")}

      <p className="ct-note">
        <i aria-hidden="true">*</i>
        {form.note}
      </p>

      <button type="submit" className="btn btn--primary ct-submit" disabled={busy}>
        {busy ? form.sending : form.cta}
      </button>
    </form>
  );
}
