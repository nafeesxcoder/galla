// ===========================================================================
// CountrySelect - the flag + dial code button on the left of the phone field
// The list of countries comes from content.js -> countries
// ===========================================================================

"use client";
import { useEffect, useRef, useState } from "react";
import Flag from "./Flag";

export default function CountrySelect({ countries, value, onChange }) {
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  const current = countries.find((c) => c.id === value) ?? countries[0];

  useEffect(() => {
    if (!open) return;
    function onDown(e) {
      if (box.current && !box.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  return (
    <div className="lg-cc" ref={box}>
      <button
        type="button"
        className="lg-cc__btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Country code, currently ${current.name}`}
        onClick={() => setOpen((v) => !v)}
      >
        <Flag id={current.id} />
        <span className="lg-cc__caret" aria-hidden="true" />
      </button>

      {open && (
        <ul className="lg-cc__menu" role="listbox">
          {countries.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                role="option"
                aria-selected={c.id === value}
                className={c.id === value ? "is-on" : undefined}
                onClick={() => {
                  onChange(c.id);
                  setOpen(false);
                }}
              >
                <Flag id={c.id} />
                <span>{c.name}</span>
                <em>{c.dial}</em>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
