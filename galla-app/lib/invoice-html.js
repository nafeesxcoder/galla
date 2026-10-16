// ===========================================================================
// THE BILL ON PAPER
// ---------------------------------------------------------------------------
// expo-print takes HTML and gives back a PDF or sends it to a printer, on
// Android, on iOS and in the browser. So the bill is built here as one HTML
// string with its styles inline - nothing to load, nothing to resolve, no
// fonts to wait for.
//
// It is a tax invoice, so it carries what the law expects one to carry: both
// parties' names and GSTINs, the place of supply, HSN against each line, the
// tax split out by rate, the total in words.
//
// A shop that has not got a GSTIN yet cannot issue a tax invoice. For them
// the heading says "Invoice" and the tax columns are dropped rather than
// printed as zeroes - a tax invoice with no GSTIN on it would be worse than
// no paper at all.
//
// Two sizes:
//   a4       for a customer who files it, or a PDF to send on WhatsApp
//   thermal  80mm roll, for the printer on the counter
// ===========================================================================

import { formatDate, formatDateLong, formatQty, paiseToWords, rupees } from "./money";
import { unitShort } from "./units";
import { stateName } from "./gst-states";

// Everything that reaches the page goes through this. A customer called
// "Sharma & Sons <Noida>" must not be able to break the markup.
function esc(v) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const money = (p) => esc(rupees(p || 0));

function headingFor(docType, registered) {
  if (docType === "estimate") return "Estimate";
  if (docType === "credit_note") return "Credit Note";
  if (docType === "debit_note") return "Debit Note";
  if (docType === "purchase") return "Purchase Bill";
  return registered ? "Tax Invoice" : "Invoice";
}

// One row per GST rate, added up from the printed lines rather than taken
// from the totals, so the breakup always agrees with the lines above it.
function taxBreakup(rows) {
  const out = [];
  for (const l of rows) {
    const rate = Number(l.taxRate) || 0;
    if (!rate) continue;
    let b = out.find((x) => x.rate === rate);
    if (!b) {
      b = { rate, taxable: 0, cgst: 0, sgst: 0, igst: 0 };
      out.push(b);
    }
    b.taxable += Number(l.taxablePaise || 0);
    b.cgst += Number(l.cgstPaise || 0);
    b.sgst += Number(l.sgstPaise || 0);
    b.igst += Number(l.igstPaise || 0);
  }
  return out.sort((a, b) => a.rate - b.rate);
}

// ---------------------------------------------------------------------------
/**
 * `settings` is the shop's bill preferences (see the Settings screen) and
 * `bankAccounts` the accounts it has marked "print on bills". Both are
 * optional: left out, the bill prints the way it always did, which keeps
 * every existing caller working.
 */
export function invoiceHtml({ invoice, shop, party, lines, size = "a4", copyLabel, settings, bankAccounts }) {
  if (!invoice) return "<html><body></body></html>";

  // Defaults chosen so that a caller that knows nothing about settings gets
  // a complete, correct bill rather than a stripped one.
  const look = {
    terms: "",
    footer: "",
    signatureLabel: "",
    showHsn: true,
    showAmountInWords: true,
    showPaymentStatus: true,
    showSignature: true,
    showBankDetails: false,
    ...(settings?.bill || settings || {}),
  };

  // Only the accounts the shop actually wants printed, and only when it has
  // asked for them at all.
  const banks = look.showBankDetails
    ? (bankAccounts || []).filter((b) => b.printOnInvoice && (b.accountNumber || b.upiId))
    : [];

  const rows = (invoice.lines && invoice.lines.length ? invoice.lines : lines) || [];
  const a = invoice.amounts || {};
  const registered = Boolean(shop?.gstin);
  const interState = Boolean(invoice.interState) || Number(a.igst) > 0;

  return size === "thermal"
    ? thermal({ invoice, shop, party, rows, a, interState, look })
    : a4({ invoice, shop, party, rows, a, registered, interState, copyLabel, look, banks });
}

