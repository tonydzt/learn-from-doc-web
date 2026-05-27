import type { MetadataRoute } from "next";

import { createSitemap } from "@/content/seo";
import { getSiteUrl } from "@/content/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return createSitemap(getSiteUrl());
}
