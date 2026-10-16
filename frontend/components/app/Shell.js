"use client";

// ===========================================================================
// THE APP SHELL
// ---------------------------------------------------------------------------
// The frame every screen behind the login sits in: the sidebar, the shop
// switcher, the top bar, and the gate that decides whether there is anything
// to show at all.
//
// The gate has four honest answers and no fifth:
//   still checking    -> a quiet placeholder, no flash of the wrong thing
//   not signed in     -> say so, with a way back to the login
//   no shop yet       -> send them to set one up; a bill needs a state
//   server unreachable-> say that, rather than an empty screen that looks
//                        like a shop with no bills in it
// ===========================================================================

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NAV, COMMON, SHOP } from "./content";
import { useShop } from "./useShop";
import { ToastProvider } from "./ui/Toast";
import { Note } from "./ui/Bits";
import {
  IconHome,
  IconBill,
  IconBox,
  IconUsers,
  IconPlus,
  IconShop,
  IconMenu,
  IconChevronDown,
  IconCheck,
  IconLogout,
  IconSettings,
  IconChart,
  IconWallet,
  IconLock,
} from "./Icons";

const ICONS = {
  home: IconHome,
  bill: IconBill,
  box: IconBox,
  users: IconUsers,
  plus: IconPlus,
  chart: IconChart,
  wallet: IconWallet,
  lock: IconLock,
};

export default function Shell({ title, children, flush = false, actions }) {
  const shop = useShop();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef(null);

  useSoloScreen(rootRef);

  // Close the slide-over whenever the route changes, or it stays over the
  // page you just navigated to on a phone.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useHotkeys(router);

  return (
    <div className="ap-root" ref={rootRef}>
      <ToastProvider>
        <div className="ap-shell">
          {menuOpen ? <div className="ap-scrim" onClick={() => setMenuOpen(false)} /> : null}

          <aside className="ap-side" data-open={menuOpen ? "true" : "false"}>
            <Link href="/app" className="ap-brandbar">
              <span className="ap-brandmark" aria-hidden="true">
                G
              </span>
              <span>myGallaBook</span>
            </Link>

            <ShopSwitcher shop={shop} />

            <nav className="ap-nav" aria-label="Main">
              {NAV.map((n) => {
                const Icon = ICONS[n.icon] || IconHome;
                const active = n.href === "/app" ? pathname === "/app" : pathname.startsWith(n.href);
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    className="ap-navlink"
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon size={18} />
                    <span>{n.label}</span>
                    <span className="ap-navkey">{n.hotkey}</span>
                  </Link>
                );
              })}

              <div className="ap-navhead">Shop</div>
              <Link href="/account" className="ap-navlink">
                <IconSettings size={18} />
                <span>{SHOP.myAccount}</span>
              </Link>
              <Link href="/" className="ap-navlink">
                <IconShop size={18} />
                <span>{SHOP.website}</span>
              </Link>
            </nav>

            <div className="ap-sidefoot">
              <button
                type="button"
                className="ap-navlink"
                style={{ width: "100%", background: "none", border: 0, font: "inherit", cursor: "pointer" }}
                onClick={() => {
                  shop.signOut?.();
                  router.push("/");
                }}
              >
                <IconLogout size={18} />
                <span>{SHOP.signOut}</span>
              </button>
            </div>
          </aside>

          <div className="ap-main">
            <header className="ap-top">
              <button
                type="button"
                className="ap-burger"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Menu"
                aria-expanded={menuOpen}
              >
                <IconMenu size={18} />
              </button>
              <h1 className="ap-title">{title}</h1>
              <div className="ap-top-right">{actions}</div>
            </header>

            <main className={flush ? "ap-body ap-body-flush" : "ap-body"}>
              <Gate shop={shop}>{children}</Gate>
            </main>
          </div>
        </div>
      </ToastProvider>
    </div>
  );
}

