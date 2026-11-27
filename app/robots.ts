import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: [
        "/sign-in",
        "/_next/static/",
        "/favicon.ico",
        "/icon",
        "/opengraph-image",
        "/twitter-image",
      ],
      disallow: "/",
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
