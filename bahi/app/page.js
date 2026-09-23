"use client";
import Link from "next/link";
import HeroVisual from "@/components/HeroVisual";
import CtaBand from "@/components/CtaBand";
import { useLang } from "@/components/LangProvider";
import TrustBar from "@/components/home/TrustBar";
import Coverage from "@/components/home/Coverage";
import DayJourney from "@/components/home/DayJourney";
import MultiDevice from "@/components/home/MultiDevice";
import Testimonials from "@/components/home/Testimonials";
import FeatureGrid from "@/components/home/FeatureGrid";
import GrowthSection from "@/components/home/GrowthSection";
import IndustryMarquee from "@/components/home/IndustryMarquee";
import Faq from "@/components/home/Faq";
import IndustryGrid from "@/components/home/IndustryGrid";
import AppDownload from "@/components/home/AppDownload";
import SetupSteps from "@/components/home/SetupSteps";

const industries = [
  "Grocery",
  "Pharmacy",
  "Hardware",
  "Garments",
  "Electronics",
  "Wholesale",
  "Restaurant",
  "Mobile shop",
  "Stationery",
  "Auto parts",
];

// Sample ratings: apne real numbers se badlo
const ratings = [
  { score: "4.7", src: "Google Play" },
  { score: "4.6", src: "App Store" },
  { score: "4.8", src: "Customer reviews" },
];

export default function Home() {
  const { t } = useLang();
  const features = [1, 2, 3, 4, 5, 6].map((n) => ({
    t: t(`feat.f${n}t`),
    d: t(`feat.f${n}d`),
  }));

  return (
    <>
      <section className="hero">
        <div className="wrap hero__grid">
          <div>
            <span className="pill">{t("hero.pill")}</span>
            <h1>{t("hero.title")}</h1>
            <p className="lead">{t("hero.lead")}</p>
            <div className="btn-row">
              <Link href="/mobile-app" className="btn btn--primary">
                {t("hero.cta")}
              </Link>
              <Link href="/pricing" className="btn btn--ghost">
                {t("hero.cta2")}
              </Link>
            </div>
            <div className="badges">
              {ratings.map((r) => (
                <div className="badge" key={r.src}>
                  <b>{r.score}</b>
                  <div>
                    <span className="stars" aria-hidden="true">
                      ★★★★★
                    </span>
                    <small>{r.src}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <HeroVisual />
        </div>
      </section>

      <TrustBar />

      <div className="wrap stats">
        <div>
          <b>2 lakh+</b>
          <span>{t("stats.businesses")}</span>
        </div>
        <div>
          <b>18</b>
          <span>{t("stats.states")}</span>
        </div>
        <div>
          <b>4.7</b>
          <span>{t("stats.rating")}</span>
        </div>
        <div>
          <b>24×7</b>
          <span>{t("stats.support")}</span>
        </div>
      </div>

      <section className="section">
        <div className="wrap">
          <h2>{t("feat.title")}</h2>
          <p className="lead">{t("feat.lead")}</p>
          <div className="features">
            {features.map((f) => (
              <div className="feature" key={f.t}>
                <h3>{f.t}</h3>
                <p>{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Coverage />

      <DayJourney />

      <SetupSteps />

      <GrowthSection />

      <MultiDevice />

      <FeatureGrid />

      <section className="section">
        <div className="wrap split">
          <div>
            <h2>{t("ind.title")}</h2>
            <p className="lead">{t("ind.lead")}</p>
            <div className="chips">
              {industries.map((i) => (
                <span key={i}>{i}</span>
              ))}
            </div>
          </div>
          <div className="panel">
            <h3>{t("ind.quoteTitle")}</h3>
            <p style={{ marginTop: "1rem", fontSize: "1.15rem" }}>
              &quot;{t("ind.quote")}&quot;
            </p>
            <p style={{ marginTop: "1rem", color: "var(--ink-soft)" }}>
              {t("ind.quoteBy")}
            </p>
          </div>
        </div>
      </section>

      <IndustryMarquee />

      <Testimonials />

      <IndustryGrid />

      <Faq />

      <AppDownload />

      <CtaBand />
    </>
  );
}
