// ===========================================================================
// ABOUT PAGE ARTWORK
// ---------------------------------------------------------------------------
// These are SVG drawings written in code, not photos. The advantages:
//   - nothing to download, so the page stays light
//   - they use the site's own colour tokens, so they match the theme
//   - they stay sharp at any screen size
//
// Each section in content.js has an  art: "..."  field, and that name picks
// the drawing. The full list is at the bottom, in Art().
//
// To use a REAL PHOTO in a section instead, set that section's
// img: "/my-photo.png"  in content.js and the photo replaces the drawing.
// ===========================================================================

/* --- 1. India coverage map ------------------------------------------- */
export function MapArt() {
  // A very simple India outline - not an accurate map, just a recognisable shape
  const india =
    "M62 18 78 6 96 20 120 26 150 30 162 44 184 40 190 58 172 62 166 78 " +
    "150 74 146 96 132 104 126 90 118 110 112 140 100 176 92 214 76 190 " +
    "64 150 52 120 38 102 16 96 28 78 20 60 44 40Z";

  return (
    <svg className="art" viewBox="0 0 420 300" role="img" aria-label="Businesses across India">
      <circle className="art__blob" cx="330" cy="62" r="54" fill="var(--wash)" />
      <g transform="translate(112 26)">
        <path d={india} fill="#fff" stroke="var(--ink)" strokeWidth="3" strokeLinejoin="round" />
        <path d={india} fill="var(--wash)" opacity=".5" />
        <g>
          <Pin x={80} y={54} />
          <Pin x={56} y={128} />
          <Pin x={142} y={92} />
          <Pin x={86} y={182} />
        </g>
        <circle className="art__pulse" cx="106" cy="168" r="16" fill="var(--marigold)" opacity=".3" />
        <g className="art__float">
          <Pin x={106} y={168} color="var(--marigold)" big />
        </g>
      </g>
    </svg>
  );
}

function Pin({ x, y, color = "var(--ledger)", big = false }) {
  const s = big ? 1.35 : 1;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0-18c7 0 13 6 13 13 0 9-13 23-13 23S-13 4-13-5c0-7 6-13 13-13z" fill={color} />
      <circle cy="-5" r="5" fill="#fff" />
    </g>
  );
}

