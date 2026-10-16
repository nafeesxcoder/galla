"use client";

// ===========================================================================
// GST RETURNS
// ---------------------------------------------------------------------------
// One month at a time, because that is how a return is filed.
//
// A GSTR-1 is really four separate lists, and they are built here as four:
//
//   B2B   every bill to a customer who gave a GSTIN, invoice by invoice,
//         split by tax rate - the department matches these against the
//         buyer's own return, so they cannot be summarised
//   B2CS  everybody else, added up by state and rate. Nobody is matching
//         these, so bill-by-bill detail would be noise
//   HSN   what was sold, grouped by HSN code, with quantity and value
//   DOCS  which bill numbers were used, and how many were cancelled. This is
//         why cancelled bills are never deleted: the department wants the
//         sequence unbroken and the cancellations declared
//
// GSTR-3B is the summary version of the same thing, and its first table is
// worked out from the same numbers.
//
// What this does NOT do: file anything, and anything to do with purchases or
// input tax credit. It produces the figures and the files; a human still
// files them. That is said plainly on the screen rather than implied.
// ===========================================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { GSTR, COMMON } from "../content";
import { useShop } from "../useShop";
import { Note, Spinner, ErrorState } from "../ui/Bits";
import { IconDownload, IconWarn } from "../Icons";
import { rupees, formatQty, formatDate, today } from "../../../lib/money";
import { unitShort } from "../../../lib/units";
import { stateName } from "../../../lib/gst-states";
import { listInvoices, listParties, getInvoice, getBusiness } from "../data";

function monthRange(ym) {
  const [y, m] = ym.split("-").map(Number);
  const last = new Date(y, m, 0).getDate();
  return { from: `${ym}-01`, to: `${ym}-${String(last).padStart(2, "0")}` };
}

async function inBatches(list, size, fn) {
  const out = [];
  for (let i = 0; i < list.length; i += size) {
    out.push(...(await Promise.all(list.slice(i, i + size).map(fn))));
  }
  return out;
}

