"use client";

// ===========================================================================
// MODAL
// ---------------------------------------------------------------------------
// Escape closes it, the backdrop closes it, and focus is trapped inside
// while it is open and handed back to whatever opened it on close. A till
// operator working on the keyboard should never tab out of a dialog into the
// page behind it.
// ===========================================================================

import { useEffect, useRef } from "react";
import { IconClose } from "../Icons";

export default function Modal({ title, onClose, children, footer, wide = false, labelledBy }) {
  const box = useRef(null);
  const returnTo = useRef(null);

  useEffect(() => {
    returnTo.current = document.activeElement;

    // The first real input, so typing can start straight away.
    const first = box.current?.querySelector(
      "input:not([type=hidden]):not([disabled]), select, textarea, button"
    );
    first?.focus();

    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose?.();
        return;
      }
      if (e.key !== "Tab") return;

      const focusable = [
        ...(box.current?.querySelectorAll(
          'a[href], button:not([disabled]), input:not([type=hidden]):not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) || []),
      ].filter((el) => el.offsetParent !== null);
      if (!focusable.length) return;

      const first2 = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first2) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first2.focus();
      }
    };

    document.addEventListener("keydown", onKey, true);
    // Stop the page behind from scrolling under the dialog.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = prevOverflow;
      if (returnTo.current && returnTo.current.focus) returnTo.current.focus();
    };
  }, [onClose]);

  return (
    <div
      className="ap-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className={`ap-modal${wide ? " ap-modal-wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={labelledBy ? undefined : title}
        aria-labelledby={labelledBy}
        ref={box}
      >
        {title ? (
          <div className="ap-modal-head">
            <h2>{title}</h2>
            <button type="button" className="ap-modal-x" onClick={onClose} aria-label="Close">
              <IconClose size={18} />
            </button>
          </div>
        ) : null}
        <div className="ap-modal-body">{children}</div>
        {footer ? <div className="ap-modal-foot">{footer}</div> : null}
      </div>
    </div>
  );
}
