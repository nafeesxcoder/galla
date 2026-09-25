import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { SITE } from "@/lib/site";
import Reveal from "@/components/Reveal";
import InvoiceMock from "@/components/InvoiceMock";
import CtaBand from "@/components/CtaBand";
import { SyncArt } from "@/components/home/Illustrations";

export const metadata = pageMeta({
  title: "Desktop app",
  description:
    "Fast billing on Windows with keyboard shortcuts, barcode scanners and thermal printers. Works offline and syncs with your phone.",
  path: "/desktop",
});

const why = [
  ["Built for a keyboard", "Bill without touching the mouse. Every field has a shortcut, so a regular customer is done in seconds."],
  ["Made for a queue", "A bigger screen means more items visible at once, which matters when six people are waiting."],
  ["Plugs into your counter", "Thermal printer, barcode scanner, weighing scale and cash drawer all work with it."],
];

const shortcuts = [
  ["Alt + S", "New sale bill"],
  ["Alt + P", "New purchase entry"],
  ["Alt + E", "New estimate"],
  ["Ctrl + F", "Find an item or party"],
  ["Ctrl + P", "Print the current bill"],
  ["Alt + R", "Open reports"],
];

const hardware = [
  ["Thermal printers", "2-inch and 3-inch counter receipt printers."],
  ["Barcode scanners", "Any USB or Bluetooth scanner, plus label printing."],
  ["Weighing scales", "Weight fills the quantity field while you bill."],
  ["Card machines", "Record card and UPI settlements against the right bill."],
];

const steps = [
  ["Download the installer", "One file, under 100 MB. No extra software needed."],
  ["Open it and follow the prompts", "Takes about a minute on most computers."],
  ["Log in with your mobile number", "The same account you use on the phone app."],
  ["Your data is already there", "Items, parties and bills sync down on first login."],
];

const faqs = [
  [
    "Do I need the internet for the desktop app?",
    "Only to sync. Billing, stock and reports all work offline, and everything uploads the moment you reconnect.",
  ],
  [
    "Can I use the desktop app and my phone together?",
    "Yes. One account covers both. A bill made at the counter shows up on your phone within seconds.",
  ],
  [
    "Is there a Mac version?",
    "Not yet. On a Mac you can use the mobile app or open your account in a browser.",
  ],
  [
    "Where is my data stored?",
    "On the computer, with an encrypted copy in the cloud. You can export everything to Excel or PDF any time.",
  ],
];

export default function Desktop() {
  return (
    <>
      <nav className="crumbs wrap" aria-label="Breadcrumb">
        <Link href="/">Home</Link> <span aria-hidden="true">/</span> <span>Desktop app</span>
      </nav>

      <section className="hero">
        <div className="wrap hero__grid">
          <div>
            <span className="pill">Windows 8 and newer</span>
            <h1>Counter billing, on a proper keyboard</h1>
            <p className="lead">
              The full {SITE.name} account on your computer. Shortcuts instead of taps, a bigger
              screen for a busy counter, and the same data as your phone.
            </p>
            <div className="btn-row">
              <a href="#" className="btn btn--primary">
                Download for Windows
              </a>
              <Link href="/mobile-app" className="btn btn--ghost">
                Get the mobile app
              </Link>
            </div>
            <div className="ministats">
              <div>
                <b>Offline</b>
                <span>Bills without internet</span>
              </div>
              <div>
                <b>Free</b>
                <span>Plan available</span>
              </div>
            </div>
          </div>
          <InvoiceMock />
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <Reveal>
            <span className="eyebrow">Why a desktop app</span>
            <h2>Some counters just need a computer</h2>
          </Reveal>
          <div className="fgrid">
            {why.map(([t, d], i) => (
              <Reveal key={t} delay={i * 80}>
                <article className="fcard">
                  <span className="fcard__dot" aria-hidden="true" />
                  <h3>{t}</h3>
                  <p>{d}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--wash">
        <div className="wrap artsplit artsplit--flip">
          <Reveal className="artsplit__art">
            <SyncArt />
          </Reveal>
          <Reveal delay={120}>
            <span className="eyebrow">Keyboard first</span>
            <h2>Shortcuts worth learning on day one</h2>
            <p className="lead">
              Your hands stay on the keyboard while the queue moves. These are the six that get used
              most.
            </p>
            <div className="table-wrap">
              <table className="compare">
                <thead>
                  <tr>
                    <th>Keys</th>
                    <th>What it does</th>
                  </tr>
                </thead>
                <tbody>
                  {shortcuts.map(([k, d]) => (
                    <tr key={k}>
                      <td>{k}</td>
                      <td>{d}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <Reveal>
            <span className="eyebrow">Hardware</span>
            <h2>Works with what is already on your counter</h2>
          </Reveal>
          <div className="fgrid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
            {hardware.map(([t, d], i) => (
              <Reveal key={t} delay={(i % 4) * 70}>
                <article className="fcard">
                  <span className="fcard__dot" aria-hidden="true" />
                  <h3>{t}</h3>
                  <p>{d}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--wash">
        <div className="wrap">
          <Reveal>
            <span className="eyebrow">Installing it</span>
            <h2>Four steps, about five minutes</h2>
          </Reveal>
          <ol className="setup">
            {steps.map(([t, d], i) => (
              <Reveal as="li" key={t} delay={i * 90} className="setup__item">
                <span className="setup__num">{i + 1}</span>
                <h3>{t}</h3>
                <p>{d}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <Reveal>
            <h2>System requirements</h2>
          </Reveal>
          <div className="table-wrap">
            <table className="compare">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Minimum</th>
                  <th>Recommended</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Operating system</td>
                  <td>Windows 8</td>
                  <td>Windows 10 or 11</td>
                </tr>
                <tr>
                  <td>RAM</td>
                  <td>2 GB</td>
                  <td>4 GB</td>
                </tr>
                <tr>
                  <td>Storage</td>
                  <td>500 MB</td>
                  <td>2 GB</td>
                </tr>
                <tr>
                  <td>Screen</td>
                  <td>1366 x 768</td>
                  <td>1920 x 1080</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section section--wash">
        <div className="wrap">
          <Reveal className="center">
            <h2>Desktop questions</h2>
          </Reveal>
          <div className="faq faq--home">
            {faqs.map(([q, a]) => (
              <details key={q} name="desk-faq">
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
