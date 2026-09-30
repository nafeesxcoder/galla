import LoginCard from "@/components/login/LoginCard";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Login - Galla",
  description: "Log in to your Galla account with your mobile number or email.",
  path: "/login",
});

// Anyone who opens /login directly gets the same card on a plain page.
// Clicking "Login" in the navbar opens it as a popup instead.
export default function Page() {
  return (
    <section className="section lg-page">
      <div className="wrap">
        <LoginCard />
      </div>
    </section>
  );
}
