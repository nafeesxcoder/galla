"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { NAV, SITE } from "@/lib/site";
import { useLang } from "./LangProvider";
import LangSwitcher from "./LangSwitcher";
import AppModal from "./AppModal";
import MegaMenu from "./MegaMenu";

export function Logo() {
  return (
    <span className="logo">
      <span className="logo__mark" aria-hidden="true" />
      {SITE.name}
    </span>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [appOpen, setAppOpen] = useState(false);
  const [anchor, setAnchor] = useState(null);
  const [mega, setMega] = useState(false);
  const [megaTop, setMegaTop] = useState(72);
  const appBtn = useRef(null);
  const path = usePathname();
  const { t } = useLang();

  const close = () => {
    setOpen(false);
    setMega(false);
    setAppOpen(false);
  };

  // Page badalte hi sab band. Mega menu ke links, browser ka back button,
  // kahin se bhi navigate ho - menu khula nahi rehta.
  useEffect(() => {
    setOpen(false);
    setMega(false);
    setAppOpen(false);
  }, [path]);

  const cur = (href) => (path === href ? "page" : undefined);

  return (
    <header className="nav">
      <nav className="wrap nav__inner" aria-label="Main">
        <Link href="/" aria-label={`${SITE.name} home`} onClick={close}>
          <Logo />
        </Link>

        <ul id="nav-links" className={`nav__links ${open ? "open" : ""}`}>
          {/* Home link sirf tab dikhta hai jab user home page par nahi hai */}
          {path !== "/" && (
            <li>
              <Link href="/" className="nav__home" onClick={close}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M3 10.5 12 3l9 7.5" />
                  <path d="M5 9.5V21h14V9.5" />
                </svg>
                {t("nav.home")}
              </Link>
            </li>
          )}

          <li>
            <button
              ref={appBtn}
              type="button"
              className="nav__mobile"
              aria-haspopup="dialog"
              aria-expanded={appOpen}
              onClick={() => {
                const r = appBtn.current?.getBoundingClientRect();
                if (r) setAnchor({ top: r.bottom, left: r.left });
                setMega(false);
                setOpen(false);
                setAppOpen((v) => !v);
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <rect x="6" y="2" width="12" height="20" rx="2" />
                <path d="M11 18h2" />
              </svg>
              {t("nav.tryMobile")}
            </button>
          </li>

          <li>
            <button
              type="button"
              className="nav__solutions"
              aria-haspopup="true"
              aria-expanded={mega}
              onClick={() => {
                const h =
                  document.querySelector(".nav")?.getBoundingClientRect()
                    .bottom ?? 72;
                setMegaTop(h);
                setAppOpen(false);
                setOpen(false);
                setMega((v) => !v);
              }}
            >
              {t("nav.solutions")}
              <span
                className={`nav__caret ${mega ? "up" : ""}`}
                aria-hidden="true"
              />
            </button>
          </li>

          {NAV.filter((item) => item.href !== "/solutions").map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={cur(item.href)}
                onClick={close}
              >
                {t(item.key)}
              </Link>
            </li>
          ))}

          <li>
            <Link href="/login" aria-current={cur("/login")} onClick={close}>
              {t("nav.login")}
            </Link>
          </li>
        </ul>

        <div className="nav__right">
          <LangSwitcher />
          <button
            className="nav__toggle"
            aria-label="Menu"
            aria-expanded={open}
            aria-controls="nav-links"
            onClick={() => {
              setMega(false);
              setAppOpen(false);
              setOpen((v) => !v);
            }}
          >
            {open ? "\u2715" : "\u2630"}
          </button>
        </div>
      </nav>

      <AppModal
        open={appOpen}
        anchor={anchor}
        onClose={() => setAppOpen(false)}
      />
      <MegaMenu open={mega} top={megaTop} onClose={() => setMega(false)} />
    </header>
  );
}
