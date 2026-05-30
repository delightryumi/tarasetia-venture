import type { Metadata } from "next";
import { Cormorant_Garamond, Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-body",
});

const cormorantGaramond = Cormorant_Garamond({
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
  subsets: ["latin"],
});

import { getSEO } from "../services/getSEO";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSEO();

  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    authors: seo.author ? [{ name: seo.author }] : undefined,
    verification: {
      google: seo.googleSiteVerification,
    },
    alternates: {
      canonical: seo.canonicalUrl,
    },
    openGraph: {
      title: seo.ogTitle || seo.title,
      description: seo.ogDescription || seo.description,
      images: seo.ogImage ? [seo.ogImage] : [],
      type: "website",
    },
    twitter: {
      card: seo.twitterCard || "summary_large_image",
      title: seo.ogTitle || seo.title,
      description: seo.ogDescription || seo.description,
      images: seo.ogImage ? [seo.ogImage] : [],
      creator: seo.twitterHandle,
    },
    icons: {
      icon: seo.landingFavicon || "/favicon.ico",
      shortcut: seo.landingFavicon || "/favicon.ico",
      apple: seo.landingFavicon || "/favicon.ico",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${outfit.variable} ${cormorantGaramond.variable} antialiased font-body font-light`}
      >
        {children}
      </body>
    </html>
  );
}
