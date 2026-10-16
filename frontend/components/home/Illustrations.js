// Original SVG illustrations. Colors CSS variables se aate hain, isliye theme ke saath match rehte hain.

export function ShopArt() {
  return (
    <svg
      className="art"
      viewBox="0 0 420 320"
      role="img"
      aria-label="A small shop with a billing counter"
    >
      <defs>
        <linearGradient id="awn" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--ledger)" />
          <stop offset="1" stopColor="var(--ledger-dark)" />
        </linearGradient>
      </defs>
      <circle
        className="art__blob"
        cx="330"
        cy="70"
        r="58"
        fill="var(--wash)"
      />
      <rect
        x="40"
        y="90"
        width="300"
        height="190"
        rx="10"
        fill="#fff"
        stroke="var(--ink)"
        strokeWidth="3"
      />
      <path d="M30 90h320l-18-42H48z" fill="url(#awn)" />
      <g fill="var(--marigold)">
        <rect x="48" y="90" width="34" height="14" rx="4" />
        <rect x="116" y="90" width="34" height="14" rx="4" />
        <rect x="184" y="90" width="34" height="14" rx="4" />
        <rect x="252" y="90" width="34" height="14" rx="4" />
      </g>
      <rect
        x="66"
        y="128"
        width="112"
        height="76"
        rx="6"
        fill="var(--wash)"
        stroke="var(--line)"
        strokeWidth="2"
      />
      <g
        className="art__shelf"
        stroke="var(--ledger)"
        strokeWidth="6"
        strokeLinecap="round"
      >
        <path d="M80 150h40M80 168h84M80 186h56" />
      </g>
      <rect
        x="206"
        y="150"
        width="108"
        height="54"
        rx="6"
        fill="#fff"
        stroke="var(--ink)"
        strokeWidth="3"
      />
      <path
        d="M218 166h60M218 180h44"
        stroke="var(--ink-soft)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <rect x="60" y="222" width="260" height="34" rx="8" fill="var(--ink)" />
      <rect
        x="86"
        y="232"
        width="64"
        height="14"
        rx="4"
        fill="var(--marigold)"
      />
      <circle
        className="art__coin"
        cx="286"
        cy="239"
        r="9"
        fill="var(--marigold)"
      />
      <g className="art__float">
        <rect
          x="248"
          y="40"
          width="120"
          height="66"
          rx="10"
          fill="#fff"
          stroke="var(--ink)"
          strokeWidth="3"
        />
        <path
          d="M264 62h62M264 76h44M264 90h30"
          stroke="var(--ledger)"
          strokeWidth="6"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

export function SyncArt() {
  return (
    <svg
      className="art"
      viewBox="0 0 420 300"
      role="img"
      aria-label="A phone and a laptop syncing data"
    >
      <circle className="art__blob" cx="90" cy="70" r="62" fill="var(--wash)" />
      <rect
        x="196"
        y="76"
        width="188"
        height="122"
        rx="10"
        fill="#fff"
        stroke="var(--ink)"
        strokeWidth="3"
      />
      <rect x="210" y="90" width="160" height="94" rx="6" fill="var(--wash)" />
      <g className="art__bars">
        <rect
          x="226"
          y="140"
          width="18"
          height="34"
          rx="3"
          fill="var(--ledger)"
        />
        <rect
          x="254"
          y="126"
          width="18"
          height="48"
          rx="3"
          fill="var(--ledger)"
          opacity=".7"
        />
        <rect
          x="282"
          y="112"
          width="18"
          height="62"
          rx="3"
          fill="var(--ledger)"
          opacity=".85"
        />
        <rect
          x="310"
          y="100"
          width="18"
          height="74"
          rx="3"
          fill="var(--marigold)"
        />
      </g>
      <path d="M176 210h228l16 22H160z" fill="var(--ink)" />
      <rect x="44" y="104" width="94" height="150" rx="16" fill="var(--ink)" />
      <rect x="53" y="118" width="76" height="122" rx="8" fill="#fff" />
      <rect x="53" y="118" width="76" height="22" rx="8" fill="var(--ledger)" />
      <path
        d="M64 156h54M64 172h38M64 188h46"
        stroke="var(--ink-soft)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <rect
        x="64"
        y="206"
        width="54"
        height="18"
        rx="9"
        fill="var(--marigold)"
      />
      <g
        className="art__sync"
        stroke="var(--ledger)"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      >
        <path d="M148 150c24-26 30-26 44 0" />
        <path d="M186 144l8 8-9 7" />
        <path d="M192 184c-24 26-30 26-44 0" />
        <path d="M154 190l-8-8 9-7" />
      </g>
    </svg>
  );
}

export function GrowthArt() {
  return (
    <svg
      className="art"
      viewBox="0 0 420 300"
      role="img"
      aria-label="A growth chart with rising sales"
    >
      <circle
        className="art__blob"
        cx="330"
        cy="230"
        r="66"
        fill="var(--wash)"
      />
      <rect
        x="40"
        y="40"
        width="330"
        height="200"
        rx="12"
        fill="#fff"
        stroke="var(--ink)"
        strokeWidth="3"
      />
      <path d="M40 76h330" stroke="var(--line)" strokeWidth="3" />
      <circle cx="62" cy="58" r="6" fill="var(--marigold)" />
      <circle cx="82" cy="58" r="6" fill="var(--line)" />
      <path
        className="art__line"
        d="M70 200l60-38 56 22 62-62 68-30"
        fill="none"
        stroke="var(--ledger)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <g fill="var(--ledger)">
        <circle cx="130" cy="162" r="7" />
        <circle cx="186" cy="184" r="7" />
        <circle cx="248" cy="122" r="7" />
      </g>
      <circle
        className="art__pulse"
        cx="316"
        cy="92"
        r="10"
        fill="var(--marigold)"
      />
      <g className="art__float">
        <rect
          x="236"
          y="182"
          width="126"
          height="54"
          rx="10"
          fill="var(--ink)"
        />
        <path
          d="M252 202h46M252 216h72"
          stroke="#fff"
          strokeWidth="5"
          strokeLinecap="round"
          opacity=".85"
        />
      </g>
    </svg>
  );
}
