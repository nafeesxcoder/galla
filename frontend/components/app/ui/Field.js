"use client";

// ===========================================================================
// FORM PIECES
// ---------------------------------------------------------------------------
// Label, input, hint and error in one component, because the three of them
// getting out of step is the commonest form bug there is. The error is tied
// to the input with aria-describedby so a screen reader reads it.
// ===========================================================================

import { useId } from "react";

export function Field({ label, hint, error, required, children, id: given }) {
  const auto = useId();
  const id = given || auto;
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;

  return (
    <div className="ap-field">
      {label ? (
        <label className="ap-label" htmlFor={id}>
          {label}
          {required ? <span className="ap-req"> *</span> : null}
        </label>
      ) : null}
      {typeof children === "function"
        ? children({
            id,
            "aria-describedby": [hintId, errId].filter(Boolean).join(" ") || undefined,
            "aria-invalid": error ? "true" : undefined,
          })
        : children}
      {hint && !error ? (
        <p className="ap-hint" id={hintId}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="ap-err" id={errId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function Text({ label, hint, error, required, id, ...rest }) {
  return (
    <Field label={label} hint={hint} error={error} required={required} id={id}>
      {(a) => <input className="ap-input" {...a} {...rest} />}
    </Field>
  );
}

export function Select({ label, hint, error, required, children, id, ...rest }) {
  return (
    <Field label={label} hint={hint} error={error} required={required} id={id}>
      {(a) => (
        <select className="ap-select" {...a} {...rest}>
          {children}
        </select>
      )}
    </Field>
  );
}

export function TextArea({ label, hint, error, required, id, ...rest }) {
  return (
    <Field label={label} hint={hint} error={error} required={required} id={id}>
      {(a) => <textarea className="ap-textarea" {...a} {...rest} />}
    </Field>
  );
}

// ---------------------------------------------------------------------------
// money input
// ---------------------------------------------------------------------------
// Held as the string the user is typing, not as a number, so a half-typed
// "12." does not get reformatted out from under them mid-keystroke.
// inputMode="decimal" gets the number pad on a phone without the spinner
// arrows and scroll-wheel surprises of type="number".
export function Money({ label, hint, error, required, id, ...rest }) {
  return (
    <Field label={label} hint={hint} error={error} required={required} id={id}>
      {(a) => (
        <div className="ap-money">
          <input
            className="ap-input"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            {...a}
            {...rest}
          />
        </div>
      )}
    </Field>
  );
}

export function Check({ label, hint, ...rest }) {
  return (
    <div>
      <label className="ap-check">
        <input type="checkbox" {...rest} />
        <span>{label}</span>
      </label>
      {hint ? <p className="ap-hint">{hint}</p> : null}
    </div>
  );
}

// Only digits, and only as many as asked for. Used for phone and PIN code,
// where a stray letter means a WhatsApp message that never arrives.
export function digitsOnly(value, max) {
  const d = String(value || "").replace(/\D+/g, "");
  return max ? d.slice(0, max) : d;
}

// Accepts digits and one decimal point, nothing else. Lets the field hold
// "12." while it is being typed.
export function numericOnly(value, { decimals = true } = {}) {
  let s = String(value ?? "").replace(decimals ? /[^0-9.]/g : /[^0-9]/g, "");
  if (decimals) {
    const first = s.indexOf(".");
    if (first !== -1) s = s.slice(0, first + 1) + s.slice(first + 1).replace(/\./g, "");
  }
  return s;
}
