import { goPage, pageHref } from "@/lib/caseRoute";
import styles from "./Footer.module.css";

// Нижняя строка сайта: документы и ©. Стоит в конце главной и после письма на остальных страницах.
export function Fine({ className = "" }: { className?: string }) {
  return (
    <p className={`${styles.fine} ${className}`}>
      <span className={styles.docs}>
        <a href={pageHref("privacy")} onClick={(e) => goPage(e, "privacy")}>
          политика обработки персональных данных
        </a>
        <a href={pageHref("consent")} onClick={(e) => goPage(e, "consent")}>
          согласие на обработку персональных данных
        </a>
      </span>
      <span className={styles.copy}>© 2026 White Inks</span>
    </p>
  );
}
