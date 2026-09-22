"use client";
import { useState } from "react";
import { PhoneMock } from "@/components/HeroVisual";
import CtaBand from "@/components/CtaBand";
import { useLang } from "@/components/LangProvider";

// Apne real store links yahan dalo
const PLAY_URL = "#";
const IOS_URL = "#";

export default function MobileApp() {
  const { t } = useLang();
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);

  function sendLink(e) {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(phone)) return setErr(t("mobile.smsErr"));
    setErr("");
    // TODO: SMS API call yahan
    setSent(true);
  }

  return (
    <>
      <section className="hero">
        <div className="wrap hero__grid">
          <div>
            <h1>{t("mobile.title")}</h1>
            <p className="lead">{t("mobile.lead")}</p>

            <div className="store-row">
              <a href={PLAY_URL} className="store">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4 2.5v19l10-9.5L4 2.5zm11.4 10.8 2.6 2.5-11.6 6.3 9-8.8zm0-2.6-9-8.8L18 8.2l-2.6 2.5zM19.3 9l2.4 1.3c.8.5.8 1.8 0 2.2L19.3 14l-2.8-2.5L19.3 9z" /></svg>
                <span><small>Android</small><b>{t("mobile.play")}</b></span>
              </a>
              <a href={IOS_URL} className="store">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.4 12.6c0-2.4 2-3.6 2.1-3.7-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.8-1.6 0-3.1 1-4 2.4-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8 1.5 0 1.9.8 3.2.8 1.3 0 2.1-1.2 2.9-2.4.9-1.4 1.3-2.7 1.3-2.8-.1 0-2.4-.9-2.4-3.9zM14 5.5c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1.1.1 2.1-.6 2.8-1.4z" /></svg>
                <span><small>iPhone</small><b>{t("mobile.ios")}</b></span>
              </a>
            </div>

            <div className="get-app">
              {/* Apna QR: public/qr.png rakho aur neeche wale div ki jagah <img src="/qr.png" width={110} height={110} alt="QR" /> */}
              <div className="qr">{t("mobile.scan")}</div>
              <div>
                <b>{t("mobile.smsTitle")}</b>
                {sent ? (
                  <p className="notice" style={{ marginTop: ".6rem" }}>{t("mobile.smsDone")}</p>
                ) : (
                  <form className="sms" onSubmit={sendLink} noValidate>
                    <input
                      inputMode="numeric" maxLength={10} value={phone} aria-label={t("mobile.smsPh")}
                      placeholder={t("mobile.smsPh")} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    />
                    <button className="btn btn--primary btn--small" type="submit">{t("mobile.smsBtn")}</button>
                  </form>
                )}
                {err && <p className="error">{err}</p>}
              </div>
            </div>
          </div>

          <div className="phone-stage"><PhoneMock /></div>
        </div>
      </section>

      <section className="section section--wash">
        <div className="wrap">
          <h2>{t("mobile.featTitle")}</h2>
          <div className="features" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))" }}>
            {[1, 2, 3, 4].map((n) => (
              <div className="feature" key={n}><h3>{t(`mobile.m${n}t`)}</h3><p>{t(`mobile.m${n}d`)}</p></div>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
