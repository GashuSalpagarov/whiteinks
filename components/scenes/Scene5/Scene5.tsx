"use client";

import { type CSSProperties, useEffect, useRef } from "react";
import { ART } from "@/components/scenes/Scene2";
import { type BriefPreset, openBrief } from "@/lib/brief";
import { formatFrom, fromPrice, fromWeeks, TYPES, type TypeId } from "@/lib/pricing";
import { phoneHold } from "@/lib/scroll/handoff";
import { onScroll, viewportH } from "@/lib/scroll/onScroll";
import styles from "./Scene5.module.css";

// Элемент услуги из Сцены 2 (Scene2Art) как есть: from — [пункт, элемент], at — место в коробке
// плитки (единицы — px при ширине 1440), turn — поворот.
type Piece = { from: [number, number]; at: [number, number]; turn?: number };

// box — коробка элементов (все элементы — внутри неё: место под рисунок в клетке — по коробке),
// color — пастель внутри них (в Сцене 2 — --accent пункта). Место и
// размер плитки (по цене: 2×2, 2×1, 1×1) — класс с id типа в Scene5.module.css.
type Tile = { color: string; box: [number, number]; art: Piece[] };

// Клетка → пилюля «что нужно» в окне заявки; уточнение уходит в заявку: «Сайт — лендинг».
const BRIEF: Record<TypeId, BriefPreset> = {
  landing: { need: "Сайт", detail: "лендинг" },
  builder: { need: "Сайт", detail: "на конструкторе" },
  corp: { need: "Сайт", detail: "корпоративный" },
  unique: { need: "Сайт", detail: "уникальный" },
  shop: { need: "Магазин" },
  app: { need: "Приложение" },
  tma: { need: "Приложение", detail: "Telegram Mini App" },
  ai: { need: "ИИ и автоматизация" },
  support: { need: "Другое", other: "Поддержка: доработки и обновления" },
  seo: { need: "Другое", other: "SEO и продвижение" },
};

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
    box: [140, 104],
    art: [
      { from: [6, 0], at: [0, 14] }, // «Чем помочь?»
      { from: [6, 1], at: [112, 0] }, // искра
      { from: [6, 2], at: [18, 74] }, // схема из трёх узлов
    ],
  },
  app: {
    color: "#d3ebdd",
    box: [86, 92],
    art: [
      { from: [5, 0], at: [0, 8], turn: -8 }, // телефон
      { from: [5, 0], at: [40, 0], turn: 6 }, // второй телефон
    ],
  },
  tma: {
    color: "#dddaf5",
    box: [116, 80],
    art: [
      { from: [5, 1], at: [0, 36] }, // Telegram
      { from: [5, 2], at: [24, 0] }, // облачко «Mini App»
    ],
  },
  support: {
    color: "#f7dccb",
    box: [110, 76],
    art: [
      { from: [7, 1], at: [0, 14], turn: -3 }, // растущий график
      { from: [7, 2], at: [66, 0] }, // шестерёнка
    ],
  },
  seo: {
    color: "#f4ebc3",
    box: [132, 54],
    art: [
      { from: [7, 0], at: [0, 0], turn: -2 }, // результат поиска
    ],
  },
};

// Тихая строка под мозаикой, двумя половинами по сторонам линии пути: слева условия работы, справа
// оговорка о ценах — по ст. 437 ГК цены на сайте не публичная оферта. В пункте условий —
// неразрывные пробелы: пункт не рвётся, перенос — только после «·». ЗАГЛУШКИ владельца: «3 месяца»
// гарантии и проценты оплаты по этапам (пока не названы — допишутся к пункту).
const TERMS = [
  ["Договор", "оплата по этапам", "код и права — ваши", "гарантия 3 месяца", "NDA по запросу"]
    .map((t) => t.replaceAll(" ", "\u00a0"))
    .join("\u00a0· "),
  "цены\u00a0— ориентир, не\u00a0публичная\u00a0оферта; стоимость\u00a0и\u00a0срок\u00a0— в\u00a0договоре",
];

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

