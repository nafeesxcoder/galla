// ===========================================================================
// The /account page
// ---------------------------------------------------------------------------
// Signed out -> a short panel asking them to sign in, which opens the popup.
// Signed in  -> plan, licences, quick links, downloads, invoices, details.
// ===========================================================================

"use client";
import Link from "next/link";
import MenuIcon from "@/components/MenuIcon";
import { useAuth } from "./AuthProvider";
import { CONTENT } from "./content";
import QuickLinks from "./QuickLinks";
import LicenceBox from "./LicenceBox";

export default function AccountPage() {
  const { user, signedIn, ready, signOut } = useAuth();
  const c = CONTENT;

  // Wait until we know, so the page does not flash the wrong state
  if (!ready) {
    return (
      <section className="section">
        <div className="wrap ac-loading">Loading...</div>
      </section>
    );
  }

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
            {/* this link opens the login popup, the same as the navbar one */}
            <Link href="/login" className="btn btn--primary">
              {c.guest.cta}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="page-head ac-head">
        <div className="wrap ac-head__row">
          <div>
            <h1>{c.page.h1}</h1>
            <p className="lead">{c.page.lead}</p>
          </div>
          <button type="button" className="btn btn--ghost btn--small" onClick={signOut}>
            {c.signOut}
          </button>
        </div>
      </section>

      <section className="section ac-main">
        <div className="wrap ac-grid">
          {/* ---- left column ---- */}
          <div className="ac-col">
            {/* plan */}
            <section className="ac-card">
              <h2>{c.plan.title}</h2>
              {user?.plan ? (
                <>
                  <p className="ac-plan__name">{user.plan.name}</p>
                  <p className="ac-plan__meta">
                    {c.plan.expires} {user.plan.expires}
                  </p>
                  <div className="btn-row">
                    <Link href="/pricing" className="btn btn--primary btn--small">
                      {c.plan.renew}
                    </Link>
                    <Link href="/pricing" className="btn btn--ghost btn--small">
                      {c.plan.upgrade}
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

            <LicenceBox />

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

            {/* invoices */}
            <section className="ac-card">
              <h2>{c.invoices.title}</h2>
              {/* TODO: list real payments here once the backend returns them */}
              <p className="ac-empty">{c.invoices.none}</p>
            </section>
          </div>

          {/* ---- right column ---- */}
          <aside className="ac-side">
            <QuickLinks />

            <section className="ac-card">
              <h2>{c.profile.title}</h2>
              <dl className="ac-dl-list">
                <div>
                  <dt>{c.profile.phone}</dt>
                  <dd>
                    {user?.dial} {user?.phone}
                  </dd>
                </div>
                <div>
                  <dt>{c.profile.name}</dt>
                  <dd>{user?.name || c.profile.notSet}</dd>
                </div>
                <div>
                  <dt>{c.profile.business}</dt>
                  <dd>{user?.business || c.profile.notSet}</dd>
                </div>
                <div>
                  <dt>{c.profile.email}</dt>
                  <dd>{user?.email || c.profile.notSet}</dd>
                </div>
              </dl>
              <p className="ac-note">{c.profile.editNote}</p>
            </section>
          </aside>
        </div>
      </section>
    </>
  );
}
