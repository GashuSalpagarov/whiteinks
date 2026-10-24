import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

// Поисковики читают robots.txt только из корня домена. Пока сайт в подпапке github.io, этот
// файл (/whiteinks/robots.txt) они не увидят — он заработает со своим доменом.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
