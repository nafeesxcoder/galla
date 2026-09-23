import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { LangProvider } from "@/components/LangProvider";
import { SITE } from "@/lib/site";
import { SITE_URL, DEFAULT_DESC } from "@/lib/seo";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE.name} | GST billing software for small businesses`,
    template: `%s | ${SITE.name}`,
  },
  description: DEFAULT_DESC,
  applicationName: SITE.name,
  keywords: [
    "GST billing software",
    "billing software",
    "invoice software",
    "inventory software",
    "accounting software for small business",
    "e-way bill",
    "e-invoice",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    url: SITE_URL,
    title: `${SITE.name} | GST billing software for small businesses`,
    description: DEFAULT_DESC,
    images: [{ url: "/og.png", width: 1200, height: 630 }],
    locale: "en_IN",
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
  robots: { index: true, follow: true },
};

export const viewport = { themeColor: "#0e6b52" };

// Google ko batata hai ki ye kaunsi company aur kaunsa product hai
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
      address: {
        "@type": "PostalAddress",
        addressLocality: SITE.city,
        addressCountry: "IN",
      },
    },
    {
      "@type": "SoftwareApplication",
      name: SITE.name,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Android, iOS, Windows",
      url: SITE_URL,
      publisher: { "@id": `${SITE_URL}/#org` },
      offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
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
          <Navbar />
          <main>{children}</main>
          <Footer />
        </LangProvider>
      </body>
    </html>
  );
}