function csvCell(v) {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadCsv(filename, rows) {
  const body = rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob([`﻿${body}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// The portal writes a place of supply as "09-Uttar Pradesh", not as a bare
// code, and the offline tool rejects anything else.
function posLabel(code) {
  if (!code) return "";
  const c = String(code).padStart(2, "0");
  const n = stateName(c);
  return n ? `${c}-${n}` : c;
}

const rupeeOf = (paise) => (Number(paise || 0) / 100).toFixed(2);

export default function GstReturns() {
  const shop = useShop();
  const [ym, setYm] = useState(() => today().slice(0, 7));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bills, setBills] = useState([]);
  const [partyById, setPartyById] = useState(new Map());
  const [biz, setBiz] = useState(null);

  const range = monthRange(ym);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [inv, prt, business] = await Promise.all([
        listInvoices({ docType: "sale", limit: 500 }),
        listParties({ limit: 500 }).catch(() => ({ rows: [] })),
        shop.businessId ? getBusiness(shop.businessId).catch(() => null) : Promise.resolve(null),
      ]);

      setPartyById(new Map(prt.rows.map((p) => [p.id, p])));
      setBiz(business);

      const month = inv.rows.filter((b) => b.date >= range.from && b.date <= range.to);

      // A return needs the lines, so every bill in the month gets opened.
      // Cancelled ones are kept - they have to be declared as cancelled.
      const full = await inBatches(month, 6, (b) =>
        b.lines && b.lines.length ? Promise.resolve(b) : getInvoice(b.id).catch(() => b)
      );
      setBills(full);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [shop.businessId, range.from, range.to]);

  useEffect(() => {
    if (shop.businessId) load();
  }, [shop.businessId, load]);

  const data = useMemo(() => {
    const live = bills.filter((b) => b.status !== "cancelled" && !b.cancelledAt);
    const cancelled = bills.filter((b) => b.status === "cancelled" || b.cancelledAt);
    const homeState = biz?.stateCode || shop.stateCode || "";

    const b2b = [];
    const b2csMap = new Map();
    const hsnMap = new Map();
    let hsnMissing = 0;
    let taxable = 0;
    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    for (const b of live) {
      const party = b.partyId != null ? partyById.get(b.partyId) : null;
      const gstin = b.partyGstin || party?.gstin || "";
      const pos = b.partyStateCode || party?.stateCode || homeState;

      // Per bill, per rate - that is the row the portal wants.
      const byRate = new Map();
      for (const l of b.lines || []) {
        const rate = Number(l.taxRate) || 0;
        const r = byRate.get(rate) || { rate, taxable: 0, cgst: 0, sgst: 0, igst: 0 };
        r.taxable += l.taxablePaise;
        r.cgst += l.cgstPaise;
        r.sgst += l.sgstPaise;
        r.igst += l.igstPaise;
        byRate.set(rate, r);

        taxable += l.taxablePaise;
        cgst += l.cgstPaise;
        sgst += l.sgstPaise;
        igst += l.igstPaise;

        const hsn = (l.hsn || "").trim();
        if (!hsn) hsnMissing++;
        const key = `${hsn}|${l.unit || "OTH"}|${rate}`;
        const h =
          hsnMap.get(key) ||
          { hsn, unit: l.unit || "OTH", rate, qty: 0, value: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0 };
        h.qty += l.quantity;
        h.value += l.totalPaise;
        h.taxable += l.taxablePaise;
        h.cgst += l.cgstPaise;
        h.sgst += l.sgstPaise;
        h.igst += l.igstPaise;
        hsnMap.set(key, h);
      }

      for (const r of byRate.values()) {
        if (gstin) {
          b2b.push({
            gstin,
            name: b.partyName || party?.name || "",
            number: b.number,
            date: b.date,
            value: b.amounts.total,
            pos,
            ...r,
          });
        } else {
          const key = `${pos}|${r.rate}`;
          const row = b2csMap.get(key) || { pos, rate: r.rate, taxable: 0, cgst: 0, sgst: 0, igst: 0 };
          row.taxable += r.taxable;
          row.cgst += r.cgst;
          row.sgst += r.sgst;
          row.igst += r.igst;
          b2csMap.set(key, row);
        }
      }
    }

    // Documents issued: the span of numbers used, and how many were voided.
    const numbers = bills.map((b) => b.number).filter(Boolean).sort();
    const docs = numbers.length
      ? {
          from: numbers[0],
          to: numbers[numbers.length - 1],
          count: numbers.length,
          cancelled: cancelled.length,
        }
      : null;

    return {
      b2b: b2b.sort((a, b) => String(a.date).localeCompare(String(b.date))),
      b2cs: [...b2csMap.values()].sort((a, b) => a.pos.localeCompare(b.pos) || a.rate - b.rate),
      hsn: [...hsnMap.values()].sort((a, b) => String(a.hsn).localeCompare(String(b.hsn)) || a.rate - b.rate),
      hsnMissing,
      docs,
      totals: { taxable, cgst, sgst, igst, tax: cgst + sgst + igst },
      billCount: live.length,
    };
  }, [bills, partyById, biz, shop.stateCode]);

  if (error) return <ErrorState error={error} onRetry={load} />;

  const stamp = `${ym}`;

  return (
    <>
      <div className="ap-panel" style={{ marginBottom: 16 }}>
        <div className="ap-panel-head" style={{ flexWrap: "wrap", gap: 12 }}>
          <label className="ap-row" style={{ gap: 8 }}>
            <span className="ap-label" style={{ margin: 0 }}>
              {GSTR.month}
            </span>
            <input
              type="month"
              className="ap-input"
              style={{ width: 180 }}
              value={ym}
              max={today().slice(0, 7)}
              onChange={(e) => setYm(e.target.value || today().slice(0, 7))}
            />
          </label>
          <span className="ap-sub ap-spacer">
            {formatDate(range.from)} to {formatDate(range.to)}
          </span>
        </div>
        <div className="ap-panel-body" style={{ display: "grid", gap: 10 }}>
          <p className="ap-hint" style={{ margin: 0 }}>
            {GSTR.note}
          </p>
          {!loading && !biz?.gstin ? <Note kind="warn">{GSTR.noGstin}</Note> : null}
        </div>
      </div>

      {loading ? (
        <div className="ap-panel">
          <div className="ap-panel-body">
            <Spinner label={GSTR.loading} />
          </div>
        </div>
      ) : (
        <>
          {/* -------------------------------------------------- 3B */}
          <section className="ap-panel" style={{ marginBottom: 16 }}>
            <div className="ap-panel-head">
              <h2>{GSTR.b3Title}</h2>
              <span className="ap-sub ap-spacer">{GSTR.b3Note}</span>
            </div>
            <div className="ap-panel-body ap-tot">
              <div className="ap-tot-row">
                <span>{GSTR.b3Taxable}</span>
                <span>{rupees(data.totals.taxable)}</span>
              </div>
              <div className="ap-tot-row">
                <span>{GSTR.b3Igst}</span>
                <span>{rupees(data.totals.igst)}</span>
              </div>
              <div className="ap-tot-row">
                <span>{GSTR.b3Cgst}</span>
                <span>{rupees(data.totals.cgst)}</span>
              </div>
              <div className="ap-tot-row">
                <span>{GSTR.b3Sgst}</span>
                <span>{rupees(data.totals.sgst)}</span>
              </div>
              <div className="ap-tot-grand">
                <span>{GSTR.b3Total}</span>
                <span className="ap-tot-amt">{rupees(data.totals.tax)}</span>
              </div>
            </div>
          </section>

          {data.hsnMissing ? (
            <div style={{ marginBottom: 14 }}>
              <Note kind="warn" icon={<IconWarn size={17} />}>
                {GSTR.hsnMissing.replace("{count}", data.hsnMissing)}
              </Note>
            </div>
          ) : null}

          {/* -------------------------------------------------- B2B */}
          <Block
            title={GSTR.b2bTitle}
            note={GSTR.b2bNote}
            empty={GSTR.b2bEmpty}
            rows={data.b2b}
            onDownload={() =>
              downloadCsv(`gstr1-b2b-${stamp}.csv`, [
                [
                  "GSTIN/UIN of Recipient",
                  "Receiver Name",
                  "Invoice Number",
                  "Invoice date",
                  "Invoice Value",
                  "Place Of Supply",
                  "Reverse Charge",
                  "Applicable % of Tax Rate",
                  "Invoice Type",
                  "E-Commerce GSTIN",
                  "Rate",
                  "Taxable Value",
                  "Cess Amount",
                ],
                ...data.b2b.map((r) => [
                  r.gstin,
                  r.name,
                  r.number,
                  formatDate(r.date),
                  rupeeOf(r.value),
                  posLabel(r.pos),
                  "N",
                  "",
                  "Regular B2B",
                  "",
                  r.rate,
                  rupeeOf(r.taxable),
                  "0.00",
                ]),
              ])
            }
            head={
              <tr>
                <th>{GSTR.colGstin}</th>
                <th>{GSTR.colName}</th>
                <th>{GSTR.colInvoice}</th>
                <th>{GSTR.colDate}</th>
                <th>{GSTR.colPos}</th>
                <th className="ap-right">{GSTR.colRate}</th>
                <th className="ap-right">{GSTR.colTaxable}</th>
                <th className="ap-right">{GSTR.colTax}</th>
              </tr>
            }
            body={data.b2b.map((r, i) => (
              <tr key={`${r.number}-${r.rate}-${i}`}>
                <td style={{ fontFamily: "var(--ap-mono)", fontSize: 12.5 }}>{r.gstin}</td>
                <td>{r.name}</td>
                <td>{r.number}</td>
                <td className="ap-sub">{formatDate(r.date)}</td>
                <td className="ap-sub">{posLabel(r.pos)}</td>
                <td className="ap-right ap-num">{r.rate}%</td>
                <td className="ap-right ap-num">{rupees(r.taxable)}</td>
                <td className="ap-right ap-num">{rupees(r.cgst + r.sgst + r.igst)}</td>
              </tr>
            ))}
          />

          {/* -------------------------------------------------- B2CS */}
          <Block
            title={GSTR.b2csTitle}
            note={GSTR.b2csNote}
            empty={GSTR.b2csEmpty}
            rows={data.b2cs}
            onDownload={() =>
              downloadCsv(`gstr1-b2cs-${stamp}.csv`, [
                [
                  "Type",
                  "Place Of Supply",
                  "Applicable % of Tax Rate",
                  "Rate",
                  "Taxable Value",
                  "Cess Amount",
                  "E-Commerce GSTIN",
                ],
                ...data.b2cs.map((r) => ["OE", posLabel(r.pos), "", r.rate, rupeeOf(r.taxable), "0.00", ""]),
              ])
            }
            head={
              <tr>
                <th>{GSTR.colPos}</th>
                <th className="ap-right">{GSTR.colRate}</th>
                <th className="ap-right">{GSTR.colTaxable}</th>
                <th className="ap-right">{GSTR.colTax}</th>
              </tr>
            }
            body={data.b2cs.map((r) => (
              <tr key={`${r.pos}-${r.rate}`}>
                <td>{posLabel(r.pos)}</td>
                <td className="ap-right ap-num">{r.rate}%</td>
                <td className="ap-right ap-num">{rupees(r.taxable)}</td>
                <td className="ap-right ap-num">{rupees(r.cgst + r.sgst + r.igst)}</td>
              </tr>
            ))}
          />

          {/* -------------------------------------------------- HSN */}
          <Block
            title={GSTR.hsnTitle}
            note={GSTR.hsnNote}
            empty={GSTR.hsnEmpty}
            rows={data.hsn}
            onDownload={() =>
              downloadCsv(`gstr1-hsn-${stamp}.csv`, [
                [
                  "HSN",
                  "Description",
                  "UQC",
                  "Total Quantity",
                  "Total Value",
                  "Rate",
                  "Taxable Value",
                  "Integrated Tax Amount",
                  "Central Tax Amount",
                  "State/UT Tax Amount",
                  "Cess Amount",
                ],
                ...data.hsn.map((r) => [
                  r.hsn,
                  "",
                  r.unit,
                  formatQty(r.qty),
                  rupeeOf(r.value),
                  r.rate,
                  rupeeOf(r.taxable),
                  rupeeOf(r.igst),
                  rupeeOf(r.cgst),
                  rupeeOf(r.sgst),
                  "0.00",
                ]),
              ])
            }
            head={
              <tr>
                <th>{GSTR.colHsn}</th>
                <th>{GSTR.colUqc}</th>
                <th className="ap-right">{GSTR.colQty}</th>
                <th className="ap-right">{GSTR.colRate}</th>
                <th className="ap-right">{GSTR.colTaxable}</th>
                <th className="ap-right">{GSTR.colTax}</th>
              </tr>
            }
            body={data.hsn.map((r, i) => (
              <tr key={`${r.hsn}-${r.unit}-${r.rate}-${i}`}>
                <td style={{ fontFamily: "var(--ap-mono)" }}>
                  {r.hsn || <span className="ap-pill ap-pill-unpaid">missing</span>}
                </td>
                <td className="ap-sub">{unitShort(r.unit)}</td>
                <td className="ap-right ap-num">{formatQty(r.qty)}</td>
                <td className="ap-right ap-num">{r.rate}%</td>
                <td className="ap-right ap-num">{rupees(r.taxable)}</td>
                <td className="ap-right ap-num">{rupees(r.cgst + r.sgst + r.igst)}</td>
              </tr>
            ))}
          />

          {/* -------------------------------------------------- docs */}
          {data.docs ? (
            <Block
              title={GSTR.docsTitle}
              note={GSTR.docsNote}
              empty=""
              rows={[data.docs]}
              onDownload={() =>
                downloadCsv(`gstr1-docs-${stamp}.csv`, [
                  ["Nature of Document", "Sr. No. From", "Sr. No. To", "Total Number", "Cancelled"],
                  [
                    GSTR.docNature,
                    data.docs.from,
                    data.docs.to,
                    data.docs.count,
                    data.docs.cancelled,
                  ],
                ])
              }
              head={
                <tr>
                  <th>{GSTR.colDocFrom}</th>
                  <th>{GSTR.colDocTo}</th>
                  <th className="ap-right">{GSTR.colDocCount}</th>
                  <th className="ap-right">{GSTR.colDocCancelled}</th>
                </tr>
              }
              body={
                <tr>
                  <td style={{ fontFamily: "var(--ap-mono)" }}>{data.docs.from}</td>
                  <td style={{ fontFamily: "var(--ap-mono)" }}>{data.docs.to}</td>
                  <td className="ap-right ap-num">{data.docs.count}</td>
                  <td className="ap-right ap-num">{data.docs.cancelled}</td>
                </tr>
              }
            />
          ) : null}

          <Note kind="info" icon={false}>
            {GSTR.caveat}
          </Note>
        </>
      )}
    </>
  );
}

function Block({ title, note, empty, rows, head, body, onDownload }) {
  return (
    <section className="ap-panel" style={{ marginBottom: 16 }}>
      <div className="ap-panel-head" style={{ flexWrap: "wrap" }}>
        <h2>{title}</h2>
        <span className="ap-sub ap-spacer">{note}</span>
        <button type="button" className="ap-btn ap-btn-sm" disabled={!rows.length} onClick={onDownload}>
          <IconDownload size={15} /> {GSTR.download}
        </button>
      </div>
      {rows.length ? (
        <div className="ap-tablewrap">
          <table className="ap-table">
            <thead>{head}</thead>
            <tbody>{body}</tbody>
          </table>
        </div>
      ) : (
        <div className="ap-panel-body ap-sub">{empty}</div>
      )}
    </section>
  );
}
