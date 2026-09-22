"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NAV, SITE } from "@/lib/site";
import { useLang } from "./LangProvider";
import LangSwitcher from "./LangSwitcher";

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
  const path = usePathname();
  const { t } = useLang();
  const close = () => setOpen(false);
  const cur = (href) => (path === href ? "page" : undefined);

  return (
    <header className="nav">
      <nav className="wrap nav__inner" aria-label="Main">
        <Link href="/" aria-label={`${SITE.name} home`} onClick={close}><Logo /></Link>

        <ul id="nav-links" className={`nav__links ${open ? "open" : ""}`}>
          <li>
            <Link href="/mobile-app" className="nav__mobile" aria-current={cur("/mobile-app")} onClick={close}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="6" y="2" width="12" height="20" rx="2" /><path d="M11 18h2" />
              </svg>
              {t("nav.tryMobile")}
            </Link>
          </li>
          {NAV.map((item) => (
            <li key={item.href}>
              <Link href={item.href} aria-current={cur(item.href)} onClick={close}>{t(item.key)}</Link>
            </li>
          ))}
          <li><Link href="/login" aria-current={cur("/login")} onClick={close}>{t("nav.login")}</Link></li>
        </ul>

        <div className="nav__right">
          <LangSwitcher />
          <button className="nav__toggle" aria-label="Menu" aria-expanded={open} aria-controls="nav-links" onClick={() => setOpen(!open)}>
            {open ? "✕" : "☰"}
          </button>
        </div>
      </nav>
    </header>
  );
}
