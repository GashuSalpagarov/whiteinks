import styles from "@/app/legal.module.css";
import { goPage, pageHref } from "@/lib/caseRoute";

export function NotFound() {
  return (
    <main className={styles.page}>
      <a href={pageHref(null)} className={styles.back} onClick={(e) => goPage(e, null)}>
        ← White Inks.
      </a>
      <h1 className={styles.title}>Такой страницы нет</h1>
      <p className={styles.text}>
        Возможно, адрес изменился. Всё о студии — услуги, работы, цены и заявка — на главной.
      </p>
    </main>
  );
}
