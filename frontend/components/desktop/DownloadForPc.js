// ===========================================================================
// SECTION  -  the PC download band
// ---------------------------------------------------------------------------
// The hero's "Download for PC" button used to point at /mobile-app, which
// is the phone page - wrong destination. It now jumps here.
//
// The Windows and Mac buttons only appear once you put real URLs in
// content.js (get.windows / get.mac). A button that goes nowhere is worse
// than no button, so an empty string hides it and the "coming soon" note
// shows instead.
// ===========================================================================

import Link from "next/link";
import MenuIcon from "@/components/MenuIcon";

export default function DownloadForPc({ get }) {
  const links = [
    ["windows", "Windows", get.windowsNote, get.windows],
    ["mac", "Mac", get.macNote, get.mac],
  ].filter(([, , , href]) => Boolean(href));

  return (
    <section className="section dk-get" id="download">
      <div className="wrap dk-get__grid">
        <div>
          <span className="eyebrow">{get.eyebrow}</span>
          <h2>{get.h2}</h2>
          <p className="lead">{get.lead}</p>

          {links.length > 0 ? (
            <div className="dk-get__btns">
              {links.map(([key, label, note, href]) => (
                <a key={key} className="dk-dl" href={href}>
                  <span className="dk-dl__icon">
                    <MenuIcon name="monitor" />
                  </span>
                  <span>
                    <strong>{label}</strong>
                    <em>{note}</em>
                  </span>
                  <span className="dk-dl__go" aria-hidden="true">
                    <MenuIcon name="download" />
                  </span>
                </a>
              ))}
            </div>
          ) : (
            <p className="dk-get__soon">{get.soon}</p>
          )}

          <ul className="dk-get__facts">
            {get.facts.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>

        <aside className="dk-get__side">
          <h3>{get.phone.h3}</h3>
          <p>{get.phone.text}</p>
          <Link href="/mobile-app" className="btn btn--ghost btn--small">
            {get.phone.cta}
          </Link>
        </aside>
      </div>
    </section>
  );
}
