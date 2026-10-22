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
        Отмечая согласие в заявке, вы разрешаете обрабатывать ваш телефон, имя и то, что вы выбрали
        в «что нужно», — только чтобы перезвонить по заявке и подготовить смету.
      </p>
      <p className={styles.note}>Полный юридический текст появится здесь позже.</p>
    </main>
  );
}
