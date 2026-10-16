import InvoiceMock from "@/components/InvoiceMock";
import { ShopArt, SyncArt, GrowthArt } from "@/components/home/Illustrations";

// Compliance / record-keeping illustration
export function ShieldArt() {
  return (
    <svg className="art" viewBox="0 0 420 300" role="img" aria-label="A record book kept safe">
      <circle className="art__blob" cx="330" cy="80" r="58" fill="var(--wash)" />
      <path d="M210 26 118 60v86c0 58 41 99 92 114 51-15 92-56 92-114V60z" fill="#fff"
        stroke="var(--ink)" strokeWidth="3" />
      <path d="M210 26 118 60v86c0 58 41 99 92 114z" fill="var(--wash)" opacity=".55" />
      <g stroke="var(--ledger)" strokeWidth="7" strokeLinecap="round">
        <path d="M156 104h108M156 132h108M156 160h74" />
      </g>
      <circle className="art__pulse" cx="266" cy="176" r="10" fill="var(--marigold)" />
      <g className="art__float">
        <circle cx="266" cy="176" r="30" fill="var(--ledger)" />
        <path d="M252 176l9 10 19-20" fill="none" stroke="#fff" strokeWidth="5"
          strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

export default function Art({ name }) {
  if (name === "invoice") return <InvoiceMock />;
  if (name === "sync") return <SyncArt />;
  if (name === "growth") return <GrowthArt />;
  if (name === "shield") return <ShieldArt />;
  return <ShopArt />;
}
