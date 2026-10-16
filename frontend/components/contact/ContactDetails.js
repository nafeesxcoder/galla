// ===========================================================================
// SECTION 2 (left column)  -  Address / Phone / Email
// ---------------------------------------------------------------------------
// All of it comes from content.js -> details, which still holds placeholders.
// The phone numbers and email addresses are real links, so they open the
// dialler or the mail app when tapped on a phone.
// IMAGE: none (icons only)
// ===========================================================================

function Pin() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 3h3l2 5-2.5 1.5a12 12 0 0 0 6 6L16 13l5 2v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4 5.2 2 2 0 0 1 6 3z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}

export default function ContactDetails({ details }) {
  const { address, phone, email } = details;

  return (
    <div className="ct-details">
      {/* ---- Address ---- */}
      <section className="ct-block">
        <h2>
          <span className="ct-block__icon"><Pin /></span>
          {address.title}
        </h2>
        <address>
          {address.lines.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </address>
      </section>

      {/* ---- Phone ---- */}
      <section className="ct-block">
        <h2>
          <span className="ct-block__icon"><PhoneIcon /></span>
          {phone.title}
        </h2>
        <ul className="ct-list">
          {phone.numbers.map((n) => (
            <li key={n.label + n.value}>
              <em>{n.label}</em>
              <a href={`tel:${n.value.replace(/[^+\d]/g, "")}`}>{n.value}</a>
            </li>
          ))}
        </ul>
        <p className="ct-hours">
          {phone.hours.map((h) => (
            <span key={h}>{h}</span>
          ))}
        </p>
      </section>

      {/* ---- Email ---- */}
      <section className="ct-block">
        <h2>
          <span className="ct-block__icon"><MailIcon /></span>
          {email.title}
        </h2>
        <ul className="ct-list">
          {email.items.map((e) => (
            <li key={e.value}>
              <em>{e.label}</em>
              <a href={`mailto:${e.value}`}>{e.value}</a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
