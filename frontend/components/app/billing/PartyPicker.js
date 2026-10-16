"use client";

// ===========================================================================
// THE CUSTOMER BOX
// ---------------------------------------------------------------------------
// Searches by name or phone, because at a counter the phone number is often
// the only thing anybody remembers. Leaving it empty is a real answer - a
// cash sale to somebody passing by does not need a name on file, and
// forcing one is how an app ends up with four hundred customers called
// "customer".
//
// Once picked, the box shows what they owe. That is the number you want in
// front of you before you hand over more goods on credit.
// ===========================================================================

import { useEffect, useRef, useState } from "react";
import { BILLING, PARTIES } from "../content";
import { IconSearch, IconPlus, IconClose, IconUsers } from "../Icons";
import { rupees } from "../../../lib/money";
import { stateName } from "../../../lib/gst-states";
import { listParties } from "../data";

export default function PartyPicker({ value, onPick, onClear, onCreate, inputRef, forSupplier }) {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const box = useRef(null);
  const own = useRef(null);
  const input = inputRef || own;
  const seq = useRef(0);

  useEffect(() => {
    const term = q.trim();
    if (!term) {
      setRows([]);
      return undefined;
    }
    const mine = ++seq.current;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const { rows: found } = await listParties({ search: term, limit: 8 });
        if (seq.current !== mine) return;
        setRows(found);
        setActive(0);
      } catch {
        if (seq.current === mine) setRows([]);
      } finally {
        if (seq.current === mine) setLoading(false);
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    const onDown = (e) => {
      if (box.current && !box.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function take(p) {
    onPick(p);
    setQ("");
    setRows([]);
    setOpen(false);
  }

  function onKeyDown(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, rows.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (rows[active]) take(rows[active]);
      else if (q.trim() && !loading) onCreate(q.trim());
    }
  }

  // Already chosen: show them, with a way to drop back to a walk-in.
  if (value) {
    const owes = value.balancePaise > 0;
    return (
      <div>
        <label className="ap-label">{forSupplier ? BILLING.partyLabelSupplier : BILLING.partyLabel}</label>
        <div
          className="ap-row"
          style={{
            border: "1px solid var(--ap-line-strong)",
            borderRadius: "var(--ap-radius-sm)",
            padding: "7px 9px 7px 11px",
            minHeight: 40,
            background: "var(--ap-panel)",
            gap: 10,
          }}
        >
          <span style={{ minWidth: 0 }}>
            <span className="ap-strong" style={{ display: "block" }}>
              {value.name}
            </span>
            <span className="ap-sub">
              {[
                value.phone || null,
                value.gstin || null,
                value.stateCode ? stateName(value.stateCode) : null,
              ]
                .filter(Boolean)
                .join(" · ") || "No phone on file"}
            </span>
          </span>
          <span style={{ marginLeft: "auto", textAlign: "right", flex: "0 0 auto" }}>
            {value.balancePaise ? (
              <span className={`ap-pill ${owes ? "ap-pill-unpaid" : "ap-pill-paid"}`}>
                {owes
                  ? `${PARTIES.owesYou} ${rupees(value.owesUs)}`
                  : `${PARTIES.youOwe} ${rupees(value.weOwe)}`}
              </span>
            ) : (
              <span className="ap-sub">{PARTIES.settled}</span>
            )}
          </span>
          <button type="button" className="ap-line-x" onClick={onClear} aria-label="Remove customer">
            <IconClose size={16} />
          </button>
        </div>
      </div>
    );
  }

  const showList = open && Boolean(q.trim());

  return (
    <div ref={box} style={{ position: "relative" }}>
      <label className="ap-label" htmlFor="ap-party-input">
        {forSupplier ? BILLING.partyLabelSupplier : BILLING.partyLabel}
      </label>
      <div className="ap-search" style={{ minWidth: 0 }}>
        <span className="ap-search-ico">
          <IconSearch size={17} />
        </span>
        <input
          id="ap-party-input"
          ref={input}
          className="ap-input"
          placeholder={BILLING.partyPlaceholder}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          autoComplete="off"
          role="combobox"
          aria-expanded={showList}
        />
      </div>
      {!q ? <p className="ap-hint">{BILLING.walkInNote}</p> : null}

      {showList ? (
        <div className="ap-suggest" role="listbox">
          {rows.map((p, i) => (
            <button
              key={p.id}
              type="button"
              role="option"
              aria-selected={i === active}
              data-active={i === active}
              className="ap-suggest-item"
              onMouseEnter={() => setActive(i)}
              onClick={() => take(p)}
            >
              <span style={{ color: "var(--ap-ink-3)" }}>
                <IconUsers size={17} />
              </span>
              <span style={{ minWidth: 0, flex: 1 }}>
                <span className="ap-suggest-name">{p.name}</span>
                <span className="ap-suggest-meta" style={{ display: "block" }}>
                  {p.phone || "No phone"}
                  {p.city ? ` · ${p.city}` : ""}
                </span>
              </span>
              {p.balancePaise ? (
                <span className="ap-suggest-right">
                  <span
                    className="ap-strong ap-num"
                    style={{ color: p.balancePaise > 0 ? "var(--ap-danger)" : "var(--ap-brand-ink)" }}
                  >
                    {rupees(Math.abs(p.balancePaise))}
                  </span>
                  <span className="ap-suggest-meta" style={{ display: "block" }}>
                    {p.balancePaise > 0 ? PARTIES.owesYou : PARTIES.youOwe}
                  </span>
                </span>
              ) : null}
            </button>
          ))}

          {loading && !rows.length ? (
            <div className="ap-suggest-empty">
              <span className="ap-spin" />
            </div>
          ) : null}

          <div className={rows.length ? "ap-suggest-new" : ""}>
            <button type="button" className="ap-suggest-item" onClick={() => onCreate(q.trim())}>
              <span style={{ color: "var(--ap-brand)" }}>
                <IconPlus size={17} />
              </span>
              <span className="ap-suggest-name">
                {BILLING.newParty} &ldquo;{q.trim()}&rdquo;
              </span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
