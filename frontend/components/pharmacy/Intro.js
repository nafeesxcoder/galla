import Reveal from "@/components/Reveal";
import Art from "./Art";

export default function Intro({ intro }) {
  return (
    <section className="section">
      <div className="wrap artsplit artsplit--flip">
        <Reveal className="artsplit__art">
          <Art name="shield" />
        </Reveal>
        <Reveal delay={120}>
          <span className="eyebrow">{intro.eyebrow}</span>
          <h2>{intro.h2}</h2>
          {intro.body.map((p) => (
            <p className="lead" key={p.slice(0, 24)}>
              {p}
            </p>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
