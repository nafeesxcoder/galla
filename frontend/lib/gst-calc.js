// ===========================================================================
// GST, WORKED OUT IN THE BROWSER
// ---------------------------------------------------------------------------
// This mirrors the backend's computeLine/computeTotals so the total updates
// as the shopkeeper types, without a round trip per keystroke.
//
// IMPORTANT: the backend is the authority. This is a preview. Once a bill is
// saved, every screen shows the amounts the server sent back, never these.
// If the two ever disagree, the server is right and this file has a bug.
//
// The rules, in plain terms:
//   - supplier's state == place of supply  ->  CGST + SGST, half each
//   - different states                     ->  IGST, the whole rate
//   - a walk-in customer with no state     ->  treated as same-state
//   - the grand total is rounded to the rupee, and the difference is shown
//     as its own "Round off" line, because that is what the law expects
// ===========================================================================

// Half of an odd number of paise cannot be split evenly. The backend gives
// the extra paisa to CGST and this does the same, so the two agree exactly.
export function halve(paise) {
  const second = Math.floor(paise / 2);
  return [paise - second, second];
}

export function roundToRupee(paise) {
  const rounded = Math.round(paise / 100) * 100;
  return { rounded, roundOff: rounded - paise };
}

export function isInterState(supplierStateCode, placeOfSupply) {
  // No place of supply means a walk-in sale over the counter, which is
  // always within the state the shop is in.
  if (!placeOfSupply) return false;
  if (!supplierStateCode) return false;
  return String(supplierStateCode) !== String(placeOfSupply);
}

// ---------------------------------------------------------------------------
// one line
// ---------------------------------------------------------------------------
// line: { quantity, ratePaise, taxRate, discountPercent, discountPaise,
//         taxIncluded }
//
// taxIncluded matters more than it looks. A kirana shop's MRP already has
// the tax in it: a 450 rupee bag of rice at 5% is 428.57 + 21.43, not
// 450 + 22.50. Getting this wrong makes every bill in the shop wrong.
export function computeLine(line, { interState = false } = {}) {
  const quantity = Number(line.quantity) || 0;
  const ratePaise = Math.round(Number(line.ratePaise) || 0);
  const taxRate = Number(line.taxRate) || 0;

  const gross = Math.round(quantity * ratePaise);

  let discount = 0;
  if (line.discountPercent) {
    discount = Math.round((gross * Number(line.discountPercent)) / 100);
  } else if (line.discountPaise) {
    discount = Math.round(Number(line.discountPaise));
  }
  if (discount > gross) discount = gross;

  const afterDiscount = gross - discount;

  let taxable;
  let tax;
  if (line.taxIncluded && taxRate > 0) {
    // Work backwards out of the inclusive amount.
    taxable = Math.round((afterDiscount * 100) / (100 + taxRate));
    tax = afterDiscount - taxable;
  } else {
    taxable = afterDiscount;
    tax = Math.round((taxable * taxRate) / 100);
  }

  let cgst = 0;
  let sgst = 0;
  let igst = 0;
  if (interState) {
    igst = tax;
  } else {
    [cgst, sgst] = halve(tax);
  }

  return {
    quantity,
    ratePaise,
    taxRate,
    gross,
    discount,
    taxable,
    tax,
    cgst,
    sgst,
    igst,
    total: taxable + tax,
  };
}

// ---------------------------------------------------------------------------
// the whole bill
// ---------------------------------------------------------------------------
// extraDiscountPaise is the "take fifty off the whole bill" that happens at
// the counter. It is applied to the taxable value of each line in
// proportion, because a flat discount after tax would make the GST on the
// bill wrong - and that is the number the department checks.
export function computeTotals(lines, options = {}) {
  const { interState = false, extraDiscountPaise = 0, roundOffEnabled = true } = options;

  const computed = lines.map((l) => computeLine(l, { interState }));

  const grossSum = computed.reduce((a, l) => a + l.gross, 0);
  const lineDiscountSum = computed.reduce((a, l) => a + l.discount, 0);

  let rows = computed;
  const afterDiscountSum = computed.reduce((a, l) => a + (l.gross - l.discount), 0);
  let extra = Math.round(Number(extraDiscountPaise) || 0);
  if (extra > afterDiscountSum) extra = afterDiscountSum;

  if (extra > 0 && afterDiscountSum > 0) {
    // The discount is spread across the lines and then the whole line is
    // worked out again from scratch, rather than simply knocked off the
    // taxable value.
    //
    // That distinction matters on an MRP-priced line. Taking fifty rupees
    // off a tax-inclusive price does not take fifty off the taxable value -
    // part of it comes out of the tax. Reducing the taxable value directly
    // would give a different total from the server, which applies the
    // discount before extracting the tax. Doing it the same way here keeps
    // the screen and the saved bill in agreement to the paisa.
    //
    // The running remainder makes sure the paise lost to rounding land on
    // the last line instead of quietly disappearing.
    let left = extra;
    rows = computed.map((l, i) => {
      const base = l.gross - l.discount;
      const share =
        i === computed.length - 1 ? left : Math.round((extra * base) / afterDiscountSum);
      const applied = Math.max(0, Math.min(share, base, left));
      left -= applied;

      const again = computeLine(
        {
          quantity: lines[i].quantity,
          ratePaise: lines[i].ratePaise,
          taxRate: lines[i].taxRate,
          taxIncluded: lines[i].taxIncluded,
          discountPaise: l.discount + applied,
        },
        { interState }
      );
      return { ...again, extraDiscount: applied };
    });
  }

  const taxable = rows.reduce((a, l) => a + l.taxable, 0);
  const cgst = rows.reduce((a, l) => a + l.cgst, 0);
  const sgst = rows.reduce((a, l) => a + l.sgst, 0);
  const igst = rows.reduce((a, l) => a + l.igst, 0);
  const tax = cgst + sgst + igst;
  const beforeRound = taxable + tax;

  const { rounded, roundOff } = roundOffEnabled
    ? roundToRupee(beforeRound)
    : { rounded: beforeRound, roundOff: 0 };

  // One row per tax rate, which is how the printed bill has to show it.
  const byRate = new Map();
  for (const l of rows) {
    if (!l.taxable && !l.tax) continue;
    const key = l.taxRate;
    const b = byRate.get(key) || { taxRate: key, taxable: 0, cgst: 0, sgst: 0, igst: 0, tax: 0 };
    b.taxable += l.taxable;
    b.cgst += l.cgst;
    b.sgst += l.sgst;
    b.igst += l.igst;
    b.tax += l.tax;
    byRate.set(key, b);
  }

  return {
    lines: rows,
    interState,
    gross: grossSum,
    lineDiscount: lineDiscountSum,
    extraDiscount: extra,
    discount: lineDiscountSum + extra,
    taxable,
    cgst,
    sgst,
    igst,
    tax,
    beforeRound,
    roundOff,
    total: rounded,
    taxBreakup: [...byRate.values()].sort((a, b) => a.taxRate - b.taxRate),
  };
}

// The rates a shop in India can actually pick. Anything else and the bill
// will be questioned.
export const TAX_RATES = [
  { value: 0, label: "0% (exempt)" },
  { value: 0.25, label: "0.25%" },
  { value: 3, label: "3%" },
  { value: 5, label: "5%" },
  { value: 12, label: "12%" },
  { value: 18, label: "18%" },
  { value: 28, label: "28%" },
];
