"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useLang } from "./LangProvider";

// anchor = { top, left } - nav button ke neeche khulta hai
export default function AppModal({ open, onClose, anchor }) {
  const { t } = useLang();
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);
  const boxRef = useRef(null);
  const [pos, setPos] = useState(null);

  useEffect(() => {
    if (!open) return;
    setSent(false);
    setErr("");
    setPhone("");
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const place = () => {
      const w = boxRef.current?.offsetWidth ?? 300;
      const vw = window.innerWidth;
      const top = (anchor?.top ?? 72) + 10;
      const left =
        vw < 760 || !anchor
          ? Math.max(12, (vw - w) / 2)
          : Math.min(Math.max(16, anchor.left), vw - w - 16);
      setPos({ top, left });
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [open, anchor]);

  if (!open) return null;

  function submit(e) {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(phone)) return setErr(t("mobile.smsErr"));
    setErr("");
    // TODO: yahan apna SMS API call lagao
    setSent(true);
  }

  return (
    <>
      <div className="pop__scrim" onMouseDown={onClose} aria-hidden="true" />
      <div
        className="pop"
        ref={boxRef}
        role="dialog"
        aria-labelledby="appmodal-title"
        style={pos ? { top: pos.top, left: pos.left } : { visibility: "hidden" }}
      >
        <button type="button" className="pop__close" aria-label="Close" onClick={onClose}>
          &times;
        </button>

        <Image
          className="pop__qr"
          src="/qr.png"
          alt="QR code to open the app download page"
          width={396}
          height={396}
        />

        <h3 id="appmodal-title">{t("modal.title")}</h3>
        <p>{t("modal.text")}</p>

        {sent ? (
          <p className="pop__done">{t("mobile.smsDone")}</p>
        ) : (
          <form className="pop__form" onSubmit={submit} noValidate>
            <input
              inputMode="numeric"
              maxLength={10}
              value={phone}
              autoComplete="tel-national"
              aria-label={t("mobile.smsPh")}
              placeholder={t("mobile.smsPh")}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            />
            <button className="btn btn--primary" type="submit">
              {t("modal.btn")}
            </button>
          </form>
        )}
        {err && <p className="pop__err">{err}</p>}
      </div>
    </>
  );
}
