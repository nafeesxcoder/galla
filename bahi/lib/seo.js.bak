// Live domain yahan daalo (bina trailing slash)
export const SITE_URL = "https://galla-seven.vercel.app";

export const DEFAULT_DESC =
  "Create GST and non-GST invoices, manage stock, track payments and get GST-ready reports. Free billing software for small businesses in India.";

// Har page me: export const metadata = pageMeta({ ... })
export function pageMeta({
  title,
  description = DEFAULT_DESC,
  path = "/",
  image = "/og.png",
}) {
  const url = `${SITE_URL}${path}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      images: [{ url: image, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

