// ===========================================================================
// ICONS
// ---------------------------------------------------------------------------
// One name per idea, mapped to Feather. Screens ask for "home" or "rupee"
// rather than naming a glyph, so the set can be swapped later without
// touching a single screen.
//
// Feather is a single stroke weight throughout, which is why a row of these
// looks even rather than some icons reading heavier than others.
// ===========================================================================

import Feather from "@expo/vector-icons/Feather";
import { colors } from "../lib/theme";

const MAP = {
  home: "home",
  box: "box",
  plus: "plus",
  users: "users",
  menu: "menu",
  bill: "file-text",
  search: "search",
  close: "x",
  check: "check",
  chevron: "chevron-right",
  back: "chevron-left",
  down: "chevron-down",
  trash: "trash-2",
  edit: "edit-2",
  print: "printer",
  share: "share-2",
  rupee: "dollar-sign",
  warn: "alert-triangle",
  phone: "phone",
  calendar: "calendar",
  chart: "bar-chart-2",
  wallet: "credit-card",
  lock: "lock",
  history: "clock",
  settings: "settings",
  logout: "log-out",
  shop: "shopping-bag",
  camera: "camera",
  download: "download",
  refresh: "refresh-cw",

  // The menu, the money screens and the rest of it.
  bank: "home",
  cash: "dollar-sign",
  cheque: "file-text",
  loan: "trending-down",
  sync: "refresh-ccw",
  cloud: "upload-cloud",
  companies: "briefcase",
  tools: "tool",
  help: "help-circle",
  star: "star",
  desktop: "monitor",
  grow: "trending-up",
  store: "globe",
  price: "tag",
  up: "chevron-up",
  arrowIn: "arrow-down-left",
  arrowOut: "arrow-up-right",
  swap: "repeat",
  purchase: "shopping-cart",
  sale: "trending-up",
  minus: "minus",
  info: "info",
  mail: "mail",
  message: "message-circle",
  list: "list",
  grid: "grid",
  pie: "pie-chart",
  truck: "truck",
  percent: "percent",
  barcode: "hash",
  user: "user",
  link: "link",
  external: "external-link",
};

export function Icon({ name, size = 22, color = colors.ink2, style }) {
  return <Feather name={MAP[name] || name} size={size} color={color} style={style} />;
}

export default Icon;
