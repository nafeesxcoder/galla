"use client";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { FOOTER } from "@/lib/footerLinks";
import { Logo } from "./Navbar";
import { useLang } from "./LangProvider";

// Apne asli registration numbers daalo ya in lines ko hata do
const LEGAL = {
  gstin: "",
  udyam: "",
  company: `${SITE.name} Technologies`,
};

export default function Footer() {
  const { t } = useLang();

  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer__top">
          <div className="footer__brand">
            <Logo />
            <p>{t("footer.tagline")}</p>
            <p className="footer__note">
              GST billing, inventory and accounting for small businesses across
              India.
            </p>
            <div className="footer__stores">
              <a href="#" className="store store--sm">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M4 2.5v19l10-9.5L4 2.5zm11.4 10.8 2.6 2.5-11.6 6.3 9-8.8zm0-2.6-9-8.8L18 8.2l-2.6 2.5zM19.3 9l2.4 1.3c.8.5.8 1.8 0 2.2L19.3 14l-2.8-2.5L19.3 9z" />
                </svg>
                <span>
                  <small>Get it on</small>
                  <b>Google Play</b>
                </span>
              </a>
              <a href="#" className="store store--sm">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M16.4 12.6c0-2.4 2-3.6 2.1-3.7-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.8-1.6 0-3.1 1-4 2.4-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8 1.5 0 1.9.8 3.2.8 1.3 0 2.1-1.2 2.9-2.4.9-1.4 1.3-2.7 1.3-2.8-.1 0-2.4-.9-2.4-3.9zM14 5.5c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1.1.1 2.1-.6 2.8-1.4z" />
                </svg>
                <span>
                  <small>Download on the</small>
                  <b>App Store</b>
                </span>
              </a>
            </div>
          </div>

          <div className="footer__cols">
            {FOOTER.map((col) => (
              <div key={col.title}>
                <h4>{col.title}</h4>
                <ul>
                  {col.links.map(([label, href]) => (
                    <li key={label}>
                      <Link href={href}>{label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="footer__contact">
          <div>
            <h4>{t("footer.contact")}</h4>
            <p>
              <a href={`tel:${SITE.phone.replace(/\s/g, "")}`}>{SITE.phone}</a>
              <br />
              <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
            </p>
          </div>
          <div>
            <h4>Support hours</h4>
            <p>
              09:00 AM to 09:00 PM (Mon to Sat)
              <br />
              10:00 AM to 07:00 PM (Sun)
            </p>
          </div>
          <div>
            <h4>Address</h4>
            <p>
              {LEGAL.company}
              <br />
              {SITE.city}
            </p>
          </div>
          {(LEGAL.gstin || LEGAL.udyam) && (
            <div>
              <h4>Registration</h4>
              <p>
                {LEGAL.gstin && <>GSTIN: {LEGAL.gstin}<br /></>}
                {LEGAL.udyam && <>Udyam: {LEGAL.udyam}</>}
              </p>
            </div>
          )}
        </div>

        <div className="footer__bottom">
          <span>
            © {new Date().getFullYear()} {LEGAL.company}. {t("footer.rights")}
          </span>
          <span className="footer__legal">
            <Link href="/about">Terms</Link>
            <Link href="/about">Privacy policy</Link>
            <Link href="/about">Refund policy</Link>
          </span>
          <span className="footer__made">Made in India · Secure SSL</span>
        </div>
      </div>
    </footer>
  );
}
