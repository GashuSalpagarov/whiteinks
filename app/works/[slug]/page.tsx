import type { Metadata } from "next";
import { CARDS_CONTENT, CASES, caseBySlug } from "@/components/scenes/Scene3";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { HomeMain } from "../../home";

// Страница кейса по прямой ссылке: статическая (generateStaticParams), та же главная с открытым
// кейсом поверх. Роботам кейсы не показываем: noindex на каждой странице всегда — и когда
// главную откроют для поиска, — в sitemap.xml их нет, ссылки на них — nofollow
// (docs/12-case-page.md).

export const dynamicParams = false;

export function generateStaticParams() {
  return CASES.map((c) => ({ slug: c.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = caseBySlug(slug);
  const card = CARDS_CONTENT.find((x) => x.slug === slug);
  const title = `${card?.title ?? "Кейс"} — кейс ${SITE_NAME}`;
  return {
    title,
    description: c?.summary,
    robots: { index: false },
    // Превью ссылки в мессенджерах — общая картинка сайта (адрес целиком: basePath сам не добавится).
    openGraph: {
      type: "article",
      locale: "ru_RU",
      siteName: SITE_NAME,
      title,
      description: c?.summary,
      images: [{ url: `${SITE_URL}/opengraph-image.png`, width: 1200, height: 630 }],
    },
  };
}

export default async function WorkPage({ params }: Props) {
  const { slug } = await params;
  return <HomeMain caseSlug={slug} />;
}
