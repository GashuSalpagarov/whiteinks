import { ADDONS, fromPrice, fromWeeks, SCALES, TYPES } from "@/lib/pricing";
import styles from "./Scene5.module.css";

const NB = " ";

// Множитель размера: «−20 %», «база», «+40 %».
const scaleNote = (k: number) =>
  k === 1 ? "база" : `${k < 1 ? "−" : "+"}${Math.round(Math.abs(k - 1) * 100)}${NB}%`;

const addonNote = (a: (typeof ADDONS)[number]) =>
  a.monthly ? "в месяц" : a.pct ? `+${a.pct}${NB}%` : `+${a.fixed}${NB}тыс.`;

// Сцена 5 — прайс-каталог только для чтения: шесть типов карточками (цена «от», срок, что
// входит), под ними две тихие строки — размеры и дополнения. Выбирать ничего не нужно —
// заявка дальше, в Сцене 6. Линия пути — продолжение Сцены 4 по центру: идёт под карточками
// и видна в зазорах между ними (Scene5.module.css).
export function Scene5() {
  return (
    <section className={styles.scene5} data-scene="scene5" aria-label="Прайс">
      <div className={styles.inner}>
        <div className={styles.head}>
          <div>
            <p className={styles.eyebrow}>Прайс</p>
            <h2 className={styles.title}>Сколько стоит</h2>
          </div>
          <p className={styles.lead}>
            Ориентиры по типам работ. Выбирать ничего не нужно — просто напишите нам ниже.
          </p>
        </div>

        <ul className={styles.cards}>
          {TYPES.map((t) => (
            <li key={t.id} className={styles.card}>
              <h3 className={styles.cardTitle}>{t.title}</h3>
              <p className={styles.price}>{fromPrice(t.base)}</p>
              <p className={styles.term}>{fromWeeks(t.weeks)}</p>
              <p className={styles.includes}>{t.includes}</p>
            </li>
          ))}
        </ul>

        <div className={styles.notes}>
          <div>
            <h3 className={styles.label}>Размер</h3>
            <p className={styles.list}>
              {SCALES.map((s) => (
                <span key={s.title}>
                  {s.title} <em>{scaleNote(s.k)}</em>
                </span>
              ))}
            </p>
            <p className={styles.fine}>
              Размер — это блоки, страницы, товары или экраны: у каждого типа свои.
            </p>
          </div>
          <div>
            <h3 className={styles.label}>Дополнения</h3>
            <p className={styles.list}>
              {ADDONS.map((a) => (
                <span key={a.title}>
                  {a.title} <em>{addonNote(a)}</em>
                </span>
              ))}
            </p>
            <p className={styles.fine}>
              Цены — ориентир: итог зависит от объёма, вилка −10…+30{NB}%. Точную смету пришлём
              после разговора.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
