// ===========================================================================
// The "already have a licence?" form
// ---------------------------------------------------------------------------
// It now does the thing. POST /api/account/licences/redeem attaches the key
// to a shop and extends that shop's plan.
//
// Two decisions worth knowing about:
//
// The key is cleaned as it is typed - upper-cased and regrouped - but the
// characters are NOT corrected here. The server already maps the letters
// people misread (O for zero, I and l for one) and it is the one that
// decides what a valid key is. Doing it in two places means one of them
// drifts, and the one that drifts is the one nobody tests.
//
// Which shop a key goes to is a real choice when somebody owns several, so
// it is asked rather than assumed. A key is spent the moment it is applied,
// and applying a year of Gold to the wrong shop is not a mistake the person
// can undo themselves.
// ===========================================================================

"use client";
import { useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "./AuthProvider";
import { useAccount, clearAccountCache } from "./useAccount";

const KEY_LENGTH = 20;

export default function LicenceForm() {
  const { signedIn, ready, businesses, businessId } = useAuth();
  const { refresh } = useAccount();

  const [key, setKey] = useState("");
  const [shop, setShop] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);

  // Licence keys are shown in groups of five. This keeps what the person
  // types tidy without fighting them.
  function clean(v) {
    return v
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, KEY_LENGTH)
      .replace(/(.{5})(?=.)/g, "$1-");
  }

  const chosen = shop || businessId || businesses[0]?.id || "";

  async function submit(e) {
    e.preventDefault();

    const bare = key.replace(/-/g, "");
    if (bare.length !== KEY_LENGTH) {
      setErr("A licence key is 20 characters, like ABCDE-12345-FGHJK-67890.");
      return;
    }
    if (!chosen) {
      setErr("Set up your shop first - a licence has to go to a shop.");
      return;
    }

    setErr("");
    setBusy(true);

    try {
      const res = await api.post("/api/account/licences/redeem", {
        code: key,
        businessId: Number(chosen),
      });
      // The plan on this account has just changed, so anything showing it is
      // now out of date.
      clearAccountCache();
      await refresh();
      setDone(res);
    } catch (e2) {
      setErr(
        e2 instanceof ApiError
          ? e2.message
          : "That key could not be applied just now."
      );
    } finally {
      setBusy(false);
    }
  }

  if (!ready) return <div className="ac-card">Loading...</div>;

  if (!signedIn) {
    return (
      <div className="ac-card">
        <h2>Sign in first</h2>
        <p>A licence key attaches to an account, so we need to know whose it is.</p>
        <Link href="/login" className="btn btn--primary">
          Sign in
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="ac-card ac-done">
        <span className="ac-done__tick" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 13l4 4L19 7" />
          </svg>
        </span>
        {/* "Added" and "started" are different news, and somebody who renewed
            early needs to see that their remaining days were not thrown away. */}
        <h2>{done.extended ? `${done.months} months added` : `${done.plan?.name ?? "Your plan"} is on`}</h2>
        <p>
          This shop now runs until{" "}
          <strong>
            {new Date(done.expiresAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </strong>
          .
        </p>
        <Link href="/account" className="btn btn--primary">
          Back to my account
        </Link>
      </div>
    );
  }

  return (
    <form className="ac-card" onSubmit={submit} noValidate>
      <label className="ac-field" htmlFor="ac-key">
        <span>Licence key</span>
        <input
          id="ac-key"
          value={key}
          placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
          onChange={(e) => {
            setKey(clean(e.target.value));
            if (err) setErr("");
          }}
          className={err ? "is-bad" : undefined}
          autoComplete="off"
          spellCheck="false"
        />
        {err && <strong className="ac-err">{err}</strong>}
      </label>

      {/* Only asked when there is actually a choice to make. */}
      {businesses.length > 1 && (
        <label className="ac-field" htmlFor="ac-shop">
          <span>Apply it to</span>
          <select id="ac-shop" value={chosen} onChange={(e) => setShop(e.target.value)}>
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <button type="submit" className="btn btn--primary" disabled={busy}>
        {busy ? "Checking..." : "Attach licence"}
      </button>

      <p className="ac-note">
        If time is still left on this shop&apos;s plan, the new months are added on top of
        it. Nothing you have already paid for is lost.
      </p>
    </form>
  );
}
