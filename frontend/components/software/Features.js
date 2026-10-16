// ===========================================================================
// SECTION 3  -  the six feature cards
// Locked to 3 columns so six cards land 3 + 3 rather than 4 + 2.
// ===========================================================================

import MenuIcon from "@/components/MenuIcon";

export default function Features({ f }) {
  return (
    <section className="section section--wash">
      <div className="wrap">
        <span className="eyebrow">What you get</span>
        <h2>{f.h2}</h2>
        <p className="lead">{f.lead}</p>

        <div className="sw-trio">
          {f.items.map(([icon, t, d], i) => (
            <article className="fcard sw-card" key={t} style={{ "--i": i }}>
              <span className="fcard__icon">
                <MenuIcon name={icon} />
              </span>
              <h3>{t}</h3>
              <p>{d}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
