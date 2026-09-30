// ===========================================================================
// QuickLinks - the three shortcuts
// Used on the account page and in the pricing sidebar
// ===========================================================================

import Link from "next/link";
import MenuIcon from "@/components/MenuIcon";
import { CONTENT } from "./content";

export default function QuickLinks({ compact = false }) {
  const q = CONTENT.quickLinks;

  return (
    <section className={`ac-quick ${compact ? "is-compact" : ""}`}>
      <h2>{q.title}</h2>
      <ul>
        {q.items.map(([label, href, note, icon]) => (
          <li key={href}>
            <Link href={href}>
              <span className="ac-quick__icon">
                <MenuIcon name={icon} />
              </span>
              <span>
                <strong>{label}</strong>
                {!compact && <em>{note}</em>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
