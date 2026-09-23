import { pageMeta } from "@/lib/seo";
import Link from "next/link";
import InvoiceMock from "@/components/InvoiceMock";

export const metadata = pageMeta({
  title: "Desktop app",
  description:
    "Fast billing on Windows with keyboard shortcuts, barcode scanners and thermal printers. Works offline.",
  path: "/desktop",
});

export default function Desktop() {
  return (
    <>
      <section className="hero">
        <div className="wrap hero__grid">
          <div>
            <h1>Fast billing on your computer</h1>
            <p className="lead">Keyboard shortcuts, barcode scanners and thermal printers all work. Runs on Windows 8 and newer.</p>
            <div className="btn-row">
              <a href="#" className="btn btn--primary">Download for Windows</a>
              <Link href="/mobile-app" className="btn btn--ghost">Get the mobile app</Link>
            </div>
            <ul className="checklist">
              <li>Bill offline, sync automatically later</li>
              <li>Same data on mobile and desktop</li>
              <li>Automatic daily backup</li>
            </ul>
          </div>
          <InvoiceMock />
        </div>
      </section>
      <section className="section section--wash">
        <div className="wrap">
          <h2>System requirements</h2>
          <div className="table-wrap">
            <table className="compare">
              <thead><tr><th>Item</th><th>Minimum</th><th>Recommended</th></tr></thead>
              <tbody>
                <tr><td>Operating system</td><td>Windows 8</td><td>Windows 10 / 11</td></tr>
                <tr><td>RAM</td><td>2 GB</td><td>4 GB</td></tr>
                <tr><td>Storage</td><td>500 MB</td><td>2 GB</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}