/* --- 2. Laptop + phone sync ------------------------------------------ */
export function DevicesArt() {
  return (
    <svg className="art" viewBox="0 0 420 300" role="img" aria-label="Laptop and phone staying in sync">
      <circle className="art__blob" cx="80" cy="70" r="52" fill="var(--wash)" />
      <rect x="50" y="78" width="212" height="132" rx="10" fill="#fff" stroke="var(--ink)" strokeWidth="3" />
      <rect x="64" y="92" width="184" height="104" rx="5" fill="var(--wash)" />
      <g stroke="var(--ledger)" strokeWidth="6" strokeLinecap="round">
        <path d="M82 116h86M82 138h122M82 160h64" />
      </g>
      <path d="M32 210h248l14 22H18z" fill="#fff" stroke="var(--ink)" strokeWidth="3" strokeLinejoin="round" />
      <rect x="296" y="96" width="84" height="150" rx="14" fill="#fff" stroke="var(--ink)" strokeWidth="3" />
      <rect x="306" y="112" width="64" height="112" rx="6" fill="var(--wash)" />
      <g stroke="var(--ledger)" strokeWidth="5" strokeLinecap="round">
        <path d="M318 132h40M318 150h30M318 168h40" />
      </g>
      <rect x="318" y="188" width="40" height="18" rx="9" fill="var(--marigold)" />
      <g className="art__float">
        <path
          d="M264 132c22-14 22 38 0 24"
          fill="none"
          stroke="var(--ledger)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="7 7"
        />
        <circle cx="282" cy="144" r="13" fill="var(--ledger)" />
        <path d="M276 144l4 5 8-9" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

/* --- 3. GST invoice screen ------------------------------------------- */
export function InvoiceArt() {
  return (
    <svg className="art" viewBox="0 0 420 300" role="img" aria-label="A GST invoice being created">
      <circle className="art__blob" cx="344" cy="76" r="52" fill="var(--wash)" />
      <rect x="86" y="30" width="230" height="244" rx="12" fill="#fff" stroke="var(--ink)" strokeWidth="3" />
      <rect x="86" y="30" width="230" height="46" rx="12" fill="var(--ledger)" />
      <rect x="104" y="46" width="70" height="8" rx="4" fill="#fff" opacity=".9" />
      <rect x="104" y="60" width="42" height="6" rx="3" fill="#fff" opacity=".55" />
      <rect x="262" y="46" width="36" height="20" rx="6" fill="var(--marigold)" />
      <g stroke="var(--wash)" strokeWidth="2">
        <path d="M104 106h194M104 136h194M104 166h194M104 196h194" />
      </g>
      <g fill="var(--ink)" opacity=".75">
        <rect x="104" y="94" width="76" height="7" rx="3.5" />
        <rect x="104" y="124" width="96" height="7" rx="3.5" />
        <rect x="104" y="154" width="64" height="7" rx="3.5" />
        <rect x="104" y="184" width="88" height="7" rx="3.5" />
      </g>
      <g fill="var(--ledger)">
        <rect x="248" y="94" width="50" height="7" rx="3.5" />
        <rect x="248" y="124" width="50" height="7" rx="3.5" />
        <rect x="248" y="154" width="50" height="7" rx="3.5" />
        <rect x="248" y="184" width="50" height="7" rx="3.5" />
      </g>
      <rect x="180" y="216" width="118" height="36" rx="8" fill="var(--wash)" />
      <rect x="192" y="226" width="42" height="7" rx="3.5" fill="var(--ink)" opacity=".6" />
      <rect x="192" y="238" width="62" height="8" rx="4" fill="var(--ledger)" />
      <g className="art__float">
        <circle cx="316" cy="238" r="28" fill="var(--ledger)" />
        <path d="M303 238l8 9 17-18" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <circle className="art__pulse" cx="316" cy="238" r="10" fill="var(--marigold)" />
    </svg>
  );
}

/* --- 4. Inventory / stock screen ------------------------------------- */
export function StockArt() {
  return (
    <svg className="art" viewBox="0 0 420 300" role="img" aria-label="Stock levels on a shelf">
      <circle className="art__blob" cx="82" cy="70" r="50" fill="var(--wash)" />
      <g stroke="var(--ink)" strokeWidth="3" fill="#fff">
        <rect x="70" y="96" width="280" height="64" rx="6" />
        <rect x="70" y="176" width="280" height="64" rx="6" />
      </g>
      <g fill="var(--wash)" stroke="var(--ink)" strokeWidth="2.5">
        <rect x="86" y="112" width="44" height="32" rx="4" />
        <rect x="140" y="112" width="44" height="32" rx="4" />
        <rect x="194" y="112" width="44" height="32" rx="4" />
        <rect x="86" y="192" width="44" height="32" rx="4" />
        <rect x="140" y="192" width="44" height="32" rx="4" />
      </g>
      <rect x="248" y="112" width="86" height="32" rx="6" fill="var(--ledger)" opacity=".12" />
      <rect x="194" y="192" width="44" height="32" rx="4" fill="var(--marigold)" opacity=".28" stroke="var(--marigold)" strokeWidth="2.5" />
      <g stroke="var(--ledger)" strokeWidth="5" strokeLinecap="round">
        <path d="M262 128h58" />
        <path d="M262 208h34" />
      </g>
      <g className="art__float">
        <rect x="276" y="176" width="74" height="30" rx="15" fill="var(--marigold)" />
        <path d="M292 191h4M302 191h4M312 191h4" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
        <path d="M330 184v8M330 197v.1" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/* --- 5. POS counter --------------------------------------------------- */
export function PosArt() {
  return (
    <svg className="art" viewBox="0 0 420 300" role="img" aria-label="Fast billing at the counter">
      <circle className="art__blob" cx="330" cy="76" r="52" fill="var(--wash)" />
      <rect x="92" y="56" width="176" height="118" rx="10" fill="#fff" stroke="var(--ink)" strokeWidth="3" />
      <rect x="106" y="70" width="148" height="52" rx="5" fill="var(--ledger)" opacity=".1" />
      <g stroke="var(--ledger)" strokeWidth="5" strokeLinecap="round">
        <path d="M120 86h62M120 104h96" />
      </g>
      <g fill="var(--wash)" stroke="var(--ink)" strokeWidth="2.5">
        <rect x="106" y="132" width="40" height="26" rx="5" />
        <rect x="154" y="132" width="40" height="26" rx="5" />
        <rect x="202" y="132" width="52" height="26" rx="5" />
      </g>
      <path d="M72 174h216l16 34H56z" fill="#fff" stroke="var(--ink)" strokeWidth="3" strokeLinejoin="round" />
      <g className="art__float">
        <rect x="264" y="126" width="94" height="128" rx="8" fill="#fff" stroke="var(--ink)" strokeWidth="3" />
        <path d="M264 126q47-22 94 0" fill="#fff" stroke="var(--ink)" strokeWidth="3" />
        <g stroke="var(--ink)" strokeWidth="4" strokeLinecap="round" opacity=".7">
          <path d="M282 156h58M282 174h58M282 192h36" />
        </g>
        <rect x="282" y="214" width="58" height="10" rx="5" fill="var(--marigold)" />
      </g>
    </svg>
  );
}

/* --- 6. Reports ------------------------------------------------------- */
export function ReportArt() {
  return (
    <svg className="art" viewBox="0 0 420 300" role="img" aria-label="Business reports and charts">
      <circle className="art__blob" cx="78" cy="72" r="50" fill="var(--wash)" />
      <rect x="66" y="52" width="288" height="196" rx="12" fill="#fff" stroke="var(--ink)" strokeWidth="3" />
      <rect x="66" y="52" width="288" height="38" rx="12" fill="var(--wash)" />
      <rect x="86" y="66" width="72" height="9" rx="4.5" fill="var(--ink)" opacity=".6" />
      <g stroke="var(--wash)" strokeWidth="2">
        <path d="M96 212h248M96 176h248M96 140h248" />
      </g>
      <g fill="var(--ledger)">
        <rect x="112" y="150" width="26" height="62" rx="5" />
        <rect x="158" y="124" width="26" height="88" rx="5" />
        <rect x="250" y="136" width="26" height="76" rx="5" />
      </g>
      <rect x="204" y="106" width="26" height="106" rx="5" fill="var(--marigold)" />
      <rect x="296" y="160" width="26" height="52" rx="5" fill="var(--ledger)" opacity=".45" />
      <path d="M96 218h252" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" />
      <g className="art__float">
        <path
          d="M110 188l48-34 46 22 48-40 46 20"
          fill="none"
          stroke="var(--ink)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="6 6"
        />
        <circle cx="298" cy="156" r="8" fill="var(--ink)" />
      </g>
    </svg>
  );
}

/* --- 7. Setup in 4 steps --------------------------------------------- */
export function SetupArt() {
  return (
    <svg className="art" viewBox="0 0 420 300" role="img" aria-label="Setting up in four steps">
      <circle className="art__blob" cx="336" cy="72" r="50" fill="var(--wash)" />
      <path
        d="M56 210c34-56 74-56 108 0s74 56 108 0 74-56 92-18"
        fill="none"
        stroke="var(--wash)"
        strokeWidth="16"
        strokeLinecap="round"
      />
      {[
        [60, 202, "var(--ledger)"],
        [164, 202, "var(--ledger)"],
        [268, 202, "var(--ledger)"],
        [356, 180, "var(--marigold)"],
      ].map(([cx, cy, fill], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r="24" fill={fill} />
          <text
            x={cx}
            y={cy + 7}
            textAnchor="middle"
            fill="#fff"
            fontSize="20"
            fontWeight="700"
            fontFamily="system-ui, sans-serif"
          >
            {i + 1}
          </text>
        </g>
      ))}
      <g className="art__float">
        <rect x="128" y="52" width="164" height="96" rx="10" fill="#fff" stroke="var(--ink)" strokeWidth="3" />
        <g stroke="var(--ledger)" strokeWidth="6" strokeLinecap="round">
          <path d="M148 80h84M148 102h110M148 124h62" />
        </g>
      </g>
    </svg>
  );
}

/* --- 8. Online store on a phone --------------------------------------- */
export function StoreArt() {
  return (
    <svg className="art" viewBox="0 0 420 300" role="img" aria-label="Your own online store">
      <circle className="art__blob" cx="90" cy="76" r="52" fill="var(--wash)" />
      <rect x="150" y="30" width="122" height="240" rx="18" fill="#fff" stroke="var(--ink)" strokeWidth="3" />
      <rect x="162" y="52" width="98" height="196" rx="8" fill="var(--wash)" />
      <rect x="188" y="38" width="46" height="6" rx="3" fill="var(--ink)" opacity=".3" />
      <g fill="#fff" stroke="var(--ink)" strokeWidth="2.5">
        <rect x="174" y="66" width="36" height="42" rx="5" />
        <rect x="216" y="66" width="36" height="42" rx="5" />
        <rect x="174" y="120" width="36" height="42" rx="5" />
        <rect x="216" y="120" width="36" height="42" rx="5" />
      </g>
      <g fill="var(--ledger)" opacity=".35">
        <rect x="180" y="92" width="24" height="6" rx="3" />
        <rect x="222" y="92" width="24" height="6" rx="3" />
        <rect x="180" y="146" width="24" height="6" rx="3" />
        <rect x="222" y="146" width="24" height="6" rx="3" />
      </g>
      <rect x="174" y="176" width="78" height="22" rx="11" fill="var(--ledger)" />
      <rect x="174" y="208" width="78" height="10" rx="5" fill="var(--ink)" opacity=".15" />
      <g className="art__float">
        <circle cx="308" cy="108" r="30" fill="var(--marigold)" />
        <path
          d="M296 98h4l4 16h14l4-11"
          fill="none"
          stroke="#fff"
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="306" cy="121" r="2.6" fill="#fff" />
        <circle cx="317" cy="121" r="2.6" fill="#fff" />
      </g>
      <circle className="art__pulse" cx="308" cy="108" r="12" fill="var(--ledger)" opacity=".3" />
    </svg>
  );
}

/* --- 9. Languages ----------------------------------------------------- */
export function LangArt() {
  return (
    <svg className="art" viewBox="0 0 420 300" role="img" aria-label="Support in many Indian languages">
      <circle className="art__blob" cx="338" cy="78" r="52" fill="var(--wash)" />
      <Bubble x={56} y={54} w={150} h={62} fill="#fff" tail="left">
        अ
      </Bubble>
      <Bubble x={224} y={96} w={140} h={62} fill="var(--wash)" tail="right">
        க
      </Bubble>
      <Bubble x={40} y={148} w={140} h={62} fill="var(--wash)" tail="left">
        ব
      </Bubble>
      <g className="art__float">
        <Bubble x={200} y={188} w={162} h={66} fill="var(--ledger)" tail="right" light>
          ગ
        </Bubble>
      </g>
    </svg>
  );
}

function Bubble({ x, y, w, h, fill, tail, light, children }) {
  const txt = light ? "#fff" : "var(--ledger)";
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={16} fill={fill} stroke="var(--ink)" strokeWidth="3" />
      <path
        d={tail === "left" ? `M${x + 24} ${y + h}l0 18-20-18z` : `M${x + w - 24} ${y + h}l0 18 20-18z`}
        fill={fill}
        stroke="var(--ink)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <text
        x={x + 22}
        y={y + h / 2 + 11}
        fill={txt}
        fontSize="30"
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
      >
        {children}
      </text>
      <g stroke={light ? "#fff" : "var(--ink)"} strokeWidth="5" strokeLinecap="round" opacity=".45">
        <path d={`M${x + 62} ${y + h / 2 - 8}h${w - 84}`} />
        <path d={`M${x + 62} ${y + h / 2 + 8}h${w - 108}`} />
      </g>
    </g>
  );
}

/* --- 10. Mobile app --------------------------------------------------- */
export function AppArt() {
  return (
    <svg className="art" viewBox="0 0 420 300" role="img" aria-label="The Galla app on a phone">
      <circle className="art__blob" cx="92" cy="80" r="56" fill="var(--wash)" />
      <rect x="146" y="22" width="130" height="256" rx="20" fill="#fff" stroke="var(--ink)" strokeWidth="3" />
      <rect x="158" y="46" width="106" height="208" rx="8" fill="var(--wash)" />
      <rect x="186" y="31" width="50" height="6" rx="3" fill="var(--ink)" opacity=".3" />
      <rect x="170" y="58" width="82" height="34" rx="8" fill="var(--ledger)" />
      <rect x="180" y="68" width="38" height="6" rx="3" fill="#fff" opacity=".85" />
      <rect x="180" y="79" width="24" height="5" rx="2.5" fill="#fff" opacity=".5" />
      <g fill="#fff" stroke="var(--ink)" strokeWidth="2">
        <rect x="170" y="102" width="38" height="38" rx="8" />
        <rect x="214" y="102" width="38" height="38" rx="8" />
        <rect x="170" y="148" width="38" height="38" rx="8" />
        <rect x="214" y="148" width="38" height="38" rx="8" />
      </g>
      <g fill="var(--ledger)" opacity=".5">
        <rect x="180" y="117" width="18" height="6" rx="3" />
        <rect x="224" y="117" width="18" height="6" rx="3" />
        <rect x="180" y="163" width="18" height="6" rx="3" />
        <rect x="224" y="163" width="18" height="6" rx="3" />
      </g>
      <rect x="170" y="198" width="82" height="26" rx="13" fill="var(--marigold)" />
      <g className="art__float">
        <circle cx="318" cy="180" r="34" fill="var(--ledger)" />
        <path d="M318 166v26M308 183l10 10 10-10" fill="none" stroke="#fff" strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M304 204h28" stroke="#fff" strokeWidth="4.4" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/* --- 11. Story avatar, used until a real photo is added --------------- */
export function AvatarArt({ initial = "G" }) {
  return (
    <svg className="art ab-avatar" viewBox="0 0 200 200" role="img" aria-label="Customer">
      <circle cx="100" cy="100" r="92" fill="var(--wash)" />
      <circle cx="100" cy="82" r="34" fill="var(--ledger)" opacity=".2" />
      <path d="M40 176c8-34 30-50 60-50s52 16 60 50z" fill="var(--ledger)" opacity=".2" />
      <text
        x="100"
        y="118"
        textAnchor="middle"
        fill="var(--ledger)"
        fontSize="72"
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
      >
        {initial}
      </text>
    </svg>
  );
}

/* ===========================================================================
   Names you can use in content.js as  art: "..."
   =========================================================================== */
export default function Art({ name, initial }) {
  switch (name) {
    case "map":
      return <MapArt />;
    case "devices":
      return <DevicesArt />;
    case "invoice":
      return <InvoiceArt />;
    case "stock":
      return <StockArt />;
    case "pos":
      return <PosArt />;
    case "report":
      return <ReportArt />;
    case "setup":
      return <SetupArt />;
    case "store":
      return <StoreArt />;
    case "langs":
      return <LangArt />;
    case "app":
      return <AppArt />;
    case "avatar":
      return <AvatarArt initial={initial} />;
    default:
      return <InvoiceArt />;
  }
}
