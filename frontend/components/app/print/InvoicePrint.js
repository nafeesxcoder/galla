"use client";

// ===========================================================================
// THE BILL ON PAPER
// ---------------------------------------------------------------------------
// This is hidden on screen and only exists when something is printed. It is
// a tax invoice, so it carries what the law expects a tax invoice to carry:
// both parties' names, addresses and GSTINs, the place of supply, HSN
// against each line, the tax split out by rate, the total in words, and the
// word "Tax Invoice" at the top when the shop is registered.
//
// A shop that has not got a GSTIN yet cannot issue a tax invoice, so for
// them the heading says "Invoice" and the tax columns are left out instead
// of printing zeroes. Printing a tax invoice without a GSTIN would be worse
// than printing nothing.
//
// Two sizes, chosen by the `size` prop:
//   a4      - a proper invoice for a customer who files it
//   thermal - 80mm roll, for a counter printer
// ===========================================================================

import { rupees, formatQty, formatDate, formatDateLong, paiseToWords } from "../../../lib/money";
import { unitShort } from "../../../lib/units";
import { stateName } from "../../../lib/gst-states";

export default function InvoicePrint({ invoice, shop, party, lines, size = "a4", copyLabel }) {
  if (!invoice) return null;

  const rows = (invoice.lines && invoice.lines.length ? invoice.lines : lines) || [];
  const a = invoice.amounts || {};
  const registered = Boolean(shop?.gstin);
  const interState = Boolean(invoice.interState) || Number(a.igst) > 0;

  const heading =
    invoice.docType === "estimate"
      ? "Estimate"
      : invoice.docType === "credit_note"
      ? "Credit Note"
      : invoice.docType === "debit_note"
      ? "Debit Note"
      : invoice.docType === "purchase"
      ? "Purchase Bill"
      : registered
      ? "Tax Invoice"
      : "Invoice";

  // One row per tax rate. Built from the lines rather than taken from the
  // totals, because the printed breakup has to add up to the printed lines.
  const breakup = [];
  for (const l of rows) {
    const rate = Number(l.taxRate) || 0;
    if (!rate) continue;
    let b = breakup.find((x) => x.rate === rate);
    if (!b) {
      b = { rate, taxable: 0, cgst: 0, sgst: 0, igst: 0 };
      breakup.push(b);
    }
    b.taxable += Number(l.taxablePaise || 0);
    b.cgst += Number(l.cgstPaise || 0);
    b.sgst += Number(l.sgstPaise || 0);
    b.igst += Number(l.igstPaise || 0);
  }
  breakup.sort((x, y) => x.rate - y.rate);

  // A batch column only earns its place when something on the bill has one.
  // On a chemist's invoice it is required; on a hardware shop's it would be
  // an empty column taking up room.
  const hasBatch = rows.some((l) => l.batchNo);

  if (size === "thermal") {
    return (
      <div className="pr-sheet pr-thermal">
        <div className="pr-t-head">
          <strong>{shop?.name || "Shop"}</strong>
          {shop?.address ? <div>{shop.address}</div> : null}
          {shop?.city ? <div>{shop.city}</div> : null}
          {shop?.phone ? <div>Ph {shop.phone}</div> : null}
          {shop?.gstin ? <div>GSTIN {shop.gstin}</div> : null}
        </div>

        <div className="pr-t-rule" />
        <div className="pr-t-meta">
          <span>{invoice.number}</span>
          <span>{formatDateLong(invoice.date)}</span>
        </div>
        {party?.name ? <div className="pr-t-meta-1">{party.name}</div> : null}
        <div className="pr-t-rule" />

        <table className="pr-t-table">
          <tbody>
            {rows.map((l, i) => (
              <tr key={l.id || i}>
                <td colSpan={2}>
                  {l.name}
                  {l.batchNo ? (
                    <div className="pr-t-sub">
                      B: {l.batchNo}
                      {l.expiryDate ? ` E: ${formatDate(l.expiryDate)}` : ""}
                    </div>
                  ) : null}
                  <div className="pr-t-sub">
                    {formatQty(l.quantity)} {unitShort(l.unit)} x {rupees(l.ratePaise)}
                  </div>
                </td>
                <td className="pr-right">{rupees(l.totalPaise)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pr-t-rule" />
        <div className="pr-t-meta">
          <span>Taxable</span>
          <span>{rupees(a.taxable)}</span>
        </div>
        {interState ? (
          <div className="pr-t-meta">
            <span>IGST</span>
            <span>{rupees(a.igst)}</span>
          </div>
        ) : (
          <>
            <div className="pr-t-meta">
              <span>CGST</span>
              <span>{rupees(a.cgst)}</span>
            </div>
            <div className="pr-t-meta">
              <span>SGST</span>
              <span>{rupees(a.sgst)}</span>
            </div>
          </>
        )}
        {a.roundOff ? (
          <div className="pr-t-meta">
            <span>Round off</span>
            <span>{rupees(a.roundOff)}</span>
          </div>
        ) : null}
        <div className="pr-t-rule" />
        <div className="pr-t-total">
          <span>TOTAL</span>
          <span>{rupees(a.total)}</span>
        </div>
        {a.balance > 0 ? (
          <div className="pr-t-meta">
            <span>Pending</span>
            <span>{rupees(a.balance)}</span>
          </div>
        ) : null}
        <div className="pr-t-rule" />
        <div className="pr-t-foot">Thank you. Please come again.</div>
      </div>
    );
  }

  return (
    <div className="pr-sheet pr-a4">
      <div className="pr-head">
        <div className="pr-shop">
          <div className="pr-shop-name">{shop?.name || "Shop"}</div>
          {shop?.address ? <div>{shop.address}</div> : null}
          <div>{[shop?.city, shop?.pincode].filter(Boolean).join(" - ")}</div>
          {shop?.stateCode ? (
            <div>
              {stateName(shop.stateCode)} ({shop.stateCode})
            </div>
          ) : null}
          {shop?.phone ? <div>Phone {shop.phone}</div> : null}
          {shop?.gstin ? (
            <div>
              <strong>GSTIN {shop.gstin}</strong>
            </div>
          ) : null}
        </div>
        <div className="pr-title">
          <div className="pr-title-main">{heading}</div>
          {copyLabel ? <div className="pr-copy">{copyLabel}</div> : null}
        </div>
      </div>

      <div className="pr-bar">
        <div>
          <span className="pr-k">Bill no.</span>
          <span className="pr-v">{invoice.number}</span>
        </div>
        <div>
          <span className="pr-k">Date</span>
          <span className="pr-v">{formatDateLong(invoice.date)}</span>
        </div>
        {invoice.dueDate ? (
          <div>
            <span className="pr-k">Due</span>
            <span className="pr-v">{formatDateLong(invoice.dueDate)}</span>
          </div>
        ) : null}
        <div>
          <span className="pr-k">Place of supply</span>
          <span className="pr-v">
            {party?.stateCode ? `${stateName(party.stateCode)} (${party.stateCode})` : stateName(shop?.stateCode) || "-"}
          </span>
        </div>
      </div>

      <div className="pr-parties">
        <div className="pr-party">
          <div className="pr-party-h">Billed to</div>
          <div className="pr-party-name">{party?.name || "Walk-in customer"}</div>
          {party?.address ? <div>{party.address}</div> : null}
          {party?.city || party?.pincode ? (
            <div>{[party?.city, party?.pincode].filter(Boolean).join(" - ")}</div>
          ) : null}
          {party?.stateCode ? <div>{stateName(party.stateCode)}</div> : null}
          {party?.phone ? <div>Phone {party.phone}</div> : null}
          {party?.gstin ? <div>GSTIN {party.gstin}</div> : null}
        </div>
      </div>

      <table className="pr-table">
        <thead>
          <tr>
            <th className="pr-n">#</th>
            <th>Item</th>
            <th className="pr-hsn">HSN</th>
            {hasBatch ? <th className="pr-batch">Batch / Exp</th> : null}
            <th className="pr-right">Qty</th>
            <th className="pr-right">Rate</th>
            {registered ? <th className="pr-right">Taxable</th> : null}
            {registered ? <th className="pr-right">GST</th> : null}
            <th className="pr-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((l, i) => (
            <tr key={l.id || i}>
              <td className="pr-n">{i + 1}</td>
              <td>{l.name}</td>
              <td className="pr-hsn">{l.hsn || ""}</td>
              {hasBatch ? (
                <td className="pr-batch">
                  {l.batchNo || ""}
                  {l.expiryDate ? <div>{formatDate(l.expiryDate)}</div> : null}
                </td>
              ) : null}
              <td className="pr-right">
                {formatQty(l.quantity)} {unitShort(l.unit)}
              </td>
              <td className="pr-right">{rupees(l.ratePaise)}</td>
              {registered ? <td className="pr-right">{rupees(l.taxablePaise)}</td> : null}
              {registered ? (
                <td className="pr-right">
                  {rupees(Number(l.cgstPaise || 0) + Number(l.sgstPaise || 0) + Number(l.igstPaise || 0))}
                  <span className="pr-rate"> ({l.taxRate}%)</span>
                </td>
              ) : null}
              <td className="pr-right">{rupees(l.totalPaise)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pr-bottom">
        <div className="pr-left">
          {registered && breakup.length ? (
            <table className="pr-tax">
              <thead>
                <tr>
                  <th>GST %</th>
                  <th className="pr-right">Taxable</th>
                  {interState ? (
                    <th className="pr-right">IGST</th>
                  ) : (
                    <>
                      <th className="pr-right">CGST</th>
                      <th className="pr-right">SGST</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {breakup.map((b) => (
                  <tr key={b.rate}>
                    <td>{b.rate}%</td>
                    <td className="pr-right">{rupees(b.taxable)}</td>
                    {interState ? (
                      <td className="pr-right">{rupees(b.igst)}</td>
                    ) : (
                      <>
                        <td className="pr-right">{rupees(b.cgst)}</td>
                        <td className="pr-right">{rupees(b.sgst)}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}

          <div className="pr-words">
            <span className="pr-k">Amount in words</span>
            <div>{paiseToWords(a.total)}</div>
          </div>

          {invoice.notes ? (
            <div className="pr-words">
              <span className="pr-k">Note</span>
              <div>{invoice.notes}</div>
            </div>
          ) : null}
        </div>

        <div className="pr-totals">
          <div className="pr-trow">
            <span>Taxable value</span>
            <span>{rupees(a.taxable)}</span>
          </div>
          {a.discount ? (
            <div className="pr-trow">
              <span>Discount</span>
              <span>- {rupees(a.discount)}</span>
            </div>
          ) : null}
          {registered && interState ? (
            <div className="pr-trow">
              <span>IGST</span>
              <span>{rupees(a.igst)}</span>
            </div>
          ) : null}
          {registered && !interState ? (
            <>
              <div className="pr-trow">
                <span>CGST</span>
                <span>{rupees(a.cgst)}</span>
              </div>
              <div className="pr-trow">
                <span>SGST</span>
                <span>{rupees(a.sgst)}</span>
              </div>
            </>
          ) : null}
          {a.roundOff ? (
            <div className="pr-trow">
              <span>Round off</span>
              <span>{rupees(a.roundOff)}</span>
            </div>
          ) : null}
          <div className="pr-trow pr-grand">
            <span>Total</span>
            <span>{rupees(a.total)}</span>
          </div>
          {a.paid ? (
            <div className="pr-trow">
              <span>Paid</span>
              <span>{rupees(a.paid)}</span>
            </div>
          ) : null}
          {a.balance > 0 ? (
            <div className="pr-trow pr-due">
              <span>Pending</span>
              <span>{rupees(a.balance)}</span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="pr-foot">
        <div className="pr-terms">
          <div className="pr-k">Terms</div>
          <div>Goods once sold will only be taken back as per the shop&rsquo;s policy.</div>
        </div>
        <div className="pr-sign">
          <div className="pr-sign-line" />
          <div>For {shop?.name || "the shop"}</div>
          <div className="pr-k">Authorised signatory</div>
        </div>
      </div>
    </div>
  );
}
