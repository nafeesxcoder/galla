import Reveal from "@/components/Reveal";
import MenuIcon from "@/components/MenuIcon";

export default function Extras({ extras }) {
  return (
    <section className="section section--wash">
      <div className="wrap">
        <Reveal>
          <span className="eyebrow">{extras.eyebrow}</span>
          <h2>{extras.h2}</h2>
          <p className="lead">{extras.lead}</p>
        </Reveal>
        <div className="fgrid">
          {extras.items.map(([t, d, icon], i) => (
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
