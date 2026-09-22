"use client";
import { useEffect, useRef, useState } from "react";
import { LANGS } from "@/lib/i18n";
import { useLang } from "./LangProvider";

export default function LangSwitcher() {
  const { lang, setLang, t } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = LANGS.find((l) => l.code === lang) ?? LANGS[0];

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="lang" ref={ref}>
      <button
        type="button"
        className="lang__btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("nav.language")}
        onClick={() => setOpen(!open)}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" />
        </svg>
        {current.short}
        <span className={`lang__caret ${open ? "up" : ""}`} aria-hidden="true" />
      </button>

      {open && (
        <ul className="lang__menu" role="listbox" aria-label={t("nav.language")}>
          {LANGS.map((l) => (
            <li key={l.code} role="option" aria-selected={l.code === lang}>
              <button
                type="button"
                lang={l.code}
                className={l.code === lang ? "active" : ""}
                onClick={() => { setLang(l.code); setOpen(false); }}
              >
                <span className="lang__code">{l.short}</span>
                {l.native}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
