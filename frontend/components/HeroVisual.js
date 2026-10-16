// Original device mockup: monitor (dashboard) + phone (invoice) + payment card.
// Apni image lagani ho to: public/hero.webp rakho aur is component ki jagah
// <img src="/hero.webp" alt="..." className="hero__img" /> use karo.

const bars = [38, 52, 44, 66, 58, 80, 72];

export function PhoneMock({ className = "" }) {
  return (
    <div className={`phone ${className}`} aria-hidden="true">
      <div className="phone__notch" />
      <div className="phone__screen">
        <div className="phone__bar">Invoice #482</div>
        <div className="phone__body">
          <b>Sharma General Store</b>
          <small>GSTIN 09ABCDE1234F1Z5</small>
          <div className="phone__rows">
            <span>Basmati rice ×4</span><span>₹7,400</span>
            <span>Mustard oil ×2</span><span>₹4,480</span>
            <span>Tiffin set ×6</span><span>₹2,520</span>
            <span>CGST + SGST</span><span>₹896</span>
          </div>
          <div className="phone__total"><span>Total</span><span>₹15,296</span></div>
          <div className="phone__share">Share on WhatsApp</div>
        </div>
      </div>
    </div>
  );
}

export default function HeroVisual() {
  return (
    <div className="hv" role="img" aria-label="Billing dashboard on a computer and an invoice on a phone">
      <div className="monitor">
        <div className="monitor__screen">
          <div className="dash">
            <aside className="dash__side">
              <i /><i /><i /><i /><i />
            </aside>
            <div className="dash__main">
              <div className="dash__top">
                <div><small>Sales this month</small><b>₹2,48,500</b></div>
                <span className="dash__up">+18%</span>
              </div>
              <div className="dash__chart">
                {bars.map((h, i) => <span key={i} style={{ height: `${h}%` }} />)}
              </div>
              <div className="dash__cards">
                <div><small>To collect</small><b className="in">₹42,300</b></div>
                <div><small>To pay</small><b className="out">₹11,860</b></div>
              </div>
            </div>
          </div>
        </div>
        <div className="monitor__neck" />
        <div className="monitor__base" />
      </div>

      <PhoneMock className="hv__phone" />

      <div className="hv__toast">
        <span className="hv__tick" aria-hidden="true" />
        <div><small>Payment received via UPI</small><b>₹3,540.00</b></div>
      </div>
    </div>
  );
}
