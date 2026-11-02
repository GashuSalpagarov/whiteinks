import type { Metadata } from "next";
import { HomeMain } from "./home";

// Ненайденный адрес: GitHub Pages отдаёт эту страницу (out/404.html) с кодом 404.
export const metadata: Metadata = { title: "Страница не найдена — White Inks" };

export default function NotFound() {
  return <HomeMain page="notfound" />;
}
