import type { Metadata, MetadataRoute } from "next";

import { product } from "./site";

export function createMetadata(siteUrl: string): Metadata {
  return {
    metadataBase: new URL(siteUrl),
    title: `${product.name} | Track developer docs reading progress`,
    description: product.description,
    alternates: {
      canonical: siteUrl,
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: product.name,
      title: product.heroTitle,
      description: product.description,
      url: siteUrl,
      images: [
        {
          url: `${siteUrl}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: product.heroTitle,
      description: product.description,
      images: [`${siteUrl}/opengraph-image`],
    },
    icons: {
      icon: "/icon.svg",
      apple: "/icon.svg",
    },
  };
}

export function createSitemap(siteUrl: string): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}

export function createRobots(siteUrl: string): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
