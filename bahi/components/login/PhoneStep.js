// ===========================================================================
// STEP 1  -  phone number and "Send OTP"
// ---------------------------------------------------------------------------
// The button stays greyed out until the number is the right length for the
// country picked, the same as in the screenshot.
// ===========================================================================

"use client";
import { useState } from "react";
import CountrySelect from "./CountrySelect";

export default function PhoneStep({ c, phone, setPhone, country, setCountry, onSent, onEmail }) {
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const picked = c.countries.find((x) => x.id === country) ?? c.countries[0];
  const ready = phone.length === picked.digits;

  async function submit(e) {
    e.preventDefault();
    if (!ready) {
      setErr(c.phone.error);
      return;
    }

    setErr("");
    setBusy(true);

    // ---- BACKEND CALL GOES HERE ------------------------------------------
    // await fetch("/api/auth/send-otp", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ dial: picked.dial, phone }),
    // });
    // ----------------------------------------------------------------------

    setBusy(false);
    onSent();
  }

  return (
    <form onSubmit={submit} noValidate>
      <label className="lg-label" htmlFor="lg-phone">
        {c.phone.label}
      </label>

      <div className={`lg-phone ${err ? "is-bad" : ""}`}>
        <CountrySelect countries={c.countries} value={country} onChange={setCountry} />
        <span className="lg-phone__dial">{picked.dial}</span>
        <input
          id="lg-phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          value={phone}
          placeholder={c.phone.placeholder}
          onChange={(e) => {
            setPhone(e.target.value.replace(/\D/g, "").slice(0, picked.digits));
            if (err) setErr("");
          }}
        />
      </div>

      {err && <p className="lg-err">{err}</p>}

      <button type="submit" className="lg-primary" disabled={!ready || busy}>
        {busy ? "Sending..." : c.phone.cta}
      </button>

      <div className="lg-or">
        <span>{c.phone.or}</span>
      </div>

      <button type="button" className="lg-ghost" onClick={onEmail}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 7l9 6 9-6" />
        </svg>
        {c.phone.emailCta}
      </button>

      <p className="lg-terms">{c.phone.terms}</p>
    </form>
  );
}
