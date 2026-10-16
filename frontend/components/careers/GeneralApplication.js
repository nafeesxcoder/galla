// ===========================================================================
// SECTION 7  -  the general application form
// ---------------------------------------------------------------------------
// This now posts to /api/careers, which emails you the application.
//
// There is still no CV file upload, on purpose: accepting files from
// strangers means storage, size limits and virus scanning before it is safe.
// The link field covers GitHub, LinkedIn or a Drive link, which is enough to
// start a conversation - and you can ask for the file by reply.
//
// Same three rules as the contact form: the server revalidates everything,
// there is a hidden bot trap, and a failed send says so rather than
// pretending the application arrived.
// ===========================================================================

"use client";
import { useRef, useState } from "react";
import { SITE } from "@/lib/site";

const EMPTY = { name: "", email: "", phone: "", role: "", link: "", message: "" };

export default function GeneralApplication({ apply }) {
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
    setFailed("");

    try {
      const res = await fetch("/api/careers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...v, website: trap }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.ok) {
        setDone(true);
      } else if (res.status === 422 && data.fields) {
        setErr(data.fields);
        refs.current[Object.keys(data.fields)[0]]?.focus();
      } else if (res.status === 429) {
        setFailed("too-many");
      } else {
        setFailed("send");
      }
    } catch {
      setFailed("send");
    }

    setBusy(false);
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

          {/* the bot trap - see the contact form for what it does */}
          <div className="fm-trap" aria-hidden="true">
            <label htmlFor="cr-website">Website</label>
            <input
              id="cr-website"
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
                <>That is a lot of applications in a short time. Please wait a few minutes and try again.</>
              ) : (
                <>
                  We could not send that just now. Please email us directly at{" "}
                  <a href={`mailto:${SITE.email}`}>{SITE.email}</a> with your details.
                </>
              )}
            </p>
          )}

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
