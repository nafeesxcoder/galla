// ===========================================================================
// Flag - the tiny flag shown inside the country selector
// Drawn in code so there are no image files to load.
// ===========================================================================

export default function Flag({ id }) {
  if (id === "ae") {
    return (
      <svg className="lg-flag" viewBox="0 0 24 16" aria-hidden="true">
        <rect width="24" height="16" fill="#fff" />
        <rect width="7" height="16" fill="#c8102e" />
        <rect x="7" width="17" height="5.33" fill="#00843d" />
        <rect x="7" y="10.67" width="17" height="5.33" fill="#111" />
      </svg>
    );
  }

  if (id === "gb") {
    return (
      <svg className="lg-flag" viewBox="0 0 24 16" aria-hidden="true">
        <rect width="24" height="16" fill="#012169" />
        <path d="M0 0l24 16M24 0L0 16" stroke="#fff" strokeWidth="3" />
        <path d="M0 0l24 16M24 0L0 16" stroke="#c8102e" strokeWidth="1.6" />
        <path d="M12 0v16M0 8h24" stroke="#fff" strokeWidth="5" />
        <path d="M12 0v16M0 8h24" stroke="#c8102e" strokeWidth="3" />
      </svg>
    );
  }

  if (id === "us") {
    return (
      <svg className="lg-flag" viewBox="0 0 24 16" aria-hidden="true">
        <rect width="24" height="16" fill="#fff" />
        {[0, 2, 4, 6, 8, 10, 12].map((y) => (
          <rect key={y} y={y * 1.23} width="24" height="1.23" fill="#b22234" />
        ))}
        <rect width="10" height="8.6" fill="#3c3b6e" />
      </svg>
    );
  }

  // India is the default
  return (
    <svg className="lg-flag" viewBox="0 0 24 16" aria-hidden="true">
      <rect width="24" height="5.33" fill="#ff9933" />
      <rect y="5.33" width="24" height="5.33" fill="#fff" />
      <rect y="10.67" width="24" height="5.33" fill="#138808" />
      <circle cx="12" cy="8" r="1.7" fill="none" stroke="#000080" strokeWidth="0.7" />
    </svg>
  );
}
