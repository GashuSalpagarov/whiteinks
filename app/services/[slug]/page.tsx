import type { Metadata } from "next";
import { SERVICE_PAGES, serviceBySlug, serviceDescription, serviceTitle } from "@/lib/services";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { HomeMain } from "../../home";

// Страница услуги: слой над главной (docs/14-service-page.md), статическая на каждую запись lib/services.ts.
// Пока закрыта от поиска: noindex, в sitemap.xml её нет, ссылки на неё и из неё в кейсы — nofollow.

export const dynamicParams = false;

export function generateStaticParams() {
  return SERVICE_PAGES.map((s) => ({ slug: s.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const s = serviceBySlug(slug);
  const title = s ? serviceTitle(s) : SITE_NAME;
  const description = s && serviceDescription(s);
  return {
    title,
    description,
    robots: { index: false },
    // Превью ссылки в мессенджерах — общая картинка сайта (адрес целиком: basePath сам не добавится).
    openGraph: {
      type: "website",
      locale: "ru_RU",
      siteName: SITE_NAME,
      title,
      description,
      images: [{ url: `${SITE_URL}/opengraph-image.png`, width: 1200, height: 630 }],
    },
  };
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  return <HomeMain page={`services/${slug}`} />;
}