const DOT_R = 6; // px, радиус точки (как .drop в Hero, 12px)
// Капля Сцены 4 падает к нижнему краю своего кадра и касается его, вся в экране (stages.ts,
// dropAt): кадр отпускает sticky — и ровно там, на радиус выше верха этой секции, её подхватывает
// своя точка.
const CATCH = -DOT_R;
const FALL = 0.4; // экрана прокрутки: на выходе точка падает к точке письма Сцены 6
// Вверх — обратно: что выше точки, складывается (порядок — в Scene5.module.css). false — только
// вперёд: показанное больше не прячется.
const REVERSIBLE = true;
// Каталог стоит на экране (sticky), пока точка идёт по нему с постоянной скоростью — px каталога
// на px прокрутки. Длина стоянки — из этой скорости (сцена тем длиннее, чем выше каталог), но не
// меньше полэкрана.
const DOT_SPEED = 0.45;
const HEADER = 72; // px, шапка сайта: каталог, который помещается, стоит под ней по центру
const GAP = 24; // px, поле у низа экрана: каталог помещается, если над ним и под ним есть по GAP
// Каталог выше экрана (телефон): не стоит, точка — на высоте экрана (lib/scroll/handoff.ts). Ловим
// её на LOW экрана, где её отпускает Сцена 4, дальше она поднимается медленнее страницы (по
// каталогу — RISE px на px прокрутки, как в Сцене 6) до высоты входа в письмо и держится на ней.
const LOW = 0.9;
const RISE = 0.6;

// Точка письма Сцены 6 — 12px на её линии. Ищем по размеру, не по классу: сцену скоро переделают;
// не нашли — точка падает за низ этой секции.
const letterDot = () =>
  [
    ...document.querySelectorAll<HTMLElement>('[data-scene="scene6"] span[aria-hidden="true"]'),
  ].find((el) => el.offsetWidth === 2 * DOT_R && el.offsetHeight === 2 * DOT_R) ?? null;

