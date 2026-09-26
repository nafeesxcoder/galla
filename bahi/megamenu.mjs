// megamenu.mjs - Solutions ka full-width dropdown + 6 software pages.
// Chalao project folder se (jahan package.json hai):   node megamenu.mjs

import { writeFileSync, readFileSync, mkdirSync, existsSync, copyFileSync } from "node:fs";
import { dirname } from "node:path";

if (!existsSync("package.json")) {
  console.log("\npackage.json nahi mila. Kya aap 'bahi' folder ke andar ho?\n");
  process.exit(1);
}

const put = (p, body) => {
  mkdirSync(dirname(p), { recursive: true });
  if (existsSync(p)) copyFileSync(p, p + ".bak");
  writeFileSync(p, body, "utf8");
  console.log("  wrote   " + p);
};

console.log("\nAdding the Solutions mega menu...\n");

put("lib/software.js", `// Software pages yahin se bante hain.
// Abhi content minimal hai - jab asli content mile to yahan bhar dena,
// page aur sitemap apne aap update ho jayenge.

export const SOFTWARE = [
  {
    slug: "billing-software",
    name: "Billing software",
    icon: "receipt",
    h1: "Billing software for small businesses",
    tagline: "Bills in seconds, tax worked out for you",
    intro: "Pick the customer, add the items, print or share. Content for this page is coming soon.",
    points: ["GST and non-GST bills", "Share on WhatsApp", "Your own invoice format", "Barcode billing"],
  },
  {
    slug: "invoicing-software",
    name: "Invoicing software",
    icon: "doc",
    h1: "Invoicing software with GST built in",
    tagline: "Estimates, invoices and challans in one place",
    intro: "Quote first, invoice later, without typing the same items twice. Content for this page is coming soon.",
    points: ["Estimate to invoice", "Automatic numbering", "Delivery challans", "Credit and debit notes"],
  },
  {
    slug: "inventory-software",
    name: "Inventory software",
    icon: "box",
    h1: "Inventory software for shops and godowns",
    tagline: "The shelf and the screen finally agree",
    intro: "Stock moves with every bill and purchase entry. Content for this page is coming soon.",
    points: ["Live stock count", "Low stock alerts", "Batch and expiry", "Multiple godowns"],
  },
  {
    slug: "accounting-software",
    name: "Accounting software",
    icon: "ledger",
    h1: "Accounting software that builds itself",
    tagline: "Reports made from the bills you already entered",
    intro: "Ledgers and statements come out of your daily billing. Content for this page is coming soon.",
    points: ["Party ledgers", "Cash and bank book", "Profit and loss", "Export to Excel"],
  },
  {
    slug: "pos-software",
    name: "POS software",
    icon: "pos",
    h1: "POS billing software for busy counters",
    tagline: "Scan, total, settle, next customer",
    intro: "Built for the hour when six people are waiting. Content for this page is coming soon.",
    points: ["Barcode checkout", "Keyboard shortcuts", "Split payments", "Thermal receipts"],
  },
  {
    slug: "e-invoice-software",
    name: "E-invoice software",
    icon: "shield",
    h1: "E-invoice and e-way bill software",
    tagline: "IRN and e-way bill from the same screen",
    intro: "Generate the e-invoice and e-way bill from the bill you just made. Content for this page is coming soon.",
    points: ["IRN and QR on the invoice", "E-way bill details", "Bulk generation", "Ready for GSTR-1"],
  },
];

export function getSoftware(slug) {
  return SOFTWARE.find((s) => s.slug === slug);
}
`);

