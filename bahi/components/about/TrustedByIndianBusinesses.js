// ===========================================================================
// SECTION 2  -  TRUST STRIP (the bar straight under the hero)
// Text: "GST-Ready Billing", "Secure Data Protection" ...
// IMAGE: none (icons only)
// ===========================================================================

import MenuIcon from "@/components/MenuIcon";

export default function TrustedByIndianBusinesses({ trustStrip }) {
  return (
    <div className="wrap">
      <ul className="ab-strip">
        {trustStrip.items.map(([t, icon]) => (
          <li key={t}>
            <span className="ab-strip__icon">
              <MenuIcon name={icon} />
            </span>
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}