// ---------------------------------------------------------------------------
// 80mm roll
// ---------------------------------------------------------------------------
function thermal({ invoice, shop, party, rows, a, interState, look }) {
  const line = (l) => `
    <tr>
      <td>
        ${esc(l.name)}
        ${l.batchNo ? `<div class="sub">B: ${esc(l.batchNo)}${l.expiryDate ? ` E: ${esc(formatDate(l.expiryDate))}` : ""}</div>` : ""}
        <div class="sub">${esc(formatQty(l.quantity))} ${esc(unitShort(l.unit))} &times; ${money(l.ratePaise)}</div>
      </td>
      <td class="r">${money(l.totalPaise)}</td>
    </tr>`;

  const kv = (k, v, cls = "") => `<div class="kv ${cls}"><span>${esc(k)}</span><span>${v}</span></div>`;

  return page(
    `
    @page { size: 80mm auto; margin: 0; }
    body { width: 72mm; margin: 0 auto; padding: 4mm 0; font-size: 11px; line-height: 1.35; }
    .mid { text-align: center; }
    .big { font-size: 14px; font-weight: 700; }
    .rule { border-top: 1px dashed #000; margin: 5px 0; }
    table { width: 100%; border-collapse: collapse; }
    td { vertical-align: top; padding: 2px 0; }
    .r { text-align: right; white-space: nowrap; }
    .sub { font-size: 10px; color: #333; }
    .kv { display: flex; justify-content: space-between; gap: 8px; }
    .tot { display: flex; justify-content: space-between; font-size: 14px; font-weight: 800; }
    .foot { text-align: center; font-size: 10px; margin-top: 6px; }
  `,
    `
    <div class="mid">
      <div class="big">${esc(shop?.name || "Shop")}</div>
      ${shop?.address ? `<div>${esc(shop.address)}</div>` : ""}
      ${shop?.city ? `<div>${esc(shop.city)}</div>` : ""}
      ${shop?.phone ? `<div>Ph ${esc(shop.phone)}</div>` : ""}
      ${shop?.gstin ? `<div>GSTIN ${esc(shop.gstin)}</div>` : ""}
    </div>

    <div class="rule"></div>
    ${kv(invoice.number || "", esc(formatDateLong(invoice.date)))}
    ${party?.name ? `<div>${esc(party.name)}${party.phone ? ` · ${esc(party.phone)}` : ""}</div>` : ""}
    <div class="rule"></div>

    <table>${rows.map(line).join("")}</table>

    <div class="rule"></div>
    ${kv("Taxable", money(a.taxable))}
    ${
      interState
        ? kv("IGST", money(a.igst))
        : `${Number(a.cgst) ? kv("CGST", money(a.cgst)) : ""}${Number(a.sgst) ? kv("SGST", money(a.sgst)) : ""}`
    }
    ${Number(a.roundOff) ? kv("Round off", money(a.roundOff)) : ""}
    <div class="rule"></div>
    <div class="tot"><span>TOTAL</span><span>${money(a.total)}</span></div>
    ${look.showPaymentStatus && Number(a.paid) ? kv("Paid", money(a.paid)) : ""}
    ${look.showPaymentStatus && Number(a.balance) > 0 ? kv("Pending", money(a.balance)) : ""}
    <div class="rule"></div>
    ${
      /* A roll is 72mm wide and every line of it costs paper, so the terms
         are trimmed rather than printed in full. The A4 copy carries the
         whole thing. */
      look.terms ? `<div class="foot">${esc(look.terms.slice(0, 160))}</div>` : ""
    }
    <div class="foot">${esc(look.footer || "Thank you. Please come again.")}</div>
  `
  );
}

