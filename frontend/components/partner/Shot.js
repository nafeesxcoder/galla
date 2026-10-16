// ===========================================================================
// Shot - image slot, used in this order:
//   1. img: "/x.png" is set  -> that photo is shown
//   2. otherwise art: "ca"   -> the code-drawn artwork from Art.js
//   3. both empty            -> a dashed placeholder box
// ===========================================================================

import Art from "./Art";

export default function Shot({ src, art, initial, alt = "", label = "Image", className = "" }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt || label} className={`pt-shot__img ${className}`} loading="lazy" />;
  }
  if (art) {
    return (
      <div className={`pt-art ${className}`}>
        <Art name={art} initial={initial} />
      </div>
    );
  }
  return (
    <div className={`pt-shot ${className}`} role="img" aria-label={label}>
      <span className="pt-shot__mark" aria-hidden="true" />
      <span className="pt-shot__txt">{label}</span>
    </div>
  );
}