put("app/sitemap.js", `import { SITE_URL } from "@/lib/seo";
import { INDUSTRIES } from "@/lib/industries";
import { SOFTWARE } from "@/lib/software";

// /sitemap.xml apne aap ban jata hai
export default function sitemap() {
  const now = new Date();

  const pages = [
    ["", 1.0, "weekly"],
    ["/pricing", 0.9, "weekly"],
    ["/solutions", 0.8, "monthly"],
    ["/mobile-app", 0.8, "monthly"],
    ["/desktop", 0.7, "monthly"],
    ["/about", 0.5, "yearly"],
    ["/careers", 0.4, "monthly"],
    ["/partner", 0.5, "monthly"],
    ["/login", 0.3, "yearly"],
  ].map(([path, priority, changeFrequency]) => ({
    url: \`\${SITE_URL}\${path}\`,
    lastModified: now,
    changeFrequency,
    priority,
  }));

  const industryPages = INDUSTRIES.map((i) => ({
    url: \`\${SITE_URL}/billing-software/\${i.slug}\`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const softwarePages = SOFTWARE.map((s) => ({
    url: \`\${SITE_URL}/software/\${s.slug}\`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...pages, ...industryPages, ...softwarePages];
}
`);

put("components/MenuIcon.js", `const paths = {
  // software
  receipt: "M6 2h12v20l-3-2-3 2-3-2-3 2zM9 7h6M9 11h6M9 15h4",
  doc: "M7 2h7l4 4v16H7zM14 2v5h4M10 12h6M10 16h4",
  box: "M3 7.5 12 3l9 4.5v9L12 21l-9-4.5zM3 7.5 12 12l9-4.5M12 12v9",
  ledger: "M5 3h13a1 1 0 0 1 1 1v17H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM9 3v18M13 8h3M13 12h3",
  pos: "M4 4h16v6H4zM7 14h.01M12 14h.01M17 14h.01M7 18h.01M12 18h.01M17 18h.01M4 4v16h16V4",
  shield: "M12 2 4 5v7c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V5zM9 12l2 2 4-4",
  // industries
  basket: "M4 9h16l-1.5 10.5A2 2 0 0 1 16.5 21h-9A2 2 0 0 1 5.5 19.5L4 9zM8 9 10 3M16 9 14 3",
  cart: "M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6M9 21h.01M17 21h.01",
  pill: "M10.5 3.5a5 5 0 0 1 7 7l-7 7a5 5 0 0 1-7-7zM7 7l10 10",
  gem: "M6 3h12l3 6-9 12L3 9zM3 9h18M9 3 6 9l6 12 6-12-3-6",
  shirt: "M8 3 4 6l2 3 2-1v12h8V8l2 1 2-3-4-3-2 2h-4z",
  plug: "M9 3v6M15 3v6M6 9h12v3a6 6 0 0 1-12 0zM12 18v3",
  cup: "M4 7h13v6a6 6 0 0 1-12 0zM17 8h2a2 2 0 0 1 0 5h-2M3 21h16",
  tool: "M14.5 3a5 5 0 0 0-5 7.5L3 17v4h4l6.5-6.5A5 5 0 0 0 21 9.5L17.5 13 15 10.5 18.5 7A5 5 0 0 0 14.5 3z",
  phone: "M7 2h10v20H7zM11 18h2",
  scissor: "M6 4l12 12M18 4L6 16M7 20a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM17 20a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  truck: "M3 6h11v10H3zM14 9h4l3 3v4h-7zM7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  factory: "M3 21V9l6 4V9l6 4V3h6v18zM7 17h2M13 17h2M19 17h.01",
  // company / get started
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8h.01",
  users: "M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 20v-2a4 4 0 0 0-3-3.9",
  handshake: "M7 11 3 7l4-4 3 3h4l3-3 4 4-4 4M7 11l3 3 2-2 2 2 3-3M7 11l-2 2 4 4 2-2",
  monitor: "M3 4h18v12H3zM8 20h8M12 16v4",
  tag: "M3 12V4h8l10 10-8 8L3 12zM7.5 7.5h.01",
  download: "M12 3v12M8 11l4 4 4-4M4 19h16",
  login: "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3",
};

export default function MenuIcon({ name }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[name] ?? paths.doc} />
    </svg>
  );
}
`);

