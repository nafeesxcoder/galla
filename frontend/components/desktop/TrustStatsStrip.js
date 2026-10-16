// ===========================================================================
// SECTION 2  -  the stat strip just under the hero
// content.js -> stats
// IMAGE: none (icons only)
// ===========================================================================

import MenuIcon from "@/components/MenuIcon";

export default function TrustStatsStrip({ stats }) {
  return (
    <div className="wrap">
      <ul className="dk-strip">
        {stats.items.map(([big, small, icon]) => (
          <li key={big}>
            <span className="dk-strip__icon">
              <MenuIcon name={icon} />
            </span>
            <span>
              <strong>{big}</strong>
              <em>{small}</em>
            </span>
          </li>
        ))}
      </ul>
      {stats.note && <p className="dk-strip__note">{stats.note}</p>}
    </div>
  );
}