// Сцена 5 — прайс мозаикой: в верхнем ряду два дорогих типа во всю половину, во втором — четыре
// сайта по одной клетке, от дорогого к дешёвому, в третьем — слева от линии приложения, справа
// помесячные услуги; на плитках — элементы услуг из Сцены 2. Рамок нет —
// клетки делят линии 1,5, а средний разделитель — линия пути (продолжение Сцены 4). Выбирать
// ничего не нужно — заявка дальше, в Сцене 6.
export function Scene5() {
  const sectionRef = useRef<HTMLElement>(null);
  const inkRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const tilesRef = useRef<HTMLUListElement>(null);
  const termsRef = useRef<HTMLParagraphElement>(null);

  // Вход — за точкой. Капля Сцены 4 подхватывается у верха секции, и дальше точка идёт вниз по
  // среднему разделителю равномерно — без остановок: по каталогу она проходит одно и то же
  // число px на каждый px прокрутки, от поимки до конца стоянки. На экране это само выходит так:
  // пока каталог въезжает — точка поднимается медленнее страницы, пока стоит (sticky) — идёт
  // вниз. Позади неё линия — чернила, впереди — пунктир. Плитки появляются, когда точка до них
  // дошла, линия под плиткой — когда до её низа: разделитель прорастает от точки
  // в стороны, следом проявляются плитки ряда (CSS). На выходе точка падает к точке письма Сцены 6
  // и сливается с ней. Каталог выше экрана (телефон) не стоит: точка идёт по нему со скоростью
  // страницы на постоянной высоте экрана и на той же высоте уходит в Сцену 6. Состояние —
  // функция положения точки (REVERSIBLE): вверх всё складывается обратно. Прячет содержимое
  // только data-armed — без JS и без анимаций всё сразу.
  useEffect(() => {
    const section = sectionRef.current;
    const ink = inkRef.current;
    const dot = dotRef.current;
    const inner = innerRef.current;
    const tiles = tilesRef.current;
    const terms = termsRef.current;
    if (!section || !ink || !dot || !inner || !tiles || !terms) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const items = [...tiles.children] as HTMLElement[];
    // Отметки на линии в координатах каталога: верх плитки — её появление (data-in), низ — линия
    // под ней (data-out). Путь точки по каталогу: c0 — где её ловят (у верха секции), speed — px
    // каталога на px прокрутки, чтобы к концу стоянки дойти до низа каталога. Пересчёт — на смену
    // экрана и высоты каталога.
    let key = "";
    let marks: { el: HTMLElement; name: "in" | "out"; at: number }[] = [];
    let termsAt = 0; // верх условий под мозаикой — там они появляются
    let target: HTMLElement | null = null;
    let c0 = 0;
    let speed = 1;
    let flow = false; // каталог выше экрана и Сцена 6 не стоит — каталог не стоит
    let inkF = "";
    let dotCss = "";
    section.dataset.armed = "";

    const layout = (h: number) => {
      const cs = getComputedStyle(section);
      const padTop = Number.parseFloat(cs.paddingTop);
      const padBottom = Number.parseFloat(cs.paddingBottom);
      const innerH = inner.offsetHeight;
      const fits = innerH <= h - HEADER - 2 * GAP;
      flow = !fits && Number.isFinite(phoneHold.y);
      // Не помещается — встаёт низом над полем у низа экрана; почти помещается — так, чтобы
      // верхний ряд не лез под шапку. Не стоит (flow) — top под шапкой: туда приводит «Сколько
      // стоит» из меню (lib/stations.ts).
      const low = h - GAP - innerH;
      const near = low > 0 && low < HEADER;
      const pinTop = Math.round(
        flow
          ? HEADER
          : fits
            ? HEADER + (h - HEADER - innerH) / 2
            : near
              ? Math.min(h - innerH, HEADER)
              : low,
      );
      // Поймали, когда верх секции у низа экрана; стоянка кончается через h + padTop − pinTop + pin
      // прокрутки — к этому мигу точка у низа каталога.
      c0 = CATCH - padTop;
      const run = (innerH - c0) / DOT_SPEED;
      const pin = flow ? 0 : Math.max(0.5 * h, run - (h + padTop - pinTop));
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
      termsAt = terms.offsetTop; // без сдвига появления (translate)
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
      // Условия — когда точка дошла до них, и уже не гаснут: показанное не прячется.
      if (d >= termsAt) set(terms, "in", true);
    };

    const update = () => {
      // Замеры — до записей.
      const h = viewportH();
      const w = window.innerWidth;
      if (!h) return;
      const k = `${w}x${h}x${inner.offsetHeight}x${phoneHold.y}`;
      if (k !== key) {
        key = k;
        layout(h);
      }
      // Каталог не стоит: точку держат на высоте входа в письмо (её пишет Сцена 6), а ловят ниже —
      // там, где её отпускает Сцена 4.
      const hold = phoneHold.y;
      const low = Math.max(hold, Math.round(LOW * h));
      phoneHold.low = flow ? low : Number.NaN;
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
      let y: number;
      let merged: boolean;
      if (flow) {
        // Каталог не стоит: Сцена 4 отпускает точку на low (на радиус выше верха секции), дальше
        // она поднимается медленнее страницы до hold и держится на нём — по каталогу идёт со
        // скоростью страницы. Низ секции дошёл до неё — дальше её ведёт Сцена 6 с той же высоты.
        const v = low + DOT_R - rect.top; // прокрутка от поимки
        y = Math.max(hold, low - (1 - RISE) * Math.max(0, v));
        merged = v < 0 || rect.bottom <= y;
      } else {
        const t = target?.isConnected ? target.getBoundingClientRect() : null;
        const goal = t ? t.top + t.height / 2 : rect.bottom + 2 * DOT_R; // куда падает на выходе
        // Точка, px от верха экрана (lead — без выхода): по каталогу — c0 + speed · прокрутка от
        // поимки, на экране — от его верха (до стоянки он едет, на стоянке стоит).
        const lead = ft + c0 + speed * (h - rect.top);
        // Выход: опускается к низу экрана, к краю, из-за которого поднимается точка письма, и ждёт
        // её там, не уходя за край (на странице идёт вместе с прокруткой); сливаются, когда та
        // поднялась к ней. За край не уходит и каталог, вставший низом к низу экрана (почти
        // помещается): путь по нему кончается у самого края.
        const span = FALL * h;
        const fall = clamp01((h + DOT_R + span - goal) / span);
        const to = Math.min(goal, h - DOT_R);
        y = Math.min(lead + (to - lead) * fall * fall, h - DOT_R);
        merged = fall >= 1 && goal <= h - DOT_R;
      }
      const d = y - rect.top; // точка в координатах секции

      paint(reduced ? Number.POSITIVE_INFINITY : y - ft);

      const f = reduced || (merged && !flow) ? "1" : clamp01(d / rect.height).toFixed(4);
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
                      key={`${i}-${j}-${x}`}
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
                {/* Помесячные (без срока) — цена как есть, под ней «в месяц». */}
                <p className={styles.price}>{t.weeks ? fromPrice(t.base) : formatFrom(t.base)}</p>
                <p className={styles.term}>{t.weeks ? fromWeeks(t.weeks) : "в месяц"}</p>
                {/* Вся клетка — кнопка: окно заявки с этим типом (растёт из точки нажатия). */}
                <button
                  type="button"
                  className={styles.open}
                  aria-label={`${t.title}: обсудить проект`}
                  onClick={(e) =>
                    openBrief(e.currentTarget, {
                      preset: BRIEF[t.id],
                      point: e.detail ? [e.clientX, e.clientY] : undefined,
                    })
                  }
                />
              </li>
            );
          })}
        </ul>
        <p ref={termsRef} className={styles.terms}>
          {TERMS.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </p>
      </div>
    </section>
  );
}
