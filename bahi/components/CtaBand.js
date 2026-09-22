"use client";
import Link from "next/link";
import { useLang } from "./LangProvider";

export default function CtaBand() {
  const { t } = useLang();
  return (
    <section className="wrap" style={{ marginTop: "5rem" }}>
      <div className="cta-band">
        <div>
          <h2>{t("cta.title")}</h2>
          <p>{t("cta.text")}</p>
        </div>
        <Link href="/mobile-app" className="btn btn--primary">{t("cta.btn")}</Link>
      </div>
    </section>
  );
}
