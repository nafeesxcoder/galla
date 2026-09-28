// ===========================================================================
// Info - the small (i) next to a feature name, with its hover tooltip
// The text comes from  info:  on each feature in content.js
// ===========================================================================

export default function Info({ text }) {
  if (!text) return null;

  return (
    <span className="pr-info" tabIndex={0} role="note" aria-label={text}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5M12 8h.01" />
      </svg>
      <span className="pr-info__tip">{text}</span>
    </span>
  );
}
