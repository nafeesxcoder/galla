"use client";

// ===========================================================================
// THE ITEM BOX
// ---------------------------------------------------------------------------
// The single most used control in the whole product. A shop doing forty
// bills an hour touches this a few hundred times a day, so it is built for
// that and nothing else:
//
//   - focused the moment the screen opens, and again after every item added
//   - type, arrow down, Enter. The mouse is never needed.
//   - an exact code match is added straight away without a list, which is
//     what a barcode scanner does: it types the code then sends Enter
//   - if nothing matches, offering to add it as a new item is the first
//     option rather than a dead end
//   - the list is kept short because reading ten lines is slower than typing
//     two more letters
// ===========================================================================

import { useEffect, useMemo, useRef, useState } from "react";
import { BILLING } from "../content";
import { IconSearch, IconPlus } from "../Icons";
import { rupees, formatQty } from "../../../lib/money";
import { unitShort } from "../../../lib/units";
import { listItems } from "../data";

export default function ItemSearch({ onPick, onCreate, inputRef, disabled }) {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const box = useRef(null);
  const own = useRef(null);
  const input = inputRef || own;

  // Keep the most recent search's answer only. Without this, a slow reply
  // for "ba" can land after "basmati" and put the wrong list on screen.
  const seq = useRef(0);

  useEffect(() => {
    const term = q.trim();
    if (!term) {
      setRows([]);
      setLoading(false);
      return undefined;
    }

    const mine = ++seq.current;
    setLoading(true);

    // 180ms is about as long as you can wait without it feeling laggy, and
    // short enough that a four-letter search is one request, not four.
    const timer = setTimeout(async () => {
      try {
        const { rows: found } = await listItems({ search: term, limit: 8 });
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

  const options = useMemo(() => rows, [rows]);

  function take(item) {
    onPick(item);
    setQ("");
    setRows([]);
    setOpen(false);
    // Straight back to the box, ready for the next item.
    input.current?.focus();
  }

  function makeNew() {
    onCreate(q.trim());
    setQ("");
    setRows([]);
    setOpen(false);
  }

  // A barcode scanner is a keyboard that types very fast and then presses
  // Enter - the whole code lands in about fifty milliseconds, well inside
  // the debounce above. So at the moment Enter arrives there is nothing in
  // the suggestion list to match against.
  //
  // Whenever Enter finds nothing loaded, the server is asked once, directly,
  // before concluding the item does not exist. No guessing from the length
  // of the text: a shop's own codes are often three or four characters, and
  // a rule based on length would miss exactly those.
  //
  // This also means Enter always does something. Swallowing the keystroke
  // because a search happened to be in flight is the kind of thing that has
  // somebody pressing Enter four times and then scanning again.
  async function lookupCode(term) {
    try {
      const { rows: found } = await listItems({ search: term, limit: 5 });
      const exact = found.find(
        (r) =>
          (r.code && r.code.toLowerCase() === term.toLowerCase()) ||
          (r.name && r.name.toLowerCase() === term.toLowerCase())
      );
      return exact || (found.length === 1 ? found[0] : null);
    } catch {
      return null;
    }
  }

  function onKeyDown(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, options.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key !== "Enter") return;

    e.preventDefault();
    const term = q.trim();
    if (!term) return;

    // A barcode scanner types the whole code and hits Enter in one burst,
    // before any suggestion list has had time to render. So an exact code
    // match wins outright.
    const exactCode = options.find(
      (r) => r.code && r.code.toLowerCase() === term.toLowerCase()
    );
    if (exactCode) {
      take(exactCode);
      return;
    }

    if (options[active]) {
      take(options[active]);
      return;
    }

    // Nothing matched in the list - which includes the list not having
    // arrived yet. One direct lookup, then either add it or offer to create
    // it. Either way the Enter is answered.
    setLoading(true);
    lookupCode(term).then((found) => {
      setLoading(false);
      if (found) take(found);
      else makeNew();
    });
  }

  const showList = open && Boolean(q.trim());

  return (
    <div className="ap-addbar" ref={box}>
      <span className="ap-addbar-ico">
        <IconSearch size={20} />
      </span>
      <input
        ref={input}
        className="ap-input"
        placeholder={BILLING.addItemPlaceholder}
        value={q}
        disabled={disabled}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        autoComplete="off"
        spellCheck="false"
        aria-label={BILLING.addItemPlaceholder}
        aria-expanded={showList}
        role="combobox"
        aria-controls="ap-item-suggest"
      />

      {showList ? (
        <div className="ap-suggest" id="ap-item-suggest" role="listbox">
          {options.map((r, i) => (
            <button
              key={r.id}
              type="button"
              role="option"
              aria-selected={i === active}
              data-active={i === active}
              className="ap-suggest-item"
              onMouseEnter={() => setActive(i)}
              onClick={() => take(r)}
            >
              <span style={{ minWidth: 0, flex: 1 }}>
                <span className="ap-suggest-name">{r.name}</span>
                <span className="ap-suggest-meta" style={{ display: "block" }}>
                  {r.type === "service"
                    ? "Service"
                    : `${formatQty(r.stock)} ${unitShort(r.unit)} in stock`}
                  {r.code ? ` · ${r.code}` : ""}
                  {r.taxRate ? ` · ${r.taxRate}% GST` : ""}
                </span>
              </span>
              <span className="ap-suggest-right">
                <span className="ap-strong ap-num">{rupees(r.salePaise)}</span>
                {r.isOut && r.type !== "service" ? (
                  <span className="ap-suggest-meta" style={{ display: "block", color: "var(--ap-danger)" }}>
                    Out of stock
                  </span>
                ) : null}
              </span>
            </button>
          ))}

          {loading && !options.length ? (
            <div className="ap-suggest-empty">
              <span className="ap-spin" />
            </div>
          ) : null}

          {!loading && !options.length ? <div className="ap-suggest-empty">{BILLING.noItems}</div> : null}

          <div className={options.length ? "ap-suggest-new" : ""}>
            <button type="button" className="ap-suggest-item" onClick={makeNew}>
              <span style={{ color: "var(--ap-brand)" }}>
                <IconPlus size={17} />
              </span>
              <span>
                <span className="ap-suggest-name">
                  {BILLING.createItem} &ldquo;{q.trim()}&rdquo;
                </span>
                <span className="ap-suggest-meta" style={{ display: "block" }}>
                  {BILLING.asNewItem}
                </span>
              </span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
