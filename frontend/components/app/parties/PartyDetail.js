"use client";

// ===========================================================================
// ONE CUSTOMER
// ---------------------------------------------------------------------------
// What they owe, every bill, every payment, and a WhatsApp reminder that is
// written for them rather than a template with a blank in it.
//
// The reminder is a link, not a messaging integration. It opens WhatsApp
// with the words ready and the shopkeeper presses send. No API, no fee, no
// approval process, and it works the same from a phone and a desktop.
// ===========================================================================

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PARTIES, BILLS, COMMON } from "../content";
import { Empty, ErrorState, PageHead, StatusPill, TableSkeleton, Note } from "../ui/Bits";
import { IconPhone, IconWhatsApp, IconEdit, IconPlus, IconBill, IconRupee } from "../Icons";
import { rupees, formatDate, relativeDay, ageInDays } from "../../../lib/money";
import { modeLabel } from "../../../lib/units";
import { stateName } from "../../../lib/gst-states";
import { getParty, listInvoices, listPayments } from "../data";
import { useShop } from "../useShop";
import PartyForm from "./PartyForm";
import PaymentForm from "../payments/PaymentForm";

export default function PartyDetail({ id }) {
  const shop = useShop();
  const [party, setParty] = useState(null);
  const [bills, setBills] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [collecting, setCollecting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, inv, pay] = await Promise.all([
        getParty(id),
        listInvoices({ partyId: id, limit: 60 }).catch(() => ({ rows: [] })),
        listPayments({ partyId: id, limit: 40 }).catch(() => ({ rows: [] })),
      ]);
      setParty(p);
      setBills(inv.rows);
      setPayments(pay.rows);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <ErrorState error={error} onRetry={load} />;

  if (loading || !party) {
    return (
      <div className="ap-panel">
        <TableSkeleton rows={5} cols={3} />
      </div>
    );
  }

  const owes = party.owesUs > 0;
  const oldestOpen = bills
    .filter((b) => b.status !== "cancelled" && b.amounts.balance > 0)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))[0];

  const reminder = PARTIES.detail.reminderText
    .replace("{name}", party.name)
    .replace("{shop}", shop.shop?.name || "our shop")
    .replace("{amount}", rupees(party.owesUs));

  const waHref = party.phone
    ? `https://wa.me/91${String(party.phone).slice(-10)}?text=${encodeURIComponent(reminder)}`
    : null;

  return (
    <>
      <PageHead title={party.name}>
        {party.phone ? (
          <a className="ap-btn" href={`tel:+91${party.phone}`}>
            <IconPhone size={16} /> {PARTIES.detail.call}
          </a>
        ) : null}
        {waHref && owes ? (
          <a className="ap-btn" href={waHref} target="_blank" rel="noopener noreferrer">
            <IconWhatsApp size={16} /> {PARTIES.detail.remind}
          </a>
        ) : null}
        <button type="button" className="ap-btn" onClick={() => setEditing(true)}>
          <IconEdit size={16} /> {COMMON.edit}
        </button>
        <button type="button" className="ap-btn ap-btn-primary" onClick={() => setCollecting(true)}>
          <IconRupee size={16} /> {owes ? PARTIES.detail.collect : PARTIES.detail.pay}
        </button>
      </PageHead>

      <div className="ap-grid2" style={{ gap: 16, alignItems: "start", marginBottom: 16 }}>
        <div className="ap-panel">
          <div className="ap-panel-body">
            <div className="ap-tile-label">{PARTIES.colBalance}</div>
            <div
              className="ap-tile-value"
              style={{ color: owes ? "var(--ap-danger)" : party.weOwe ? "var(--ap-brand-ink)" : undefined }}
            >
              {party.balancePaise === 0 ? PARTIES.settled : rupees(Math.abs(party.balancePaise))}
            </div>
            {party.balancePaise !== 0 ? (
              <div className="ap-tile-note">{owes ? PARTIES.owesYou : PARTIES.youOwe}</div>
            ) : null}

            {oldestOpen ? (
              <div style={{ marginTop: 12 }}>
                <Note kind={ageInDays(oldestOpen.date) > 30 ? "warn" : "info"} icon={false}>
                  Oldest unpaid bill is <strong>{oldestOpen.number}</strong> from{" "}
                  {formatDate(oldestOpen.date)}
                  {ageInDays(oldestOpen.date) > 0 ? ` — ${ageInDays(oldestOpen.date)} days ago` : ""}.
                </Note>
              </div>
            ) : null}
          </div>
        </div>

        <div className="ap-panel">
          <div className="ap-panel-body" style={{ display: "grid", gap: 8, fontSize: 13.5 }}>
            <Row label="Phone" value={party.phone ? `+91 ${party.phone}` : null} />
            <Row label="Email" value={party.email} />
            <Row label="GSTIN" value={party.gstin} mono />
            <Row label="State" value={party.stateCode ? stateName(party.stateCode) : null} />
            <Row label="Address" value={[party.address, party.city, party.pincode].filter(Boolean).join(", ")} />
          </div>
        </div>
      </div>

      <section className="ap-panel" style={{ marginBottom: 16 }}>
        <div className="ap-panel-head">
          <h2>{PARTIES.detail.bills}</h2>
          <Link href="/app/billing" className="ap-btn ap-btn-sm ap-spacer">
            <IconPlus size={15} /> {BILLS.add}
          </Link>
        </div>
        {bills.length ? (
          <div className="ap-tablewrap">
            <table className="ap-table">
              <thead>
                <tr>
                  <th>{BILLS.colNumber}</th>
                  <th>{BILLS.colDate}</th>
                  <th className="ap-right">{BILLS.colTotal}</th>
                  <th className="ap-right">{BILLS.colBalance}</th>
                  <th className="ap-right">{BILLS.colStatus}</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <Link href={`/app/bills/${b.id}`}>{b.number}</Link>
                    </td>
                    <td className="ap-sub">{relativeDay(b.date)}</td>
                    <td className="ap-right ap-num">{rupees(b.amounts.total)}</td>
                    <td className="ap-right ap-num">
                      {b.amounts.balance > 0 ? (
                        <span style={{ color: "var(--ap-danger)" }}>{rupees(b.amounts.balance)}</span>
                      ) : (
                        <span className="ap-sub">{"–"}</span>
                      )}
                    </td>
                    <td className="ap-right">
                      <StatusPill invoice={b} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty icon={<IconBill size={30} />} title={PARTIES.detail.billsEmpty} />
        )}
      </section>

      <section className="ap-panel">
        <div className="ap-panel-head">
          <h2>{PARTIES.detail.payments}</h2>
        </div>
        {payments.length ? (
          <div className="ap-tablewrap">
            <table className="ap-table">
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="ap-sub">{formatDate(p.date)}</td>
                    <td>
                      {p.direction === "in" ? "Received" : "Paid"} by {modeLabel(p.mode)}
                      {p.notes ? <div className="ap-sub">{p.notes}</div> : null}
                    </td>
                    <td
                      className="ap-right ap-num ap-strong"
                      style={{ color: p.direction === "in" ? "var(--ap-brand-ink)" : "var(--ap-ink)" }}
                    >
                      {rupees(p.amountPaise)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty icon={<IconRupee size={30} />} title={PARTIES.detail.ledgerEmpty} />
        )}
      </section>

      {editing ? (
        <PartyForm
          party={party}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            load();
          }}
        />
      ) : null}

      {collecting ? (
        <PaymentForm
          party={party}
          direction={owes || party.balancePaise === 0 ? "in" : "out"}
          onClose={() => setCollecting(false)}
          onSaved={() => {
            setCollecting(false);
            load();
          }}
        />
      ) : null}
    </>
  );
}

function Row({ label, value, mono }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", gap: 12 }}>
      <span className="ap-sub" style={{ width: 78, flex: "0 0 auto" }}>
        {label}
      </span>
      <span style={mono ? { fontFamily: "var(--ap-mono)" } : undefined}>{value}</span>
    </div>
  );
}
