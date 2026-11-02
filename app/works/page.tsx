import type { Metadata } from "next";
import { Works } from "@/components/works";
import { SITE_NAME } from "@/lib/site";

// Страница «Наши работы»: список кейсов на оси (docs/13-works-page.md). Роботам её, как и кейсы, не
// показываем: noindex всегда, в sitemap.xml её нет, ссылки на неё и из неё в кейсы — nofollow.
export const metadata: Metadata = {
  title: `Наши работы — ${SITE_NAME}`,
  description: "Сайты, приложения и бренды, которые сделала студия.",
  robots: { index: false },
};

export default function WorksPage() {
  return <Works />;
}
