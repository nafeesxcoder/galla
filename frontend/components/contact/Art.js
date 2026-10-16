// ===========================================================================
// CONTACT PAGE ARTWORK
// ---------------------------------------------------------------------------
// The support illustration next to the "Contact Us" heading, drawn in code.
// To use a real image instead, set  hero.img: "/my-image.png"  in content.js
// ===========================================================================

export function SupportArt() {
  return (
    <svg className="art" viewBox="0 0 420 300" role="img" aria-label="Get in touch with our support team">
      {/* soft blob behind everything */}
      <path
        d="M96 62c46-34 132-42 186-14 52 27 76 86 54 132-22 45-88 74-152 70-64-3-126-38-134-84-8-45 30-84 46-104z"
        fill="var(--wash)"
      />

      {/* desk line */}
      <path d="M52 236h316" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" opacity=".25" />

      {/* office block */}
      <rect x="168" y="120" width="112" height="116" rx="8" fill="#fff" stroke="var(--ink)" strokeWidth="3" />
      <rect x="168" y="120" width="112" height="22" rx="8" fill="var(--ledger)" />
      <g fill="var(--wash)" stroke="var(--ink)" strokeWidth="2">
        <rect x="182" y="156" width="26" height="22" rx="3" />
        <rect x="216" y="156" width="26" height="22" rx="3" />
        <rect x="250" y="156" width="16" height="22" rx="3" />
        <rect x="182" y="190" width="26" height="22" rx="3" />
        <rect x="216" y="190" width="26" height="22" rx="3" />
      </g>
      <rect x="250" y="190" width="16" height="46" rx="3" fill="var(--marigold)" opacity=".5" />

      {/* the telephone handset, tilted over the top */}
      <g className="art__float">
        <g transform="translate(214 92) rotate(-32)">
          {/* the bar you hold */}
          <rect x="-56" y="-10" width="112" height="20" rx="10" fill="var(--ledger)" stroke="var(--ink)" strokeWidth="3" />
          {/* the two ends */}
          <rect x="-78" y="-27" width="36" height="54" rx="15" fill="var(--ledger)" stroke="var(--ink)" strokeWidth="3" />
          <rect x="42" y="-27" width="36" height="54" rx="15" fill="var(--ledger)" stroke="var(--ink)" strokeWidth="3" />
          {/* highlight so it does not read flat */}
          <rect x="-70" y="-18" width="20" height="18" rx="8" fill="#fff" opacity=".35" />
          <rect x="50" y="-18" width="20" height="18" rx="8" fill="#fff" opacity=".35" />
        </g>
      </g>

      {/* signal arcs */}
      <g stroke="var(--marigold)" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".8">
        <path d="M286 62a26 26 0 0 1 22 22" />
        <path d="M290 44a44 44 0 0 1 38 38" />
      </g>

      {/* two small people */}
      <g>
        <circle cx="104" cy="186" r="11" fill="var(--ledger)" opacity=".35" />
        <path d="M86 236c2-18 9-28 18-28s16 10 18 28z" fill="var(--ledger)" opacity=".35" />
      </g>
      <g>
        <circle cx="334" cy="196" r="9" fill="var(--marigold)" opacity=".55" />
        <path d="M319 236c2-15 7-24 15-24s13 9 15 24z" fill="var(--marigold)" opacity=".55" />
      </g>

      {/* little chat bubble */}
      <g className="art__float">
        <rect x="58" y="118" width="62" height="40" rx="10" fill="#fff" stroke="var(--ink)" strokeWidth="3" />
        <path d="M74 158l0 14-14-14z" fill="#fff" stroke="var(--ink)" strokeWidth="3" strokeLinejoin="round" />
        <g stroke="var(--ledger)" strokeWidth="4" strokeLinecap="round">
          <path d="M72 132h34M72 144h22" />
        </g>
      </g>
    </svg>
  );
}

export default function Art() {
  return <SupportArt />;
}
