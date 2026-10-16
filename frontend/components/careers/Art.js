// ===========================================================================
// CAREERS PAGE ARTWORK
// ---------------------------------------------------------------------------
// The illustration beside the hero, drawn in code.
// To use a real team photo instead, set  hero.img: "/team.jpg"  in content.js
// ===========================================================================

export default function Art() {
  return (
    <svg className="art" viewBox="0 0 420 300" role="img" aria-label="People building software together">
      <circle className="art__blob" cx="330" cy="70" r="56" fill="var(--wash)" />

      {/* desk */}
      <path d="M44 232h332" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" />
      <path d="M78 232v28M342 232v28" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" opacity=".5" />

      {/* laptop, left */}
      <rect x="92" y="150" width="104" height="66" rx="7" fill="#fff" stroke="var(--ink)" strokeWidth="3" />
      <rect x="102" y="160" width="84" height="46" rx="4" fill="var(--wash)" />
      <g stroke="var(--ledger)" strokeWidth="4" strokeLinecap="round">
        <path d="M112 172h44M112 184h58M112 196h32" />
      </g>
      <path d="M82 216h124l8 16H74z" fill="#fff" stroke="var(--ink)" strokeWidth="3" strokeLinejoin="round" />

      {/* board, right */}
      <rect x="226" y="122" width="118" height="94" rx="8" fill="#fff" stroke="var(--ink)" strokeWidth="3" />
      <g fill="var(--wash)" stroke="var(--ink)" strokeWidth="2">
        <rect x="240" y="136" width="40" height="28" rx="4" />
        <rect x="290" y="136" width="40" height="28" rx="4" />
        <rect x="240" y="174" width="40" height="28" rx="4" />
      </g>
      <rect x="290" y="174" width="40" height="28" rx="4" fill="var(--marigold)" opacity=".45" stroke="var(--marigold)" strokeWidth="2" />

      {/* two people */}
      <g>
        <circle cx="144" cy="112" r="17" fill="var(--ledger)" opacity=".85" />
        <path d="M116 150c3-20 13-30 28-30s25 10 28 30z" fill="var(--ledger)" opacity=".85" />
      </g>
      <g>
        <circle cx="286" cy="86" r="15" fill="var(--marigold)" opacity=".9" />
        <path d="M262 122c3-18 11-27 24-27s21 9 24 27z" fill="var(--marigold)" opacity=".9" />
      </g>

      {/* idea bubble */}
      <g className="art__float">
        <circle cx="70" cy="86" r="26" fill="#fff" stroke="var(--ink)" strokeWidth="3" />
        <path d="M63 92c-4-10 1-18 7-18s11 8 7 18z" fill="none" stroke="var(--marigold)" strokeWidth="3" strokeLinejoin="round" />
        <path d="M65 96h10M67 101h6" stroke="var(--marigold)" strokeWidth="3" strokeLinecap="round" />
      </g>
    </svg>
  );
}
