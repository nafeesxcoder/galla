// ===========================================================================
// LoginPage - what /login shows
// ---------------------------------------------------------------------------
// The popup and this page share the same LoginCard, but they end differently:
//
//   popup  -> you stay on the page you were reading, it just closes.
//             (This is what Vyapar does, and what we copied.)
//
//   /login -> there is nothing behind it to stay on, so once you are signed
//             in we send you to /account.
//
// It also handles the two other cases /login has to cope with:
//   - you are ALREADY signed in and you open /login   -> straight to /account
//   - a link sent you here from somewhere specific    -> back to that page
//
// The second one uses ?next=, so /login?next=/pricing returns you to pricing
// after signing in. Anything that is not a path on this site is ignored, so
// nobody can use the parameter to bounce your users to another website.
// ===========================================================================

"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/account/AuthProvider";
import LoginCard from "./LoginCard";

export default function LoginPage() {
  const { signedIn, ready } = useAuth();
  const router = useRouter();
  const params = useSearchParams();

  const raw = params.get("next");
  // Only a plain path on this site. "//evil.com" and "https://evil.com" are
  // both rejected - an open redirect is a real phishing route.
  const next = raw && /^\/(?!\/)[\w\-./?=&%#]*$/.test(raw) ? raw : "/account";

  useEffect(() => {
    if (ready && signedIn) router.replace(next);
  }, [ready, signedIn, next, router]);

  // While we work out whether someone is signed in, and again in the moment
  // between signing in and the redirect landing, show this instead of
  // flashing the login form back up.
  if (!ready || signedIn) {
    return (
      <div className="lg-wait">
        <span className="lg-wait__spin" aria-hidden="true" />
        <p>{signedIn ? "Signing you in..." : "One moment..."}</p>
      </div>
    );
  }

  return <LoginCard />;
}