// ---------------------------------------------------------------------------
// the gate
// ---------------------------------------------------------------------------
function Gate({ shop, children }) {
  if (!shop.ready) {
    return (
      <div style={{ padding: 20, display: "grid", gap: 10, maxWidth: 420 }}>
        <div className="ap-skel" style={{ width: "40%", height: 17 }} />
        <div className="ap-skel" style={{ width: "72%" }} />
        <div className="ap-skel" style={{ width: "58%" }} />
      </div>
    );
  }

  if (shop.offline && !shop.signedIn) {
    return (
      <div style={{ maxWidth: 560 }}>
        <Note kind="warn">
          <strong style={{ display: "block", marginBottom: 3 }}>{COMMON.offlineTitle}</strong>
          {COMMON.offlineBody}
        </Note>
      </div>
    );
  }

  if (!shop.signedIn) {
    return (
      <div className="ap-panel" style={{ maxWidth: 480 }}>
        <div className="ap-panel-body">
          <h2 style={{ margin: "0 0 6px", fontSize: 17 }}>{COMMON.authTitle}</h2>
          <p style={{ margin: "0 0 14px", color: "var(--ap-ink-3)" }}>{COMMON.authBody}</p>
          <Link href="/login?next=/app" className="ap-btn ap-btn-primary">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  if (!shop.businessId) {
    return (
      <div className="ap-panel" style={{ maxWidth: 480 }}>
        <div className="ap-panel-body">
          <h2 style={{ margin: "0 0 6px", fontSize: 17 }}>{COMMON.noShopTitle}</h2>
          <p style={{ margin: "0 0 14px", color: "var(--ap-ink-3)" }}>{COMMON.noShopBody}</p>
          <Link href="/account" className="ap-btn ap-btn-primary">
            {COMMON.noShopCta}
          </Link>
        </div>
      </div>
    );
  }

  return children;
}

// ---------------------------------------------------------------------------
// shop switcher
// ---------------------------------------------------------------------------
// Only becomes a menu when there is more than one shop. A single-shop
// shopkeeper should not be given a dropdown that does nothing.
function ShopSwitcher({ shop }) {
  const [open, setOpen] = useState(false);
  const box = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (box.current && !box.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const name = shop.shop?.name || "Your shop";
  const sub = shop.shop?.stateName || shop.shop?.city || "";
  const many = (shop.businesses || []).length > 1;

  if (!shop.signedIn) {
    return (
      <div className="ap-shopbtn" style={{ cursor: "default" }}>
        <IconShop size={18} />
        <span className="ap-shopbtn-txt">
          <span className="ap-shopbtn-name">Not signed in</span>
        </span>
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }} ref={box}>
      <button
        type="button"
        className="ap-shopbtn"
        onClick={() => many && setOpen((v) => !v)}
        aria-expanded={many ? open : undefined}
        style={many ? undefined : { cursor: "default" }}
      >
        <IconShop size={18} />
        <span className="ap-shopbtn-txt">
          <span className="ap-shopbtn-name" title={name}>
            {name}
          </span>
          {sub ? <span className="ap-shopbtn-sub">{sub}</span> : null}
        </span>
        {many ? <IconChevronDown size={16} /> : null}
      </button>

      {open ? (
        <div
          className="ap-suggest"
          style={{ left: 10, right: 10, top: "calc(100% - 4px)" }}
          role="menu"
        >
          {shop.businesses.map((b) => (
            <button
              key={b.id}
              type="button"
              className="ap-suggest-item"
              onClick={() => {
                shop.switchBusiness?.(b.id);
                setOpen(false);
              }}
            >
              <span className="ap-suggest-name">{b.name}</span>
              {String(b.id) === String(shop.businessId) ? (
                <span className="ap-suggest-right" style={{ color: "var(--ap-brand)" }}>
                  <IconCheck size={16} />
                </span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// the app gets the screen to itself
// ---------------------------------------------------------------------------
// The website's header and footer come from the root layout, which wraps
// every page including these. On the marketing pages that is right; here it
// is not. A shopkeeper making a bill does not want a "Pricing" menu and a
// "Partner with us" link sitting on top of the till, and the app has its own
// sidebar and top bar already.
//
// Rather than guess at the layout's component names, this walks up from the
// app's own element to the body and hides everything standing beside it on
// the way. That works whatever the layout is made of, and it puts it all
// back on the way out, so the website is untouched the moment you leave /app.
function useSoloScreen(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const hidden = [];
    const SKIP = new Set(["SCRIPT", "STYLE", "LINK", "META", "NOSCRIPT", "TEMPLATE"]);

    let node = el;
    while (node.parentElement && node.parentElement !== document.documentElement) {
      for (const sibling of node.parentElement.children) {
        if (sibling === node) continue;
        if (SKIP.has(sibling.tagName)) continue;
        // Custom elements - the dev error overlay is one - are left alone.
        // Hiding the thing that tells you what went wrong is a poor trade.
        if (sibling.tagName.includes("-")) continue;
        if (sibling.hasAttribute("data-ap-hidden")) continue;
        sibling.setAttribute("data-ap-hidden", "");
        hidden.push(sibling);
      }
      node = node.parentElement;
    }

    return () => {
      for (const n of hidden) n.removeAttribute("data-ap-hidden");
    };
  }, [ref]);
}

// ---------------------------------------------------------------------------
// keyboard shortcuts
// ---------------------------------------------------------------------------
// "g" then a letter, the way a lot of keyboard-driven tools work. Ignored
// while the cursor is in a field, because a shopkeeper typing "garam masala"
// into the item box must not be thrown onto another page by the g.
function useHotkeys(router) {
  const pending = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target;
      const tag = el?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el?.isContentEditable) return;

      const key = e.key.toLowerCase();

      if (pending.current === "g") {
        pending.current = null;
        const to = {
          h: "/app",
          b: "/app/billing",
          l: "/app/bills",
          i: "/app/items",
          p: "/app/parties",
          e: "/app/expenses",
          d: "/app/day-close",
          r: "/app/reports",
        }[key];
        if (to) {
          e.preventDefault();
          router.push(to);
        }
        return;
      }

      if (key === "g") {
        pending.current = "g";
        // Forget it after a moment, so a stray g does not hijack the next key
        // pressed a minute later.
        setTimeout(() => {
          pending.current = null;
        }, 1200);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);
}
