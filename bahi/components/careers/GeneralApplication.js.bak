// ===========================================================================
// SECTION 7  -  the general application form
// ---------------------------------------------------------------------------
// FRONTEND ONLY right now - nothing is sent to a server. When the backend
// exists, put the fetch() where it says "BACKEND CALL GOES HERE".
//
// There is no CV file upload on purpose: uploads need storage and virus
// scanning before they are safe. The link field covers GitHub, LinkedIn or
// a Drive link, which is enough to start a conversation.
// ===========================================================================

"use client";
import { useRef, useState } from "react";

const EMPTY = { name: "", email: "", phone: "", role: "", link: "", message: "" };

export default function GeneralApplication({ apply }) {
  const [v, setV] = useState(EMPTY);
  const [err, setErr] = useState({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const refs = useRef({});

  function set(key, value) {
    setV((old) => ({ ...old, [key]: value }));
    if (err[key]) setErr((old) => ({ ...old, [key]: "" }));
  }

  async function submit(e) {
    e.preventDefault();

    const bad = {};
    if (!v.name.trim()) bad.name = apply.errors.name;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email)) bad.email = apply.errors.email;
    if (!/^[6-9]\d{9}$/.test(v.phone)) bad.phone = apply.errors.phone;
    if (!v.role.trim()) bad.role = apply.errors.role;

    setErr(bad);
    const first = Object.keys(bad)[0];
    if (first) {
      refs.current[first]?.focus();
      return;
    }

    setBusy(true);

    // ---- BACKEND CALL GOES HERE ------------------------------------------
    // await fetch("/api/careers", {
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
      <section className="section section--wash" id="apply">
        <div className="wrap">
          <div className="cr-form cr-form--done">
            <span className="cr-tick" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <h2>{apply.done.title}</h2>
            <p>{apply.done.text}</p>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                setV(EMPTY);
                setErr({});
                setDone(false);
              }}
            >
              {apply.done.again}
            </button>
          </div>
        </div>
      </section>
    );
  }

  const field = (key, type = "text", extra = {}) => {
    const f = apply[key];
    return (
      <label className={`cr-field ${err[key] ? "is-bad" : ""}`} htmlFor={`cr-${key}`}>
        <span>
          {f.label}
          {f.required ? <i aria-hidden="true">*</i> : f.optional ? <b>({f.optional})</b> : null}
        </span>

        {type === "textarea" ? (
          <textarea
            id={`cr-${key}`}
            ref={(el) => (refs.current[key] = el)}
            rows={4}
            value={v[key]}
            placeholder={f.placeholder}
            onChange={(e) => set(key, e.target.value)}
            {...extra}
          />
        ) : (
          <input
            id={`cr-${key}`}
            ref={(el) => (refs.current[key] = el)}
            type={type}
            value={v[key]}
            placeholder={f.placeholder}
            onChange={(e) => set(key, e.target.value)}
            {...extra}
          />
        )}

        {err[key] && <strong className="cr-err">{err[key]}</strong>}
      </label>
    );
  };

  return (
    <section className="section section--wash" id="apply">
      <div className="wrap">
        <form className="cr-form" onSubmit={submit} noValidate>
          <h2>{apply.h2}</h2>
          <p className="cr-form__sub">{apply.sub}</p>

          <div className="cr-two">
            {field("name", "text", { autoComplete: "name" })}
            {field("email", "email", { autoComplete: "email" })}
          </div>

          <div className="cr-two">
            {field("phone", "tel", {
              inputMode: "numeric",
              autoComplete: "tel",
              onChange: (e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10)),
            })}
            {field("role")}
          </div>

          {field("link", "url")}
          {field("message", "textarea")}

          <p className="cr-note">
            <i aria-hidden="true">*</i>
            {apply.note}
          </p>

          <button type="submit" className="btn btn--primary cr-submit" disabled={busy}>
            {busy ? apply.sending : apply.cta}
          </button>
        </form>
      </div>
    </section>
  );
}
