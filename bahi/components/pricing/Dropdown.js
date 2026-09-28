// ===========================================================================
// Dropdown - the two small pill selectors above the plan cards
// ("Desktop + Mobile" and "1 Year")
// ---------------------------------------------------------------------------
// Closes on outside click and on Escape, like a normal menu.
// ===========================================================================

"use client";
import { useEffect, useRef, useState } from "react";

export default function Dropdown({ options, value, onChange, label }) {
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  const current = options.find((o) => o.id === value) ?? options[0];

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

  return (
    <div className="pr-dd" ref={box}>
      <button
        type="button"
        className={`pr-dd__btn ${open ? "is-open" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
      >
        {current.label}
        <span className="pr-dd__caret" aria-hidden="true" />
      </button>

      {open && (
        <ul className="pr-dd__menu" role="listbox" aria-label={label}>
          {options.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                role="option"
                aria-selected={o.id === value}
                className={o.id === value ? "is-on" : undefined}
                onClick={() => {
                  onChange(o.id);
                  setOpen(false);
                }}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
