"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useLenis } from "@/app/providers";
import { BRIEF_CONFIG } from "@/lib/brief";
import { onScroll } from "@/lib/scroll/onScroll";
import styles from "./Footer.module.css";

// Новый круг пути: Hero по этому событию запускает интро с t = 0.
export const LOOP_EVENT = "whiteinks:loop";

// Зона раскрытия (высота — в Footer.module.css): к RAMP точка заливает весь экран, дальше
// до конца зоны экран просто залит — телепорт в любой момент этого отрезка невидим.
const RAMP = 0.85;
const DOT_R = 6; // px, радиус точки (как .drop в Hero)
const HINT_FADE = 0.15; // за эту долю зоны гаснет подсказка
// После прыжка наверх колёсико ещё какое-то время шлёт инерцию — глотаем её, пока не стихнет.
const INERTIA_QUIET_MS = 250;

// ЗАГЛУШКИ — заполнит владелец.
const SOCIALS = [
  { title: "Telegram-канал", href: "https://t.me/" },
  { title: "Behance", href: "https://www.behance.net/" },
  { title: "VK", href: "https://vk.com/" },
];

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

// Последний экран: чёрный, с белой точкой — героем в инвертированном цвете. Дальше зона,
// где точка раскрывается на весь экран. Залитый экран — ровно инвертированный первый кадр
// интро Hero (круг на весь экран), поэтому в конце зоны мы незаметно меняем палитру
// (html[data-palette], см. globals.css), прыгаем наверх и запускаем интро заново.
// Каждый круг меняет палитру. Reduced motion: зоны нет, футер — конец страницы.
export function Footer() {
  const sectionRef = useRef<HTMLElement>(null);
  const bloomRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLParagraphElement>(null);
  const lenis = useLenis();

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let last = "";
    let jumped = false;
    let quiet = 0;
    let lastZ = 0;
    let viewport = "";

    // Колёсико снова слушаем, когда инерция стихла (INERTIA_QUIET_MS без событий).
    const onWheel = () => {
      window.clearTimeout(quiet);
      quiet = window.setTimeout(() => {
        window.removeEventListener("wheel", onWheel);
        lenis?.start();
      }, INERTIA_QUIET_MS);
    };

    const teleport = () => {
      const root = document.documentElement;
      if (root.dataset.palette) delete root.dataset.palette;
      else root.dataset.palette = "inverted";
      window.dispatchEvent(new Event(LOOP_EVENT));
      // immediate: без анимации и со сбросом скорости Lenis — пружина скорости Сцены 3 не
      // получит рывка от прыжка через всю страницу.
      if (lenis) {
        lenis.scrollTo(0, { immediate: true, force: true });
        lenis.stop();
        onWheel();
        window.addEventListener("wheel", onWheel, { passive: true });
      } else {
        window.scrollTo(0, 0);
      }
    };

    const update = () => {
      const rect = section.getBoundingClientRect();
      const h = window.innerHeight;
      // Зона — всё, что секция длиннее экрана: столько футер стоит sticky, а точка растёт.
      const zone = rect.height - h;
      const scrolled = -rect.top;
      const z = zone > 0 ? clamp01(scrolled / zone) : 0;

      // Resize посреди зоны: страница сменила длину, и браузер сдвинул скролл (у края — сразу
      // в конец зоны, то есть в прыжок). Возвращаем ту же долю зоны и в этом проходе не прыгаем.
      // Панель браузера на телефоне долю не меняет — тогда и скролл не трогаем.
      const vp = `${window.innerWidth}x${h}`;
      if (vp !== viewport) {
        const was = viewport;
        viewport = vp;
        const y = window.scrollY + rect.top + lastZ * zone;
        // Нативно, не через Lenis: его граница прокрутки после resize ещё старая.
        if (was && lastZ > 0 && Math.abs(y - window.scrollY) > 1) {
          window.scrollTo(0, y);
          return;
        }
      }
      lastZ = z;
      if (z < 0.5) jumped = false;

      // Радиус — от точки до диагонали экрана: так круг накрывает экран из любой точки.
      const t = clamp01(z / RAMP);
      const r = DOT_R + (Math.hypot(window.innerWidth, h) - DOT_R) * t * t;
      const hint = 1 - clamp01(z / HINT_FADE);
      if (`${r}|${hint}` !== last) {
        last = `${r}|${hint}`;
        bloomRef.current?.style.setProperty("--r", `${r}px`);
        if (hintRef.current) hintRef.current.style.opacity = `${hint}`;
      }

      // Конец зоны (≥ 1px до низа страницы) — один прыжок на круг. Вверх петли нет.
      if (reduced || jumped || zone <= 0 || scrolled < zone - 1) return;
      jumped = true;
      teleport();
    };

    const unsubscribe = onScroll(section, update);
    return () => {
      unsubscribe();
      window.clearTimeout(quiet);
      window.removeEventListener("wheel", onWheel);
    };
  }, [lenis]);

  const telegram = BRIEF_CONFIG.telegram;
  return (
    <section ref={sectionRef} className={styles.footer} data-scene="footer" aria-label="Контакты">
      <div className={styles.sticky}>
        <div className={styles.inner}>
          <p className={styles.closing}>Путь продолжается</p>

          <div className={styles.columns}>
            <div className={styles.column}>
              <h2 className={styles.label}>Связаться</h2>
              <a
                href={`https://t.me/${telegram.replace(/^@/, "")}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Telegram {telegram}
              </a>
              <a href={`mailto:${BRIEF_CONFIG.email}`}>{BRIEF_CONFIG.email}</a>
              <a href={`tel:+${BRIEF_CONFIG.phone.replace(/\D/g, "")}`}>{BRIEF_CONFIG.phone}</a>
            </div>

            <div className={styles.column}>
              <h2 className={styles.label}>Соцсети</h2>
              {SOCIALS.map((s) => (
                <a key={s.title} href={s.href} target="_blank" rel="noopener noreferrer">
                  {s.title}
                </a>
              ))}
            </div>

            <div className={styles.column}>
              <h2 className={styles.label}>Студия</h2>
              <span className={styles.muted}>ООО / ИП — реквизиты будут добавлены</span>
              <Link href="/privacy">Политика конфиденциальности</Link>
              <Link href="/consent">Согласие на обработку данных</Link>
              <span className={styles.muted}>© 2026 White Inks</span>
            </div>
          </div>
        </div>

        <p ref={hintRef} className={styles.hint}>
          Листайте — путь начнётся заново
        </p>
        {/* Точка и её раскрытие — один слой: круг clip-path с радиусом --r. */}
        <div ref={bloomRef} className={styles.bloom} aria-hidden="true" />
      </div>
    </section>
  );
}
