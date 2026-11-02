import type { Metadata } from "next";
import { HomeMain } from "../home";

export const metadata: Metadata = {
  title: "Согласие на обработку персональных данных — White Inks",
};

// Страница — слой над главной (components/page/PageLayer): текст в components/page/Consent.tsx.
export default function ConsentPage() {
  return <HomeMain page="consent" />;
}
