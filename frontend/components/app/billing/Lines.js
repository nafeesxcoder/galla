"use client";

// ===========================================================================
// THE LINES ON THE BILL
// ---------------------------------------------------------------------------
// Everything is editable in place: the rate because a regular customer gets
// a different price, the discount because it is haggled over at the counter,
// the GST rate because the person entering the item may have picked the
// wrong one. Changing it here changes this bill only, never the item.
//
// Quantities and rates are held as the strings being typed and only turned
// into numbers when the total is worked out, so a half-typed "1." is not
// rewritten under the cursor.
// ===========================================================================

import { BILLING, ITEMS } from "../content";
import { IconClose, IconWarn } from "../Icons";
import { rupees, formatQty } from "../../../lib/money";
import { unitShort } from "../../../lib/units";
import { TAX_RATES } from "../../../lib/gst-calc";
import { numericOnly } from "../ui/Field";
import { Empty } from "../ui/Bits";
import { IconBox } from "../Icons";

export default function Lines({ lines, computed, onChange, onRemove, docType }) {
  if (!lines.length) {
    return (
      <div className="ap-panel">
        <Empty
          icon={<IconBox size={34} />}
          title={BILLING.emptyLines}
          body={BILLING.emptyLinesHint}
        />
      </div>
    );
  }

  const takesStock = docType === "sale" || docType === "debit_note";

  return (
    <div className="ap-tablewrap">
      <table className="ap-lines">
        <thead>
          <tr>
            <th>{BILLING.colItem}</th>
            <th className="ap-col-qty ap-right">{BILLING.colQty}</th>
            <th className="ap-col-rate ap-right">{BILLING.colRate}</th>
            <th className="ap-col-disc ap-right">{BILLING.colDisc}</th>
            <th className="ap-col-tax">{BILLING.colTax}</th>
            <th className="ap-col-amt ap-right">{BILLING.colAmount}</th>
            <th className="ap-col-x" />
          </tr>
        </thead>
        <tbody>
          {lines.map((line, i) => {
            const c = computed.lines[i] || {};
            const qty = Number(line.quantity) || 0;

            // Only a warning, never a block. A shop sells the last bag before
            // the delivery arrives all the time, and the stock count is
            // frequently behind reality. Stopping the sale would be wrong.
            const short =
              takesStock &&
              line.type !== "service" &&
              line.stock != null &&
              qty > Number(line.stock);

            return (
              <tr key={line.key}>
                <td>
                  <div className="ap-line-name">{line.name}</div>
                  <div className="ap-line-sub">
                    {line.hsn ? `HSN ${line.hsn} · ` : ""}
                    {line.type === "service"
                      ? ITEMS.service
                      : `${formatQty(line.stock ?? 0)} ${unitShort(line.unit)} in stock`}
                  </div>
                  {short ? (
                    <div
                      className="ap-line-sub"
                      style={{ color: "var(--ap-warn)", display: "flex", gap: 5, alignItems: "center" }}
                    >
                      <IconWarn size={13} />
                      {BILLING.stockWarn
                        .replace("{qty}", formatQty(line.stock))
                        .replace("{unit}", unitShort(line.unit))
                        .replace("{name}", line.name)}
                    </div>
                  ) : null}
                </td>

                <td>
                  <input
                    className="ap-input"
                    value={line.quantity}
                    inputMode="decimal"
                    onChange={(e) => onChange(i, { quantity: numericOnly(e.target.value) })}
                    aria-label={`Quantity of ${line.name}`}
                  />
                </td>

                <td>
                  <input
                    className="ap-input"
                    value={line.rate}
                    inputMode="decimal"
                    onChange={(e) => onChange(i, { rate: numericOnly(e.target.value) })}
                    aria-label={`Rate of ${line.name}`}
                  />
                </td>

                <td>
                  <input
                    className="ap-input"
                    value={line.discountPercent}
                    inputMode="decimal"
                    placeholder="0"
                    onChange={(e) => onChange(i, { discountPercent: numericOnly(e.target.value) })}
                    aria-label={`Discount on ${line.name}`}
                  />
                </td>

                <td>
                  <select
                    className="ap-select"
                    value={String(line.taxRate)}
                    onChange={(e) => onChange(i, { taxRate: e.target.value })}
                    aria-label={`GST rate on ${line.name}`}
                  >
                    {TAX_RATES.map((t) => (
                      <option key={t.value} value={String(t.value)}>
                        {t.value}%
                      </option>
                    ))}
                  </select>
                </td>

                <td className="ap-right">
                  <span className="ap-strong ap-num">{rupees(c.total || 0)}</span>
                  {c.tax ? (
                    <div className="ap-line-sub ap-num">
                      {rupees(c.taxable || 0)} + {rupees(c.tax)}
                    </div>
                  ) : null}
                </td>

                <td>
                  <button
                    type="button"
                    className="ap-line-x"
                    onClick={() => onRemove(i)}
                    aria-label={`Remove ${line.name}`}
                  >
                    <IconClose size={16} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
