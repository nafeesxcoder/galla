// heroart.mjs - Pharmacy hero ka app mockup (invoice + expiring stock + low stock).
// Chalao project folder se:   node heroart.mjs

import { writeFileSync, readFileSync, mkdirSync, existsSync, copyFileSync } from "node:fs";
import { dirname } from "node:path";

if (!existsSync("package.json")) {
  console.log("\npackage.json nahi mila. Kya aap 'bahi' folder ke andar ho?\n");
  process.exit(1);
}
if (!existsSync("components/industry/IndustryHero.js")) {
  console.log("\nPehle pharmacy.mjs chalao.\n");
  process.exit(1);
}

const put = (p, body) => {
  mkdirSync(dirname(p), { recursive: true });
  if (existsSync(p)) copyFileSync(p, p + ".bak");
  writeFileSync(p, body, "utf8");
  console.log("  wrote   " + p);
};

console.log("\nBuilding the pharmacy hero artwork...\n");

put("lib/industry-content.js", `// Industry pages ka detailed content. Jis slug ka content yahan hai,
// us page par saare sections dikhenge. Baki pages simple rehte hain.
// Naya section chahiye to yahan key add karo - component apne aap render kar dega.

export const CONTENT = {
  pharmacy: {
    hero: {
      badge: "Built for chemists and medical stores",
      h1: "Pharmacy billing software",
      lead:
        "Make GST bills, track every batch and expiry date, watch your stock and run the counter from one app. Free to start, works offline.",
      chips: ["Drug licence on the bill", "Batch details", "GST slabs", "Expiry alerts"],
      cta: "Download free",
      cta2: "See pricing",
      trust: ["Made for Indian pharmacies", "Schedule H and H1 records", "Free plan, no expiry"],
      art: "pharmacy",
    },

    intro: {
      eyebrow: "The basics",
      h2: "What is pharmacy billing software?",
      body: [
        "It is the software a chemist shop uses instead of a bill book and a stock register. You add your medicines once, and from then on every sale makes a proper GST bill, reduces the stock, and records which batch went out and when it expires.",
        "The same data then gives you your purchase records, party ledgers and the summaries your CA needs at return time. Meeting drug and tax rules is still your responsibility, but the records are kept in a form you can produce on demand.",
      ],
    },

    whoFor: {
      eyebrow: "Who it is for",
      h2: "Made for every kind of pharmacy business",
      lead: "Whether you run one counter or supply to fifty of them.",
      items: [
        [
          "Chemist stores",
          "GST bills at the counter, batch and expiry on every line, barcode billing and low stock alerts for daily retail.",
          "pill",
        ],
        [
          "Pharma distributors",
          "Bulk tax invoices, strip and box conversions, manufacturer batch numbers and party-wise margins.",
          "truck",
        ],
        [
          "Hospital pharmacies",
          "Bills tied to patient records, doctor-wise prescription history and emergency stock room tracking.",
          "shield",
        ],
        [
          "Chain pharmacies",
          "Stock across branches, central purchase and store-wise sales from one login.",
          "cart",
        ],
      ],
    },

    features: {
      eyebrow: "Key features",
      h2: "Billing, expiry, wholesale and compliance in one system",
      lead: "The parts of a pharmacy that a general billing app never gets right.",
      blocks: [
        {
          h3: "GST invoicing with a drug licence field",
          p: "Bills that satisfy both the customer and the inspector. Enter your drug licence number once and it prints on every invoice after that.",
          points: [
            "Drug licence number added to invoices automatically",
            "GST worked out by medicine category (Nil, 5%, 18%)",
            "Share the bill by print, WhatsApp or email",
            "HSN codes stored against each medicine",
          ],
          note: "Rates change from time to time. Check the current slabs on gst.gov.in before you rely on them.",
          art: "invoice",
        },
        {
          h3: "Batch and expiry on every bill",
          p: "Know which batch each strip came from and when it runs out. Near-expiry stock shows up while you can still return it.",
          points: [
            "Batch number recorded at the time of billing",
            "Expiry date printed on the invoice",
            "Filter stock by expiry so old batches move first",
            "Stock movement visible across every medicine category",
          ],
          art: "sync",
        },
        {
          h3: "Schedule H and H1 records",
          p: "Restricted medicines need a register that holds up during an inspection. That register is kept for you, every time such a medicine is billed.",
          points: [
            "Only an admin or authorised staff member can release restricted medicines for billing",
            "A description field records the prescription reference, doctor name or reason",
            "The digital Schedule H and H1 register updates with every transaction",
            "Restricted medicines can be switched off at the counter when not needed",
            "Full history retrievable in seconds during an inspection",
          ],
          note: "Requirements come from the Drugs and Cosmetics Act, 1940 and its Rules, 1945. Your pharmacist remains responsible for compliance.",
          art: "shield",
        },
        {
          h3: "Wholesale billing for distributors",
          p: "Built for volume. Bulk orders, party accounts and credit, without a spreadsheet on the side.",
          points: [
            "Bulk invoices with many products on one bill",
            "PTR or MRP based pricing, whichever your trade uses",
            "Party-wise ledger for purchases, payments and outstanding",
            "Credit limits so one buyer cannot run up the whole book",
            "Purchase returns and expired stock handled cleanly",
          ],
          art: "growth",
        },
      ],
    },

    steps: {
      eyebrow: "Getting started",
      h2: "Billing at your counter in four steps",
      lead: "No training needed. Most shops make their first bill the same evening.",
      items: [
        ["Download the app", "Install it on an Android phone or a Windows computer and set up your shop."],
        ["Add your medicines", "Enter or import items with batch, expiry and rates. Excel imports work."],
        ["Make your first bill", "Pick the customer, scan or search the medicine, print or share on WhatsApp."],
        ["Watch stock and records", "Expiry alerts, low stock warnings and GST summaries build up on their own."],
      ],
    },

    compare: {
      eyebrow: "What changes",
      h2: "Register, generic software, and a pharmacy app",
      head: ["What you need", "Paper register", "General billing app", "Pharmacy billing"],
      rows: [
        ["GST by medicine category", "Worked out by hand", "Partly supported", "Nil, 5% or 18% applied for you"],
        ["Batch and expiry", "Paper register only", "Usually missing", "Recorded on every bill"],
        ["Drug licence on the invoice", "Rubber stamp", "Not supported", "Added from settings"],
        ["Schedule H and H1 register", "Physical register", "Not supported", "Kept digitally, role controlled"],
        ["Restricted drug access", "No control", "No control", "Admin releases it"],
        ["Works on phone and computer", "No", "Mostly desktop only", "Android and Windows"],
      ],
    },

    extras: {
      eyebrow: "Also in the app",
      h2: "Barcode billing, stock alerts and GST reports",
      lead: "The smaller things that save an hour a day once the counter gets busy.",
      items: [
        ["Barcode billing", "Scan the strip and it is on the bill. Fewer wrong medicines, faster queues.", "pos"],
        ["Low stock alerts", "Set a minimum for each medicine and reorder before the shelf is empty.", "box"],
        ["GST reports", "Category-wise summaries for GSTR-1 and GSTR-3B, pulled from your own bills.", "ledger"],
      ],
    },

    trust: {
      eyebrow: "Why pharmacies use it",
      h2: "Built around how a chemist shop actually works",
      items: [
        [
          "Made for pharmacy rules",
          "Drug licence details, batch and expiry tracking and audit-ready records are part of the app, not an add-on.",
          "shield",
        ],
        [
          "Simple enough for the counter",
          "No accounting background needed. Staff pick it up during a normal shift.",
          "users",
        ],
        [
          "Your records stay yours",
          "Everything is backed up and exportable to Excel or PDF whenever you want it.",
          "ledger",
        ],
      ],
    },

    related: {
      h2: "Other tools pharmacies use",
      items: [
        ["POS software", "/software/pos-software", "Counter billing with barcode scanning and quick payment modes."],
        ["Inventory software", "/software/inventory-software", "Batch tracking, purchase orders and expiry alerts."],
        ["Billing software", "/software/billing-software", "Quick bills, barcode receipts and daily sales tracking."],
        ["Accounting software", "/software/accounting-software", "Ledgers, expenses, profit and loss and cash flow."],
        ["E-invoice software", "/software/e-invoice-software", "IRN and e-way bills straight from the invoice."],
      ],
    },

    faqs: [
      [
        "What is pharmacy billing software and why does a chemist need it?",
        "It replaces the bill book and the stock register with one system. Bills carry GST and your drug licence number, stock reduces as you sell, and batch and expiry are recorded automatically. The point is not speed alone. It is having records you can produce during an inspection without digging through papers.",
      ],
      [
        "Can my drug licence number print on the invoice?",
        "Yes. Enter it once in your shop settings and it appears on every invoice after that, along with your GSTIN and shop details.",
      ],
      [
        "How does expiry tracking work?",
        "Stock is kept batch-wise, and each batch carries its expiry date. When you bill, the batch is recorded on the invoice. You can also sort your stock by expiry to move or return the oldest batches first.",
      ],
      [
        "Does it handle the different GST rates on medicines?",
        "Yes. Set the rate against each medicine once and it is applied on every bill, whether that is nil-rated, 5% or 18%. Rates change from time to time, so check the current slabs on gst.gov.in.",
      ],
      [
        "How does it help with Schedule H and H1 medicines?",
        "Restricted medicines can only be released for billing by an admin or an authorised staff member, and releasing one requires a note such as the prescription reference or doctor name. The digital register builds up with every transaction and can be pulled up during an inspection.",
      ],
      [
        "Is it suitable for a wholesale pharma business?",
        "Yes. Bulk invoices, strip and box conversions, PTR or MRP based pricing, party ledgers and credit limits are all supported.",
      ],
      [
        "Can I use a barcode scanner?",
        "Yes. Any USB or Bluetooth scanner works, and you can print your own barcode labels for repacked or loose items.",
      ],
      [
        "What happens during a drug inspection or GST audit?",
        "Your transaction history is searchable by date, party or medicine name, and batch and expiry records stay current. GST summaries are ready at the end of each return period.",
      ],
      [
        "Does it work on both phone and computer?",
        "Yes. One account covers an Android phone and a Windows computer, and bills made on one show up on the other.",
      ],
      [
        "Is there a free version?",
        "Yes. The free plan covers unlimited GST and non-GST bills on one device. Paid plans add more devices, staff logins and the compliance reports.",
      ],
      [
        "Will it work if the internet goes down?",
        "Yes. Billing runs offline and everything syncs the moment you are back online.",
      ],
      [
        "Can I move my existing records in?",
        "Medicines, suppliers, customers and opening balances can be imported from an Excel or CSV file.",
      ],
      [
        "Can I control which staff can bill restricted medicines?",
        "Yes. Each staff member has their own login, and you decide who can release Schedule H or H1 medicines and who can only bill regular stock.",
      ],
    ],
  },
};

export function getContent(slug) {
  return CONTENT[slug] ?? null;
}
`);