put("components/MegaMenu.js", `"use client";
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
                  <Link href={\`/software/\${s.slug}\`} onClick={onClose}>
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
                  <Link href={\`/billing-software/\${i.slug}\`} onClick={onClose}>
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
`);

put("components/Navbar.js", `"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
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
  };
  const cur = (href) => (path === href ? "page" : undefined);

  return (
    <header className="nav">
      <nav className="wrap nav__inner" aria-label="Main">
        <Link href="/" aria-label={\`\${SITE.name} home\`} onClick={close}>
          <Logo />
        </Link>

        <ul id="nav-links" className={\`nav__links \${open ? "open" : ""}\`}>
          {/* Home link sirf tab dikhta hai jab user home page par nahi hai */}
          {path !== "/" && (
            <li>
              <Link href="/" className="nav__home" onClick={close}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
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
                const h = document.querySelector(".nav")?.getBoundingClientRect().bottom ?? 72;
                setMegaTop(h);
                setAppOpen(false);
                setMega((v) => !v);
              }}
            >
              {t("nav.solutions")}
              <span className={\`nav__caret \${mega ? "up" : ""}\`} aria-hidden="true" />
            </button>
          </li>

          {NAV.filter((item) => item.href !== "/solutions").map((item) => (
            <li key={item.href}>
              <Link href={item.href} aria-current={cur(item.href)} onClick={close}>
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
            onClick={() => setOpen(!open)}
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </nav>

      <AppModal open={appOpen} anchor={anchor} onClose={() => setAppOpen(false)} />
      <MegaMenu open={mega} top={megaTop} onClose={() => setMega(false)} />
    </header>
  );
}
`);

put("app/software/[slug]/page.js", `import Link from "next/link";
import { notFound } from "next/navigation";
import { SOFTWARE, getSoftware } from "@/lib/software";
import { pageMeta } from "@/lib/seo";
import { SITE } from "@/lib/site";
import Reveal from "@/components/Reveal";
import InvoiceMock from "@/components/InvoiceMock";
import CtaBand from "@/components/CtaBand";
import MenuIcon from "@/components/MenuIcon";

export function generateStaticParams() {
  return SOFTWARE.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const s = getSoftware(slug);
  if (!s) return {};
  return pageMeta({
    title: \`\${s.h1} | \${SITE.name}\`,
    description: \`\${s.tagline}. \${s.intro}\`,
    path: \`/software/\${s.slug}\`,
  });
}

export default async function SoftwarePage({ params }) {
  const { slug } = await params;
  const s = getSoftware(slug);
  if (!s) notFound();

  const others = SOFTWARE.filter((x) => x.slug !== s.slug);

  return (
    <>
      <nav className="crumbs wrap" aria-label="Breadcrumb">
        <Link href="/">Home</Link> <span aria-hidden="true">/</span>{" "}
        <Link href="/solutions">Solutions</Link> <span aria-hidden="true">/</span>{" "}
        <span>{s.name}</span>
      </nav>

      <section className="hero">
        <div className="wrap hero__grid">
          <div>
            <span className="pill">{s.tagline}</span>
            <h1>{s.h1}</h1>
            <p className="lead">{s.intro}</p>
            <div className="btn-row">
              <Link href="/mobile-app" className="btn btn--primary">
                Start free
              </Link>
              <Link href="/pricing" className="btn btn--ghost">
                See pricing
              </Link>
            </div>
          </div>
          <InvoiceMock />
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <Reveal>
            <span className="eyebrow">What you get</span>
            <h2>{s.name} in {SITE.name}</h2>
          </Reveal>
          <div className="fgrid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
            {s.points.map((p, i) => (
              <Reveal key={p} delay={(i % 4) * 70}>
                <article className="fcard">
                  <span className="fcard__icon">
                    <MenuIcon name={s.icon} />
                  </span>
                  <h3>{p}</h3>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--wash">
        <div className="wrap">
          <h2>Other tools in the same app</h2>
          <div className="otherlinks">
            {others.map((o) => (
              <Link key={o.slug} href={\`/software/\${o.slug}\`}>
                {o.name} &rarr;
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
`);


