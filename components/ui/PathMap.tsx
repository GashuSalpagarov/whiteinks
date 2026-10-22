"use client";

import { type CSSProperties, useEffect, useRef } from "react";
import { useLenis } from "@/app/providers";
import { onScroll, viewportH } from "@/lib/scroll/onScroll";
import { goToStation, pathProgress, STATIONS } from "@/lib/stations";
import styles from "./PathMap.module.css";

// Миниатюра пути сайта в единицах viewBox 24×450 (ось — x = 12): круг Hero, падение к Услугам,
// змейка Услуг, дальше прямая ось — туннель, веер, мозаика, конверт — и петля в конце. Значки — в
// полосе x 4…20, змейка — 7…17: с точкой (радиус 5,5) карта не шире 22,5 единицы.
const H = 450;
const PATH =
  "M12 16C12 26 16 28 16 34S12 44 12 50C12 56 17 58 17 66S7 82 7 90S17 106 17 114S12 128 12 134L12 440";
// Метки на пути (y): начало (под кругом Hero) и стыки станций по порядку; последняя — центр петли.
// Между метками точка идёт непрерывно, по доле прокрутки от стыка до стыка (pathProgress).
const MARKS = [16, 50, 134, 218, 302, 372, 440];
// Зоны нажатия по высоте и где подпись: [от, до, подпись] — «Начало» (круг Hero) и станции.
const ZONES: [number, number, number][] = [
  [0, 30, 10],
  [30, 134, 92],
  [134, 218, 176],
  [218, 302, 260],
  [302, 372, 337],
  [372, 422, 398],
  [422, H, 440],
];
const NAMES = ["Начало", ...STATIONS.map((s) => s.word)];

