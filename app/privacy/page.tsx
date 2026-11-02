import type { Metadata } from "next";
import { HomeMain } from "../home";

export const metadata: Metadata = {
  title: "Политика обработки персональных данных — White Inks",
};

// Страница — слой над главной (components/page/PageLayer): текст в components/page/Privacy.tsx.
export default function PrivacyPage() {
  return <HomeMain page="privacy" />;
}
