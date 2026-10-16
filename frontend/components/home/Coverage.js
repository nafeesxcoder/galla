import Counter from "@/components/Counter";
import Reveal from "@/components/Reveal";
import { ShopArt } from "./Illustrations";

const stats = [
  { to: 12, l: "Business types with their own setup" },
  { raw: "GST", l: "And non-GST invoices" },
  { raw: "Offline", l: "First, syncs when you reconnect" },
  { raw: "Excel", l: "Import and export your data" },
];

export default function Coverage() {
  return (
    <section className="section section--wash">
      <div className="wrap artsplit">
        <div>
          <Reveal>
            <span className="eyebrow">Built for Indian business</span>
            <h2>From corner shops to growing factories</h2>
            <p className="lead">
              Local language support, offline-first billing and features shaped around how Indian
              business owners actually work through their day.
            </p>
          </Reveal>

          <div className="statgrid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            {stats.map((s, i) => (
              <Reveal key={s.l} delay={i * 90}>
                <b>{s.raw ? s.raw : <Counter to={s.to} />}</b>
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
