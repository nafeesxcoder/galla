import Link from "next/link";
import Reveal from "@/components/Reveal";

export default function Related({ related }) {
  return (
    <section className="section section--wash">
      <div className="wrap">
        <Reveal>
          <h2>{related.h2}</h2>
        </Reveal>
        <div className="fgrid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))" }}>
          {related.items.map(([t, href, d], i) => (
            <Reveal key={t} delay={(i % 3) * 70}>
              <Link href={href} className="icard">
                <h3>{t}</h3>
                <p>{d}</p>
                <span className="icard__go">Learn more &rarr;</span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
