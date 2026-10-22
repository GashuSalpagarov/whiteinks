"use client";

import { useEffect, useRef } from "react";
import { onScroll, viewportH } from "@/lib/scroll/onScroll";
import { STATIONS } from "@/lib/stations";
import styles from "./SceneLabel.module.css";

// Сцены по порядку, слова и стыки (f) — общий список станций (lib/stations.ts): слово сменяется,
// когда верх секции поднялся до f экрана от верха экрана. Hero и футер без слова: у Hero свой
// плакат, футер закрывает шапку; слово уходит, когда футер поднялся почти до середины экрана — и в
// конце страницы без анимаций (там футер — нижние 60 % экрана, без зоны петли).
const SCENES = STATIONS.map((s) => ({ ...s, word: s.scene === "footer" ? "" : s.word }));
const SWAP = 0.14; // экрана прокрутки на смену слова, поровну до стыка и после
// Кеглей, на столько уезжает слово: целиком за окно строки вместе с хвостами «р», «у», «б» —
// окно выше строки на 4px сверху и снизу (SceneLabel.module.css), соседнее слово в него не
// заглядывает.
const ROLL = 1.5;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (t: number) => t * t * (3 - 2 * t);

// Подпись сцены в шапке — у линии пути, как название станции: справа от оси экрана, кеглем
// пунктов меню (на телефоне в строке шапки нет места — второй строкой под логотипом). Смена —
// перекат: старое слово уходит вверх, новое приходит снизу; положение — функция прокрутки,
// назад всё так же. Для экранных дикторов — нет: у секций свои aria-label.
export function SceneLabel() {
  const rootRef = useRef<HTMLDivElement>(null);
  const outRef = useRef<HTMLSpanElement>(null);
  const inRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const out = outRef.current;
    const into = inRef.current;
    if (!root || !out || !into) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const sections: (Element | null)[] = SCENES.map(() => null);
    const section = (i: number) => {
      const el = sections[i];
      if (el?.isConnected) return el;
      sections[i] = document.querySelector(`[data-scene="${SCENES[i].scene}"]`);
      return sections[i];
    };
    let words = "";
    let shift = "";
    let size = "";
    let roll = 0; // px — ROLL кеглей, целым числом

    const update = () => {
      const h = viewportH();
      if (!h) return;
      // Замеры — до записей. k — последняя сцена, чей стык близко или пройден; d — прокрутка
      // от её стыка.
      const span = SWAP * h;
      const sz = `${window.innerWidth}x${h}`;
      if (sz !== size) {
        size = sz;
        roll = Math.round(ROLL * Number.parseFloat(getComputedStyle(root).fontSize));
      }
      let k = -1;
      let d = 0;
      for (let i = 0; i < SCENES.length; i++) {
        const el = section(i);
        if (!el) continue;
        const di = SCENES[i].f * h - el.getBoundingClientRect().top;
        if (di < -span / 2) break;
        k = i;
        d = di;
      }
      // Без анимаций — мгновенно на стыке.
      const p = k < 0 ? 1 : reduced ? (d >= 0 ? 1 : 0) : smooth(clamp01(d / span + 0.5));
      const from = k > 0 ? SCENES[k - 1].word : "";
      const to = k >= 0 ? SCENES[k].word : "";
      const w = `${from}|${to}`;
      if (w !== words) {
        words = w;
        out.textContent = from;
        into.textContent = to;
      }
      // Сдвиги — целые px; слово за окном ещё и скрыто: в покое ничего не просвечивает. Уходящее
      // слово во второй половине переката гаснет — его хвосты «р», «у» последними проходят окно и
      // торчали бы над новым словом, если остановиться посреди смены.
      const a = Math.round(-p * roll);
      const b = Math.round((1 - p) * roll);
      const o = (1 - smooth(clamp01((p - 0.5) / 0.3))).toFixed(2);
      const s = `${a}|${b}|${o}`;
      if (s !== shift) {
        shift = s;
        out.style.transform = `translateY(${a}px)`;
        into.style.transform = `translateY(${b}px)`;
        out.style.opacity = o;
        out.style.visibility = a <= -roll ? "hidden" : "";
        into.style.visibility = b >= roll ? "hidden" : "";
      }
    };

    return onScroll(root, update);
  }, []);

  return (
    <div ref={rootRef} className={styles.label} aria-hidden="true">
      <span ref={outRef} />
      <span ref={inRef} />
    </div>
  );
}
