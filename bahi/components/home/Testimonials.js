import Reveal from "@/components/Reveal";

const stories = [
  {
    q: "We moved off paper bills last year. GST billing, barcode billing and stock all sit in one place now.",
    who: "Ankit Kumar",
    role: "Gift shop owner, Kanpur",
    stat: "80%",
    statLabel: "less manual work",
  },
  {
    q: "Three years in, and I run two branches from one login. Item tracking alone saves me a full day a month.",
    who: "Raghu Nair",
    role: "KJV Technologies, Kochi",
    stat: "100%",
    statLabel: "accurate GST totals",
  },
];

export default function Testimonials() {
  return (
    <section className="section">
      <div className="wrap">
        <Reveal>
          <span className="eyebrow">Customer stories</span>
          <h2>Why small business owners switch</h2>
        </Reveal>

        <div className="stories">
          {stories.map((s, i) => (
            <Reveal key={s.who} delay={i * 120}>
              <figure className="story">
                <div className="story__stat">
                  <b>{s.stat}</b>
                  <small>{s.statLabel}</small>
                </div>
                <blockquote>{s.q}</blockquote>
                <figcaption>
                  <b>{s.who}</b>
                  <small>{s.role}</small>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
