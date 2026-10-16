import SimplePage from "@/components/account/SimplePage";
import OfflinePayment from "@/components/account/OfflinePayment";
import MyPayments from "@/components/account/MyPayments";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Pay by UPI or bank transfer",
  description: "Pay for myGallaBook by UPI, bank transfer, cheque or demand draft.",
  path: "/account/offline-payment",
});
metadata.robots = { index: false, follow: false };

// The bank details are NOT here any more.
//
// They used to be a hardcoded list in this file, which meant the website and
// the app could print different account numbers and nobody would notice
// until money went somewhere it could not be recovered from. They now come
// from GET /api/plans/payment-info, which is the same place the app reads
// them. One account number, one source.
//
// To change them: backend .env - BANK_ACCOUNT_NAME, BANK_ACCOUNT_NUMBER,
// BANK_IFSC, BANK_NAME, BANK_BRANCH - or the defaults in src/config/index.js.

export default function Page() {
  return (
    <SimplePage
      title="Pay for your plan"
      lead="Scan the QR with any UPI app, or transfer from your bank. Then tell us the transaction number."
    >
      <OfflinePayment />
      <MyPayments />

      <section className="ac-card">
        <h2>How it works</h2>
        <ol className="ac-steps">
          <li>Choose your plan above and we give you the amount and a reference.</li>
          <li>Pay by UPI or bank transfer, with the reference in the remarks.</li>
          <li>Enter the transaction number from your UPI app or bank statement.</li>
          <li>Your plan starts, and we match the payment against our bank afterwards.</li>
        </ol>
        <p className="ac-note">
          Cheques and demand drafts are slower, because we have to wait for them to
          clear before anything can be switched on. Post them to our office and email
          us the cheque number.
        </p>
      </section>
    </SimplePage>
  );
}
