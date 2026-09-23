"use client";
import { useState } from "react";
import { PhoneMock } from "@/components/HeroVisual";
import { useLang } from "@/components/LangProvider";

const PLAY_URL = "#"; // apna Play Store link
const IOS_URL = "#"; // apna App Store link

const points = [
  ["Android and iPhone", "One login, same data on every device you use."],
  ["Free plan for life", "Unlimited bills on the free plan, no card needed."],
  ["Instant cloud sync", "Bill on the phone, see it on the computer at once."],
];

export default function AppDownload() {
  const { t } = useLang();
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);

  function sendLink(e) {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(phone)) return setErr(t("mobile.smsErr"));
    setErr("");
    // TODO: yahan apna SMS API call lagao
    setSent(true);
  }

  return (
    <section className="appdl">
      <div className="wrap appdl__grid">
        <div className="appdl__phone">
          <PhoneMock />
        </div>

        <div>
          <span className="eyebrow eyebrow--light">Get the app</span>
          <h2>Run your whole shop from your phone</h2>
          <p>
            Send yourself the download link and start billing in the next five
            minutes.
          </p>

          <ul className="appdl__points">
            {points.map(([t2, d]) => (
              <li key={t2}>
                <b>{t2}</b>
                <span>{d}</span>
              </li>
            ))}
          </ul>

          {sent ? (
            <p className="appdl__done">{t("mobile.smsDone")}</p>
          ) : (
            <form className="appdl__form" onSubmit={sendLink} noValidate>
              <span className="appdl__cc">+91</span>
              <input
                inputMode="numeric"
                maxLength={10}
                value={phone}
                aria-label={t("mobile.smsPh")}
                placeholder={t("mobile.smsPh")}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              />
              <button className="btn btn--primary" type="submit">
                {t("mobile.smsBtn")}
              </button>
            </form>
          )}
          {err && <p className="appdl__err">{err}</p>}

          <div className="store-row">
            <a href={PLAY_URL} className="store">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M4 2.5v19l10-9.5L4 2.5zm11.4 10.8 2.6 2.5-11.6 6.3 9-8.8zm0-2.6-9-8.8L18 8.2l-2.6 2.5zM19.3 9l2.4 1.3c.8.5.8 1.8 0 2.2L19.3 14l-2.8-2.5L19.3 9z" />
              </svg>
              <span>
                <small>Android</small>
                <b>{t("mobile.play")}</b>
              </span>
            </a>
            <a href={IOS_URL} className="store">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M16.4 12.6c0-2.4 2-3.6 2.1-3.7-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.8-1.6 0-3.1 1-4 2.4-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8 1.5 0 1.9.8 3.2.8 1.3 0 2.1-1.2 2.9-2.4.9-1.4 1.3-2.7 1.3-2.8-.1 0-2.4-.9-2.4-3.9zM14 5.5c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1.1.1 2.1-.6 2.8-1.4z" />
              </svg>
              <span>
                <small>iPhone</small>
                <b>{t("mobile.ios")}</b>
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
