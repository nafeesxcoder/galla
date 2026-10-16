// ===========================================================================
// MONEY
// ---------------------------------------------------------------------------
// The backend stores every amount as an integer number of paise in a BIGINT,
// and so does this file. 0.1 + 0.2 is not 0.3 in a browser either, and a
// shopkeeper checking a bill against the cash in the drawer will find the
// missing paisa.
//
// Rule: paise inside, rupees only at the edges - what the user types in and
// what gets printed out.
// ===========================================================================

export function toPaise(rupees) {
  const n = typeof rupees === "string" ? Number(rupees.replace(/,/g, "").trim()) : rupees;
  if (typeof n !== "number" || !Number.isFinite(n)) return 0;
  // Multiply first, then round. Rounding a float loses a paisa: 19.99 * 100
  // comes out as 1998.9999999999998, which truncates to 1998.
  return Math.round(n * 100);
}

export function toRupees(paise) {
  return (Number(paise) || 0) / 100;
}

// 152450 -> "1,524.50". Indian grouping: last three digits, then pairs.
export function formatPaise(paise, { decimals = true } = {}) {
  const n = Number(paise) || 0;
  const negative = n < 0;
  const abs = Math.abs(n);
  const whole = Math.floor(abs / 100);
  const fraction = abs % 100;

  let s = String(whole);
  if (s.length > 3) {
    const last3 = s.slice(-3);
    let rest = s.slice(0, -3);
    const pairs = [];
    while (rest.length > 2) {
      pairs.unshift(rest.slice(-2));
      rest = rest.slice(0, -2);
    }
    if (rest) pairs.unshift(rest);
    s = `${pairs.join(",")},${last3}`;
  }

  const out = decimals || fraction ? `${s}.${String(fraction).padStart(2, "0")}` : s;
  return negative ? `-${out}` : out;
}

// With the rupee sign. Used everywhere on screen.
export function rupees(paise, options) {
  return `₹${formatPaise(paise, options)}`;
}

// Short form for dashboard tiles, where the exact paisa is noise.
// 4523400 -> "45,234" ; 125000000 -> "1.25 L" ; 45000000000 -> "4.50 Cr"
export function rupeesShort(paise) {
  const n = Math.abs(Number(paise) || 0);
  const sign = Number(paise) < 0 ? "-" : "";
  if (n >= 10000000 * 100) return `${sign}₹${(n / (10000000 * 100)).toFixed(2)} Cr`;
  if (n >= 100000 * 100) return `${sign}₹${(n / (100000 * 100)).toFixed(2)} L`;
  return `${sign}₹${formatPaise(n, { decimals: false })}`;
}

// Quantities are DECIMAL(12,3) in the database - 1.5 kg is a real sale.
// Trailing zeros are dropped so a count of pieces reads as "4", not "4.000".
export function formatQty(qty) {
  const n = Number(qty) || 0;
  const s = n.toFixed(3);
  return s.replace(/\.?0+$/, "");
}

export function toQty(value) {
  const n = typeof value === "string" ? Number(value.trim()) : value;
  if (typeof n !== "number" || !Number.isFinite(n)) return 0;
  return Number(n.toFixed(3));
}

// ---------------------------------------------------------------------------
// amount in words
// ---------------------------------------------------------------------------
// A GST invoice is expected to carry the total in words, and in India that
// means the lakh/crore system, not millions.
const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigits(n) {
  if (n < 20) return ONES[n];
  const t = TENS[Math.floor(n / 10)];
  const o = ONES[n % 10];
  return o ? `${t} ${o}` : t;
}

function threeDigits(n) {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  const parts = [];
  if (h) parts.push(`${ONES[h]} Hundred`);
  if (rest) parts.push(twoDigits(rest));
  return parts.join(" ");
}

function wholeToWords(n) {
  if (n === 0) return "Zero";
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const rest = n % 1000;

  const parts = [];
  if (crore) parts.push(`${wholeToWords(crore)} Crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
  if (rest) parts.push(threeDigits(rest));
  return parts.join(" ");
}

export function paiseToWords(paise) {
  const n = Math.abs(Number(paise) || 0);
  const whole = Math.floor(n / 100);
  const fraction = n % 100;
  let out = `${wholeToWords(whole)} Rupees`;
  if (fraction) out += ` and ${twoDigits(fraction)} Paise`;
  return `${out} Only`;
}

// ---------------------------------------------------------------------------
// dates
// ---------------------------------------------------------------------------
// Indian shops read dates as DD-MM-YYYY. The server speaks YYYY-MM-DD.
export function today() {
  const d = new Date();
  const p = (x) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const p = (x) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function formatDate(value) {
  if (!value) return "";
  const s = String(value).slice(0, 10);
  const [y, m, d] = s.split("-");
  if (!y || !m || !d) return s;
  return `${d}-${m}-${y}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatDateLong(value) {
  if (!value) return "";
  const s = String(value).slice(0, 10);
  const [y, m, d] = s.split("-");
  if (!y || !m || !d) return s;
  return `${Number(d)} ${MONTHS[Number(m) - 1] || m} ${y}`;
}

// "3 days ago" reads faster than a date when scanning who owes money.
export function ageInDays(value) {
  if (!value) return 0;
  const then = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((now - then) / 86400000));
}

export function relativeDay(value) {
  const days = ageInDays(value);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return formatDate(value);
}
