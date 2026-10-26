"use client";

import { type CSSProperties, useEffect, useRef } from "react";
import { useLenis } from "@/app/providers";
import { phoneLayout } from "@/lib/phoneLayout";
import { onScroll, viewportH } from "@/lib/scroll/onScroll";
import { goToStation, pathProgress, STATIONS } from "@/lib/stations";
import styles from "./PathMap.module.css";

// Миниатюра пути сайта в единицах viewBox 24×450 (ось — x = 12): круг Hero, падение к Услугам,
// змейка Услуг, дальше прямая ось — туннель, веер, мозаика, конверт — и петля в конце. Значки — в
// полосе x 4…20, змейка — 7…17: с точкой (радиус 5,5) карта не шире 22,5 единицы.
const H = 450;
const PATH =
  "M12 16C12 34 16 38 16 49S12 64 12 82C12 86.5 17 88 17 93.5S7 105 7 110.5S17 122 17 127.5S12 137.5 12 142L12 440";
// Метки на пути (y): начало (под кругом Hero) и стыки станций по порядку, шаг ~72; последняя —
// центр петли. Точку на метку ставит стык — тот же, на котором SceneLabel меняет слово, — поэтому
// на метке и значок станции, и её подпись (у Услуг значок — сама змейка, она с метки и начинается).
// Между метками точка идёт непрерывно, по доле прокрутки от стыка до стыка (pathProgress).
const MARKS = [16, 82, 154, 226, 297, 368, 440];
// Подписи — на метках, «Начало» — у центра круга Hero. Зона нажатия — от середины до середины
// между соседними подписями, без дыр и наложений: [от, до, подпись].
// Подвала (последней станции, петли) в списке нет: контактов в нём нет — петля только конец пути.
const NAMES = ["Начало", ...STATIONS.filter((s) => s.scene !== "footer").map((s) => s.word)];
const AT = [10, ...MARKS.slice(1, NAMES.length)];
const ZONES = AT.map((c, n) => [
  n ? (AT[n - 1] + c) / 2 : 0,
  n < AT.length - 1 ? (c + AT[n + 1]) / 2 : H,
  c,
]);
// Значок станции i — на её метке: рисуется вокруг y = 0 и сдвигается на место.
const mark = (i: number) => `translate(0 ${MARKS[i + 1]})`;

// Карта пути слева: та же линия, что идёт по сайту, в миниатюре. Позади точки — чернила, впереди —
// пунктир; значки сцен, до которых дошли, — чернилами. Наведение или Tab открывает лист с
// названиями; клик — пролёт Lenis к станции (lib/stations.ts). Нет на Hero (там пункты шапки) и
// над чёрным подвалом — началом нового круга (Footer.tsx); уже 1024px, ниже 600px по высоте и в
// телефонной раскладке (планшет в портрете) — нет совсем (там меню в бургере).
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
    let mapH = 0;
    let mapKey = "";
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
      const key = `${window.innerWidth}x${h}`;
      if (key !== mapKey) {
        mapKey = key;
        mapH = root.offsetHeight;
      }
      // Видна, когда ушли пункты шапки (как в HeaderMenu — 10% экрана), и пока чёрный подвал
      // (последний блок футера) ниже карты: на чёрном её не видно.
      const black = footer?.lastElementChild ?? footer;
      const show =
        wide.matches &&
        !phoneLayout() &&
        window.scrollY > 0.1 * h &&
        (black?.getBoundingClientRect().top ?? h) > 0.5 * h + mapH / 2;
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
        <g className={styles.glyph} data-i={1} transform={mark(1)}>
          <path d="M16.5 0H20M7.5 0H4M15.2 3.2L17.7 5.7M8.8 3.2L6.3 5.7M8.8 -3.2L6.3 -5.7M15.2 -3.2L17.7 -5.7" />
          <circle className={styles.fill} cx={12} cy={0} r={2.2} />
        </g>
        {/* Как мы работаем — веер карточек. */}
        <g className={`${styles.glyph} ${styles.paper}`} data-i={2} transform={mark(2)}>
          <rect x={7.5} y={-6} width={9} height={12} rx={1.5} transform="rotate(-18 12 6)" />
          <rect x={7.5} y={-6} width={9} height={12} rx={1.5} transform="rotate(18 12 6)" />
          <rect x={7.5} y={-6} width={9} height={12} rx={1.5} />
        </g>
        {/* Сколько стоит — мозаика, ось пути делит её пополам. */}
        <g className={`${styles.glyph} ${styles.paper}`} data-i={3} transform={mark(3)}>
          <rect x={4} y={-8} width={16} height={16} rx={1.5} />
          <path d="M12 -8V8M4 0H20" />
        </g>
        {/* Заявка — письмо. */}
        <g className={`${styles.glyph} ${styles.paper}`} data-i={4} transform={mark(4)}>
          <rect x={4} y={-6} width={16} height={12} rx={1.5} />
          <path d="M4.5 -5L12 1L19.5 -5" />
        </g>
        {/* Петля в конце пути (круг Hero следующего круга) — без подписи. */}
        <circle className={styles.glyph} data-i={5} transform={mark(5)} cx={12} r={7} />
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
