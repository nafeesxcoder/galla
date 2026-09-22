"use client";
import { useState } from "react";

export default function PartnerForm() {
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");

  function onSubmit(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    if (!/^[6-9]\d{9}$/.test(data.phone)) return setErr("Enter a valid 10-digit mobile number.");
    setErr("");
    // TODO: apna API route yahan call karo
    console.log(data);
    setSent(true);
  }

  if (sent) return <p className="notice">Request received. Our team will call you within 24 hours.</p>;

  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      <div className="form-row">
        <div className="field"><label htmlFor="name">Your name</label><input id="name" name="name" required /></div>
        <div className="field">
          <label htmlFor="phone">Mobile number</label>
          <input id="phone" name="phone" inputMode="numeric" maxLength={10} required />
          {err && <p className="error">{err}</p>}
        </div>
      </div>
      <div className="form-row">
        <div className="field"><label htmlFor="city">City</label><input id="city" name="city" /></div>
        <div className="field">
          <label htmlFor="type">Partner type</label>
          <select id="type" name="type">
            <option>Reseller</option>
            <option>CA / Tax consultant</option>
            <option>Referral partner</option>
          </select>
        </div>
      </div>
      <button className="btn btn--primary" type="submit">Send request</button>
    </form>
  );
}
