// ===========================================================================
// AccountMenu - the navbar item that swaps between "Login" and "My Account"
// ---------------------------------------------------------------------------
// HOW TO USE IT: open components/Navbar.js and swap the Login link
//
//     <Link href="/login" aria-current={cur("/login")} onClick={close}>
//       {t("nav.login")}
//     </Link>
//
// for this, keeping the same props:
//
//     <AccountMenu aria-current={cur("/login")} onClick={close}>
//       {t("nav.login")}
//     </AccountMenu>
//
// plus this import at the top:
//
//     import AccountMenu from "@/components/account/AccountMenu";
//
// Signed out, it renders exactly the Login link you had - same props, same
// translated label - so the login popup still opens from it. Signed in, it
// becomes a "My Account" dropdown. The installer does this swap for you.
// ===========================================================================

"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { CONTENT } from "./content";

export default function AccountMenu({
  children,
  onClick,
  href = "/login",
  className = "",
  ...rest
}) {
  const { signedIn, user, signOut, ready } = useAuth();
  const [open, setOpen] = useState(false);
  const box = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e) {
      if (box.current && !box.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Until we know, show the signed-out version. It avoids the menu
  // flickering from one state to the other on first paint.
  if (!ready || !signedIn) {
    return (
      <Link href={href} className={className} onClick={onClick} {...rest}>
        {children ?? "Login"}
      </Link>
    );
  }

  // closes our dropdown AND the mobile nav, if Navbar passed a closer
  function shut() {
    setOpen(false);
    onClick?.();
  }

  return (
    <div className="ac-menu" ref={box}>
      <button
        type="button"
        className="ac-menu__btn"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="ac-menu__dot" aria-hidden="true">
          {/* A name gives us an initial. A phone number does not - "7" in a
              circle means nothing - so fall back to a person instead. */}
          {user?.name?.trim() ? (
            user.name.trim().charAt(0).toUpperCase()
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
            </svg>
          )}
        </span>
        My Account
        <span className={`ac-menu__caret ${open ? "up" : ""}`} aria-hidden="true" />
      </button>

      {open && (
        <div className="ac-menu__drop" role="menu">
          <p className="ac-menu__who">
            {user?.name || "Signed in"}
            <span>
              {user?.dial} {user?.phone}
            </span>
          </p>

          <Link href="/account" onClick={shut}>
            My account
          </Link>
          {CONTENT.quickLinks.items.map(([label, href]) => (
            <Link key={href} href={href} onClick={shut}>
              {label}
            </Link>
          ))}

          <button
            type="button"
            className="ac-menu__out"
            onClick={() => {
              setOpen(false);
              signOut();
            }}
          >
            {CONTENT.signOut}
          </button>
        </div>
      )}
    </div>
  );
}
