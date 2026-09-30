import { Suspense } from "react";
import LoginPage from "@/components/login/LoginPage";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Login - Galla",
  description: "Log in to your Galla account with your mobile number or email.",
  path: "/login",
});

// A login page has no business being in Google's index.
metadata.robots = { index: false, follow: false };

// Anyone who opens /login directly gets the card on a plain page.
// Clicking "Login" in the navbar opens it as a popup instead.
//
// The Suspense wrapper is required: LoginPage reads ?next= with
// useSearchParams, and Next needs a boundary around that on a static page.
export default function Page() {
  return (
    <section className="section lg-page">
      <div className="wrap">
        <Suspense
          fallback={
            <div className="lg-wait">
              <span className="lg-wait__spin" aria-hidden="true" />
              <p>One moment...</p>
            </div>
          }
        >
          <LoginPage />
        </Suspense>
      </div>
    </section>
  );
}
