import Reveal from "@/components/Reveal";
import { GrowthArt } from "./Illustrations";

const points = [
  ["Sell online", "Share a store link on WhatsApp and take orders without building a website."],
  ["Talk to customers", "Send offers, order updates and festival greetings to your whole party list."],
  ["Know your numbers", "Daily sales, top items and slow stock in one screen before you shut the shop."],
];

export default function GrowthSection() {
  return (
    <section className="section">
      <div className="wrap artsplit">
        <div>
          <Reveal>
            <span className="eyebrow">Grow, not just bill</span>
            <h2>Billing is day one. Growth is what follows.</h2>
            <p className="lead">
              Once your items and parties are in, the same data drives your reports, your reminders
              and your marketing.
            </p>
          </Reveal>

          <ul className="checklist" style={{ marginTop: "1.6rem" }}>
            {points.map(([t, d], i) => (
              <Reveal as="li" key={t} delay={i * 90}>
                <b>{t}</b> &mdash; <span style={{ color: "var(--ink-soft)" }}>{d}</span>
              </Reveal>
            ))}
          </ul>
        </div>

        <Reveal className="artsplit__art" delay={150}><GrowthArt /></Reveal>
      </div>
    </section>
  );
}