// ---------------------------------------------------------------------------
// A4
// ---------------------------------------------------------------------------
function a4({ invoice, shop, party, rows, a, registered, interState, copyLabel, look, banks }) {
  // A batch column only earns its place when something on the bill has one.
  // Required on a chemist's invoice; an empty column on a hardware shop's.
  const hasBatch = rows.some((l) => l.batchNo);
  const breakup = taxBreakup(rows);

  const head = `
    <tr>
      <th class="n">#</th>
      <th>Item</th>
      ${look.showHsn ? `<th class="hsn">HSN</th>` : ""}
      ${hasBatch ? `<th class="batch">Batch / Exp</th>` : ""}
      <th class="r">Qty</th>
      <th class="r">Rate</th>
      ${registered ? `<th class="r">Taxable</th><th class="r">GST</th>` : ""}
      <th class="r">Amount</th>
    </tr>`;

  const body = rows
    .map(
      (l, i) => `
    <tr>
      <td class="n">${i + 1}</td>
      <td><strong>${esc(l.name)}</strong></td>
      ${look.showHsn ? `<td class="hsn">${esc(l.hsn || "")}</td>` : ""}
      ${
        hasBatch
          ? `<td class="batch">${esc(l.batchNo || "")}${l.expiryDate ? `<div class="sub">${esc(formatDate(l.expiryDate))}</div>` : ""}</td>`
          : ""
      }
      <td class="r">${esc(formatQty(l.quantity))} ${esc(unitShort(l.unit))}</td>
      <td class="r">${money(l.ratePaise)}</td>
      ${
        registered
          ? `<td class="r">${money(l.taxablePaise)}</td>
             <td class="r">${money(
               Number(l.cgstPaise || 0) + Number(l.sgstPaise || 0) + Number(l.igstPaise || 0)
             )}<span class="sub"> (${esc(l.taxRate)}%)</span></td>`
          : ""
      }
      <td class="r"><strong>${money(l.totalPaise)}</strong></td>
    </tr>`
    )
    .join("");

  const trow = (k, v, cls = "") =>
    `<div class="trow ${cls}"><span>${esc(k)}</span><span>${v}</span></div>`;

  const placeOfSupply = party?.stateCode
    ? `${stateName(party.stateCode)} (${party.stateCode})`
    : stateName(shop?.stateCode) || "-";

  return page(
    `
    @page { size: A4; margin: 12mm; }
    body { font-size: 11.5px; color: #10151c; }
    .head { display: flex; justify-content: space-between; gap: 16px; border-bottom: 2px solid #10151c; padding-bottom: 10px; }
    .shop-name { font-size: 19px; font-weight: 800; margin-bottom: 2px; }
    .title { text-align: right; }
    .title-main { font-size: 17px; font-weight: 800; letter-spacing: .4px; text-transform: uppercase; }
    .copy { font-size: 10px; color: #55606c; }
    .bar { display: flex; flex-wrap: wrap; gap: 4px 26px; padding: 8px 0; border-bottom: 1px solid #cbd3db; }
    .k { display: block; font-size: 9.5px; text-transform: uppercase; letter-spacing: .5px; color: #55606c; }
    .v { font-weight: 650; }
    .party { padding: 9px 0; border-bottom: 1px solid #cbd3db; }
    .party-name { font-weight: 700; font-size: 13px; }
    table.items { width: 100%; border-collapse: collapse; margin-top: 10px; }
    table.items th { text-align: left; font-size: 9.5px; text-transform: uppercase; letter-spacing: .4px;
      color: #55606c; border-bottom: 1px solid #10151c; padding: 5px 6px; }
    table.items td { padding: 6px; border-bottom: 1px solid #e2e6eb; vertical-align: top; }
    .r { text-align: right; white-space: nowrap; }
    .n { width: 22px; color: #55606c; }
    .hsn, .batch { font-size: 10.5px; color: #333; }
    .sub { font-size: 9.5px; color: #55606c; font-weight: 400; }
    .bottom { display: flex; gap: 22px; margin-top: 12px; }
    .left { flex: 1; }
    table.tax { border-collapse: collapse; font-size: 10.5px; }
    table.tax th, table.tax td { border: 1px solid #cbd3db; padding: 3px 7px; }
    .words { margin-top: 10px; }
    .terms { white-space: pre-wrap; }
    .bank { margin-top: 10px; }
    .bank-row { margin-top: 3px; line-height: 1.35; }
    .footline { margin-top: 10px; text-align: center; font-size: 9pt; color: #555; }
    .totals { width: 232px; }
    .trow { display: flex; justify-content: space-between; gap: 10px; padding: 3px 0; }
    .grand { border-top: 1px solid #10151c; border-bottom: 2px solid #10151c; margin-top: 4px;
      padding: 6px 0; font-size: 15px; font-weight: 800; }
    .due { color: #b3261e; font-weight: 700; }
    .foot { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 26px; gap: 20px; }
    .sign { text-align: center; }
    /* Space to sign in, then the line under it - not the other way round. */
    .sign-line { border-bottom: 1px solid #10151c; width: 170px; margin-bottom: 4px; height: 42px; }
  `,
    `
    <div class="head">
      <div>
        <div class="shop-name">${esc(shop?.name || "Shop")}</div>
        ${shop?.address ? `<div>${esc(shop.address)}</div>` : ""}
        ${shop?.city || shop?.pincode ? `<div>${esc([shop?.city, shop?.pincode].filter(Boolean).join(" - "))}</div>` : ""}
        ${shop?.stateCode ? `<div>${esc(stateName(shop.stateCode))} (${esc(shop.stateCode)})</div>` : ""}
        ${shop?.phone ? `<div>Phone ${esc(shop.phone)}</div>` : ""}
        ${shop?.gstin ? `<div><strong>GSTIN ${esc(shop.gstin)}</strong></div>` : ""}
      </div>
      <div class="title">
        <div class="title-main">${esc(headingFor(invoice.docType, registered))}</div>
        ${copyLabel ? `<div class="copy">${esc(copyLabel)}</div>` : ""}
      </div>
    </div>

    <div class="bar">
      <div><span class="k">Bill no.</span><span class="v">${esc(invoice.number || "")}</span></div>
      <div><span class="k">Date</span><span class="v">${esc(formatDateLong(invoice.date))}</span></div>
      ${invoice.dueDate ? `<div><span class="k">Due</span><span class="v">${esc(formatDateLong(invoice.dueDate))}</span></div>` : ""}
      <div><span class="k">Place of supply</span><span class="v">${esc(placeOfSupply)}</span></div>
    </div>

    <div class="party">
      <span class="k">Billed to</span>
      <div class="party-name">${esc(party?.name || "Walk-in customer")}</div>
      ${party?.address ? `<div>${esc(party.address)}</div>` : ""}
      ${party?.city || party?.pincode ? `<div>${esc([party?.city, party?.pincode].filter(Boolean).join(" - "))}</div>` : ""}
      ${party?.stateCode ? `<div>${esc(stateName(party.stateCode))}</div>` : ""}
      ${party?.phone ? `<div>Phone ${esc(party.phone)}</div>` : ""}
      ${party?.gstin ? `<div>GSTIN ${esc(party.gstin)}</div>` : ""}
    </div>

    <table class="items"><thead>${head}</thead><tbody>${body}</tbody></table>

    <div class="bottom">
      <div class="left">
        ${
          registered && breakup.length
            ? `<table class="tax">
                 <thead><tr>
                   <th>GST %</th><th class="r">Taxable</th>
                   ${interState ? `<th class="r">IGST</th>` : `<th class="r">CGST</th><th class="r">SGST</th>`}
                 </tr></thead>
                 <tbody>${breakup
                   .map(
                     (b) => `<tr>
                       <td>${esc(b.rate)}%</td>
                       <td class="r">${money(b.taxable)}</td>
                       ${interState ? `<td class="r">${money(b.igst)}</td>` : `<td class="r">${money(b.cgst)}</td><td class="r">${money(b.sgst)}</td>`}
                     </tr>`
                   )
                   .join("")}</tbody>
               </table>`
            : ""
        }
        ${look.showAmountInWords ? `<div class="words"><span class="k">Amount in words</span><div>${esc(paiseToWords(a.total))}</div></div>` : ""}
        ${invoice.notes ? `<div class="words"><span class="k">Note</span><div>${esc(invoice.notes)}</div></div>` : ""}
      </div>

      <div class="totals">
        ${trow("Taxable value", money(a.taxable))}
        ${Number(a.discount) ? trow("Discount", `- ${money(a.discount)}`) : ""}
        ${registered && interState ? trow("IGST", money(a.igst)) : ""}
        ${registered && !interState ? trow("CGST", money(a.cgst)) + trow("SGST", money(a.sgst)) : ""}
        ${Number(a.roundOff) ? trow("Round off", money(a.roundOff)) : ""}
        ${trow("Total", money(a.total), "grand")}
        ${look.showPaymentStatus && Number(a.paid) ? trow("Paid", money(a.paid)) : ""}
        ${look.showPaymentStatus && Number(a.balance) > 0 ? trow("Pending", money(a.balance), "due") : ""}
      </div>
    </div>

    <div class="foot">
      <div>
        ${
          /* The shop's own terms, or nothing. The first version printed
             "Goods once sold will only be taken back as per the shop's
             policy" on every bill - a policy the shopkeeper never wrote,
             on a document a customer could hold them to. A blank space is
             honest; an invented policy is not. */
          look.terms
            ? `<span class="k">Terms</span><div class="terms">${esc(look.terms)}</div>`
            : ""
        }
        ${
          banks.length
            ? `<div class="bank">
                 <span class="k">Pay into</span>
                 ${banks
                   .map(
                     (b) => `<div class="bank-row">
                       <strong>${esc(b.bankName || b.name)}</strong>
                       ${b.accountNumber ? `<div>A/c ${esc(b.accountNumber)}</div>` : ""}
                       ${b.ifsc ? `<div>IFSC ${esc(b.ifsc)}</div>` : ""}
                       ${b.upiId ? `<div>UPI ${esc(b.upiId)}</div>` : ""}
                     </div>`
                   )
                   .join("")}
               </div>`
            : ""
        }
      </div>
      ${
        look.showSignature
          ? `<div class="sign">
               <div class="sign-line"></div>
               <div>${esc(look.signatureLabel || `For ${shop?.name || "the shop"}`)}</div>
               <span class="k">Authorised signatory</span>
             </div>`
          : ""
      }
    </div>
    ${look.footer ? `<div class="footline">${esc(look.footer)}</div>` : ""}
  `
  );
}

// ---------------------------------------------------------------------------
function page(css, body) {
  return `<!doctype html>
<html><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
         color: #10151c; -webkit-print-color-adjust: exact; }
  ${css}
</style></head>
<body>${body}</body></html>`;
}

export default invoiceHtml;
