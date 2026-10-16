import Reveal from "@/components/Reveal";
import MenuIcon from "@/components/MenuIcon";

export default function WhoFor({ whoFor }) {
  return (
    <section className="section section--wash">
      <div className="wrap">
        <Reveal>
          <span className="eyebrow">{whoFor.eyebrow}</span>
          <h2>{whoFor.h2}</h2>
          <p className="lead">{whoFor.lead}</p>
        </Reveal>
        <div className="fgrid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          {whoFor.items.map(([t, d, icon], i) => (
            <Reveal key={t} delay={(i % 4) * 70}>
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
