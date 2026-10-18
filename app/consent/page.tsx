import type { Metadata } from "next";
import Link from "next/link";
import styles from "../legal.module.css";

export const metadata: Metadata = { title: "Согласие на обработку данных — White Inks" };

export default function ConsentPage() {
  return (
    <main className={styles.page}>
      <Link href="/" className={styles.back}>
        ← White Inks
      </Link>
      <h1 className={styles.title}>Согласие на обработку персональных данных</h1>
      <p className={styles.text}>
        Отправляя бриф, вы соглашаетесь, что мы используем ваш контакт и комментарий только для
        ответа на заявку и подготовки сметы.
      </p>
      <p className={styles.note}>Полный юридический текст появится здесь позже.</p>
    </main>
  );
}
