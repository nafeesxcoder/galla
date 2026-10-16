// ===========================================================================
// PAYING - by UPI QR or bank transfer
// ---------------------------------------------------------------------------
// There is no payment gateway. The money goes from their bank to yours and
// nothing tells the server it arrived, so this screen is built around one
// honest admission: the only thing it can know is what the customer types in.
//
// Three steps, and the screen never pretends to be further along than it is:
//
//   1. Work out the amount. The server quotes it and writes down what they
//      are buying, against a reference.
//   2. Show them where to send it - the QR, and the account details for
//      anybody whose bank app is not a UPI one.
//   3. Take the UTR. If the server is set to trust it, the plan starts right
//      then and the screen says so. If not, the screen says THAT instead -
//      never "done" for something a human has not looked at yet.
//
// THE AMOUNT IS NOT IN THE QR
// ---------------------------
// It is a fixed picture from a bank app, the same one for every customer, so
// there is no amount inside it. Somebody who scans it and taps through
// without reading will send the wrong number, which is why the figure is the
// largest thing on the screen and is repeated beside the QR.
// ===========================================================================

"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "./AuthProvider";
import { useAccount, clearAccountCache } from "./useAccount";

function money(n) {
  return Number(n ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

/** A value worth copying rather than retyping - an account number above all. */
function Copyable({ label, value }) {
  const [done, setDone] = useState(false);
  if (!value) return null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(String(value));
      setDone(true);
      setTimeout(() => setDone(false), 1600);
    } catch {
      // Clipboard is blocked on insecure origins and in some browsers. The
      // number is on screen either way, so this stays quiet rather than
      // throwing an error at somebody who can simply read it.
    }
  }

  return (
    <div className="ac-copy">
      <div>
        <dt>{label}</dt>
        <dd>{value}</dd>
      </div>
      <button type="button" className="ac-copy__btn" onClick={copy} aria-label={`Copy ${label}`}>
        {done ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Where to send it
// ---------------------------------------------------------------------------
function PayHere({ info, amount, reference }) {
  const [qrBroken, setQrBroken] = useState(false);
  const bank = info?.bank ?? {};
  const upi = info?.upi ?? {};
  const haveBank = Boolean(bank.accountNumber && bank.ifsc);

  return (
    <>
      <section className="ac-card">
        <h2>Scan and pay</h2>

        <div className="ac-pay">
          <div className="ac-pay__qr">
            {qrBroken ? (
              <p className="ac-note">
                The QR image has not been uploaded yet. Use the bank details below, or
                call us.
              </p>
            ) : (
              /* A plain img, not next/image: this file is dropped into
                 public/ by hand and may be any size. Optimising it would
                 also resample it, and a resampled QR is a QR that some
                 phones cannot read. */
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src="/upi-qr.png"
                alt="UPI QR code for paying myGallaBook"
                width={240}
                height={240}
                onError={() => setQrBroken(true)}
              />
            )}
          </div>

          <div className="ac-pay__how">
            <p className="ac-pay__amount">
              Send &#8377; {money(amount)}
            </p>
            <p className="ac-warn ac-warn--amount">
              This QR does not carry the amount. Type &#8377; {money(amount)} into your
              UPI app yourself before you pay.
            </p>
            <ol className="ac-steps">
              <li>Scan with GPay, PhonePe, Paytm or any UPI app.</li>
              <li>
                Type the amount: <strong>&#8377; {money(amount)}</strong>
              </li>
              <li>
                Put <strong>{reference}</strong> in the note or remarks.
              </li>
              <li>Pay, then come back here and enter the transaction number.</li>
            </ol>
            {upi.id ? (
              <p className="ac-note">
                Cannot scan? Our UPI ID is <strong>{upi.id}</strong>
                {upi.payeeName ? ` (${upi.payeeName})` : ""}.
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {haveBank && (
        <section className="ac-card">
          <h2>Or transfer from your bank</h2>
          <p className="ac-sub">
            NEFT, IMPS or RTGS. Put <strong>{reference}</strong> in the remarks.
          </p>
          <dl className="ac-dl-list">
            {bank.accountName ? <Copyable label="Account name" value={bank.accountName} /> : null}
            <Copyable label="Account number" value={bank.accountNumber} />
            <Copyable label="IFSC code" value={bank.ifsc} />
            {bank.bankName ? (
              <div>
                <dt>Bank</dt>
                <dd>
                  {bank.bankName}
                  {bank.branch ? `, ${bank.branch}` : ""}
                </dd>
              </div>
            ) : null}
            {bank.accountType ? (
              <div>
                <dt>Account type</dt>
                <dd>{bank.accountType}</dd>
              </div>
            ) : null}
          </dl>
          <p className="ac-note">
            Check the name your bank shows when you add the payee against the name
            above. If they do not match, stop and call us.
          </p>
        </section>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// "I have paid"
// ---------------------------------------------------------------------------
function ClaimForm({ quote, shops, onDone }) {
  const [utr, setUtr] = useState("");
  const [shopId, setShopId] = useState(quote.business?.id ? String(quote.business.id) : "");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // A plan has to land on a shop. If the quote already names one this never
  // shows; it only appears when there is a real choice to make.
  const needShop = !quote.business?.id;
  const owned = shops.filter((s) => s.role === "owner");

  useEffect(() => {
    if (needShop && !shopId && owned.length === 1) setShopId(String(owned[0].id));
  }, [needShop, shopId, owned]);

  async function submit(e) {
    e.preventDefault();
    setErr("");

    if (utr.trim().length < 4) {
      setErr("Enter the transaction number from your UPI app or bank statement.");
      return;
    }
    if (needShop && !shopId) {
      setErr("Choose which shop this plan is for.");
      return;
    }

    setBusy(true);
    try {
      const res = await api.post(
        `/api/account/payments/${encodeURIComponent(quote.reference)}/claim`,
        {
          utr: utr.trim(),
          ...(needShop ? { businessId: Number(shopId) } : {}),
          ...(note.trim() ? { note: note.trim() } : {}),
        }
      );
      // The plan may have just changed, so anything holding the old answer
      // has to let go of it.
      clearAccountCache();
      onDone(res);
    } catch (e2) {
      setErr(
        e2 instanceof ApiError ? e2.message : "Could not record that just now. Try again."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="ac-card" onSubmit={submit} noValidate>
      <h2>Paid? Tell us the transaction number</h2>
      <p className="ac-sub">
        Open the payment in your UPI app and look for the UTR, transaction ID or
        reference number. It is usually twelve digits.
      </p>

      {needShop && (
        <label className="ac-field" htmlFor="cl-shop">
          <span>
            Which shop<i aria-hidden="true">*</i>
          </span>
          <select id="cl-shop" value={shopId} onChange={(e) => setShopId(e.target.value)}>
            <option value="">Choose a shop</option>
            {owned.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="ac-field" htmlFor="cl-utr">
        <span>
          Transaction number (UTR)<i aria-hidden="true">*</i>
        </span>
        <input
          id="cl-utr"
          value={utr}
          onChange={(e) => setUtr(e.target.value)}
          placeholder="e.g. 428913756204"
          inputMode="numeric"
          autoComplete="off"
        />
      </label>

      <label className="ac-field" htmlFor="cl-note">
        <span>Anything we should know</span>
        <input
          id="cl-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. paid from my brother's account"
          autoComplete="off"
        />
      </label>
      <p className="ac-note">
        Tell us here if the money came from an account in somebody else&apos;s name -
        that is the usual reason a payment cannot be matched.
      </p>

      {err && <strong className="ac-err">{err}</strong>}

      <button type="submit" className="btn btn--primary" disabled={busy}>
        {busy ? "Checking..." : "I have paid"}
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
export default function OfflinePayment() {
  const { signedIn, ready, businessId } = useAuth();
  const { account } = useAccount();

  const [info, setInfo] = useState(null);
  const [plans, setPlans] = useState([]);
  const [planId, setPlanId] = useState("");
  const [device, setDevice] = useState("both");
  const [months, setMonths] = useState(12);
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const [quote, setQuote] = useState(null);
  const [claimed, setClaimed] = useState(null);

  useEffect(() => {
    // Both public, so this works signed out too - somebody can see what a
    // transfer would be for before making an account.
    api
      .get("/api/plans", { auth: false })
      .then((rows) => {
        const paid = (rows ?? []).filter((p) => p.code !== "free");
        setPlans(paid);
        setPlanId((id) => id || String(paid[0]?.id ?? ""));
      })
      .catch(() => setPlans([]));

    api
      .get("/api/plans/payment-info", { auth: false })
      .then(setInfo)
      .catch(() => setInfo(null));
  }, []);

  async function getQuote(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const res = await api.post("/api/account/offline-payment", {
        planId: Number(planId),
        device,
        periodMonths: Number(months),
        quantity: Number(quantity),
        method: "upi",
        ...(businessId ? { businessId: Number(businessId) } : {}),
      });
      setQuote(res);
    } catch (e2) {
      setErr(e2 instanceof ApiError ? e2.message : "Could not work that out just now.");
    } finally {
      setBusy(false);
    }
  }

  if (!ready) return null;

  if (!signedIn) {
    return (
      <section className="ac-card">
        <h2>Sign in first</h2>
        <p>
          We give you a reference to put on the payment. Without one we cannot tell
          whose money has arrived.
        </p>
        <Link href="/login" className="btn btn--primary">
          Sign in
        </Link>
      </section>
    );
  }

  // ---- after they have told us the transaction number --------------------
  if (claimed) {
    return (
      <section className="ac-card ac-done">
        <h2>{claimed.planStarted ? "Your plan is on" : "Got it"}</h2>
        {claimed.planStarted ? (
          <>
            <p>
              {claimed.plan?.name} is running
              {claimed.expiresAt
                ? ` until ${new Date(claimed.expiresAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}`
                : ""}
              .
              {claimed.extended ? " The days you had left were added on top." : ""}
            </p>
            <p className="ac-note">
              We match every payment against our bank as a matter of course. Keep the
              transaction number safe until then.
            </p>
          </>
        ) : (
          <p>{claimed.next}</p>
        )}
        <Link href="/account" className="btn btn--primary">
          Go to my account
        </Link>
      </section>
    );
  }

  // ---- they have a reference, now pay ------------------------------------
  if (quote) {
    return (
      <>
        <section className="ac-card">
          <h2>Your reference</h2>
          <p className="ac-ref">{quote.reference}</p>
          <p>
            {quote.plan?.name}
            {quote.quantity > 1 ? ` x${quote.quantity}` : ""} &mdash;{" "}
            <strong>&#8377; {money(quote.amount)}</strong>
            {quote.quantity > 1 ? ` (${quote.quantity} × ₹${money(quote.unitPrice)})` : ""}
          </p>
          <p className="ac-note">{quote.next}</p>
          <button
            type="button"
            className="btn btn--ghost btn--small"
            onClick={() => setQuote(null)}
          >
            Work out a different amount
          </button>
        </section>

        <PayHere info={info} amount={quote.amount} reference={quote.reference} />

        <ClaimForm
          quote={quote}
          shops={account?.shops ?? []}
          onDone={(res) => setClaimed(res)}
        />
      </>
    );
  }

  // ---- work out what they owe --------------------------------------------
  return (
    <form className="ac-card" onSubmit={getQuote} noValidate>
      <h2>What are you paying for?</h2>
      <p className="ac-sub">
        Pick it and we will give you the amount, a QR to scan, and a reference.
      </p>

      <label className="ac-field" htmlFor="op-plan">
        <span>Plan</span>
        <select id="op-plan" value={planId} onChange={(e) => setPlanId(e.target.value)}>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      {/* The price depends on all three, so none of them is shown with a
          figure beside it. The amount comes back from the server, which is
          the only number that matters. */}
      <label className="ac-field" htmlFor="op-device">
        <span>For</span>
        <select id="op-device" value={device} onChange={(e) => setDevice(e.target.value)}>
          <option value="both">Desktop + Mobile</option>
          <option value="mobile">Mobile only</option>
          <option value="desktop">Desktop only</option>
        </select>
      </label>

      <label className="ac-field" htmlFor="op-term">
        <span>How long</span>
        <select
          id="op-term"
          value={months}
          onChange={(e) => setMonths(Number(e.target.value))}
        >
          <option value={12}>1 year</option>
          <option value={36}>3 years</option>
        </select>
      </label>

      <label className="ac-field" htmlFor="op-qty">
        <span>How many licences</span>
        <input
          id="op-qty"
          type="number"
          min="1"
          max="50"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
      </label>
      {Number(quantity) > 1 && (
        <p className="ac-note">
          More than one licence is sent as keys you hand out, so it does not switch a
          plan on by itself. We will email the keys once the payment is checked.
        </p>
      )}

      {err && <strong className="ac-err">{err}</strong>}

      <button type="submit" className="btn btn--primary" disabled={busy || !planId}>
        {busy ? "Working..." : "Show me how to pay"}
      </button>
    </form>
  );
}
