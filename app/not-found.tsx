import type { Metadata } from "next";
import Link from "next/link";
import styles from "./legal.module.css";

// Ненайденный адрес: GitHub Pages отдаёт эту страницу (out/404.html) с кодом 404.
export const metadata: Metadata = { title: "Страница не найдена — White Inks" };

export default function NotFound() {
  return (
    <main className={styles.page}>
      <Link href="/" className={styles.back}>
        ← white inks.
      </Link>
      <h1 className={styles.title}>Такой страницы нет</h1>
      <p className={styles.text}>
        Возможно, адрес изменился. Всё о студии — услуги, работы, цены и заявка — на главной.
      </p>
    </main>
  );
}
