// ===========================================================================
// SimplePage - the shared shell for the three Quick Link pages
// (licence key, offline payment, bulk purchase)
// ===========================================================================

import Link from "next/link";

export default function SimplePage({ title, lead, children, back = true }) {
  return (
    <>
      <section className="page-head ac-head">
        <div className="wrap">
          {back && (
            <Link href="/account" className="ac-back">
              <span aria-hidden="true">&larr;</span> Back to my account
            </Link>
          )}
          <h1>{title}</h1>
          <p className="lead">{lead}</p>
        </div>
      </section>

      <section className="section">
        <div className="wrap ac-narrow">{children}</div>
      </section>
    </>
  );
}
