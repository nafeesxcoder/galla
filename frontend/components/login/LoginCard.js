// ===========================================================================
// LoginCard - the card itself
// ---------------------------------------------------------------------------
// Now talks to the real API. The card owns the calls because it owns the
// form; the two step components stay dumb and just report what happened.
//
// Used twice:
//   - inside LoginModal.js, as the popup
//   - on the /login page, for anyone who opens that URL directly
// ===========================================================================

"use client";
import { useState } from "react";
import { useAuth } from "@/components/account/AuthProvider";
import { api, ApiError } from "@/lib/api";
import { CONTENT } from "./content";
import GallaMark from "./GallaMark";
import PhoneStep from "./PhoneStep";
import OtpStep from "./OtpStep";
import EmailStep from "./EmailStep";

export default function LoginCard({ onClose }) {
  const c = CONTENT;
  const { signIn } = useAuth();
  const [step, setStep] = useState("phone"); // phone | otp | email
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState(c.countries[0].id);

  // In development the backend returns the code so you can build without
  // SMS working. It is forced off in production, so this is null there.
  const [devCode, setDevCode] = useState(null);

  const picked = c.countries.find((x) => x.id === country) ?? c.countries[0];

  const heading =
    step === "otp" ? c.otp.title : step === "email" ? c.email.title : c.title;

  // ---- ask for a code ----------------------------------------------------
  // Returns nothing on success, throws a readable message on failure. The
  // step component shows whatever comes back.
  async function sendOtp() {
    try {
      const data = await api.auth.requestOtp(phone, picked.dial);
      setDevCode(data.devCode ?? null);
    } catch (e) {
      throw new Error(messageFor(e));
    }
  }

  // ---- check it ----------------------------------------------------------
  async function verifyOtp(code) {
    try {
      const data = await api.auth.verifyOtp(phone, code, picked.dial);
      await signIn(data);
      // Vyapar does not redirect after login - you stay where you were and
      // the page becomes account-aware. We do the same. The /login PAGE is
      // the exception, and LoginPage.js handles that.
      onClose?.();
    } catch (e) {
      throw new Error(messageFor(e));
    }
  }

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
          onSend={sendOtp}
          onSent={() => setStep("otp")}
          onEmail={() => setStep("email")}
        />
      )}

      {step === "otp" && (
        <OtpStep
          c={c}
          dial={picked.dial}
          phone={phone}
          devCode={devCode}
          onVerify={verifyOtp}
          onResend={sendOtp}
          onBack={() => {
            setDevCode(null);
            setStep("phone");
          }}
        />
      )}

      {step === "email" && <EmailStep c={c} onBack={() => setStep("phone")} />}
    </div>
  );
}

/** Turns an ApiError into something worth showing a shopkeeper. */
function messageFor(e) {
  if (!(e instanceof ApiError)) {
    return "Something went wrong. Please try again.";
  }

  if (e.isOffline) {
    return "Could not reach the server. Please try again in a moment.";
  }

  // The backend already writes these for people rather than for developers,
  // so pass them straight through.
  if (e.status === 400 || e.status === 422 || e.status === 429) {
    return e.fields?.phone ?? e.fields?.code ?? e.message;
  }

  if (e.status === 403) return e.message;

  return "Something went wrong. Please try again.";
}
