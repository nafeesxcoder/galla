// ===========================================================================
// SENDING MAIL, THROUGH YOUR OWN SERVER
// ---------------------------------------------------------------------------
// The contact and careers forms both call sendMail() and neither knows how
// it goes out. It goes out over SMTP from the cPanel mailbox that already
// exists - support@mygallabook.com on mail.mygallabook.com - so there is no
// third party in the middle, no monthly sending quota, and no extra account
// to keep alive.
//
// SET UP (five minutes)
// ---------------------
// Put these in .env.local for local work, and in your host's environment
// variables for the live site. The values come straight out of cPanel ->
// Email Accounts -> Connect Devices:
//
//   SMTP_HOST=mail.mygallabook.com
//   SMTP_PORT=465
//   SMTP_USER=support@mygallabook.com
//   SMTP_PASS=the mailbox password
//   MAIL_FROM=myGallaBook <support@mygallabook.com>
//   MAIL_TO=support@mygallabook.com
//
// MAIL_FROM MUST BE A MAILBOX ON THIS DOMAIN, and in practice the same one
// as SMTP_USER. A server will refuse to send mail claiming to be from an
// address it does not host - and if it does send it, Gmail puts it in spam,
// because the SPF record for that domain does not list your server.
//
// UNTIL IT IS SET UP, nothing breaks. sendMail() reports that mail is not
// configured, the route returns a clear message, and the form tells the
// visitor to email you directly instead of pretending it went through. A
// form that silently swallows messages is worse than no form at all.
// ===========================================================================

import nodemailer from "nodemailer";

export function mailIsConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.MAIL_FROM &&
      process.env.MAIL_TO
  );
}

// One connection pool for the whole process rather than a fresh TLS
// handshake per message. On a serverless host each instance builds its own,
// which is fine - the point is that a burst of five form submissions on the
// same instance does not open five connections.
let transport = null;

function getTransport() {
  if (transport) return transport;

  const port = Number(process.env.SMTP_PORT || 465);

  transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    // 465 is TLS from the first byte. 587 starts in the clear and upgrades
    // with STARTTLS, so `secure` must be false there or the handshake hangs
    // until it times out - which looks exactly like a wrong password.
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    pool: true,
    maxConnections: 2,
    // A form submission must not hang a request for a minute. If the mail
    // server is slow the visitor gets told to email directly instead.
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  });

  return transport;
}

/**
 * Sends one email.
 *
 * Returns { ok: true } or { ok: false, reason: "..." }. It never throws: a
 * form route should fail politely rather than 500, and a visitor should
 * never see a stack trace because a mailbox password expired.
 */
export async function sendMail({ subject, text, replyTo }) {
  if (!mailIsConfigured()) {
    return { ok: false, reason: "not-configured" };
  }

  try {
    await getTransport().sendMail({
      from: process.env.MAIL_FROM,
      to: process.env.MAIL_TO,
      subject,
      text,
      // So that hitting Reply in the inbox writes back to the person who
      // filled in the form, not to your own support address.
      ...(replyTo ? { replyTo } : {}),
    });
    return { ok: true };
  } catch (e) {
    // The three that actually happen, told apart so the log says which:
    //   EAUTH     wrong username or password
    //   ECONNECTION / ETIMEDOUT  wrong host or port, or the host blocks it
    //   EENVELOPE the From address is not one this server will send as
    const code = e?.code || e?.responseCode || "unknown";
    console.error(`SMTP refused the message (${code}):`, e?.message || e);

    // A failed pool is not reused - the next attempt builds a fresh one,
    // which is what recovers after the mail server restarts.
    transport = null;

    if (code === "EAUTH") return { ok: false, reason: "bad-credentials" };
    if (code === "EENVELOPE") return { ok: false, reason: "bad-from-address" };
    return { ok: false, reason: "network-error" };
  }
}

// ---------------------------------------------------------------------------
// A very small rate limit
// ---------------------------------------------------------------------------
// This holds recent submissions in memory. On a serverless host each
// instance has its own memory, so somebody determined can get around it by
// hitting a different instance - it is a speed bump, not a lock. It is worth
// having anyway, because most form spam is a dumb script hammering one
// endpoint.
//
// If the forms start getting real abuse, the next step is a shared store
// (Upstash Redis has a free tier) or Cloudflare Turnstile on the form.
const HITS = new Map();
const WINDOW_MS = 10 * 60 * 1000; // ten minutes
const MAX_IN_WINDOW = 5;

export function rateLimit(key) {
  const now = Date.now();
  const list = (HITS.get(key) ?? []).filter((t) => now - t < WINDOW_MS);

  if (list.length >= MAX_IN_WINDOW) {
    HITS.set(key, list);
    return false;
  }

  list.push(now);
  HITS.set(key, list);

  // stop the map growing forever on a long-lived instance
  if (HITS.size > 5000) {
    for (const [k, v] of HITS) {
      if (v.every((t) => now - t >= WINDOW_MS)) HITS.delete(k);
    }
  }

  return true;
}

// The visitor's IP, as far as we can tell behind a proxy.
export function clientIp(request) {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
