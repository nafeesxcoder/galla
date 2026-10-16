import Reveal from "@/components/Reveal";

export default function Steps({ steps }) {
  return (
    <section className="section section--wash">
      <div className="wrap">
        <Reveal>
          <span className="eyebrow">{steps.eyebrow}</span>
          <h2>{steps.h2}</h2>
          <p className="lead">{steps.lead}</p>
        </Reveal>
        <ol className="setup">
          {steps.items.map(([t, d], i) => (
            <Reveal as="li" key={t} delay={i * 90} className="setup__item">
              <span className="setup__num">{i + 1}</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
