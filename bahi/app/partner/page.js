import PartnerForm from "./PartnerForm";

export const metadata = { title: "Partner with us" };

export default function Partner() {
  return (
    <>
      <section className="page-head">
        <div className="wrap">
          <h1>Become a partner and earn on every sale</h1>
          <p className="lead">A recurring commission program for resellers, CAs and tax consultants.</p>
        </div>
      </section>
      <section className="section">
        <div className="wrap split" style={{ alignItems: "start" }}>
          <div>
            <h2>What partners get</h2>
            <ul className="checklist">
              <li>Up to 30% commission on every license</li>
              <li>Recurring income on renewals</li>
              <li>Free demo account and training</li>
              <li>A dedicated partner manager</li>
            </ul>
            <ol className="steps" style={{ gridTemplateColumns: "1fr", gap: "1.2rem" }}>
              <li><h3>Fill in the form</h3></li>
              <li><h3>Get a call and training from our team</h3></li>
              <li><h3>Onboard customers and earn commission</h3></li>
            </ol>
          </div>
          <div className="panel"><PartnerForm /></div>
        </div>
      </section>
    </>
  );
}
