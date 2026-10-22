import type { Metadata } from "next";
import Link from "next/link";
import styles from "../legal.module.css";

export const metadata: Metadata = { title: "Политика конфиденциальности — White Inks" };

export default function PrivacyPage() {
  return (
    <main className={styles.page}>
      <Link href="/" className={styles.back}>
        ← White Inks
      </Link>
      <h1 className={styles.title}>Политика конфиденциальности</h1>
      <p className={styles.text}>
        Мы собираем только то, что вы оставили в заявке: телефон, имя и что нужно. Не передаём это
        третьим лицам и удаляем по первой просьбе.
      </p>
      <p className={styles.note}>Полный юридический текст появится здесь позже.</p>
    </main>
  );
}
