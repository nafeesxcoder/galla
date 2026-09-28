// ===========================================================================
// 404 - shown whenever someone lands on a URL that does not exist
// ---------------------------------------------------------------------------
// Next.js picks this file up automatically because of its name. No route
// or config needed.
// ===========================================================================

import Link from "next/link";

export const metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

const LINKS = [
  ["Home", "/"],
  ["Pricing", "/pricing"],
  ["Solutions", "/solutions"],
  ["Desktop app", "/desktop"],
  ["About us", "/about"],
  ["Contact us", "/contact"],
];

export default function NotFound() {
  return (
    <section className="section nf">
      <div className="wrap center">
        <div className="nf__art" aria-hidden="true">
          <svg viewBox="0 0 320 210" role="img">
            {/* a torn invoice - fits a billing product better than a
                generic broken robot. Two halves with a ragged edge and a
                gap between them, so it reads as torn rather than folded. */}

            {/* top half */}
            <path
              d="M62 24a10 10 0 0 1 10-10h176a10 10 0 0 1 10 10v66l-21 7-21-7-21 7-21-7-21 7-21-7-21 7-21-7-18 6z"
              fill="#fff"
              stroke="var(--ink)"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <path d="M62 24a10 10 0 0 1 10-10h176a10 10 0 0 1 10 10v20H62z" fill="var(--ledger)" />
            <rect x="78" y="25" width="56" height="8" rx="4" fill="#fff" opacity=".9" />
            <rect x="222" y="24" width="26" height="10" rx="5" fill="var(--marigold)" />
            <g fill="var(--ink)" opacity=".38">
              <rect x="78" y="58" width="72" height="7" rx="3.5" />
              <rect x="78" y="74" width="96" height="7" rx="3.5" />
            </g>
            <g fill="var(--ledger)" opacity=".55">
              <rect x="196" y="58" width="52" height="7" rx="3.5" />
              <rect x="196" y="74" width="52" height="7" rx="3.5" />
            </g>

            {/* bottom half, nudged across so the tear is obvious */}
            <path
              d="M72 118l18-6 21 7 21-7 21 7 21-7 21 7 21-7 21 7v66a10 10 0 0 1-10 10H82a10 10 0 0 1-10-10z"
              fill="#fff"
              stroke="var(--ink)"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <text
              x="160"
              y="168"
              textAnchor="middle"
              fill="var(--marigold)"
              fontSize="52"
              fontWeight="800"
              fontFamily="system-ui, sans-serif"
            >
              404
            </text>
          </svg>
        </div>

        <h1>This page does not exist</h1>
        <p className="lead">
          The link may be old, or the address may have a typo in it. Here is where most
          people were heading.
        </p>

        <ul className="nf__links">
          {LINKS.map(([label, href]) => (
            <li key={href}>
              <Link href={href}>{label}</Link>
            </li>
          ))}
        </ul>

        <div className="btn-row nf__btns">
          <Link href="/" className="btn btn--primary">
            Back to home
          </Link>
          <Link href="/contact" className="btn btn--ghost">
            Tell us what broke
          </Link>
        </div>
      </div>
    </section>
  );
}
