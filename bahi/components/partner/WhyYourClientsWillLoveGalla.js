// ===========================================================================
// SECTION 4  -  "Why Your Clients Will Love Galla?"
// ---------------------------------------------------------------------------
// This is the design from the screenshot:
//   - a small rounded pill above the heading (PRODUCT CONFIDENCE)
//   - heading where the second half is highlighted and underlined
//   - a centred sub-line
//   - four cards, each with a small UI mockup on a tinted panel at the top
//     and the title plus description below it
//   - a centred button under the row
//
// The mockups are drawn in Art.js (cardInvoice, cardGstr, cardShare,
// cardError). To swap one for a real screenshot, set that card's
// img: "/my-shot.png" in content.js.
// ===========================================================================

import Link from "next/link";
import Reveal from "@/components/Reveal";
import Shot from "./Shot";

export default function WhyYourClientsWillLoveGalla({ product }) {
  const [head, highlight] = product.h2;

  return (
    <section className="section pt-product">
      <div className="wrap">
        <Reveal className="center">
          <span className="pt-pill">{product.eyebrow}</span>
          <h2 className="pt-product__h2">
            {head}
            <span className="pt-mark">{highlight}</span>
          </h2>
          <p className="lead">{product.lead}</p>
        </Reveal>

        <div className="pt-cards">
          {product.items.map((it, i) => (
            <Reveal key={it.title} delay={i * 90}>
              <article className="pt-card">
                <div className="pt-card__shot">
                  <Shot src={it.img} art={it.art} label={it.imgLabel} alt={it.title} />
                </div>
                <h3>{it.title}</h3>
                <p>{it.text}</p>
              </article>
            </Reveal>
          ))}
        </div>

        {product.cta && (
          <div className="center pt-cards__cta">
            <Link href={product.cta[1]} className="btn btn--primary">
              {product.cta[0]}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
