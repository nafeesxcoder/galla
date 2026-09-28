// ===========================================================================
// LegalPage - the shared layout for Terms, Privacy and Refund
// ---------------------------------------------------------------------------
// Every legal page passes in a title, an intro and a list of sections.
// This file builds the page and the contents list down the side, so adding
// a section anywhere means it appears in the contents automatically.
//
// A section looks like:
//   { id: "how-we-use", h: "How we use your data", p: ["para", "para"],
//     list: ["bullet", "bullet"] }
//
// p and list are both optional.
// ===========================================================================

import { COMPANY } from "./company";

export default function LegalPage({ title, intro, sections }) {
  return (
    <>
      <section className="lp-head">
        <div className="wrap">
          <h1>{title}</h1>
          <p className="lp-updated">Last updated: {COMPANY.updated}</p>
          {intro.map((p) => (
            <p className="lead" key={p.slice(0, 30)}>
              {p}
            </p>
          ))}
        </div>
      </section>

      <section className="section lp-main">
        <div className="wrap lp-grid">
          {/* contents down the side, built from the sections themselves */}
          <nav className="lp-toc" aria-label="On this page">
            <p className="lp-toc__title">On this page</p>
            <ol>
              {sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`}>{s.h}</a>
                </li>
              ))}
            </ol>
          </nav>

          <article className="lp-body">
            {sections.map((s, i) => (
              <section className="lp-sec" id={s.id} key={s.id}>
                <h2>
                  <span className="lp-sec__no">{i + 1}.</span>
                  {s.h}
                </h2>

                {s.p?.map((p) => (
                  <p key={p.slice(0, 30)}>{p}</p>
                ))}

                {s.list && (
                  <ul className="lp-list">
                    {s.list.map((l) => (
                      <li key={l.slice(0, 30)}>{l}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}

            <p className="lp-foot">
              Questions about this page? Write to us at{" "}
              <a href={`mailto:${COMPANY.legalEmail}`}>{COMPANY.legalEmail}</a>.
            </p>
          </article>
        </div>
      </section>
    </>
  );
}
