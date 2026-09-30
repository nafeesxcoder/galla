// ===========================================================================
// SENDING MAIL
// ---------------------------------------------------------------------------
// One place that knows how to send an email. Both form routes call sendMail()
// and neither of them knows or cares which provider is behind it.
//
// SET UP (about ten minutes):
//   1. Sign up at resend.com - the free tier is enough to start.
//   2. Create an API key.
//   3. Put these in .env.local for local work, and in Vercel under
//      Settings -> Environment Variables for the live site:
//
//        RESEND_API_KEY=re_xxxxxxxxxxxx
//        MAIL_FROM=Galla <noreply@yourdomain.com>
//        MAIL_TO=you@yourdomain.com
//
//   4. Verify your domain in Resend. Until you do, you can only send to the
//      address you signed up with, which is fine for testing.
//
// UNTIL THAT IS DONE, nothing breaks. sendMail() reports that mail is not
// configured, the route returns a clear message, and the form tells the
// visitor to email you directly instead of pretending it went through. A
// form that silently swallows messages is worse than no form.
//
// TO USE A DIFFERENT PROVIDER: replace the body of sendViaResend below.
// SendGrid, Postmark, Brevo and Amazon SES all take the same shape - a POST
// with an API key and a JSON body. Nothing outside this file changes.
// ===========================================================================

const API = "https://api.resend.com/emails";

export function mailIsConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM && process.env.MAIL_TO);
}

/**
 * Sends one email.
 * Returns { ok: true } or { ok: false, reason: "..." } - it never throws,
 * because a form route should fail politely rather than 500.
 */
export async function sendMail({ subject, text, replyTo }) {
  if (!mailIsConfigured()) {
    return { ok: false, reason: "not-configured" };
  }

  try {
    const res = await fetch(API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.MAIL_FROM,
        to: [process.env.MAIL_TO],
        subject,
        text,
        // so hitting Reply in your inbox writes back to the person, not to
        // your own noreply address
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("Mail provider refused the message:", res.status, body);
      return { ok: false, reason: "provider-error" };
    }

    return { ok: true };
  } catch (e) {
    console.error("Could not reach the mail provider:", e);
    return { ok: false, reason: "network-error" };
  }
}

// ---------------------------------------------------------------------------
// A very small rate limit
// ---------------------------------------------------------------------------
// This holds recent submissions in memory. On Vercel each serverless instance
// has its own memory, so somebody determined can get around it by hitting a
// different instance - it is a speed bump, not a lock. It is worth having
// anyway, because most form spam is a dumb script hammering one endpoint.
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

// The visitor's IP, as far as we can tell behind Vercel's proxy.
export function clientIp(request) {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
