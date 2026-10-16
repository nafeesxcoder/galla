// ===========================================================================
// POST /api/contact
// ---------------------------------------------------------------------------
// Takes the Get In Touch form and emails it to you.
//
// Everything the browser sends is checked again here. The form validates for
// the visitor's benefit; this validates for yours. Anyone can post straight
// to this URL without going near the form.
// ===========================================================================

import { sendMail, rateLimit, clientIp, mailIsConfigured } from "@/lib/mailer";

// This route talks to an external API, so it cannot be prerendered.
export const dynamic = "force-dynamic";

const PHONE = /^[6-9]\d{9}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function clean(s, max) {
  return String(s ?? "").trim().slice(0, max);
}

export async function POST(request) {
  // ---- is there anywhere to send it? ------------------------------------
  if (!mailIsConfigured()) {
    return Response.json(
      { ok: false, error: "not-configured" },
      { status: 503 }
    );
  }

  // ---- rate limit --------------------------------------------------------
  if (!rateLimit("contact:" + clientIp(request))) {
    return Response.json(
      { ok: false, error: "too-many" },
      { status: 429 }
    );
  }

  // ---- read the body -----------------------------------------------------
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "bad-request" }, { status: 400 });
  }

  // ---- the honeypot ------------------------------------------------------
  // The form renders a field that is hidden from people and left empty. A
  // bot fills in every field it finds, so anything here means a bot. We
  // return success so it does not learn anything, and send nothing.
  if (clean(body.website, 100)) {
    return Response.json({ ok: true });
  }

  // ---- validate ----------------------------------------------------------
  const name = clean(body.name, 120);
  const phone = clean(body.phone, 15);
  const email = clean(body.email, 200);
  const company = clean(body.company, 160);
  const message = clean(body.message, 4000);

  const bad = {};
  if (!name) bad.name = "Name is required.";
  if (!PHONE.test(phone)) bad.phone = "Enter a 10 digit Indian mobile number.";
  if (!EMAIL.test(email)) bad.email = "Enter a valid email address.";
  if (message.length < 5) bad.message = "Tell us a little more.";

  if (Object.keys(bad).length) {
    return Response.json({ ok: false, error: "invalid", fields: bad }, { status: 422 });
  }

  // ---- send it -----------------------------------------------------------
  const sent = await sendMail({
    subject: `Website enquiry from ${name}`,
    replyTo: email,
    text: [
      `Name:     ${name}`,
      `Phone:    +91 ${phone}`,
      `Email:    ${email}`,
      `Company:  ${company || "-"}`,
      "",
      "Message:",
      message,
      "",
      "---",
      `Sent from the contact form at ${new Date().toISOString()}`,
    ].join("\n"),
  });

  if (!sent.ok) {
    return Response.json({ ok: false, error: sent.reason }, { status: 502 });
  }

  return Response.json({ ok: true });
}
