// ===========================================================================
// Shot - image slot, used in this order:
// ---------------------------------------------------------------------------
//   1. content.js has  img: "/my-shot.png"  -> that photo is shown
//   2. otherwise it has  art: "pc"          -> the code-drawn artwork
//   3. both empty                           -> a dashed placeholder box
// ===========================================================================

import Art from "./Art";

export default function Shot({ src, art, initial, alt = "", label = "Image", className = "" }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt || label} className={`dk-shot__img ${className}`} loading="lazy" />;
  }

  if (art) {
    return (
      <div className={`dk-art ${className}`}>
        <Art name={art} initial={initial} />
      </div>
    );
  }

  return (
    <div className={`dk-shot ${className}`} role="img" aria-label={label}>
      <span className="dk-shot__mark" aria-hidden="true" />
      <span className="dk-shot__txt">{label}</span>
    </div>
  );
}
