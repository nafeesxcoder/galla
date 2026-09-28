// ===========================================================================
// PARTNER PAGE ARTWORK
// ---------------------------------------------------------------------------
// SVG drawings written in code. content.js picks one with  art: "..."
// The full list of names is at the bottom, in Art().
// To use a real photo instead, set  img: "/my-photo.png"  in content.js.
// ===========================================================================

/* --- CA partner dashboard --------------------------------------------- */
export function CaArt() {
  return (
    <svg className="art" viewBox="0 0 420 300" role="img" aria-label="Partner dashboard with earnings">
      <circle className="art__blob" cx="350" cy="62" r="52" fill="var(--wash)" />

      {/* laptop */}
      <rect x="54" y="52" width="252" height="156" rx="10" fill="#fff" stroke="var(--ink)" strokeWidth="3" />
      <rect x="68" y="66" width="224" height="128" rx="6" fill="var(--wash)" />
      <rect x="68" y="66" width="224" height="22" rx="6" fill="var(--ledger)" />
      <rect x="80" y="74" width="54" height="6" rx="3" fill="#fff" opacity=".85" />

      {/* earnings card */}
      <rect x="82" y="100" width="96" height="52" rx="8" fill="#fff" />
      <rect x="94" y="112" width="34" height="6" rx="3" fill="var(--ink)" opacity=".35" />
      <text x="94" y="140" fill="var(--ledger)" fontSize="20" fontWeight="700" fontFamily="system-ui, sans-serif">
        ₹
      </text>
      <rect x="110" y="130" width="46" height="9" rx="4.5" fill="var(--ledger)" />

      {/* mini chart */}
      <rect x="190" y="100" width="90" height="76" rx="8" fill="#fff" />
      <g fill="var(--ledger)">
        <rect x="202" y="146" width="12" height="20" rx="3" />
        <rect x="220" y="134" width="12" height="32" rx="3" />
        <rect x="256" y="126" width="12" height="40" rx="3" />
      </g>
      <rect x="238" y="116" width="12" height="50" rx="3" fill="var(--marigold)" />

      <rect x="82" y="160" width="96" height="16" rx="8" fill="var(--marigold)" opacity=".55" />
      <path d="M34 208h292l16 26H18z" fill="#fff" stroke="var(--ink)" strokeWidth="3" strokeLinejoin="round" />

      <g className="art__float">
        <circle cx="344" cy="176" r="32" fill="var(--ledger)" />
        <path d="M344 160v32M334 172l10-10 10 10" fill="none" stroke="#fff" strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <circle className="art__pulse" cx="344" cy="176" r="12" fill="var(--marigold)" />
    </svg>
  );
}

/* --- Network of referred businesses ----------------------------------- */
export function NetworkArt() {
  return (
    <svg className="art" viewBox="0 0 420 300" role="img" aria-label="Your network, connected">
      <circle className="art__blob" cx="72" cy="66" r="50" fill="var(--wash)" />
      <g stroke="var(--ledger)" strokeWidth="3" strokeDasharray="7 7" fill="none" opacity=".55">
        <path d="M210 150 96 78M210 150l114-72M210 150 96 226M210 150l114 76" />
      </g>
      {[
        [96, 78],
        [324, 78],
        [96, 226],
        [324, 226],
      ].map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r="28" fill="#fff" stroke="var(--ink)" strokeWidth="3" />
          <circle cx={cx} cy={cy - 6} r="8" fill="var(--ledger)" opacity=".35" />
          <path d={`M${cx - 13} ${cy + 16}c3-10 8-14 13-14s10 4 13 14z`} fill="var(--ledger)" opacity=".35" />
        </g>
      ))}
      <circle className="art__pulse" cx="210" cy="150" r="54" fill="var(--marigold)" opacity=".22" />
      <g className="art__float">
        <circle cx="210" cy="150" r="42" fill="var(--ledger)" />
        <path d="M194 150l10 11 22-23" fill="none" stroke="#fff" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

