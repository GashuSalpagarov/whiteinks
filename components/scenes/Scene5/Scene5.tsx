"use client";

import { type CSSProperties, useEffect, useRef } from "react";
import { ART } from "@/components/scenes/Scene2";
import { fromPrice, fromWeeks, TYPES, type TypeId } from "@/lib/pricing";
import { onScroll, viewportH } from "@/lib/scroll/onScroll";
import styles from "./Scene5.module.css";

// Элемент услуги из Сцены 2 (Scene2Art) как есть: from — [пункт, элемент], at — место в коробке
// плитки (единицы — px при ширине 1440), turn — поворот.
type Piece = { from: [number, number]; at: [number, number]; turn?: number };

// box — коробка элементов, color — пастель внутри них (в Сцене 2 — --accent пункта). Место и
// размер плитки (по цене: 2×2, 2×1, 1×1) — класс с id типа в Scene5.module.css.
type Tile = { color: string; box: [number, number]; art: Piece[] };

const TILES: Record<TypeId, Tile> = {
  landing: {
    color: "#f4ebc3",
    box: [112, 88],
    art: [
      { from: [0, 0], at: [0, 0], turn: -3 }, // окно браузера
      { from: [0, 1], at: [92, 62] }, // курсор
    ],
  },
  builder: {
    color: "#d3ebdd",
    box: [104, 84],
    art: [
      { from: [3, 0], at: [0, 4] }, // рамка выделения
      { from: [3, 2], at: [84, 58] }, // курсор
    ],
  },
  corp: {
    color: "#f4ebc3",
    box: [90, 72],
    art: [
      { from: [4, 0], at: [0, 8], turn: -5 }, // знак W
      { from: [4, 1], at: [66, 0] }, // образцы цветов
    ],
  },
  shop: {
    color: "#dddaf5",
    box: [124, 100],
    art: [
      { from: [1, 0], at: [46, 0], turn: 5 }, // карточка товара
      { from: [1, 2], at: [4, 52] }, // корзина
    ],
  },
  unique: {
    color: "#f7dccb",
    box: [118, 92],
    art: [
      { from: [2, 2], at: [30, 0] }, // столбики
      { from: [2, 1], at: [0, 44] }, // поиск
    ],
  },
  ai: {
    color: "#d3ebdd",
    box: [136, 96],
    art: [
      { from: [6, 0], at: [0, 6] }, // «Чем помочь?»
      { from: [6, 1], at: [112, -8] }, // искра
      { from: [6, 2], at: [18, 66] }, // схема из трёх узлов
    ],
  },
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

const DOT_R = 6; // px, радиус точки (как .drop в Hero, 12px)
// Капля Сцены 4 падает за нижний край своего кадра на 2 радиуса (stages.ts, dropAt): кадр
// отпускает sticky — и ровно там, у верха этой секции, её подхватывает своя точка.
const CATCH = 2 * DOT_R;
const FALL = 0.4; // экрана прокрутки: на выходе точка падает к точке письма Сцены 6
// Вверх — обратно: что выше точки, складывается (порядок — в Scene5.module.css). false — только
// вперёд: показанное больше не прячется.
const REVERSIBLE = true;
// Каталог стоит на экране (sticky), пока точка идёт по нему с постоянной скоростью — px каталога
// на px прокрутки. Длина стоянки — из этой скорости (сцена тем длиннее, чем выше каталог), но не
// меньше полэкрана.
const DOT_SPEED = 0.45;
const HEADER = 72; // px, шапка сайта: каталог, который помещается, стоит под ней по центру
const GAP = 24; // px, поле у низа экрана, если каталог выше экрана

// Точка письма Сцены 6 — 12px на её линии. Ищем по размеру, не по классу: сцену скоро переделают;
// не нашли — точка падает за низ этой секции.
const letterDot = () =>
  [
    ...document.querySelectorAll<HTMLElement>('[data-scene="scene6"] span[aria-hidden="true"]'),
  ].find((el) => el.offsetWidth === 2 * DOT_R && el.offsetHeight === 2 * DOT_R) ?? null;

// Сцена 5 — прайс мозаикой: в верхнем ряду два дорогих типа во всю половину, в нижнем — четыре
// по одной клетке, от дорогого к дешёвому; на плитках — элементы услуг из Сцены 2. Рамок нет —
// клетки делят линии 1,5, а средний разделитель — линия пути (продолжение Сцены 4). Выбирать
// ничего не нужно — заявка дальше, в Сцене 6.
export function Scene5() {
  const sectionRef = useRef<HTMLElement>(null);
  const inkRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const tilesRef = useRef<HTMLUListElement>(null);

  // Вход — за точкой. Капля Сцены 4 подхватывается у верха секции, и дальше точка идёт вниз по
  // среднему разделителю равномерно — без остановок: по каталогу она проходит одно и то же
  // число px на каждый px прокрутки, от поимки до конца стоянки. На экране это само выходит так:
  // пока каталог въезжает — точка поднимается медленнее страницы, пока стоит (sticky) — идёт
  // вниз. Позади неё линия — чернила, впереди — пунктир. Плитки появляются, когда точка до них
  // дошла, линия под плиткой — когда до её низа: разделитель прорастает от точки
  // в стороны, следом проявляются плитки ряда (CSS). Каталог выше экрана (телефон) встаёт низом к
  // низу экрана. На выходе точка падает к точке письма Сцены 6 и сливается с ней. Состояние —
  // функция положения точки (REVERSIBLE): вверх всё складывается обратно. Прячет содержимое
  // только data-armed — без JS и без анимаций всё сразу.
  useEffect(() => {
    const section = sectionRef.current;
    const ink = inkRef.current;
    const dot = dotRef.current;
    const inner = innerRef.current;
    const tiles = tilesRef.current;
    if (!section || !ink || !dot || !inner || !tiles) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const items = [...tiles.children] as HTMLElement[];
    // Отметки на линии в координатах каталога: верх плитки — её появление (data-in), низ — линия
    // под ней (data-out). Путь точки по каталогу: c0 — где её ловят (у верха секции), speed — px
    // каталога на px прокрутки, чтобы к концу стоянки дойти до низа каталога. Пересчёт — на смену
    // экрана и высоты каталога.
    let key = "";
    let marks: { el: HTMLElement; name: "in" | "out"; at: number }[] = [];
    let target: HTMLElement | null = null;
    let c0 = 0;
    let speed = 1;
    let inkF = "";
    let dotCss = "";
    section.dataset.armed = "";

    const layout = (h: number) => {
      const cs = getComputedStyle(section);
      const padTop = Number.parseFloat(cs.paddingTop);
      const padBottom = Number.parseFloat(cs.paddingBottom);
      const innerH = inner.offsetHeight;
      const fits = innerH <= h - HEADER - 2 * GAP;
      // Не помещается — встаёт низом над полем у низа экрана; почти помещается — так, чтобы
      // верхний ряд не лез под шапку.
      const low = h - GAP - innerH;
      const near = low > 0 && low < HEADER;
      const pinTop = Math.round(
        fits ? HEADER + (h - HEADER - innerH) / 2 : near ? Math.min(h - innerH, HEADER) : low,
      );
      // Поймали, когда верх секции у низа экрана; стоянка кончается через h + padTop − pinTop + pin
      // прокрутки — к этому мигу точка у низа каталога.
      c0 = CATCH - padTop;
      const run = (innerH - c0) / DOT_SPEED;
      const pin = Math.max(0.5 * h, run - (h + padTop - pinTop));
      speed = (innerH - c0) / (h + padTop - pinTop + pin);
      inner.style.top = `${pinTop}px`;
      section.style.height = `${Math.round(padTop + innerH + padBottom + pin)}px`;
      const top = inner.getBoundingClientRect().top;
      marks = items.flatMap((el) => {
        const r = el.getBoundingClientRect();
        return [
          { el, name: "in" as const, at: r.top - top },
          { el, name: "out" as const, at: r.bottom - top },
        ];
      });
      target = letterDot();
    };

    // Появление по положению точки d (px от верха секции): что точка прошла — показано, что выше
    // неё — сложено (если REVERSIBLE). Пишем только изменившееся.
    const set = (el: HTMLElement, name: string, on: boolean) => {
      if (name in el.dataset === on || (!on && !REVERSIBLE)) return;
      if (on) el.dataset[name] = "";
      else delete el.dataset[name];
    };
    const paint = (d: number) => {
      for (const m of marks) set(m.el, m.name, d >= m.at);
    };

    const update = () => {
      // Замеры — до записей.
      const h = viewportH();
      const w = window.innerWidth;
      if (!h) return;
      const k = `${w}x${h}x${inner.offsetHeight}`;
      if (k !== key) {
        key = k;
        layout(h);
      }
      const rect = section.getBoundingClientRect();
      if (!(rect.height > 0)) return;
      const hide = () => {
        if (dotCss === "") return;
        dotCss = "";
        dot.style.opacity = "0";
      };
      // Секция ниже экрана — точкой ещё ведёт Сцена 4, всё сложено. Уже выше экрана (в том числе
      // прыжком к письму) — всё показано, линия в чернилах, точка слилась с точкой письма.
      if (rect.top > h) {
        paint(reduced ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY);
        hide();
        return;
      }
      if (rect.bottom < 0) {
        paint(Number.POSITIVE_INFINITY);
        if (inkF !== "1") {
          inkF = "1";
          ink.style.transform = "scaleY(1)";
        }
        hide();
        return;
      }
      const ft = inner.getBoundingClientRect().top; // верх каталога на экране
      const t = target?.isConnected ? target.getBoundingClientRect() : null;
      const goal = t ? t.top + t.height / 2 : rect.bottom + CATCH; // куда точка падает на выходе

      // Точка, px от верха экрана (lead — без выхода): по каталогу — c0 + speed · прокрутка от
      // поимки, на экране — от его верха (до стоянки он едет, на стоянке стоит).
      const lead = ft + c0 + speed * (h - rect.top);
      // Выход: опускается к низу экрана, к краю, из-за которого поднимается точка письма, и ждёт
      // её там, не уходя за край (на странице идёт вместе с прокруткой); сливаются, когда та
      // поднялась к ней.
      const span = FALL * h;
      const fall = clamp01((h + DOT_R + span - goal) / span);
      const to = Math.min(goal, h - DOT_R);
      const y = lead + (to - lead) * fall * fall;
      const merged = fall >= 1 && goal <= h - DOT_R;
      const d = y - rect.top; // точка в координатах секции

      paint(reduced ? Number.POSITIVE_INFINITY : y - ft);

      const f = reduced || merged ? "1" : clamp01(d / rect.height).toFixed(4);
      if (f !== inkF) {
        inkF = f;
        ink.style.transform = `scaleY(${f})`;
      }
      const shown = !reduced && !merged;
      const css = shown ? `translate(${(w / 2).toFixed(1)}px,${y.toFixed(2)}px)` : "";
      if (css !== dotCss) {
        dotCss = css;
        dot.style.opacity = shown ? "1" : "0";
        if (shown) dot.style.transform = css;
      }
    };

    return onScroll(section, update);
  }, []);

  return (
    <section ref={sectionRef} className={styles.scene5} data-scene="scene5" aria-label="Прайс">
      {/* Линия пути: пунктир (::before секции), над ним — чернила до точки, над ними — точка; всё
          под мозаикой (на телефоне мозаика на белом их закрывает). */}
      <div ref={inkRef} className={styles.ink} aria-hidden="true" />
      <span ref={dotRef} className={styles.dot} aria-hidden="true" />
      {/* Название сцены — общей подписью в шапке (components/ui/SceneLabel). */}
      <div ref={innerRef} className={styles.inner}>
        <ul ref={tilesRef} className={styles.tiles}>
          {TYPES.map((t) => {
            const { color, box, art } = TILES[t.id];
            return (
              <li
                key={t.id}
                className={`${styles.tile} ${styles[t.id]}`}
                style={{ "--c": color } as CSSProperties}
              >
                <div
                  className={styles.art}
                  style={{ "--w": box[0], "--h": box[1] } as CSSProperties}
                  aria-hidden="true"
                >
                  {art.map(({ from: [i, j], at: [x, y], turn }) => (
                    <span
                      key={`${i}-${j}`}
                      style={{
                        left: `${x / 10}em`,
                        top: `${y / 10}em`,
                        rotate: turn ? `${turn}deg` : undefined,
                      }}
                    >
                      {ART[i][j].el}
                    </span>
                  ))}
                </div>
                <h3 className={styles.name}>{t.title}</h3>
                <p className={styles.includes}>{t.includes}</p>
                <p className={styles.price}>{fromPrice(t.base)}</p>
                <p className={styles.term}>{fromWeeks(t.weeks)}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
