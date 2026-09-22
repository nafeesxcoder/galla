"use client";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { Logo } from "./Navbar";
import { useLang } from "./LangProvider";

export default function Footer() {
  const { t } = useLang();
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer__grid">
          <div>
            <Logo />
            <p style={{ marginTop: "1rem" }}>{t("footer.tagline")}</p>
          </div>
          <div>
            <h4>{t("footer.product")}</h4>
            <ul>
              <li><Link href="/solutions">{t("nav.solutions")}</Link></li>
              <li><Link href="/pricing">{t("nav.pricing")}</Link></li>
              <li><Link href="/desktop">{t("nav.desktop")}</Link></li>
              <li><Link href="/mobile-app">{t("nav.tryMobile")}</Link></li>
            </ul>
          </div>
          <div>
            <h4>{t("footer.company")}</h4>
            <ul>
              <li><Link href="/about">{t("nav.about")}</Link></li>
              <li><Link href="/careers">{t("nav.careers")}</Link></li>
              <li><Link href="/partner">{t("nav.partner")}</Link></li>
            </ul>
          </div>
          <div>
            <h4>{t("footer.contact")}</h4>
            <ul>
              <li><a href={`tel:${SITE.phone.replace(/\s/g, "")}`}>{SITE.phone}</a></li>
              <li><a href={`mailto:${SITE.email}`}>{SITE.email}</a></li>
              <li>{SITE.city}</li>
            </ul>
          </div>
        </div>
        <div className="footer__bottom">© {new Date().getFullYear()} {SITE.name}. {t("footer.rights")}</div>
      </div>
    </footer>
  );
}
