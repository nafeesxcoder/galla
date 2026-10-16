"use client";
import { useState } from "react";
import Reveal from "@/components/Reveal";
import { SITE } from "@/lib/site";

// Question aur answer yahin edit karo. Yeh list JSON-LD schema me bhi jati hai,
// jisse Google search results me FAQ dikh sakta hai.
export const faqs = [
  {
    q: "What is billing software?",
    a: "Billing software replaces the paper bill book. You add your items and customers once, and the software makes the invoice, calculates tax, keeps a copy and updates your stock at the same time.",
  },
  {
    q: "What makes it GST billing software?",
    a: "A GST bill needs the right HSN or SAC code, the correct CGST, SGST or IGST split, your GSTIN and a serial invoice number. GST billing software fills all of that in for you and prepares the reports your GST return needs.",
  },
  {
    q: `Who can use ${SITE.name}?`,
    a: "Any business that issues bills: grocery and general stores, medical shops, hardware and electrical shops, garment stores, wholesalers, restaurants, salons, transporters and small manufacturers. Freelancers and service businesses use it for invoices too.",
  },
  {
    q: "Do I need internet to make a bill?",
    a: "No. Billing works fully offline and your data is saved on the device. The moment you are back online, everything syncs to the cloud and to your other devices.",
  },
  {
    q: "Is my business data safe?",
    a: "Your data is sent over an encrypted connection and backed up automatically. You can export everything to Excel or PDF whenever you want, so your records always stay with you.",
  },
  {
    q: "Can I use it on my phone and computer together?",
    a: "Yes. One account works on Android, iPhone and Windows. A bill made at the counter shows up on your phone within seconds, and paid plans allow more devices and staff logins.",
  },
  {
    q: "Can my staff bill without seeing my profit?",
    a: "Yes. Each staff member gets their own login, and you decide what they can see or change. Purchase prices, profit reports and settings can stay visible only to you.",
  },
  {
    q: "Do I have to pay to start?",
    a: "No. The free plan gives you unlimited GST and non-GST invoices on one device. Paid plans add more devices, GST reports, e-way bills and staff logins, and you can upgrade any time.",
  },
  {
    q: "I am not registered under GST. Can I still use it?",
    a: "Yes. You can make simple non-GST bills, cash memos and estimates without entering a GSTIN. If you register later, add your GSTIN in settings and GST bills start working right away.",
  },
  {
    q: "Can I move my data from Tally or Excel?",
    a: "Yes. Items, customers, suppliers and opening balances can be imported from an Excel or CSV file, so you do not have to type your old records again.",
  },
  {
    q: "Which printers does it work with?",
    a: "Regular A4 and A5 printers work for full-page invoices, and 2-inch or 3-inch thermal printers work for counter receipts. Barcode label printers, scanners and weighing scales are supported too.",
  },
  {
    q: "How do payment reminders work?",
    a: "Every unpaid bill shows how much is pending and for how long. From that list you can send a reminder with the bill attached on WhatsApp or SMS, and record the payment when it comes in.",
  },
  {
    q: "Can I track stock across two shops or a godown?",
    a: "Yes, on the plan that includes multiple locations. Each location keeps its own stock, you can transfer items between them, and reports can be seen location-wise or together.",
  },
  {
    q: "What happens to my data if I stop paying?",
    a: "Your data stays with you. Premium features stop, but you can still open the app, see your records and export everything to Excel or PDF.",
  },
  {
    q: "Does it help with GST return filing?",
    a: "It prepares the reports your return needs, like GSTR-1, GSTR-3B summaries and an HSN-wise summary, which you or your CA can use while filing on the GST portal.",
  },
  {
    q: "Which languages does the app support?",
    a: "The app and support are available in English, Hindi and other major Indian languages, so your staff can bill in the language they are comfortable with.",
  },
];

const VISIBLE = 6;

export default function Faq() {
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? faqs : faqs.slice(0, VISIBLE);

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <section className="section">
      <div className="wrap">
        <Reveal className="center">
          <span className="eyebrow">Common questions</span>
          <h2>Frequently asked questions</h2>
          <p className="lead">
            Quick answers about billing, GST and how the app works day to day.
          </p>
        </Reveal>

        <div className="faq faq--home">
          {shown.map((f, i) => (
            <Reveal key={f.q} delay={i < VISIBLE ? (i % 3) * 70 : 0}>
              <details name="home-faq">
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            </Reveal>
          ))}
        </div>

        <div className="faq__actions">
          <button
            type="button"
            className="btn btn--ghost"
            aria-expanded={showAll}
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? "View less FAQs" : `View all ${faqs.length} FAQs`}
            <span
              className={`faq__caret ${showAll ? "up" : ""}`}
              aria-hidden="true"
            />
          </button>
        </div>

        <p className="faq__more">
          Still stuck? Call us on{" "}
          <a href={`tel:${SITE.phone.replace(/\s/g, "")}`}>{SITE.phone}</a> or
          write to <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
        </p>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    </section>
  );
}
