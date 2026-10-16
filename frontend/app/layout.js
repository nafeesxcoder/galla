import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { LangProvider } from "@/components/LangProvider";
import { SITE } from "@/lib/site";
import { SITE_URL, DEFAULT_DESC } from "@/lib/seo";
import LoginModal from "@/components/login/LoginModal";
import { AuthProvider } from "@/components/account/AuthProvider";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    // The home page title. The KEYWORD comes first, not the brand: Google
    // shows about 60 characters and nobody searches for a name they have
    // not heard of yet. The brand still gets its place, at the end.
    default: `GST Billing Software for Small Business | ${SITE.name}`,
    // Every other page passes its own words and this appends the brand.
    // Pages must NOT include the brand themselves, or it lands twice.
    template: `%s | ${SITE.name}`,
  },
  description: DEFAULT_DESC,
  applicationName: SITE.name,
  // No meta keywords tag. Google has ignored it since 2009 and Bing treats
  // it as a spam signal. The words that matter belong in the title, the
  // description and the page copy - where they are read by people too.
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    url: SITE_URL,
    title: `GST Billing Software for Small Business | ${SITE.name}`,
    description: DEFAULT_DESC,
    images: [{ url: "/og.png", width: 1200, height: 630 }],
    locale: "en_IN",
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
  robots: { index: true, follow: true },
};

export const viewport = { themeColor: "#0e6b52" };

// Tells Google which company this is and what the product is.
//
// One @graph with both nodes rather than two separate scripts, so the
// SoftwareApplication can point at the Organization by id instead of
// repeating the company details. Google reads the relationship.
//
// NOTHING INVENTED HERE. There is no aggregateRating and no review count,
// because there are no reviews yet - marking up ratings that do not exist is
// a manual action waiting to happen, and it is a lie told to customers.
// Add it when real ratings exist.
const orgSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#org`,
      name: SITE.name,
      url: SITE_URL,
      email: SITE.email,
      telephone: SITE.phone,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/og.png` },
      address: {
        "@type": "PostalAddress",
        addressLocality: SITE.city,
        addressCountry: "IN",
      },
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        telephone: SITE.phone,
        email: SITE.email,
        areaServed: "IN",
        availableLanguage: ["en", "hi"],
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE.name,
      publisher: { "@id": `${SITE_URL}/#org` },
      inLanguage: "en-IN",
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#app`,
      name: SITE.name,
      applicationCategory: "BusinessApplication",
      applicationSubCategory: "Accounting & Billing",
      operatingSystem: "Android, iOS, Windows, macOS, Web",
      url: SITE_URL,
      publisher: { "@id": `${SITE_URL}/#org` },
      inLanguage: "en-IN",
      // The free plan is the entry point, so that is the offer shown. The
      // paid prices live on the server and are rendered on /pricing; they
      // are not repeated here, because a price in two places is a price
      // that will disagree with itself.
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "INR",
        category: "free",
        url: `${SITE_URL}/pricing`,
      },
      featureList: [
        "GST and non-GST invoices",
        "Inventory and stock tracking",
        "Customer and supplier ledgers",
        "Payment reminders on WhatsApp",
        "GSTR-ready reports",
        "Works offline",
      ],
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-IN" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Hind:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
      </head>
      <body>
        <LangProvider>
          <AuthProvider>
          <Navbar />
          <main>{children}</main>
          <Footer />

          {/* The login popup. It sits here so it can use the language
              context, and it opens itself when anyone clicks a link
              pointing at /login - no change needed in Navbar.js. */}
          <LoginModal />
        </AuthProvider>
        </LangProvider>
      </body>
    </html>
  );
}
