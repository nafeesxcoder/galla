// ===========================================================================
// SENDING AN SMS
// ---------------------------------------------------------------------------
// One function, one provider so far. It is kept apart from the auth service
// because "did the code reach the phone" and "is this code valid" are
// different questions with different failure modes, and the login flow
// should not have Twilio's URL buried in it.
//
// WHAT THIS DOES NOT DO
// ---------------------
// It does not make an SMS arrive in India. Nothing in code can. Under TRAI's
// DLT rules a commercial message is delivered only if the sender and the
// message TEMPLATE are both registered on a DLT portal, and the text sent
// matches the registered template word for word with only the variables
// differing. An unregistered or mismatched message is accepted by Twilio,
// billed, and then dropped by the operator - so "the API returned 201" is
// not evidence that anybody received anything.
//
// That is why the template lives in configuration rather than in this file:
// it has to be edited to match whatever gets registered, without a code
// change.
// ===========================================================================

const config = require("../config");
const logger = require("./logger");

/** Is a real sender configured, or are we only logging? */
function configured() {
  if (config.sms.provider !== "twilio") return false;
  const t = config.sms.twilio;
  return Boolean(t.accountSid && t.apiKeySid && t.apiKeySecret && (t.from || t.messagingServiceSid));
}

/** What is missing, in words, for a startup warning that is worth reading. */
function missing() {
  if (config.sms.provider !== "twilio") return [];
  const t = config.sms.twilio;
  const gaps = [];
  if (!t.accountSid) gaps.push("TWILIO_ACCOUNT_SID");
  if (!t.apiKeySid) gaps.push("TWILIO_API_KEY_SID");
  if (!t.apiKeySecret) gaps.push("TWILIO_API_KEY_SECRET");
  if (!t.from && !t.messagingServiceSid) gaps.push("TWILIO_FROM or TWILIO_MESSAGING_SERVICE_SID");
  return gaps;
}

/** The message, with the variables filled in. */
function render(code) {
  return config.sms.template
    .replace(/\{code\}/g, code)
    .replace(/\{minutes\}/g, String(config.otp.ttlMinutes));
}

/**
 * Sends one message.
 *
 * Returns { ok, id } or { ok: false, error, status }. It does NOT throw:
 * the caller decides whether a failed send should stop a login, and a
 * provider outage turning into an unhandled 500 helps nobody.
 */
async function send({ to, body }) {
  if (!configured()) {
    return { ok: false, error: "no SMS provider configured", skipped: true };
  }

  const t = config.sms.twilio;
  const url = `${t.baseUrl}/2010-04-01/Accounts/${encodeURIComponent(t.accountSid)}/Messages.json`;

  const form = new URLSearchParams();
  form.set("To", to);
  form.set("Body", body);
  // A Messaging Service wins when both are set: it is the one that carries
  // the sender pool and, in India, the DLT registration.
  if (t.messagingServiceSid) form.set("MessagingServiceSid", t.messagingServiceSid);
  else form.set("From", t.from);

  // The API key and its secret are the basic-auth pair. The account SID is
  // in the path, not the credentials - sending the account SID as the
  // username works too but then the key cannot be revoked separately, which
  // is the entire reason for having one.
  const auth = Buffer.from(`${t.apiKeySid}:${t.apiKeySecret}`).toString("base64");

  // A login must not hang because a provider is slow. Ten seconds is long
  // enough for a real send and short enough that the person tapping "send
  // code" gets an answer rather than a spinner.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
      signal: controller.signal,
    });

    const payload = await res.json().catch(() => null);

    if (!res.ok) {
      // Twilio's own message is far more use than "request failed" - it
      // says things like "the From number is not a valid, SMS-capable
      // Twilio number" and "trial accounts can only send to verified
      // numbers", which are the two mistakes everybody makes first.
      return {
        ok: false,
        status: res.status,
        error: payload?.message || `Twilio returned ${res.status}`,
        twilioCode: payload?.code ?? null,
      };
    }

    // Accepted is not delivered. Twilio queues the message and the operator
    // may still drop it - in India, routinely, when DLT does not match.
    return { ok: true, id: payload?.sid ?? null, status: payload?.status ?? null };
  } catch (e) {
    const aborted = e?.name === "AbortError";
    return { ok: false, error: aborted ? "the SMS provider did not answer in time" : e.message };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Sends a login code. The one thing every caller actually wants.
 *
 * The code is never logged, in any environment. A log line with a live OTP
 * in it is a login anybody with log access can perform.
 */
async function sendLoginCode({ dialCode, phone, code }) {
  const to = `${dialCode}${phone}`;

  if (!configured()) {
    logger.info({ to }, "no SMS provider configured - login code not sent");
    return { ok: false, skipped: true };
  }

  const result = await send({ to, body: render(code) });

  if (result.ok) logger.info({ to, sid: result.id, status: result.status }, "login code sent");
  else logger.error({ to, reason: result.error, twilioCode: result.twilioCode }, "login code could not be sent");

  return result;
}

module.exports = { send, sendLoginCode, configured, missing, render };
