import type { Metadata } from "next";
import { JSON_LD, SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site";
import { HomeMain } from "./home";

export const metadata: Metadata = {
  alternates: { canonical: `${SITE_URL}/` },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: SITE_NAME,
    url: `${SITE_URL}/`,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: { card: "summary_large_image" },
};

export default function Home() {
  return (
    <HomeMain>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD из своих данных, «<» экранирован
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD).replace(/</g, "\\u003c") }}
      />
    </HomeMain>
  );
}
