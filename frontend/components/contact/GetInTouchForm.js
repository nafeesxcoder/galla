// ===========================================================================
// SECTION 2 (right column)  -  the "Get In Touch" form
// ---------------------------------------------------------------------------
// This now posts to /api/contact, which emails you the message.
//
// Three things worth knowing:
//
//   1. The validation here is for the visitor's benefit. The API route
//      checks everything again, because anyone can post straight to it.
//
//   2. There is a hidden "website" field. People never see it and never
//      fill it; bots fill every field they find. Anything in it means a bot,
//      and the server quietly drops the message.
//
//   3. If mail is not set up yet, or sending fails, the form SAYS SO and
//      shows your email address instead. It does not pretend the message
//      went through. A form that silently swallows enquiries costs you
//      customers you never find out about.
// ===========================================================================

"use client";
import { useRef, useState } from "react";
import { SITE } from "@/lib/site";

const EMPTY = { name: "", phone: "", email: "", company: "", message: "" };

export default function GetInTouchForm({ form }) {
  const [v, setV] = useState(EMPTY);
  const [err, setErr] = useState({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState("");
  const [trap, setTrap] = useState("");
  const refs = useRef({});

  function set(key, value) {
    setV((old) => ({ ...old, [key]: value }));
    if (err[key]) setErr((old) => ({ ...old, [key]: "" }));
    if (failed) setFailed("");
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
    setFailed("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...v, website: trap }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.ok) {
        setDone(true);
      } else if (res.status === 422 && data.fields) {
        // the server found something the browser missed
        setErr(data.fields);
        refs.current[Object.keys(data.fields)[0]]?.focus();
      } else if (res.status === 429) {
        setFailed("too-many");
      } else {
        setFailed("send");
      }
    } catch {
      // no network, or the request never left the browser
      setFailed("send");
    }

    setBusy(false);
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

      {/* The bot trap. Hidden from people and from screen readers, and never
          focusable, so nobody real can land in it by accident. */}
      <div className="fm-trap" aria-hidden="true">
        <label htmlFor="ct-website">Website</label>
        <input
          id="ct-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={trap}
          onChange={(e) => setTrap(e.target.value)}
        />
      </div>

      {failed && (
        <p className="fm-failed" role="alert">
          {failed === "too-many" ? (
            <>That is a lot of messages in a short time. Please wait a few minutes and try again.</>
          ) : (
            <>
              We could not send that just now. Please email us directly at{" "}
              <a href={`mailto:${SITE.email}`}>{SITE.email}</a> and we will pick it up.
            </>
          )}
        </p>
      )}

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