put("components/industry/PharmacyHeroArt.js", `// Pharmacy hero ka app mockup. Saara text yahin badal sakte ho.
// Sab kuch container ki width se scale hota hai, to koi fixed size nahi.

const EXPIRING = [
  ["Ibuprofen 400", "20/04/2026"],
  ["Diclofenac gel", "21/04/2026"],
  ["Cetirizine 10", "22/04/2026"],
  ["Amoxicillin 500", "24/04/2026"],
];

const LOW = [
  ["Paracetamol 650", "12", true],
  ["ORS sachets", "39", false],
  ["Cough syrup", "190", false],
  ["Naproxen 250", "9", true],
];

const BILL = [
  ["Paracetamol x2", "36"],
  ["ORS sachet x5", "110"],
  ["Cough syrup", "98"],
  ["CGST + SGST", "12"],
];

const icons = {
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  doc: "M7 2h7l4 4v16H7zM14 2v5h4M10 12h6M10 16h4",
  box: "M3 7.5 12 3l9 4.5v9L12 21l-9-4.5zM3 7.5 12 12l9-4.5M12 12v9",
  pill: "M10.5 3.5a5 5 0 0 1 7 7l-7 7a5 5 0 0 1-7-7zM7 7l10 10",
};

function Tag({ name, icon, className }) {
  return (
    <div className={\`phtag \${className}\`}>
      <i>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d={icons[icon]} />
        </svg>
      </i>
      {name}
    </div>
  );
}

export default function PharmacyHeroArt({ shop = "Sunrise Medical Store" }) {
  return (
    <div className="phart" role="img" aria-label="Pharmacy billing app showing an invoice, expiring stock and low stock alerts">
      <div className="phart__stage">
        <Tag name="Accounting" icon="chart" className="phtag--acc" />
        <Tag name="Billing" icon="doc" className="phtag--bill" />
        <Tag name="Inventory" icon="box" className="phtag--inv" />
        <Tag name="Pharmacy" icon="pill" className="phtag--pharm" />

        <div className="phart__screen">
          <div className="phart__frame">
            <div className="phart__inner">
              <div className="phart__side">
                <i /><i /><i /><i /><i /><i />
              </div>
              <div className="phart__doc">
                <b>Tax invoice</b>
                {shop} &middot; DL No. 20B/21B-MZ-4417
                <div className="phart__rule" />
                <div className="phart__lines">
                  <span /><span /><span /><span /><span /><span />
                </div>
                <div className="phart__rule" />
                <div className="phart__lines">
                  <span /><span /><span /><span />
                </div>
                <div className="phart__rule" />
                <div className="phart__lines">
                  <span /><span />
                </div>
                <div className="phart__foot">
                  <span>Amount in words</span>
                  <span>Batch and expiry printed</span>
                </div>
              </div>
            </div>
          </div>
          <div className="phart__stand" />
          <div className="phart__base" />
        </div>

        <div className="phcard phcard--expiry">
          <div className="phcard__head">
            <span>Expiring stock</span>
            <span>In 7 days</span>
          </div>
          {EXPIRING.map(([n, d]) => (
            <div className="phcard__row" key={n}>
              <span>{n}</span>
              <span>{d}</span>
            </div>
          ))}
        </div>

        <div className="phcard phcard--low">
          <div className="phcard__head">
            <span>Low stock</span>
            <span>As of now</span>
          </div>
          {LOW.map(([n, q, low]) => (
            <div className={\`phcard__row \${low ? "is-low" : ""}\`} key={n}>
              <span>{n}</span>
              <span>{q}</span>
            </div>
          ))}
        </div>

        <div className="phphone">
          <div className="phphone__scr">
            <div className="phphone__bar">INVOICE</div>
            <div className="phphone__body">
              <b>{shop}</b>
              GSTIN 09ABCDE1234F1Z5
              <div className="phphone__tbl">
                {BILL.map(([n, a]) => (
                  <span key={n} style={{ display: "contents" }}>
                    <span>{n}</span>
                    <span>{a}</span>
                  </span>
                ))}
              </div>
              <div className="phphone__tot">
                <span>Total</span>
                <span>&#8377;256</span>
              </div>
              <div className="phphone__btn">Share on WhatsApp</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
`);

