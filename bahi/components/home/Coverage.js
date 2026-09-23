import Counter from "@/components/Counter";
import Reveal from "@/components/Reveal";
import { ShopArt } from "./Illustrations";

const stats = [
  { to: 2016, l: "Serving small businesses since", raw: true },
  { to: 1, suffix: " Cr+", l: "App downloads" },
  { to: 7, suffix: " days", l: "Support every week" },
  { to: 9, suffix: "+", l: "Indian languages" },
];

export default function Coverage() {
  return (
    <section className="section section--wash">
      <div className="wrap artsplit">
        <div>
          <Reveal>
            <span className="eyebrow">Nationwide coverage</span>
            <h2>
              From corner shops to growing factories, in every part of India
            </h2>
            <p className="lead">
              Local language support, offline-first billing and features shaped
              around how Indian business owners actually work through their day.
            </p>
          </Reveal>

          <div className="statgrid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            {stats.map((s, i) => (
              <Reveal key={s.l} delay={i * 90}>
                <b>{s.raw ? s.to : <Counter to={s.to} suffix={s.suffix} />}</b>
                <span>{s.l}</span>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal className="artsplit__art" delay={150}>
          <ShopArt />
        </Reveal>
      </div>
    </section>
  );
}
