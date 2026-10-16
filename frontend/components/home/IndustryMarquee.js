const items = [
  "Grocery",
  "Supermarket",
  "Pharmacy",
  "Jewellery",
  "Cloth shop",
  "Electronics",
  "Restaurant",
  "Hardware",
  "Mobile shop",
  "Salon & spa",
  "Hotel",
  "Transport",
  "Stationery",
  "Auto parts",
];

export default function IndustryMarquee() {
  return (
    <div className="marquee" aria-label="Business types we support">
      <div className="marquee__track">
        {[...items, ...items].map((x, i) => (
          <span key={`${x}-${i}`}>{x}</span>
        ))}
      </div>
    </div>
  );
}
