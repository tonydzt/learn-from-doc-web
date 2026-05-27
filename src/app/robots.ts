import type { MetadataRoute } from "next";

import { createRobots } from "@/content/seo";
import { getSiteUrl } from "@/content/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return createRobots(getSiteUrl());
}
