// ===========================================================================
// GallaMark - the logo square at the top of the login popup
// ---------------------------------------------------------------------------
// The real mark now, not a placeholder: a galla with a bill coming out of it.
//
// It is drawn inline rather than loaded from public/mark.svg because this
// sits at the top of the sign-in card, which is the first thing somebody
// sees. An <img> there is one more request that can arrive late, and a logo
// that pops in after the page has painted looks broken on a slow connection.
//
// The same artwork, as a file, is public/mark.svg - used by the navbar - and
// as PNGs in public/icon-*.png for the browser tab and home screens. If this
// ever changes, those have to change with it, or the site and the phone end
// up showing two different logos.
// ===========================================================================

export default function GallaMark() {
  return (
    <span className="lg-mark" aria-hidden="true">
      <svg viewBox="0 0 512 512">
        <rect width="512" height="512" rx="136" fill="var(--ledger, #0e6b52)" />
        {/* the galla */}
        <rect x="104" y="258" width="304" height="150" rx="28" fill="#fff" />
        {/* the slot. This one dark bar is what stops the bill and the box
            reading as a single white shape once the mark gets small. */}
        <rect x="150" y="266" width="212" height="22" rx="11" fill="var(--ledger-dark, #0a4d3b)" />
        {/* the bill, torn edge at the top */}
        <path
          d="M176 292 V110 l20,-16 l20,16 l20,-16 l20,16 l20,-16 l20,16 l20,-16 l20,16 V292 Z"
          fill="#fff"
        />
        <rect x="198" y="146" width="88" height="13" rx="6" fill="#9bb8ac" />
        <rect x="198" y="178" width="116" height="11" rx="5" fill="#cfe0d8" />
        <rect x="198" y="200" width="82" height="11" rx="5" fill="#cfe0d8" />
        {/* the total */}
        <rect x="198" y="232" width="70" height="16" rx="8" fill="var(--marigold, #f2a20c)" />
        <rect x="230" y="330" width="52" height="20" rx="10" fill="var(--marigold, #f2a20c)" />
      </svg>
    </span>
  );
}
