"use client";
import Link from "next/link";
import MenuIcon from "./MenuIcon";
import { SOFTWARE } from "@/lib/software";
import { INDUSTRIES } from "@/lib/industries";

// Menu me chhote naam, taaki do line me na jayein
const SHORT = {
  "grocery-store": "Grocery",
  "jewellery-store": "Jewellery",
  "cloth-and-garments": "Garments",
  "electronics-store": "Electronics",
  "restaurant": "Restaurant",
  "hardware-and-paint": "Hardware",
  "mobile-shop": "Mobile shop",
  "salon-and-spa": "Salon and spa",
  "wholesale-and-distribution": "Wholesale",
};

export default function MegaMenu({ open, onClose, top }) {
  if (!open) return null;

  const industries = INDUSTRIES.slice(0, 8);

  return (
    <>
      <div className="mega__scrim" onMouseDown={onClose} aria-hidden="true" />
      <div className="mega" style={{ top }} role="region" aria-label="Solutions menu">
        <div className="wrap mega__grid">
          <div className="mega__col">
            <h4>Software</h4>
            <ul>
              {SOFTWARE.map((s) => (
                <li key={s.slug}>
                  <Link href={`/software/${s.slug}`} onClick={onClose}>
                    <span className="mega__icon">
                      <MenuIcon name={s.icon} />
                    </span>
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="mega__col mega__col--wide">
            <h4>By business type</h4>
            <ul>
              {industries.map((i) => (
                <li key={i.slug}>
                  <Link href={`/billing-software/${i.slug}`} onClick={onClose}>
                    <span className="mega__icon">
                      <MenuIcon name={i.icon} />
                    </span>
                    {SHORT[i.slug] ?? i.name}
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/solutions" className="mega__all" onClick={onClose}>
              See all {INDUSTRIES.length} business types &rarr;
            </Link>
          </div>

          <div className="mega__col">
            <h4>Company</h4>
            <ul>
              <li>
                <Link href="/about" onClick={onClose}>
                  <span className="mega__icon"><MenuIcon name="info" /></span>
                  About us
                </Link>
              </li>
              <li>
                <Link href="/careers" onClick={onClose}>
                  <span className="mega__icon"><MenuIcon name="users" /></span>
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/partner" onClick={onClose}>
                  <span className="mega__icon"><MenuIcon name="handshake" /></span>
                  Partner with us
                </Link>
              </li>
              <li>
                <Link href="/desktop" onClick={onClose}>
                  <span className="mega__icon"><MenuIcon name="monitor" /></span>
                  Desktop app
                </Link>
              </li>
            </ul>
          </div>

          <div className="mega__col">
            <h4>Get started</h4>
            <ul>
              <li>
                <Link href="/pricing" onClick={onClose}>
                  <span className="mega__icon"><MenuIcon name="tag" /></span>
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/mobile-app" onClick={onClose}>
                  <span className="mega__icon"><MenuIcon name="download" /></span>
                  Download the app
                </Link>
              </li>
              <li>
                <Link href="/login" onClick={onClose}>
                  <span className="mega__icon"><MenuIcon name="login" /></span>
                  Login
                </Link>
              </li>
            </ul>
            <Link href="/mobile-app" className="btn btn--primary btn--small mega__cta" onClick={onClose}>
              Start free
            </Link>
          </div>
        </div>

        <button type="button" className="mega__close" aria-label="Close menu" onClick={onClose}>
          &times;
        </button>
      </div>
    </>
  );
}
