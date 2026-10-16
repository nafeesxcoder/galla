"use client";

// ===========================================================================
// TOASTS
// ---------------------------------------------------------------------------
// Confirmation that something happened, without stealing focus. A shopkeeper
// mid-bill must never have the keyboard taken away from them by a dialog
// saying "Saved".
// ===========================================================================

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { IconCheck, IconWarn } from "../Icons";

const Ctx = createContext({ toast: () => {}, error: () => {} });

export function useToast() {
  return useContext(Ctx);
}

export function ToastProvider({ children }) {
  const [list, setList] = useState([]);
  const seq = useRef(0);

  const push = useCallback((message, kind) => {
    if (!message) return;
    const id = ++seq.current;
    setList((prev) => [...prev, { id, message, kind }]);
    // An error stays up longer - it may need reading twice.
    const ms = kind === "bad" ? 5200 : 2600;
    setTimeout(() => setList((prev) => prev.filter((t) => t.id !== id)), ms);
  }, []);

  const value = useMemo(
    () => ({
      toast: (m) => push(m, "good"),
      error: (m) => push(m, "bad"),
    }),
    [push]
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      {/* aria-live so a screen reader announces it without a focus jump */}
      <div className="ap-toasts" role="status" aria-live="polite">
        {list.map((t) => (
          <div key={t.id} className={`ap-toast ap-toast-${t.kind}`}>
            {t.kind === "bad" ? <IconWarn size={16} /> : <IconCheck size={16} />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
