// ===========================================================================
// Mark - what a feature value looks like in a cell
//   true   -> green tick
//   false  -> red cross
//   "text" -> the text itself, e.g. "10 per month"
// ===========================================================================

export default function Mark({ value }) {
  if (value === true) {
    return (
      <span className="pr-mark pr-mark--yes" aria-label="Included">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 13l4 4L19 7" />
        </svg>
      </span>
    );
  }

  if (value === false) {
    return (
      <span className="pr-mark pr-mark--no" aria-label="Not included">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </span>
    );
  }

  return <span className="pr-val">{value}</span>;
}
