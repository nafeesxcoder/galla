// ===========================================================================
// LoginModal - the popup, mounted once in app/layout.js
// ---------------------------------------------------------------------------
// HOW IT OPENS, without any change to Navbar.js:
// it listens for clicks anywhere on the page and, if the click was on a link
// pointing at /login (or on anything with a data-login attribute), it stops
// the navigation and opens this popup instead.
//
// So the existing "Login" link in the navbar keeps working as it is, and
// /login still opens as a normal page if someone types that URL.
//
// To open it from your own code:  window.dispatchEvent(new Event("galla:login"))
// ===========================================================================

"use client";
import { useCallback, useEffect, useState } from "react";
import LoginCard from "./LoginCard";

export default function LoginModal() {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  // intercept clicks on the Login link
  useEffect(() => {
    function onClick(e) {
      // let people still open the link in a new tab
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;

      const hit = e.target.closest?.('a[href="/login"], a[href$="/login"], [data-login]');
      if (!hit) return;

      e.preventDefault();
      setOpen(true);
    }

    function onEvent() {
      setOpen(true);
    }

    document.addEventListener("click", onClick);
    window.addEventListener("galla:login", onEvent);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("galla:login", onEvent);
    };
  }, []);

  // Escape closes it, and the page behind stops scrolling while it is open
  useEffect(() => {
    if (!open) return;

    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="lg-scrim" role="dialog" aria-modal="true" aria-label="Login" onMouseDown={(e) => {
      if (e.target === e.currentTarget) close();
    }}>
      <LoginCard onClose={close} />
    </div>
  );
}
