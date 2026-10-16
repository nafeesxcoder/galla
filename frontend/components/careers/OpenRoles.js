// ===========================================================================
// SECTION 4  -  the job listing
// ---------------------------------------------------------------------------
// This section reads content.js -> roles.list
//
//   list is EMPTY  -> shows the "no openings right now" panel
//   list has jobs  -> shows the listing, plus filter buttons built from
//                     whichever departments you used. The filters only
//                     appear once there is more than one department.
//
// So you never have to touch this file. Add or remove jobs in content.js
// and the page follows.
// IMAGE: none
// ===========================================================================

"use client";
import { useMemo, useState } from "react";
import Reveal from "@/components/Reveal";

export default function OpenRoles({ roles }) {
  const list = roles.list ?? [];
  const [dept, setDept] = useState("All");

  // build the filter buttons from the jobs themselves
  const depts = useMemo(() => {
    const found = [];
    list.forEach((r) => {
      if (r.dept && !found.includes(r.dept)) found.push(r.dept);
    });
    return found.length > 1 ? ["All", ...found] : [];
  }, [list]);

  const shown = dept === "All" ? list : list.filter((r) => r.dept === dept);

  return (
    <section className="section" id="roles">
      <div className="wrap">
        <Reveal className="center">
          <span className="eyebrow cr-eyebrow">{roles.eyebrow}</span>
          <h2>{roles.h2}</h2>
          {list.length > 0 && <p className="lead">{roles.lead}</p>}
        </Reveal>

        {/* ---- nothing open ---- */}
        {list.length === 0 && (
          <Reveal>
            <div className="cr-empty">
              <span className="cr-empty__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="7" width="18" height="13" rx="2" />
                  <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 12h18" />
                </svg>
              </span>
              <h3>{roles.emptyTitle}</h3>
              <p>{roles.emptyText}</p>
              <a href="#apply" className="btn btn--primary">
                Send your details
              </a>
            </div>
          </Reveal>
        )}

        {/* ---- filter buttons ---- */}
        {depts.length > 0 && (
          <div className="cr-filters" role="tablist" aria-label="Filter by department">
            {depts.map((d) => (
              <button
                key={d}
                type="button"
                role="tab"
                aria-selected={d === dept}
                className={`cr-filter ${d === dept ? "is-on" : ""}`}
                onClick={() => setDept(d)}
              >
                {d}
              </button>
            ))}
          </div>
        )}

        {/* ---- the jobs ---- */}
        {shown.length > 0 && (
          <div className="cr-roles" key={dept}>
            {shown.map((r, i) => (
              <article className="cr-role" key={r.title + i} style={{ animationDelay: `${i * 70}ms` }}>
                <div className="cr-role__main">
                  <h3>{r.title}</h3>
                  {r.summary && <p>{r.summary}</p>}
                  <ul className="cr-tags">
                    {r.dept && <li>{r.dept}</li>}
                    {r.location && <li>{r.location}</li>}
                    {r.type && <li>{r.type}</li>}
                    {r.experience && <li>{r.experience}</li>}
                  </ul>
                </div>
                <a href={r.apply || "#apply"} className="btn btn--ghost cr-role__cta">
                  {roles.applyCta}
                </a>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