/* ---- CSS ---- */
{
  const p = "components/home/home.css";
  let cur = readFileSync(p, "utf8");
  copyFileSync(p, p + ".bak");
  const marker = "/* ===== Mega menu (Solutions dropdown) ===== */";
  const i = cur.indexOf(marker);
  if (i !== -1) cur = cur.slice(0, i);
  writeFileSync(p, cur.trimEnd() + "\n\n" + `/* ===== Mega menu (Solutions dropdown) ===== */
.mega__scrim { position: fixed; inset: 0; z-index: 44; background: transparent; }
.mega { position: fixed; left: 0; right: 0; z-index: 45; background: #fff; border-bottom: 1px solid var(--line);
  box-shadow: 0 22px 44px rgba(15, 23, 34, .13); animation: megaIn .16s ease; }
.mega__grid { display: grid; grid-template-columns: 1fr 1.7fr .9fr .9fr; gap: 2.5rem; padding-block: 2.2rem 2.4rem; }
.mega__col h4 { font: 700 1.02rem var(--display); margin-bottom: 1.1rem; padding-bottom: .7rem;
  border-bottom: 1px solid var(--line); }
.mega__col ul { list-style: none; display: grid; gap: .15rem; }
.mega__col--wide ul { grid-template-columns: 1fr 1fr; column-gap: 1.2rem; }
.mega__col a { display: flex; align-items: center; gap: .65rem; padding: .5rem .55rem; margin-left: -.55rem;
  border-radius: 8px; color: var(--ink); font-weight: 500; font-size: .96rem; }
.mega__col a:hover { background: var(--wash); color: var(--ledger-dark); }
.mega__icon { flex: none; display: grid; place-items: center; width: 1.9rem; height: 1.9rem; border-radius: 7px;
  background: var(--wash); color: var(--ledger); }
.mega__icon svg { width: 1.05rem; height: 1.05rem; }
.mega__col a:hover .mega__icon { background: var(--ledger); color: #fff; }
.mega__all { display: inline-block; margin-top: 1rem; color: var(--ledger); font-weight: 600; font-size: .92rem; }
.mega__all:hover { color: var(--ledger-dark); }
.mega__cta { margin-top: 1.2rem; width: fit-content; }
.mega__close { position: absolute; top: .8rem; right: 1.1rem; width: 2rem; height: 2rem; display: grid;
  place-items: center; border: 0; border-radius: 50%; background: transparent; color: var(--ink-soft);
  font-size: 1.5rem; line-height: 1; cursor: pointer; }
.mega__close:hover { background: var(--wash); color: var(--ink); }
@keyframes megaIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .mega { animation: none; } }
@media (max-width: 1100px) {
  .mega { max-height: calc(100vh - 72px); overflow-y: auto; }
  .mega__grid { grid-template-columns: 1fr 1fr; gap: 1.8rem; }
}
@media (max-width: 620px) {
  .mega__grid { grid-template-columns: 1fr; gap: 1.5rem; padding-block: 1.6rem 2rem; }
  .mega__col--wide ul { grid-template-columns: 1fr; }
}

/* Nav button that opens the mega menu */
button.nav__solutions { background: none; border: 0; padding: 0; font: 500 1rem var(--body); color: var(--ink-soft);
  cursor: pointer; white-space: nowrap; display: inline-flex; align-items: center; gap: .3rem; }
button.nav__solutions:hover, button.nav__solutions[aria-expanded="true"] { color: var(--ledger); }
.nav__caret { width: 7px; height: 7px; border-right: 2px solid currentColor; border-bottom: 2px solid currentColor;
  transform: rotate(45deg) translateY(-2px); transition: transform .15s; }
.nav__caret.up { transform: rotate(-135deg) translateY(-2px); }
`, "utf8");
  console.log("  patched " + p);
}

console.log("\nDone. Ab chalao:  npm run build\n");
