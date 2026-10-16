// ===========================================================================
// The /account page
// ---------------------------------------------------------------------------
// Five states, in this order:
//
//   not ready        we do not know yet - show nothing rather than a flash
//   offline          the backend is unreachable, say so plainly
//   signed out       a panel asking them to sign in
//   no shop yet      the setup screen, because nothing works without one
//   signed in        the real thing
//
// Every figure on this page comes from the API. Nothing is a placeholder any
// more, so what a shopkeeper sees here is what is actually in their books.
// ===========================================================================

"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import MenuIcon from "@/components/MenuIcon";
import { useAuth } from "./AuthProvider";
import { api, ApiError } from "@/lib/api";
import { CONTENT } from "./content";
import QuickLinks from "./QuickLinks";
import SetupBusiness from "./SetupBusiness";
import LicenceBox from "./LicenceBox";
import { useAccount } from "./useAccount";

export default function AccountPage() {
  const {
    user,
    signedIn,
    ready,
    offline,
    signOut,
    businesses,
    activeBusiness,
    businessId,
    switchBusiness,
  } = useAuth();

  const c = CONTENT;

  // The plan, the expiry and the licences all come from /api/account. The
  // shop record below still carries a plan, but only its name and code - it
  // cannot say "nine days left", which is the thing worth seeing.
  const { plan: accountPlan, loading: accountLoading } = useAccount();

  const [detail, setDetail] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  // ---- pull this shop's real numbers ------------------------------------
  const load = useCallback(async () => {
    if (!businessId) return;

    setLoading(true);
    setLoadError("");

    try {
      // Both at once - they do not depend on each other, and a shopkeeper
      // on a shop wifi should not wait for two round trips in a row.
      const [biz, list] = await Promise.all([
        api.get(`/api/businesses/${businessId}`),
        api.get("/api/invoices?docType=sale&limit=5"),
      ]);
      setDetail(biz);
      setInvoices(list ?? []);
    } catch (e) {
      setLoadError(
        e instanceof ApiError && e.isOffline
          ? "Could not reach the server."
          : "Could not load your account just now."
      );
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    load();
  }, [load]);

  // ---- not ready --------------------------------------------------------
  if (!ready) {
    return (
      <section className="section">
        <div className="wrap ac-loading">Loading...</div>
      </section>
    );
  }

  // ---- the backend is down ----------------------------------------------
  if (offline) {
    return (
      <section className="section">
        <div className="wrap">
          <div className="ac-guest">
            <h1>Cannot reach the server</h1>
            <p>
              Your account is fine - we just cannot get to it right now. Check
              that the backend is running, then try again.
            </p>
            <button type="button" className="btn btn--primary" onClick={() => window.location.reload()}>
              Try again
            </button>
          </div>
        </div>
      </section>
    );
  }

  // ---- signed out -------------------------------------------------------
  if (!signedIn) {
    return (
      <section className="section">
        <div className="wrap">
          <div className="ac-guest">
            <span className="ac-guest__icon" aria-hidden="true">
              <MenuIcon name="login" />
            </span>
            <h1>{c.guest.h2}</h1>
            <p>{c.guest.text}</p>
            <Link href="/login" className="btn btn--primary">
              {c.guest.cta}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // ---- signed in, but no shop yet ---------------------------------------
  if (businesses.length === 0) {
    return <SetupBusiness onDone={load} />;
  }

  const plan = accountPlan ?? detail?.plan ?? null;

  return (
    <>
      <section className="page-head ac-head">
        <div className="wrap ac-head__row">
          <div>
            <h1>{activeBusiness?.name ?? c.page.h1}</h1>
            <p className="lead">{c.page.lead}</p>

            {/* Only worth showing when there is more than one to switch to. */}
            {businesses.length > 1 && (
              <label className="ac-switch">
                <span>Shop</span>
                <select
                  value={businessId ?? ""}
                  onChange={(e) => switchBusiness(e.target.value)}
                >
                  {businesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          <button type="button" className="btn btn--ghost btn--small" onClick={() => signOut()}>
            {c.signOut}
          </button>
        </div>
      </section>

      <section className="section ac-main">
        <div className="wrap ac-grid">
          {/* ---- left column ---- */}
          <div className="ac-col">
            {loadError && (
              <p className="fm-failed" role="alert">
                {loadError}
              </p>
            )}

            {/* plan */}
            <section className="ac-card">
              <h2>{c.plan.title}</h2>
              {accountLoading && !plan ? (
                <p className="ac-empty">Loading...</p>
              ) : plan ? (
                <>
                  <p className="ac-plan__name">{plan.name}</p>
                  <p className="ac-plan__meta">
                    {plan.status === "trial" ? "Trial" : "Active"}
                    {plan.endsAt ? ` - ${c.plan.expires} ${formatDate(plan.endsAt)}` : ""}
                    {typeof plan.daysLeft === "number" ? ` (${remaining(plan.daysLeft)})` : ""}
                  </p>

                  {/* Said here and not only on the pricing page, because this
                      is the page somebody opens when they wonder about it.
                      Three states, loudest last. */}
                  {plan.blocked ? (
                    <p className="ac-warn ac-warn--bad" role="status">
                      <strong>New bills are paused.</strong> This plan ended and the grace period is
                      over. Everything you already have is still here - bills, customers, stock and
                      reports. Renew and billing starts again straight away.
                    </p>
                  ) : plan.inGrace ? (
                    <p className="ac-warn" role="status">
                      <strong>This plan has ended.</strong> You can still make bills for{" "}
                      {plan.graceDaysLeft} more {plan.graceDaysLeft === 1 ? "day" : "days"}. Renew
                      before then and nothing stops.
                    </p>
                  ) : plan.expiringSoon ? (
                    <p className="ac-warn" role="status">
                      This plan ends in {plan.daysLeft} day{plan.daysLeft === 1 ? "" : "s"}. Renewing
                      now does not waste anything - the days left are added on top.
                    </p>
                  ) : null}

                  <div className="btn-row">
                    <Link href="/pricing" className="btn btn--primary btn--small">
                      {plan.code === "free" ? c.plan.upgrade : c.plan.renew}
                    </Link>
                    <Link href="/account/license" className="btn btn--ghost btn--small">
                      Already have a licence?
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <p className="ac-plan__name">{c.plan.noneTitle}</p>
                  <p className="ac-plan__meta">{c.plan.noneText}</p>
                  <Link href="/pricing" className="btn btn--primary btn--small">
                    {c.plan.cta}
                  </Link>
                </>
              )}
            </section>

            {/* recent bills - real ones */}
            <section className="ac-card">
              <h2>Recent bills</h2>
              {loading && invoices.length === 0 ? (
                <p className="ac-empty">Loading...</p>
              ) : invoices.length === 0 ? (
                <p className="ac-empty">
                  No bills yet. Your most recent sales will show up here.
                </p>
              ) : (
                <ul className="ac-bills">
                  {invoices.map((inv) => (
                    <li key={inv.id}>
                      <span>
                        <strong>{inv.number}</strong>
                        <em>
                          {formatDate(inv.issueDate)}
                          {inv.party?.name ? ` - ${inv.party.name}` : ""}
                        </em>
                      </span>
                      <span className="ac-bills__amt">
                        <strong>&#8377; {formatMoney(inv.amounts.total)}</strong>
                        <em className={`ac-pill ac-pill--${inv.status}`}>{inv.status}</em>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* downloads */}
            <section className="ac-card">
              <h2>{c.downloads.title}</h2>
              <p className="ac-sub">{c.downloads.text}</p>
              <ul className="ac-dl">
                {c.downloads.items.map(([name, note, href, icon]) => (
                  <li key={name}>
                    <a href={href}>
                      <span className="ac-dl__icon">
                        <MenuIcon name={icon} />
                      </span>
                      <span>
                        <strong>{name}</strong>
                        <em>{note}</em>
                      </span>
                      <span className="ac-dl__go" aria-hidden="true">
                        <MenuIcon name="download" />
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* ---- right column ---- */}
          <aside className="ac-side">
            <QuickLinks />
            <LicenceBox />

            <section className="ac-card">
              <h2>{c.profile.title}</h2>
              <dl className="ac-dl-list">
                <div>
                  <dt>{c.profile.phone}</dt>
                  <dd>
                    {user?.dialCode} {user?.phone}
                  </dd>
                </div>
                <div>
                  <dt>{c.profile.name}</dt>
                  <dd>{user?.name || c.profile.notSet}</dd>
                </div>
                <div>
                  <dt>{c.profile.business}</dt>
                  <dd>{activeBusiness?.name ?? c.profile.notSet}</dd>
                </div>
                <div>
                  <dt>State</dt>
                  <dd>{detail?.stateName ?? activeBusiness?.stateCode ?? c.profile.notSet}</dd>
                </div>
                <div>
                  <dt>GSTIN</dt>
                  <dd>{detail?.gstin || "Not registered"}</dd>
                </div>
              </dl>
            </section>
          </aside>
        </div>
      </section>
    </>
  );
}

/** How long is left, said the way a person would say it. */
function remaining(days) {
  if (days < 0) return "expired";
  if (days === 0) return "ends today";
  if (days === 1) return "1 day left";
  if (days < 60) return `${days} days left`;
  return `about ${Math.round(days / 30)} months left`;
}

/** "2026-10-01" -> "1 Oct 2026" */
function formatDate(value) {
  if (!value) return "";
  const d = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/** Indian digit grouping: 123456.5 -> "1,23,456.50" */
function formatMoney(n) {
  return Number(n ?? 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
