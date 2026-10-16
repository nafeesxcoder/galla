// ===========================================================================
// CODE 128 - DRAWING A BARCODE A SCANNER WILL ACTUALLY READ
// ---------------------------------------------------------------------------
// Printing the item code as text under a label is useless: a laser scanner
// reads bars, not digits. So the bars are generated here.
//
// Code 128 subset B is the right one for a shop: it covers every character
// from space to ~, which means an item code like "RICE-5KG" works without
// being rewritten as digits. Subset C would pack numbers more tightly, but
// it cannot carry a letter and most shop codes have one.
//
// Every symbol is six bars and spaces wide, alternating bar-space-bar...
// starting with a bar. The table below is one row per symbol, the six widths
// as six digits, in symbol order - so symbol 0 is the first six characters.
// It is the published Code 128 table; nothing here is invented, and the check
// character and stop pattern are part of the standard rather than a choice.
// ===========================================================================

// prettier-ignore
const W =
  "212222" + "222122" + "222221" + "121223" + "121322" + "131222" + "122213" + "122312" +
  "132212" + "221213" + "221312" + "231212" + "112232" + "122132" + "122231" + "113222" +
  "123122" + "123221" + "223211" + "221132" + "221231" + "213212" + "223112" + "312131" +
  "311222" + "321122" + "321221" + "312212" + "322112" + "322211" + "212123" + "212321" +
  "232121" + "111323" + "131123" + "131321" + "112313" + "132113" + "132311" + "211313" +
  "231113" + "231311" + "112133" + "112331" + "132131" + "113123" + "113321" + "133121" +
  "313121" + "211331" + "231131" + "213113" + "213311" + "213131" + "311123" + "311321" +
  "331121" + "312113" + "312311" + "332111" + "314111" + "221411" + "431111" + "111224" +
  "111422" + "121124" + "121421" + "141122" + "141221" + "112214" + "112412" + "122114" +
  "122411" + "142112" + "142211" + "241211" + "221114" + "413111" + "241112" + "134111" +
  "111242" + "121142" + "121241" + "114212" + "124112" + "124211" + "411212" + "421112" +
  "421211" + "212141" + "214121" + "412121" + "111143" + "111341" + "131141" + "114113" +
  "114311" + "411113" + "411311" + "113141" + "114131" + "311141" + "411131" + "211412" +
  "211214" + "211232" + "233111";

// The stop pattern is the one symbol that is seven elements wide rather than
// six - 2331112, thirteen modules instead of eleven. The table holds the
// first six like every other row and the seventh is appended below, so the
// row length stays fixed at six and the lookup stays a simple slice.
const START_B = 104;
const STOP = 106;
const STOP_TAIL = 2;

const widths = (symbol) => W.slice(symbol * 6, symbol * 6 + 6);

/**
 * Turns text into a list of bar widths, alternating bar, space, bar, space…
 * starting with a bar. Returns null for text Code 128 B cannot carry.
 */
export function code128(text) {
  const value = String(text ?? "");
  if (!value) return null;

  const codes = [START_B];
  let sum = START_B;

  for (let i = 0; i < value.length; i++) {
    const c = value.charCodeAt(i);
    // Subset B runs from space (32) to DEL-1 (126), mapped to symbols 0-94.
    if (c < 32 || c > 126) return null;
    const symbol = c - 32;
    codes.push(symbol);
    // The check character is a weighted sum: each symbol counts for its
    // position. Getting this wrong produces bars that look perfect and are
    // rejected by every scanner, which is the worst possible failure.
    sum += symbol * (i + 1);
  }

  codes.push(sum % 103);
  codes.push(STOP);

  const bars = [];
  for (const symbol of codes) {
    for (const d of widths(symbol)) bars.push(Number(d));
  }
  // The stop pattern's seventh element. Push two numbers here instead of one
  // and every bar after it is a space and every space a bar - a label that
  // looks right on paper and that no scanner will read.
  bars.push(STOP_TAIL);

  return bars;
}

/**
 * The same thing as HTML, for printing. A row of divs rather than an SVG
 * because a printer driver that rescales an SVG can round a one-module bar
 * to nothing, and a missing bar is an unreadable label.
 *
 * `module` is the width of the narrowest bar in millimetres. 0.33mm is the
 * usual minimum for a thermal printer; below that cheap scanners struggle.
 */
export function code128Html(text, { module = 0.33, height = 14 } = {}) {
  const bars = code128(text);
  if (!bars) return "";

  let html = `<div style="display:flex;align-items:flex-end;height:${height}mm">`;
  bars.forEach((w, i) => {
    const colour = i % 2 === 0 ? "#000" : "transparent";
    html += `<div style="width:${(w * module).toFixed(3)}mm;height:${height}mm;background:${colour}"></div>`;
  });
  html += "</div>";
  return html;
}

/** Whether this text can be printed as a barcode at all. */
export function canEncode(text) {
  return code128(text) !== null;
}
