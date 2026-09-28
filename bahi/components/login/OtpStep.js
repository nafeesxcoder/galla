// ===========================================================================
// STEP 2  -  the 6 digit OTP
// ---------------------------------------------------------------------------
// Typing moves to the next box on its own, Backspace steps back, and a
// pasted code fills every box at once. The resend link unlocks after the
// countdown set in content.js -> otp.seconds
// ===========================================================================

"use client";
import { useEffect, useRef, useState } from "react";

const LEN = 6;

export default function OtpStep({ c, dial, phone, onBack, onDone }) {
  const [code, setCode] = useState(Array(LEN).fill(""));
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [left, setLeft] = useState(c.otp.seconds);
  const boxes = useRef([]);

  useEffect(() => {
    boxes.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  function put(i, v) {
    const digit = v.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[i] = digit;
    setCode(next);
    if (err) setErr("");
    if (digit && i < LEN - 1) boxes.current[i + 1]?.focus();
  }

  function onKeyDown(i, e) {
    if (e.key === "Backspace" && !code[i] && i > 0) boxes.current[i - 1]?.focus();
    if (e.key === "ArrowLeft" && i > 0) boxes.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < LEN - 1) boxes.current[i + 1]?.focus();
  }

  function onPaste(e) {
    const text = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, LEN);
    if (!text) return;
    e.preventDefault();
    const next = Array(LEN).fill("");
    text.split("").forEach((d, i) => (next[i] = d));
    setCode(next);
    boxes.current[Math.min(text.length, LEN - 1)]?.focus();
  }

  async function submit(e) {
    e.preventDefault();
    const value = code.join("");
    if (value.length !== LEN) {
      setErr(c.otp.error);
      return;
    }

    setBusy(true);

    // ---- BACKEND CALL GOES HERE ------------------------------------------
    // const res = await fetch("/api/auth/verify-otp", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ dial, phone, code: value }),
    // });
    // if (!res.ok) { setBusy(false); setErr(c.otp.error); return; }
    // ----------------------------------------------------------------------

    setBusy(false);
    onDone();
  }

  async function resend() {
    setLeft(c.otp.seconds);
    setCode(Array(LEN).fill(""));
    boxes.current[0]?.focus();
    // ---- BACKEND CALL GOES HERE (send the OTP again) ---------------------
  }

  return (
    <form onSubmit={submit} noValidate>
      <p className="lg-sub">
        {c.otp.sub} <strong>{dial} {phone}</strong>
      </p>

      <div className="lg-otp" onPaste={onPaste}>
        {code.map((d, i) => (
          <input
            key={i}
            ref={(el) => (boxes.current[i] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            autoComplete={i === 0 ? "one-time-code" : "off"}
            aria-label={`Digit ${i + 1}`}
            value={d}
            className={err ? "is-bad" : undefined}
            onChange={(e) => put(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
          />
        ))}
      </div>

      {err && <p className="lg-err">{err}</p>}

      <button type="submit" className="lg-primary" disabled={code.join("").length !== LEN || busy}>
        {busy ? "Checking..." : c.otp.cta}
      </button>

      <p className="lg-row">
        {left > 0 ? (
          <span className="lg-muted">
            {c.otp.resendIn} {left}s
          </span>
        ) : (
          <button type="button" className="lg-link" onClick={resend}>
            {c.otp.resend}
          </button>
        )}
        <button type="button" className="lg-link" onClick={onBack}>
          {c.otp.change}
        </button>
      </p>
    </form>
  );
}
