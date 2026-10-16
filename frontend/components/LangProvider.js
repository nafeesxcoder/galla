"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { DEFAULT_LANG, DICT, LANGS } from "@/lib/i18n";

const LangContext = createContext(null);
const STORAGE_KEY = "site-lang";

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(DEFAULT_LANG); // pehle hamesha English

  // Browser me pichli choice yaad rakho (sirf client side)
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved && LANGS.some((l) => l.code === saved)) setLangState(saved);
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((code) => {
    setLangState(code);
    try { window.localStorage.setItem(STORAGE_KEY, code); } catch {}
  }, []);

  const t = useCallback((key) => DICT[lang]?.[key] ?? DICT[DEFAULT_LANG][key] ?? key, [lang]);

  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used inside LangProvider");
  return ctx;
}
