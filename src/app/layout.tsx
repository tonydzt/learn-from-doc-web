import type { Metadata } from "next";
import { IBM_Plex_Sans, Literata } from "next/font/google";

import { getSiteUrl } from "@/content/site";
import { createMetadata } from "@/content/seo";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import "./globals.css";

const literata = Literata({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export function generateMetadata(): Metadata {
  return createMetadata(getSiteUrl());
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${literata.variable} ${plex.variable}`}>
        {children}
        <GoogleAnalytics measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
      </body>
    </html>
  );
}
