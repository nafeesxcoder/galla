// ===========================================================================
// GallaMark - the logo square at the top of the popup
// ---------------------------------------------------------------------------
// This is a placeholder mark drawn in code. When you have the real logo,
// put it in public/ and swap this for an <img src="/logo.png" .../>.
// ===========================================================================

export default function GallaMark() {
  return (
    <span className="lg-mark" aria-hidden="true">
      <svg viewBox="0 0 48 48">
        <rect width="48" height="48" rx="13" fill="var(--ledger, #0e6b52)" />
        <rect x="13" y="15" width="22" height="4" rx="2" fill="#fff" />
        <rect x="13" y="22" width="16" height="4" rx="2" fill="#fff" opacity=".85" />
        <rect x="13" y="29" width="22" height="4" rx="2" fill="var(--marigold, #f2a20c)" />
      </svg>
    </span>
  );
}
