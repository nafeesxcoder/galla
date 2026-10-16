"use client";
import Reveal from "@/components/Reveal";
import { useLang } from "@/components/LangProvider";

export default function SetupSteps() {
  const { t } = useLang();
  const steps = [1, 2, 3, 4];

  return (
    <section className="section section--wash">
      <div className="wrap">
        <Reveal>
          <span className="eyebrow">Quick setup</span>
          <h2>{t("steps.title")}</h2>
          <p className="lead">
            No training, no installation help needed. Most shops bill within ten
            minutes.
          </p>
        </Reveal>

        <ol className="setup">
          {steps.map((n, i) => (
            <Reveal as="li" key={n} delay={i * 90} className="setup__item">
              <span className="setup__num">{n}</span>
              <h3>{t(`steps.s${n}t`)}</h3>
              <p>{t(`steps.s${n}d`)}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
