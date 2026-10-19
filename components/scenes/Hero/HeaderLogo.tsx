"use client";

import { type CSSProperties, useEffect, useRef } from "react";
import { LOOP_EVENT } from "@/components/scenes/Footer";
import styles from "./Hero.module.css";

// Логотип по очереди показывает два названия. Смена — по буквам (.logoAlt / .logoBack в
// Hero.module.css): буквы уходящего уезжают вверх, нового — выезжают снизу.
const NAMES = ["White Inks", "Белые чернила"];
const INTRO_MS = 6600; // логотип проявляется после интро — как uiFadeIn у .logo
const EVERY_MS = 4000;
const SWAP_MS = 12 * 28 + 550; // вся смена: задержка последней буквы и её ход

export function HeaderLogo() {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let alt = false;
    let liveAt = 0;
    let busyUntil = 0;
    let timer = 0;

    const swap = () => {
      alt = !alt;
      el.classList.toggle(styles.logoAlt, alt);
      el.classList.toggle(styles.logoBack, !alt);
      busyUntil = performance.now() + SWAP_MS;
    };
    const wait = (ms: number) => {
      clearTimeout(timer);
      timer = window.setTimeout(() => {
        swap();
        wait(EVERY_MS);
      }, ms);
    };
    // Интро и каждый новый круг пути: снова «White Inks», отсчёт — от появления логотипа.
    const start = () => {
      alt = false;
      el.classList.remove(styles.logoAlt, styles.logoBack);
      liveAt = performance.now() + INTRO_MS;
      wait(INTRO_MS + EVERY_MS);
    };
    // Наведение: смена сразу (если прошлая доиграла), пока курсор на логотипе — таймер стоит,
    // ушёл курсор — отсчёт заново. Пока логотип не проявился, наведение не считаем.
    const enter = () => {
      if (performance.now() < liveAt) return;
      clearTimeout(timer);
      if (performance.now() >= busyUntil) swap();
    };
    const leave = () => {
      if (performance.now() >= liveAt) wait(EVERY_MS);
    };

    start();
    window.addEventListener(LOOP_EVENT, start);
    const hover = matchMedia("(hover: hover)").matches;
    if (hover) {
      el.addEventListener("mouseenter", enter);
      el.addEventListener("mouseleave", leave);
    }
    return () => {
      clearTimeout(timer);
      window.removeEventListener(LOOP_EVENT, start);
      el.removeEventListener("mouseenter", enter);
      el.removeEventListener("mouseleave", leave);
    };
  }, []);

  return (
    <span ref={ref} className={styles.logo} role="img" aria-label={NAMES[0]}>
      {NAMES.map((name) => (
        <span key={name} className={styles.logoName} aria-hidden="true">
          {[...name].map((ch, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: буквы повторяются, порядок постоянный
            <span key={i} style={{ "--i": i } as CSSProperties}>
              {ch}
            </span>
          ))}
        </span>
      ))}
    </span>
  );
}
