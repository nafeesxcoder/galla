"use client";
import { useState } from "react";
import { SITE } from "@/lib/site";

export default function Login() {
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState("");

  function sendOtp(e) {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(phone)) return setErr("Enter a valid 10-digit mobile number.");
    setErr("");
    // TODO: OTP API call
    setStep("otp");
  }

  function verify(e) {
    e.preventDefault();
    // TODO: OTP verify API call, phir dashboard par redirect
    alert("OTP verified (demo)");
  }

  return (
    <section className="auth">
      <div className="auth__side">
        <h2>Welcome back to {SITE.name}</h2>
        <p style={{ marginTop: "1rem" }}>See data from all your devices with one login.</p>
      </div>
      <div className="auth__main">
        <div className="auth__box">
          <h2 style={{ marginBottom: "1.5rem" }}>Login</h2>
          {step === "phone" ? (
            <form className="form" onSubmit={sendOtp} noValidate>
              <div className="field">
                <label htmlFor="phone">Mobile number</label>
                <input id="phone" inputMode="numeric" maxLength={10} value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} placeholder="98XXXXXXXX" />
                {err && <p className="error">{err}</p>}
              </div>
              <button className="btn btn--primary" type="submit">Send OTP</button>
            </form>
          ) : (
            <form className="form" onSubmit={verify}>
              <p className="notice">OTP sent to +91 {phone}.</p>
              <div className="field">
                <label htmlFor="otp">OTP</label>
                <input id="otp" inputMode="numeric" maxLength={6} required />
              </div>
              <button className="btn btn--primary" type="submit">Verify and log in</button>
              <button type="button" className="btn btn--ghost" onClick={() => setStep("phone")}>Change number</button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
