// ===========================================================================
// LoginCard - the card itself
// ---------------------------------------------------------------------------
// Holds which step is showing. It is used twice:
//   - inside LoginModal.js, as the popup
//   - on the /login page, for anyone who opens that URL directly
// ===========================================================================

"use client";
import { useState } from "react";
import { CONTENT } from "./content";
import GallaMark from "./GallaMark";
import PhoneStep from "./PhoneStep";
import OtpStep from "./OtpStep";
import EmailStep from "./EmailStep";

export default function LoginCard({ onClose }) {
  const c = CONTENT;
  const [step, setStep] = useState("phone"); // phone | otp | email
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState(c.countries[0].id);

  const picked = c.countries.find((x) => x.id === country) ?? c.countries[0];

  const heading =
    step === "otp" ? c.otp.title : step === "email" ? c.email.title : c.title;

  return (
    <div className="lg-card">
      {onClose && (
        <button type="button" className="lg-x" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      )}

      <div className="lg-top">
        <GallaMark />
        <h2>{heading}</h2>
      </div>

      {step === "phone" && (
        <PhoneStep
          c={c}
          phone={phone}
          setPhone={setPhone}
          country={country}
          setCountry={setCountry}
          onSent={() => setStep("otp")}
          onEmail={() => setStep("email")}
        />
      )}

      {step === "otp" && (
        <OtpStep
          c={c}
          dial={picked.dial}
          phone={phone}
          onBack={() => setStep("phone")}
          onDone={() => {
            // ---- WHAT HAPPENS AFTER A SUCCESSFUL LOGIN --------------------
            // Once the backend exists, send them on to the dashboard here:
            // window.location.href = "/app";
            // ---------------------------------------------------------------
            onClose?.();
          }}
        />
      )}

      {step === "email" && <EmailStep c={c} onBack={() => setStep("phone")} />}
    </div>
  );
}
