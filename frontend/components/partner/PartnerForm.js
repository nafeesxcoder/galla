// ===========================================================================
// Partner registration form
// ---------------------------------------------------------------------------
// FRONTEND ONLY for now - nothing is sent to a server.
// When the backend exists, put the fetch() call where it says
// "BACKEND CALL GOES HERE" below.
// ===========================================================================

"use client";
import { useState } from "react";

export default function PartnerForm({ form }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  function onSubmit(e) {
    e.preventDefault();

    if (!name.trim()) {
      setErr(form.errName);
      return;
    }
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setErr(form.errPhone);
      return;
    }

    setErr("");

    // ---- BACKEND CALL GOES HERE ------------------------------------------
    // await fetch("/api/partner", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ name, phone }),
    // });
    // ---------------------------------------------------------------------

    setDone(true);
  }

  if (done) {
    return (
      <div className="pt-form pt-form--done" id="partner-form">
        <span className="pt-form__tick" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 13l4 4L19 7" />
          </svg>
        </span>
        <p>{form.done}</p>
      </div>
    );
  }

  return (
    <form className="pt-form" id="partner-form" onSubmit={onSubmit} noValidate>
      <h2>{form.title}</h2>
      <p className="pt-form__sub">{form.sub}</p>

      <label className="pt-field">
        <span>{form.nameLabel}</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={form.namePlaceholder}
          autoComplete="name"
        />
      </label>

      <label className="pt-field">
        <span>{form.phoneLabel}</span>
        <div className="pt-field__phone">
          <em>+91</em>
          <input
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder={form.phonePlaceholder}
            autoComplete="tel"
          />
        </div>
      </label>

      {err && <p className="pt-form__err">{err}</p>}

      <button type="submit" className="btn btn--primary pt-form__btn">
        {form.cta}
      </button>
    </form>
  );
}
