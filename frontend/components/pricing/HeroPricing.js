// ===========================================================================
// SECTION 1  -  the page heading above the plans
// IMAGE: none
// ===========================================================================

export default function HeroPricing({ head }) {
  return (
    <section className="page-head pr-head">
      <div className="wrap center">
        <span className="eyebrow">{head.eyebrow}</span>
        <h1>{head.h1}</h1>
        <p className="lead">{head.lead}</p>
      </div>
    </section>
  );
}
