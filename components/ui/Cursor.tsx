"use client";

import { useEffect, useRef } from "react";
import styles from "./Cursor.module.css";

// Курсор мыши с инверсией: белый силуэт в mix-blend-mode: difference — чёрный на белом,
// белый на чёрном, негатив на картинках. Свой курсор браузера прячем (html[data-cursor],
// globals.css) с первым движением мыши — до него виден обычный. Остриё стрелки и кончик
// пальца — в точке (0, 0) viewBox, ровно там, где мышь. Над ссылками и кнопками — рука,
// в полях ввода — обычный текстовый курсор. Без своего rAF: место пишется прямо в pointermove.
const LINK = "a[href], button, [role='button'], label, summary, select";
const TEXT = "input:not([type='checkbox'], [type='radio'], [type='submit']), textarea";

export function Cursor() {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const root = document.documentElement;
    const ac = new AbortController();
    const opts = { passive: true, signal: ac.signal };
    let on = false;

    document.addEventListener(
      "pointermove",
      (e) => {
        if (e.pointerType === "touch") return;
        el.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
        if (on) return;
        on = true;
        el.dataset.on = "";
        root.dataset.cursor = "";
      },
      opts,
    );
    document.addEventListener(
      "pointerover",
      (e) => {
        const t = e.target as Element;
        el.dataset.state = t.closest(TEXT) ? "text" : t.closest(LINK) ? "link" : "";
      },
      opts,
    );
    // Мышь ушла за окно — прячем до возвращения.
    document.addEventListener(
      "pointerout",
      (e) => {
        if (e.relatedTarget) return;
        on = false;
        delete el.dataset.on;
      },
      opts,
    );

    return () => {
      ac.abort();
      delete root.dataset.cursor;
    };
  }, []);

  return (
    <svg ref={ref} className={styles.cursor} viewBox="-6 0 19 22" aria-hidden="true">
      <path className={styles.arrow} d="M0 0V16.5L4 12.8 6.6 18.8 9.2 17.7 6.6 11.8H11.8Z" />
      <path
        className={styles.hand}
        d="M-2 2A2 2 0 0 1 2 2V7.75A1.75 1.75 0 0 1 5.5 7.75V8.75A1.75 1.75 0 0 1 9 8.75V10A1.5 1.5 0 0 1 12 10V15.5Q12 18.5 10 20V22H1V20Q-0.5 19-2.2 17L-5.4 12.8A1.6 1.6 0 0 1-3.2 10.6L-2 12.2Z"
      />
    </svg>
  );
}
