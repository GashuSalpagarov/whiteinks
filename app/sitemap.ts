import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

// Карта сайта для Вебмастера и Search Console. Страницы услуг (docs/14-service-page.md) сюда войдут,
// когда их откроют для поиска; пока закрыты. Страниц кейсов (/works/<slug>/) здесь не бывает никогда:
// роботам работы не показываем (docs/12-case-page.md).
// Юридические страницы индексируются, но в карту не входят: искать их незачем.
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${SITE_URL}/` }];
}