// Карта пути слева: та же линия, что идёт по сайту, в миниатюре. Позади точки — чернила, впереди —
// пунктир; значки сцен, до которых дошли, — чернилами. Наведение или Tab открывает лист с
// названиями; клик — пролёт Lenis к станции (lib/stations.ts). Нет на Hero (там пункты шапки) и в
// зоне петли футера; уже 1024px и ниже 600px по высоте — нет совсем (там меню в бургере).
export function PathMap() {
  const rootRef = useRef<HTMLElement>(null);
  const inkRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);
  const lenis = useLenis();

  useEffect(() => {
    const root = rootRef.current;
    const ink = inkRef.current;
    const dot = dotRef.current;
    if (!root || !ink || !dot) return;
    const wide = matchMedia("(min-width: 1024px) and (min-height: 600px)");
    const glyphs = [...root.querySelectorAll<SVGElement>("[data-i]")];
    const buttons = [...root.querySelectorAll<HTMLButtonElement>("button")];
    let footer: Element | null = null;
    let lengths: number[] = [];
    let on = false;
    let k = Number.NaN;
    let inkCss = "";
    let dotCss = "";

    // Длина пути у каждой метки — один раз (геометрия в единицах viewBox от экрана не зависит).
    const measure = () => {
      const total = ink.getTotalLength();
      ink.style.strokeDasharray = `${total} ${total}`;
      lengths = MARKS.map((y) => {
        let lo = 0;
        let hi = total;
        for (let n = 0; n < 24; n++) {
          const m = (lo + hi) / 2;
          if (ink.getPointAtLength(m).y < y) lo = m;
          else hi = m;
        }
        return lo;
      });
      lengths[lengths.length - 1] = total;
    };

    const update = () => {
      const h = viewportH();
      if (!h) return;
      if (!footer?.isConnected) footer = document.querySelector('[data-scene="footer"]');
      // Видна, когда ушли пункты шапки (как в HeaderMenu — 10% экрана), и до зоны петли футера.
      const show =
        wide.matches &&
        window.scrollY > 0.1 * h &&
        (footer?.getBoundingClientRect().top ?? h) > 0.35 * h;
      if (show !== on) {
        on = show;
        root.classList.toggle(styles.on, on);
      }
      if (!on) return;
      if (!lengths.length) measure();
      const total = lengths[lengths.length - 1];
      const p = pathProgress(h);
      const j = Math.max(0, Math.min(MARKS.length - 2, Math.floor(p + 1)));
      const t = Math.max(0, Math.min(1, p + 1 - j));
      const len = lengths[j] + (lengths[j + 1] - lengths[j]) * t;
      const off = (total - len).toFixed(1);
      if (off !== inkCss) {
        inkCss = off;
        ink.style.strokeDashoffset = off;
      }
      const pt = ink.getPointAtLength(len);
      const tr = `translate(${pt.x.toFixed(2)} ${pt.y.toFixed(2)})`;
      if (tr !== dotCss) {
        dotCss = tr;
        dot.setAttribute("transform", tr);
      }
      const kk = Math.floor(p + 1e-6);
      if (kk !== k) {
        k = kk;
        for (const g of glyphs) g.classList.toggle(styles.done, Number(g.dataset.i) <= k);
        buttons.forEach((b, n) => {
          if (n - 1 === k) b.setAttribute("aria-current", "step");
          else b.removeAttribute("aria-current");
        });
      }
    };

    return onScroll(root, update);
  }, []);

  return (
    <nav ref={rootRef} className={styles.map} aria-label="Карта страницы">
      <svg className={styles.svg} viewBox={`0 0 24 ${H}`} aria-hidden="true">
        <path className={styles.ghost} d={PATH} />
        <path ref={inkRef} className={styles.ink} d={PATH} />
        {/* Круг Hero — начало пути, пройден всегда, когда карта видна. */}
        <circle className={`${styles.glyph} ${styles.done}`} cx={12} cy={10} r={6} />
        {/* Работы — точка туннеля и лучи потока. */}
        <g className={styles.glyph} data-i={1}>
          <path d="M16.5 176H20M7.5 176H4M15.2 179.2L17.7 181.7M8.8 179.2L6.3 181.7M8.8 172.8L6.3 170.3M15.2 172.8L17.7 170.3" />
          <circle className={styles.fill} cx={12} cy={176} r={2.2} />
        </g>
        {/* Как мы работаем — веер карточек. */}
        <g className={`${styles.glyph} ${styles.paper}`} data-i={2}>
          <rect x={7.5} y={254} width={9} height={12} rx={1.5} transform="rotate(-18 12 266)" />
          <rect x={7.5} y={254} width={9} height={12} rx={1.5} transform="rotate(18 12 266)" />
          <rect x={7.5} y={254} width={9} height={12} rx={1.5} />
        </g>
        {/* Сколько стоит — мозаика, ось пути делит её пополам. */}
        <g className={`${styles.glyph} ${styles.paper}`} data-i={3}>
          <rect x={4} y={329} width={16} height={16} rx={1.5} />
          <path d="M12 329V345M4 337H20" />
        </g>
        {/* Заявка — письмо. */}
        <g className={`${styles.glyph} ${styles.paper}`} data-i={4}>
          <rect x={4} y={392} width={16} height={12} rx={1.5} />
          <path d="M4.5 393L12 399L19.5 393" />
        </g>
        {/* Контакты — петля в конце пути (круг Hero следующего круга). */}
        <circle className={styles.glyph} data-i={5} cx={12} cy={440} r={7} />
        <circle ref={dotRef} className={styles.dot} r={5.5} transform="translate(12 16)" />
      </svg>
      <ol className={styles.list}>
        {ZONES.map(([a, b, c], n) => (
          <li key={NAMES[n]}>
            <button
              type="button"
              className={styles.station}
              style={{ "--a": a / H, "--b": b / H, "--c": (c - a) / (b - a) } as CSSProperties}
              onClick={() => goToStation(n - 1, lenis)}
            >
              <span className={styles.name}>{NAMES[n]}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
