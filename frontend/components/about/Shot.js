// ===========================================================================
// Shot - image slot
// ---------------------------------------------------------------------------
// Used in this order:
//   1. content.js has  img: "/my-photo.png"  -> that photo is shown
//   2. otherwise it has  art: "invoice"      -> the code-drawn artwork
//   3. both empty                            -> a dashed placeholder box
//
// So every slot shows a drawing right now. When you have a real photo, just
// fill in that section's  img:  and the drawing disappears by itself.
// ===========================================================================

import Art from "./Art";

export default function Shot({ src, art, initial, alt = "", label = "Image", className = "" }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt || label} className={`ab-shot__img ${className}`} loading="lazy" />;
  }

  if (art) {
    return (
      <div className={`ab-art ${className}`}>
        <Art name={art} initial={initial} />
      </div>
    );
  }

  return (
    <div className={`ab-shot ${className}`} role="img" aria-label={label}>
      <span className="ab-shot__mark" aria-hidden="true" />
      <span className="ab-shot__txt">{label}</span>
    </div>
  );
}
