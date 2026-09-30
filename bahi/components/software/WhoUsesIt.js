// ===========================================================================
// SECTION 5  -  who this is for
// ===========================================================================

import MenuIcon from "@/components/MenuIcon";

export default function WhoUsesIt({ who }) {
  return (
    <section className="section section--wash">
      <div className="wrap">
        <span className="eyebrow">Who it is for</span>
        <h2>{who.h2}</h2>
        <p className="lead">{who.lead}</p>

        <ul className="sw-who">
          {who.items.map(([icon, t, d]) => (
            <li key={t}>
              <span className="sw-who__icon">
                <MenuIcon name={icon} />
              </span>
              <div>
                <strong>{t}</strong>
                <p>{d}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