/* --- Avatar, used until a real photo is added -------------------------- */
export function AvatarArt({ initial = "G" }) {
  return (
    <svg className="art pt-avatar" viewBox="0 0 200 200" role="img" aria-label="Partner">
      <circle cx="100" cy="100" r="96" fill="#fff" opacity=".9" />
      <circle cx="100" cy="82" r="34" fill="var(--ledger)" opacity=".25" />
      <path d="M40 176c8-34 30-50 60-50s52 16 60 50z" fill="var(--ledger)" opacity=".25" />
      <text x="100" y="118" textAnchor="middle" fill="var(--ledger)" fontSize="70" fontWeight="700" fontFamily="system-ui, sans-serif">
        {initial}
      </text>
    </svg>
  );
}

/* ===========================================================================
   PRODUCT CARD MOCKUPS
   ---------------------------------------------------------------------------
   Small UI screenshots drawn in code, shown at the top of each card in the
   "Why Your Clients Will Love Galla" section.
   =========================================================================== */

// Shared frame so all four mockups line up the same way
function Card({ children, title, tag, tagColor = "var(--ledger)" }) {
  return (
    <svg className="art pt-cardart" viewBox="0 0 300 200" role="img" aria-label={title}>
      <rect x="8" y="8" width="284" height="184" rx="12" fill="#fff" stroke="rgba(22,32,46,.12)" strokeWidth="2" />
      {title && (
        <>
          <circle cx="26" cy="30" r="4" fill={tagColor} />
          <text x="38" y="34" fill="var(--ink)" fontSize="11" fontWeight="600" fontFamily="system-ui, sans-serif">
            {title}
          </text>
        </>
      )}
      {tag && (
        <>
          <rect x="238" y="21" width="40" height="18" rx="5" fill={tagColor} />
          <text x="258" y="34" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="700" fontFamily="system-ui, sans-serif">
            {tag}
          </text>
        </>
      )}
      {children}
    </svg>
  );
}

