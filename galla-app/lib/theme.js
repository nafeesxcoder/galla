// ===========================================================================
// THE LOOK, AS VALUES
// ---------------------------------------------------------------------------
// React Native has no stylesheet to cascade, so the tokens the website kept
// in CSS variables live here as plain objects instead. Same colours, same
// spacing, so the app and the website look like one product.
//
// Sizes lean a little larger than the website's. A shopkeeper taps this with
// a thumb, often one-handed, sometimes with the other hand holding the goods.
// Nothing you have to act on is under 44 points.
// ===========================================================================

import { Platform } from "react-native";

export const colors = {
  bg: "#f5f6f8",
  panel: "#ffffff",
  sunken: "#f0f2f5",
  line: "#e2e6eb",
  lineStrong: "#cbd3db",

  ink: "#10151c",
  ink2: "#46525f",
  ink3: "#74818e",

  // A ledger green. Reads as money without shouting.
  brand: "#0b6e4f",
  brandInk: "#085840",
  brandSoft: "#e6f4ef",
  brandLine: "#bfe0d4",

  danger: "#b4232a",
  dangerSoft: "#fdecec",
  warn: "#9a6400",
  warnSoft: "#fdf3e2",
  info: "#1f5fa8",
  infoSoft: "#eaf2fc",

  sidebar: "#0c1118",
  white: "#ffffff",
};

export const space = (n) => n * 4;

export const radius = {
  sm: 7,
  md: 10,
  lg: 14,
  pill: 999,
};

export const text = {
  // Numbers line up in a column only if the digits are the same width.
  // Without this a list of amounts looks ragged and is slower to scan.
  num: { fontVariant: ["tabular-nums"] },

  h1: { fontSize: 22, fontWeight: "700", letterSpacing: -0.4, color: colors.ink },
  h2: { fontSize: 17, fontWeight: "650", color: colors.ink },
  body: { fontSize: 15.5, color: colors.ink },
  label: { fontSize: 13, fontWeight: "600", color: colors.ink2 },
  sub: { fontSize: 13, color: colors.ink3 },
  tiny: { fontSize: 11.5, color: colors.ink3 },
  mono: {
    fontSize: 14,
    color: colors.ink,
  },
};

// A shadow has to be written twice. On the browser react-native-web now warns
// that shadowColor / shadowRadius are deprecated and wants CSS boxShadow; on a
// phone boxShadow is the newer prop and shadow* is what every Android and iOS
// build still honours. Platform.select keeps both honest, so the console stays
// clean on the web build without flattening the card on a phone.
const shade = (y, blur, alpha, elevation) =>
  Platform.select({
    web: { boxShadow: `0 ${y}px ${blur}px rgba(16, 21, 28, ${alpha})` },
    default: {
      shadowColor: "#10151c",
      shadowOpacity: alpha,
      shadowRadius: blur,
      shadowOffset: { width: 0, height: y },
      elevation,
    },
  });

export const shadow = {
  card: shade(2, 10, 0.06, 2),
  lift: shade(8, 22, 0.16, 10),
};

// The smallest thing worth tapping. Anything interactive gets at least this.
export const TAP = 44;

// The same screens run in a desktop window through react-native-web, where a
// browser will happily stretch a button to thirteen hundred pixels. Nothing
// here is designed to be read at that width - a bill is a column of lines,
// not a spreadsheet - so the content is held to a comfortable measure and
// centred, which looks deliberate instead of unfinished.
//
// 720 is wide enough for a bill line with its quantity, rate and amount, and
// narrow enough that the eye does not have to travel.
export const MAX_W = 720;

// Dropped onto any full-screen container.
export const wide = { width: "100%", maxWidth: MAX_W, alignSelf: "center" };
