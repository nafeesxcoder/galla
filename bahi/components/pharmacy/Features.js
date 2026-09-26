import Reveal from "@/components/Reveal";
import Art from "./Art";

export default function Features({ features }) {
  return (
    <section className="section">
      <div className="wrap">
        <Reveal>
          <span className="eyebrow">{features.eyebrow}</span>
          <h2>{features.h2}</h2>
          <p className="lead">{features.lead}</p>
        </Reveal>
      </div>

      {features.blocks.map((b, i) => {
        const flip = i % 2 === 1;
        return (
          <div className={`wrap artsplit featblock ${flip ? "artsplit--flip" : ""}`} key={b.h3}>
            {flip && (
              <Reveal className="artsplit__art">
                <Art name={b.art} />
              </Reveal>
            )}

            <Reveal delay={flip ? 120 : 0}>
              <h3 className="featblock__h">{b.h3}</h3>
              <p>{b.p}</p>
              <ul className="checklist">
                {b.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              {b.note && <p className="featblock__note">{b.note}</p>}
            </Reveal>

            {!flip && (
              <Reveal className="artsplit__art" delay={150}>
                <Art name={b.art} />
              </Reveal>
            )}
          </div>
        );
      })}
    </section>
  );
}
