import SimplePage from "@/components/account/SimplePage";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Offline payment",
  description: "Pay for Galla by bank transfer, cheque or demand draft.",
  path: "/account/offline-payment",
});
metadata.robots = { index: false, follow: false };

// TODO: put your real bank details here before you tell anyone to use this.
//       Double-check every digit - a wrong account number means money goes
//       somewhere you cannot get it back from.
const BANK = [
  ["Account name", "TODO Your Company Name Pvt Ltd"],
  ["Account number", "TODO 000000000000"],
  ["IFSC code", "TODO XXXX0000000"],
  ["Bank and branch", "TODO Bank Name, Branch"],
  ["Account type", "Current"],
];

export default function Page() {
  return (
    <SimplePage
      title="Offline payment"
      lead="Prefer to pay by bank transfer, cheque or demand draft? Here is how."
    >
      <section className="ac-card">
        <h2>Our bank details</h2>
        <dl className="ac-dl-list">
          {BANK.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="ac-card">
        <h2>After you pay</h2>
        <ol className="ac-steps">
          <li>Make the transfer, or send the cheque or DD to our office address.</li>
          <li>Email us the transaction reference or the cheque number.</li>
          <li>Tell us the plan you want and the mobile number on your account.</li>
          <li>We confirm the payment and activate your plan, usually within two working days.</li>
        </ol>
        <p className="ac-note">
          Cheques and demand drafts take longer, because we have to wait for them to
          clear before we can activate anything.
        </p>
      </section>
    </SimplePage>
  );
}