function Row({ y, label, value, valueColor = "var(--ink)", check }) {
  return (
    <>
      <text x="26" y={y} fill="rgba(22,32,46,.62)" fontSize="10.5" fontFamily="system-ui, sans-serif">
        {label}
      </text>
      <text x="274" y={y} textAnchor="end" fill={valueColor} fontSize="10.5" fontWeight="600" fontFamily="system-ui, sans-serif">
        {value}
      </text>
      {check && (
        <path
          d={`M${212} ${y - 7}l3 3.6 6-7`}
          fill="none"
          stroke="var(--ledger)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </>
  );
}

/* 1. GST-ready invoice */
export function CardInvoiceArt() {
  return (
    <Card title="Galla Invoice" tag="GST">
      <path d="M20 50h260" stroke="rgba(22,32,46,.1)" strokeWidth="1.5" />
      <Row y={74} label="GSTIN" value="Verified" valueColor="var(--ledger)" check />
      <Row y={100} label="HSN Code" value="8471" />
      <Row y={126} label="Tax @18%" value="₹1,800" />
      <path d="M20 142h260" stroke="rgba(22,32,46,.1)" strokeWidth="1.5" />
      <Row y={166} label="Total" value="₹11,800" valueColor="var(--ledger)" />
    </Card>
  );
}

/* 2. Auto GSTR reports */
export function CardGstrArt() {
  return (
    <Card title="GSTR Reports">
      <rect x="22" y="48" width="62" height="24" rx="6" fill="var(--ledger)" />
      <text x="53" y="64" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="700" fontFamily="system-ui, sans-serif">
        GSTR-1
      </text>
      <rect x="92" y="48" width="66" height="24" rx="6" fill="rgba(14,107,82,.12)" />
      <text x="125" y="64" textAnchor="middle" fill="var(--ledger)" fontSize="10" fontWeight="700" fontFamily="system-ui, sans-serif">
        GSTR-3B
      </text>

      {[
        ["Sales", 168, 0.92],
        ["Tax", 138, 0.66],
        ["ITC", 100, 0.42],
      ].map(([label, w, o], i) => {
        const y = 96 + i * 26;
        return (
          <g key={label}>
            <text x="26" y={y + 4} fill="rgba(22,32,46,.6)" fontSize="10" fontFamily="system-ui, sans-serif">
              {label}
            </text>
            <rect x="74" y={y - 5} width="200" height="9" rx="4.5" fill="rgba(22,32,46,.07)" />
            <rect x="74" y={y - 5} width={w} height="9" rx="4.5" fill="var(--ledger)" opacity={o} />
          </g>
        );
      })}

      <text x="26" y="178" fill="rgba(22,32,46,.45)" fontSize="9.5" fontFamily="system-ui, sans-serif">
        Ready before you ask
      </text>
    </Card>
  );
}

/* 3. Instant data sharing */
export function CardShareArt() {
  return (
    <Card>
      <circle cx="150" cy="56" r="21" fill="rgba(14,107,82,.1)" />
      <g stroke="var(--ledger)" strokeWidth="2" fill="none" strokeLinecap="round">
        <circle cx="157" cy="49" r="4" fill="var(--ledger)" stroke="none" />
        <circle cx="143" cy="57" r="4" fill="var(--ledger)" stroke="none" />
        <circle cx="157" cy="64" r="4" fill="var(--ledger)" stroke="none" />
        <path d="M147 55l7-4M147 59l7 4" />
      </g>

      <text x="150" y="98" textAnchor="middle" fill="var(--ink)" fontSize="12" fontWeight="700" fontFamily="system-ui, sans-serif">
        P&amp;L Report
      </text>

      <g>
        <rect x="70" y="112" width="70" height="46" rx="10" fill="rgba(14,107,82,.08)" />
        <rect x="93" y="122" width="24" height="18" rx="4" fill="var(--ledger)" />
        <text x="105" y="152" textAnchor="middle" fill="rgba(22,32,46,.65)" fontSize="9" fontFamily="system-ui, sans-serif">
          WhatsApp
        </text>
      </g>
      <g>
        <rect x="160" y="112" width="70" height="46" rx="10" fill="rgba(242,162,12,.14)" />
        <rect x="183" y="122" width="24" height="18" rx="4" fill="var(--marigold)" />
        <text x="195" y="152" textAnchor="middle" fill="rgba(22,32,46,.65)" fontSize="9" fontFamily="system-ui, sans-serif">
          PDF
        </text>
      </g>
    </Card>
  );
}

/* 4. Errors caught at entry */
export function CardErrorArt() {
  return (
    <Card>
      <rect x="26" y="40" width="248" height="34" rx="8" fill="rgba(198,40,40,.08)" />
      <circle cx="46" cy="57" r="7.5" fill="none" stroke="#c62828" strokeWidth="2" />
      <path d="M46 53v5M46 61v.1" stroke="#c62828" strokeWidth="2" strokeLinecap="round" />
      <text x="62" y="61" fill="#c62828" fontSize="11" fontWeight="600" fontFamily="system-ui, sans-serif">
        Invalid HSN: 4802
      </text>

      <path d="M150 84v22M143 100l7 7 7-7" fill="none" stroke="rgba(22,32,46,.35)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      <rect x="26" y="116" width="248" height="34" rx="8" fill="rgba(14,107,82,.1)" />
      <circle cx="46" cy="133" r="7.5" fill="var(--ledger)" />
      <path d="M42.5 133l2.6 2.8 4.6-5.2" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <text x="62" y="137" fill="var(--ledger)" fontSize="11" fontWeight="600" fontFamily="system-ui, sans-serif">
        Corrected: 480210
      </text>

      <text x="150" y="172" textAnchor="middle" fill="rgba(22,32,46,.45)" fontSize="9.5" fontStyle="italic" fontFamily="system-ui, sans-serif">
        Validation check completed
      </text>
    </Card>
  );
}

/* ===========================================================================
   Names you can use in content.js as  art: "..."
   =========================================================================== */
export default function Art({ name, initial }) {
  switch (name) {
    case "ca":
      return <CaArt />;
    case "network":
      return <NetworkArt />;
    case "avatar":
      return <AvatarArt initial={initial} />;
    case "cardInvoice":
      return <CardInvoiceArt />;
    case "cardGstr":
      return <CardGstrArt />;
    case "cardShare":
      return <CardShareArt />;
    case "cardError":
      return <CardErrorArt />;
    default:
      return <CaArt />;
  }
}
