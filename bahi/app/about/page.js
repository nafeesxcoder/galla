import { pageMeta } from "@/lib/seo";
import CtaBand from "@/components/CtaBand";
import { SITE } from "@/lib/site";

export const metadata = pageMeta({
  title: "About us",
  description:
    "Why we build simple GST billing software for Indian small businesses, and how the product has grown.",
  path: "/about",
});

const timeline = [
  ["2019", "Started with one grocery store's billing problem."],
  ["2021", "Android app launched. First 10,000 users."],
  ["2023", "Desktop app and GST e-invoice support."],
  ["2025", "2 lakh+ businesses across 18 states."],
];

export default function About() {
  return (
    <>
      <section className="page-head">
        <div className="wrap">
          <h1>We make accounts simple for small businesses</h1>
          <p className="lead">{SITE.name} exists so every shop owner can understand their own accounts, with or without an accountant.</p>
        </div>
      </section>
      <section className="section">
        <div className="wrap split">
          <div>
            <h2>Our story</h2>
            <p className="lead">
              The bahi-khata has been the backbone of Indian business for centuries. We brought that same honest,
              simple ledger to phones and computers, with GST built in.
            </p>
          </div>
          <ol className="steps" style={{ gridTemplateColumns: "1fr", marginTop: 0 }}>
            {timeline.map(([y, t]) => <li key={y}><h3>{y}</h3><p>{t}</p></li>)}
          </ol>
        </div>
      </section>
      <section className="section section--wash">
        <div className="wrap">
          <h2>What we stand for</h2>
          <div className="features">
            <div className="feature"><h3>Plain language</h3><p>No accounting jargon, just the words you use every day.</p></div>
            <div className="feature"><h3>Fair prices</h3><p>Pricing that fits a small business budget.</p></div>
            <div className="feature"><h3>Support nearby</h3><p>Phone and WhatsApp support in Hindi and English.</p></div>
          </div>
        </div>
      </section>
      <CtaBand />
    </>
  );
}

