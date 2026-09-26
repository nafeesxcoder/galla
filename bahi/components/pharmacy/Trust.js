import Reveal from "@/components/Reveal";
import MenuIcon from "@/components/MenuIcon";

export default function Trust({ trust }) {
  return (
    <section className="section">
      <div className="wrap">
        <Reveal>
          <span className="eyebrow">{trust.eyebrow}</span>
          <h2>{trust.h2}</h2>
        </Reveal>
        <div className="fgrid">
          {trust.items.map(([t, d, icon], i) => (
            <Reveal key={t} delay={i * 80}>
              <article className="fcard">
                <span className="fcard__icon">
                  <MenuIcon name={icon} />
                </span>
                <h3>{t}</h3>
                <p>{d}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
