// ===========================================================================
// POST /api/careers
// ---------------------------------------------------------------------------
// Takes the general application form and emails it to you.
//
// There is no CV upload, on purpose. Accepting files from strangers means
// storage, size limits and virus scanning before it is safe. The link field
// covers a GitHub profile, a LinkedIn page or a Drive link, which is enough
// to start a conversation - and you can ask for the file by reply.
// ===========================================================================

import { sendMail, rateLimit, clientIp, mailIsConfigured } from "@/lib/mailer";

export const dynamic = "force-dynamic";

const PHONE = /^[6-9]\d{9}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function clean(s, max) {
  return String(s ?? "").trim().slice(0, max);
}

export async function POST(request) {
  if (!mailIsConfigured()) {
    return Response.json({ ok: false, error: "not-configured" }, { status: 503 });
  }

  if (!rateLimit("careers:" + clientIp(request))) {
    return Response.json({ ok: false, error: "too-many" }, { status: 429 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "bad-request" }, { status: 400 });
  }

  // the honeypot - see the contact route for why
  if (clean(body.website, 100)) {
    return Response.json({ ok: true });
  }

  const name = clean(body.name, 120);
  const email = clean(body.email, 200);
  const phone = clean(body.phone, 15);
  const role = clean(body.role, 160);
  const link = clean(body.link, 500);
  const message = clean(body.message, 4000);

  const bad = {};
  if (!name) bad.name = "Name is required.";
  if (!EMAIL.test(email)) bad.email = "Enter a valid email address.";
  if (!PHONE.test(phone)) bad.phone = "Enter a 10 digit Indian mobile number.";
  if (!role) bad.role = "Tell us what kind of work you are looking for.";

  // A link field is where people paste anything. Only http and https reach
  // your inbox as a link - javascript: and data: URLs do not.
  if (link && !/^https?:\/\//i.test(link)) {
    bad.link = "Start the link with http:// or https://";
  }

  if (Object.keys(bad).length) {
    return Response.json({ ok: false, error: "invalid", fields: bad }, { status: 422 });
  }

  const sent = await sendMail({
    subject: `Application: ${role} - ${name}`,
    replyTo: email,
    text: [
      `Name:     ${name}`,
      `Email:    ${email}`,
      `Phone:    +91 ${phone}`,
      `Role:     ${role}`,
      `Link:     ${link || "-"}`,
      "",
      "Message:",
      message || "-",
      "",
      "---",
      `Sent from the careers form at ${new Date().toISOString()}`,
    ].join("\n"),
  });

  if (!sent.ok) {
    return Response.json({ ok: false, error: sent.reason }, { status: 502 });
  }

  return Response.json({ ok: true });
}