put("components/industry/IndustryHero.js", `import Link from "next/link";
import IndustryArt from "./IndustryArt";
import PharmacyHeroArt from "./PharmacyHeroArt";

export default function IndustryHero({ hero }) {
  return (
    <section className="hero">
      <div className="wrap hero__grid">
        <div>
          <span className="pill">{hero.badge}</span>
          <h1>{hero.h1}</h1>
          <p className="lead">{hero.lead}</p>

          {hero.chips?.length > 0 && (
            <div className="chips chips--tight">
              {hero.chips.map((c) => (
                <span key={c}>{c}</span>
              ))}
            </div>
          )}

          <div className="btn-row">
            <Link href="/mobile-app" className="btn btn--primary">
              {hero.cta}
            </Link>
            <Link href="/pricing" className="btn btn--ghost">
              {hero.cta2}
            </Link>
          </div>

          {hero.trust?.length > 0 && (
            <ul className="herotrust">
              {hero.trust.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          )}
        </div>
        {hero.art === "pharmacy" ? <PharmacyHeroArt /> : <IndustryArt name="invoice" />}
      </div>
    </section>
  );
}
`);


/* ---- CSS ---- */
{
  const p = "components/home/home.css";
  let cur = readFileSync(p, "utf8");
  copyFileSync(p, p + ".bak");
  const marker = "/* ===== Pharmacy hero artwork ===== */";
  const i = cur.indexOf(marker);
  if (i !== -1) cur = cur.slice(0, i);
  writeFileSync(p, cur.trimEnd() + "\n\n" + `/* ===== Pharmacy hero artwork ===== */
/* Sab kuch container ki width ke hisaab se scale hota hai (cqi units) */
.phart { container-type: inline-size; width: 100%; max-width: 620px; margin-inline: auto; }
.phart__stage { position: relative; aspect-ratio: 62 / 41; font-size: 2.5cqi;
  background: linear-gradient(150deg, var(--wash), #fff 72%); border-radius: 1.4em; }
.phart__stage * { box-sizing: border-box; }

/* monitor */
.phart__screen { position: absolute; left: 15%; top: 14%; width: 72%; z-index: 1; }
.phart__frame { background: var(--ink); border-radius: .55em; padding: .35em .35em 0;
  box-shadow: 0 1.4em 2.6em rgba(15,23,34,.18); }
.phart__inner { background: #fff; border-radius: .3em .3em 0 0; display: flex; aspect-ratio: 16 / 8.6; overflow: hidden; }
.phart__side { width: 20%; background: var(--wash); padding: .5em .35em; display: grid; gap: .3em; align-content: start; }
.phart__side i { display: block; height: .22em; border-radius: .11em; background: #c5dace; }
.phart__side i:first-child { background: var(--ledger); width: 70%; }
.phart__doc { flex: 1; padding: .55em .6em; font-size: .38em; color: var(--ink-soft); line-height: 1.4; }
.phart__doc b { display: block; font-size: 1.5em; color: var(--ink); font-family: var(--display); }
.phart__rule { height: 1px; background: var(--line); margin: .5em 0; }
.phart__lines { display: grid; gap: .32em; }
.phart__lines span { height: .28em; border-radius: .14em; background: #e8efeb; }
.phart__lines span:nth-child(2) { width: 76%; }
.phart__lines span:nth-child(4) { width: 58%; }
.phart__lines span:nth-child(5) { width: 84%; }
.phart__stand { width: 20%; height: .75em; margin: 0 auto; background: linear-gradient(#c9d1d9, #aeb8c2); }
.phart__base { width: 32%; height: .3em; margin: 0 auto; border-radius: .2em; background: #aeb8c2; }

/* floating data cards */
.phcard { position: absolute; background: #fff; border-radius: .55em; padding: .55em .65em;
  box-shadow: 0 .9em 2em rgba(15,23,34,.18); font-size: .72em; line-height: 1.45; }
.phcard__head { display: flex; justify-content: space-between; gap: 1em; align-items: baseline;
  font-family: var(--display); font-weight: 700; margin-bottom: .45em; }
.phcard__head span:last-child { font-family: var(--body); font-weight: 600; color: var(--ink-soft); font-size: .86em; }
.phcard__row { display: flex; justify-content: space-between; gap: 1em; padding: .12em 0; }
.phcard__row span:last-child { color: var(--ink-soft); font-variant-numeric: tabular-nums; }
.phcard__row.is-low span { color: #c2410c; font-weight: 600; }
.phcard--expiry { left: 21%; top: 25%; width: 47%; z-index: 2; border: 1.5px solid var(--ledger); }
.phcard--low { left: 51%; top: 58%; width: 43%; z-index: 2; border: 1.5px solid var(--marigold); }

/* phone */
.phphone { position: absolute; left: 0; top: 37%; width: 20%; z-index: 3; background: var(--ink); border-radius: .7em;
  padding: .22em; box-shadow: 0 1em 2.2em rgba(15,23,34,.26); }
.phphone__scr { background: #fff; border-radius: .5em; overflow: hidden; font-size: .3em; line-height: 1.5; }
.phphone__bar { background: var(--ledger); color: #fff; font-weight: 700; padding: .5em .6em; letter-spacing: .06em; }
.phphone__body { padding: .6em; color: var(--ink-soft); }
.phphone__body b { display: block; color: var(--ink); }
.phphone__tbl { display: grid; grid-template-columns: 1fr auto; gap: .25em .4em; margin-top: .5em;
  padding-top: .45em; border-top: 1px dashed var(--line); }
.phphone__tbl span:nth-child(even) { text-align: right; font-variant-numeric: tabular-nums; }
.phphone__tot { display: flex; justify-content: space-between; margin-top: .5em; padding: .35em .45em;
  background: var(--wash); border-radius: .3em; font-weight: 700; color: var(--ledger-dark); }
.phphone__btn { margin-top: .5em; text-align: center; background: var(--marigold); border-radius: 99px;
  padding: .4em; font-weight: 700; color: var(--ink); }

/* labelled tags */
.phtag { position: absolute; display: flex; align-items: center; gap: .4em; font-weight: 600; font-size: .72em;
  white-space: nowrap; z-index: 4; }
.phtag i { display: grid; place-items: center; width: 2.1em; height: 2.1em; border-radius: .6em; background: #fff;
  box-shadow: 0 .5em 1.2em rgba(15,23,34,.16); color: var(--ledger); }
.phtag i svg { width: 1.1em; height: 1.1em; }
.phtag--acc { left: 3%; top: 3%; }
.phtag--bill { right: 3%; top: 3%; flex-direction: row-reverse; }
.phtag--inv { left: 28%; bottom: 3%; }
.phtag--pharm { right: 1.5%; top: 27%; flex-direction: column; gap: .3em; font-size: .66em; }
.phtag--pharm i { color: var(--marigold); }

.phart__foot { display: flex; justify-content: space-between; gap: 1em; margin-top: .7em; padding-top: .5em;
  border-top: 1px solid var(--line); font-size: .9em; color: #9aa7b4; }
`, "utf8");
  console.log("  patched " + p);
}

console.log("\nDone. Ab chalao:  npm run build");
console.log("Dekho:  /billing-software/pharmacy\n");
