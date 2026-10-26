"use client";

import { useEffect, useRef } from "react";
import { LOOP_EVENT } from "@/components/scenes/Footer";
import { phoneLayout } from "@/lib/phoneLayout";
import { onScroll, setVar, syncScroll, viewportH } from "@/lib/scroll/onScroll";
import heroStyles from "../Hero/Hero.module.css";
import styles from "./Scene2.module.css";
import { ART, type Slot } from "./Scene2Art";

// Колена трассы на десктопе — размах в vw, по очереди влево и вправо; 7vh «прелюдии» —
// ничтожная вертикальная прямая прежде чем начнётся первое колено.
const KNEES = [-32, 18, -26, 14];
const PRELUDE = 7;

// Конец трассы: точка вернулась в центр. Дальше трасса уезжает вверх вместе со страницей, а её
// конец с точкой связывает нить — прямая по центру той же толщины. Через TAIL после конца трассы
// точка входит в Сцену 3 (там кончается и секция); к этому мигу линия над точкой растворяется
// сверху вниз: за FADE прокрутки граница прозрачности с мягким краем в EDGE экрана проходит
// от верха экрана до точки. Назад — всё обратно. TAIL и FADE — vh прокрутки.
const TAIL = 30;
const FADE = 60;
const EDGE = 0.25; // как у маски .fade в Scene2.module.css
const BREATH = 48; // px прокрутки, за которые гаснет пульс точки в покое
const smooth = (t: number) => t * t * (3 - 2 * t);

// Вход из Hero. В покое точка у конца линии Hero (93% экрана) — на d ниже своего места в центре
// (+20px). С первого пикселя прокрутки она идёт по пути: поднимается к месту вдвое медленнее
// страницы, то есть по странице — вниз, вдвое медленнее прокрутки, и последние 0.14 экрана плавно
// тормозит. Возвращает, на сколько px точка ниже места. Страницу тянут вниз за верх (iOS) — точка
// едет с ней, как стояла.
function dropLift(y: number, h: number): number {
  const d = 0.43 * h - 20;
  const e = 0.14 * h;
  const s = 2 * d - e / 2; // отсюда — торможение
  if (y < 0) return d - y;
  if (y >= s + e) return 0;
  const t = Math.max(0, y - s);
  return d - y / 2 + (t * t) / (4 * e);
}

// Раскладка: места блоков (px от верха секции) и опорные точки трассы [phase, сдвиг в vw] —
// между ними косинусный переход. Phase — по месту точки на странице: (прокрутка + dropLift) − 43vh;
// точка на phase стоит в (phase − 7)vh + 20px от верха секции, на phase 0 — на 20px ниже конца
// линии Hero. Считается раз на размер экрана и высоты блоков (heights; below — насколько элемент
// пункта под блоком, со стороны трассы, ниже блока).
type Layout = { tops: number[]; keys: [number, number][]; end: number };

function layout(w: number, h: number, heights: number[], below: number[]): Layout {
  const phase = (y: number) => ((y - 20) / h) * 100 + PRELUDE;
  let tops: number[] = [];
  const keys: [number, number][] = [[0, 0]];
  if (w >= 768 && h <= 500) {
    // Короткий ландшафт (как в Scene2.module.css) — как раньше: колено на экран, блок в 4–5
    // строк выше 40% экрана, и пары раздвинуты по-своему; слева тексты длиннее (блок до 68%
    // экрана) — верхний блок пары выше: ниже нижнего проходит точка.
    keys.push([PRELUDE, 0]);
    for (let k = 0; k < 4; k++)
      keys.push([PRELUDE + 100 * k + 50, KNEES[k]], [PRELUDE + 100 * (k + 1), 0]);
    tops = [0.06, 0.58, 0.9, 1.58, 2.06, 2.58, 2.84, 3.58].map((f) => f * h);
  } else if (!phoneLayout()) {
    // Ровный ритм по настоящей высоте блоков: в паре (одна сторона трассы) от тегов верхнего
    // до нижнего — 0.11 экрана, между парами (по разные стороны) — 0.04. Перед первым блоком —
    // 0.16 экрана от точки, а трасса до него идёт прямо: Сцена 2 начинается отдельно от Hero.
    // Колено — от середины просвета между парами до следующей, пик — посередине своей пары.
    const gap = 0.11 * h;
    const cross = 0.04 * h;
    let top = 20 + 0.16 * h;
    keys.push([phase(top - cross / 2), 0]);
    for (let k = 0; k < 4; k++) {
      const low = top + heights[2 * k] + gap;
      const end = low + heights[2 * k + 1];
      tops.push(top, low);
      keys.push([phase((top + end) / 2), KNEES[k]], [phase(end + cross / 2), 0]);
      top = end + cross;
    }
  } else {
    // Телефонная раскладка (как мобильный блок Scene2.module.css): блоки широкие, колоколу между ними
    // места нет. Точка идёт «серпантином»: в 13vw от края (±37vw), пока напротив неё пара блоков,
    // и между парами переходит на другую сторону. Верхний блок пары встаёт, когда переход пройден
    // на 0.85, нижний — через просвет 0.06 экрана, не меньше 50px (в просвете — значки gap из
    // Scene2Art, на низком экране им иначе не хватит места); у края точка держится до низа пары
    // и элемента под ней со стороны трассы (below) и ещё 0.02 экрана — элемент снаружи, у края
    // экрана, точка минует уже выше него. Из центра и в центр — как на десктопе: стыки с Hero
    // и Scene 3 те же.
    let y = 20 - 0.07 * h; // точка на phase 0
    let cross = 0.19 * h;
    for (let k = 0; k < 4; k++) {
      const side = k % 2 ? 37 : -37;
      keys.push([phase(y + cross), side]);
      const top = y + 0.85 * cross;
      tops.push(top, top + heights[2 * k] + Math.max(0.06 * h, 50));
      y = tops[2 * k + 1] + heights[2 * k + 1] + below[2 * k + 1] + 0.02 * h;
      keys.push([phase(y), side]);
      // Не короче 120px: элемент над верхним блоком следующей пары стоит у края, от которого
      // точка уходит, — на коротком экране она прошла бы по нему.
      cross = Math.max(0.23 * h, 120);
    }
    keys.push([phase(y + 0.14 * h), 0]);
  }
  return { tops, keys, end: keys[keys.length - 1][0] };
}

// Скорость элемента пункта (Scene2Art) — доля подъёма блока при появлении, у каждого места своя.
const ART_DEPTH: Record<Slot, number> = {
  topOut: 0.06,
  out: 0.1,
  bottom: 0.12,
  in: 0.08,
  gap: 0.08,
};

type Block = {
  title: string;
  body: string;
  tags: string[];
  side: "left" | "right";
};

// Услуги. Неразрывный пробел (\u00a0) — перед тире и внутри названия Telegram Mini App.
const BLOCKS: Block[] = [
  // Колено 0 — точка идёт влево, блоки справа
  {
    title: "Сайты под ключ",
    body: "Корпоративные сайты и лендинги: от структуры и текстов до запуска и аналитики.",
    tags: ["Лендинги", "Корпоративные", "Каталоги", "Промо"],
    side: "right",
  },
  {
    title: "Интернет-магазины",
    body: "Каталог, корзина, оплата и доставка\u00a0— магазин, который удобно вести и легко растить.",
    tags: ["Каталог", "Оплата и доставка", "1С и CRM"],
    side: "right",
  },
  // Колено 1 — точка идёт вправо, блоки слева
  {
    title: "Продуктовая аналитика",
    body: "Изучаем аудиторию и конкурентов до разработки, чтобы продукт решал настоящие задачи.",
    tags: ["Интервью", "Конкуренты", "CJM", "Прототипы"],
    side: "left",
  },
  {
    title: "UX/UI-дизайн",
    body: "Проектируем сценарии и рисуем интерфейсы, понятные с первого экрана.",
    tags: ["Интерфейсы", "Дизайн-системы", "Анимация", "3D"],
    side: "left",
  },
  // Колено 2 — точка идёт влево, блоки справа
  {
    title: "Брендинг",
    body: "Имя, логотип и айдентика, которые узнают сразу, и бренд-бук, чтобы их сохранить.",
    tags: ["Нейминг", "Логотип", "Айдентика", "Бренд-бук"],
    side: "right",
  },
  {
    title: "Мобильные приложения и Telegram\u00a0Mini\u00a0App",
    body: "iOS, Android и приложения внутри Telegram\u00a0— от прототипа до публикации.",
    tags: ["iOS", "Android", "Telegram Mini App"],
    side: "right",
  },
  // Колено 3 — точка идёт вправо, блоки слева
  {
    title: "ИИ и автоматизация",
    body: "Чат-боты на нейросетях и автоматизация рутины: связываем сайт, CRM и 1С, чтобы заявки и документы шли сами.",
    tags: ["ИИ-боты", "Интеграции", "CRM и 1С", "Бизнес-процессы"],
    side: "left",
  },
  {
    title: "Поддержка, развитие и SEO",
    body: "Дорабатываем, следим за стабильностью и приводим клиентов из поиска.",
    tags: ["Поддержка", "Доработки", "SEO", "Аналитика"],
    side: "left",
  },
];

// Сдвиг точки (vw): косинусный переход между опорными точками — производная = 0 в каждой,
// колено к колену без излома.
function getDropX(scrollVh: number, keys: [number, number][]): number {
  if (scrollVh < 43) return 0;
  const phase = scrollVh - 43;
  for (let i = 1; i < keys.length; i++) {
    const [p1, x1] = keys[i];
    if (phase >= p1) continue;
    const [p0, x0] = keys[i - 1];
    return x0 + (x1 - x0) * 0.5 * (1 - Math.cos((Math.PI * (phase - p0)) / (p1 - p0)));
  }
  return 0;
}

// Блок проявляется, как только въехал снизу на экран: верх блока на APPEAR экрана — прозрачный
// и на RISE px ниже места, ещё через APPEAR_LEN экрана прокрутки — на месте. Впереди видно, что
// дальше. Потом остаётся и уезжает вверх вместе со страницей — под шапку (на телефоне — с её
// полосой, Hero.module.css).
const APPEAR = 0.92;
const APPEAR_LEN = 0.26;
const RISE = 24;

// Трасса целиком, в координатах страницы при прокрутке 0: точка на месте s (vh, прокрутка +
// dropLift) стоит в (50vw + getDropX(s), 50vh + s + 20px). Строится вместе с раскладкой и лежит
// трафаретом в потоке страницы (Scene2.module.css, .trail): едет вместе с текстом.
function buildTrail(w: number, h: number, { keys, end }: Layout): string {
  // Начало — конец линии Hero (точка покоя, 93vh): вместе они читаются как одна линия. 20px —
  // сдвиг точки вниз после Hero (--drop-offset).
  const points: [number, number][] = [[w * 0.5, h * 0.93]];
  const n = Math.ceil(end / 0.6);
  for (let i = 0; i <= n; i++) {
    const s = 43 + (end * i) / n;
    points.push([((50 + getDropX(s, keys)) * w) / 100, ((50 + s) * h) / 100 + 20]);
  }

  // Catmull-Rom через cubic Bezier — кривая проходит через все sample points
  // с C1-гладкостью.
  const f = (p: [number, number]) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
  let d = `M${f(points[0])}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i + 2 < points.length ? points[i + 2] : points[i + 1];

    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;

    d += ` C${f([c1x, c1y])} ${f([c2x, c2y])} ${f(p2)}`;
  }
  return d;
}

// Ход по прокрутке: анимация (WAAPI), у которой время — прокрутка страницы, px от from до from + dur.
// Где есть ScrollTimeline, её ведёт сам браузер в такт прокрутке — как и саму страницу, даже если
// главный поток к кадру не успел. Где нет — время ставит общий проход (seek).
type Scrub = { anim: Animation; from: number; dur: number; t: number };

export function Scene2() {
  const sectionRef = useRef<HTMLElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);
  const inkRef = useRef<HTMLDivElement>(null);
  const fadeRef = useRef<HTMLDivElement>(null);
  const bridgeRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const trail = trailRef.current;
    const ink = inkRef.current;
    const fade = fadeRef.current;
    if (!section || !trail || !ink || !fade) return;
    const blockEls = [...section.querySelectorAll<HTMLElement>("aside")];
    const artEls = blockEls.map((el, i) =>
      [...el.querySelectorAll<HTMLElement>(`.${styles.art} > *`)].map((art, j) => ({
        el: art,
        slot: ART[i][j].slot,
        depth: ART_DEPTH[ART[i][j].slot],
      })),
    );
    // Стили пишем прямо на элементы и только изменившиеся. Не переменными на корне: каждая
    // их смена пересчитывает стили всей страницы (~850 узлов, 7–10 мс на кадр).
    const written = new Map<Element, Map<string, string>>();
    const put = (el: HTMLElement | SVGElement, prop: string, value: string) => {
      const last = written.get(el) ?? new Map<string, string>();
      if (last.get(prop) === value) return;
      last.set(prop, value);
      written.set(el, last);
      el.style.setProperty(prop, value);
    };

    // Всё, что идёт за прокруткой, — ходы по ней (Scrub): точка, чернила, появление блоков. Так
    // на кадр нет записей из прохода, а точка не сходит с изгиба, который едет вместе с текстом.
    const timeline =
      "ScrollTimeline" in window ? new ScrollTimeline({ source: document.documentElement }) : null;
    if (!timeline) trail.classList.add(styles.onScreen);
    let scrubs: Scrub[] = [];
    const scrub = (el: Element, frames: Keyframe[], from: number, to: number, fill: FillMode) => {
      const dur = Math.max(1, to - from);
      const anim = timeline
        ? el.animate(frames, {
            timeline,
            rangeStart: `${from}px`,
            rangeEnd: `${from + dur}px`,
            fill,
          })
        : el.animate(frames, { duration: dur, fill });
      if (!timeline) anim.pause();
      const s = { anim, from, dur, t: Number.NaN };
      scrubs.push(s);
      return s;
    };
    const seek = (s: Scrub, y: number) => {
      const t = Math.max(0, Math.min(s.dur, y - s.from));
      if (t === s.t) return;
      s.t = t;
      s.anim.currentTime = t;
    };

    let drop: HTMLElement | null = null;
    let dotScrub: Scrub | null = null;
    let layoutKey = "";
    let L: Layout = { tops: [], keys: [[0, 0]], end: 0 };
    let trailTop = 0; // верх трафарета на странице, px
    let trailEnd = 0; // прокрутка, с которой трафарет весь выше экрана
    let bridgeKey = "";
    let lastY = 0;
    const update = () => {
      const w = window.innerWidth;
      // Общая высота экрана (как --ih в CSS): на телефоне vh больше innerHeight.
      const h = viewportH();
      if (!h) return; // иначе scrollVh = NaN
      const scrollY = window.scrollY;
      // Точка и чернила — целыми пикселями экрана, чтобы линия не размывалась.
      const dpr = window.devicePixelRatio || 1;
      const px = (v: number) => Math.round(v * dpr) / dpr;

      // Сначала замеры, потом записи: замер после записи заново пересчитывал бы стили.
      const rect = section.getBoundingClientRect();
      const heights = blockEls.map((el) => el.offsetHeight);
      const sectionTop = Math.round((rect.top + scrollY) * 100) / 100;

      // Сдвиги точки — на самой точке (она в вёрстке Hero). Место точки — центр экрана + 20px,
      // как в Сцене 3.
      if (!drop?.isConnected) {
        drop = document.querySelector<HTMLElement>(`.${heroStyles.drop}`);
        layoutKey = "";
      }

      // Раскладка — на новый размер экрана и высоты блоков (догрузился шрифт), не каждый кадр:
      // места блоков, высота секции — до входа в Сцену 3, трафарет трассы и ходы по прокрутке.
      const key = `${w} ${h} ${sectionTop} ${heights.join(" ")}`;
      if (key !== layoutKey) {
        layoutKey = key;
        // На телефоне элемент .bottom — под блоком со стороны трассы (Scene2.module.css).
        const below = artEls.map((arts, i) =>
          Math.max(
            0,
            ...arts
              .filter(({ slot }) => slot === "bottom")
              .map(({ el }) => el.offsetTop + el.offsetHeight - heights[i]),
          ),
        );
        L = layout(w, h, heights, below);
        for (const [i, top] of L.tops.entries()) put(blockEls[i], "top", `${top}px`);
        put(section, "height", `${((43 + L.end + TAIL) * h) / 100}px`);
        for (const s of scrubs) s.anim.cancel();
        scrubs = [];

        // Трафарет: трасса от конца линии Hero и дальше прямая по центру — до точки на входе
        // в Сцену 3, когда линия над ней уже растворилась. Лежит в потоке страницы — изгибы
        // едут вместе с текстом; видна трасса там, где под трафаретом чернила (.ink).
        const endVh = 43 + L.end;
        trailTop = Math.floor(0.93 * h) - 4;
        const bottom = Math.ceil(((50 + endVh + TAIL) * h) / 100) + 60;
        const height = bottom - trailTop;
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${height}" viewBox="0 ${trailTop} ${w} ${height}"><path d="${buildTrail(w, h, L)} V${bottom}" fill="none" stroke="#000" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
        if (timeline) put(trail, "top", `${trailTop - sectionTop}px`);
        put(trail, "height", `${height}px`);
        put(trail, "mask-size", `${w}px ${height}px`);
        put(trail, "mask-image", `url("data:image/svg+xml,${encodeURIComponent(svg)}")`);
        trailEnd = bottom;

        // Точка: с прокрутки 0 до конца трассы идёт по изгибу (getDropX), на входе из Hero она
        // ниже места на lift. Дальше — по центру, на своём месте. Чернила обрезаны по ней же.
        // Кадры — через 8px прокрутки: между ними прямая, от изгиба — меньше 0,5px.
        const liftEnd = 2 * (0.43 * h - 20) + 0.07 * h; // dropLift: s + e
        const dotEnd = Math.max(liftEnd, (endVh * h) / 100);
        const steps = (end: number) => {
          const n = Math.ceil(end / 8);
          return Array.from({ length: n + 1 }, (_, i) => (end * i) / n);
        };
        const dotFrames = steps(dotEnd).map((y) => {
          const lift = px(dropLift(y, h));
          const x = (getDropX(((y + lift) / h) * 100, L.keys) * w) / 100;
          return { translate: `calc(-50% + ${x.toFixed(2)}px) calc(-50% + ${20 + lift}px)` };
        });
        dotScrub = drop ? scrub(drop, dotFrames, 0, dotEnd, "both") : null;
        if (timeline)
          scrub(
            ink,
            steps(liftEnd).map((y) => ({ transform: `translateY(${px(dropLift(y, h))}px)` })),
            0,
            liftEnd,
            "both",
          );

        // Растворение: слой с маской (.fade) за FADE прокрутки едет от верха экрана (край маски
        // над экраном) до точки — к входу в Сцену 3 линии над точкой уже нет. Назад — всё обратно.
        const fadeFrom = ((endVh + TAIL - FADE) * h) / 100;
        const dot = h / 2 + 20;
        scrub(
          fade,
          [
            { transform: `translateY(${-px(EDGE * h)}px)` },
            { transform: `translateY(${px(dot)}px)` },
          ],
          fadeFrom,
          fadeFrom + (FADE * h) / 100,
          "both",
        );

        // Блок: прозрачность и подъём при появлении, элементы пункта (Scene2Art) — на свою долю
        // подъёма. После хода блок — в своём стиле: на месте, непрозрачный (до первого прохода
        // он прозрачный, Scene2.module.css).
        for (const [i, el] of blockEls.entries()) {
          put(el, "opacity", "1");
          const from = sectionTop + L.tops[i] - APPEAR * h;
          const to = from + APPEAR_LEN * h;
          scrub(
            el,
            [
              { opacity: 0, transform: `translateY(${RISE}px)` },
              { opacity: 1, transform: "translateY(0px)" },
            ],
            from,
            to,
            "backwards",
          );
          for (const art of artEls[i])
            scrub(
              art.el,
              [{ translate: `0 ${RISE * art.depth}px` }, { translate: "0 0" }],
              from,
              to,
              "backwards",
            );
        }
      }

      // Страницу тянут вниз за верх (iOS): прокрутка меньше нуля, ход по ней стоит на нуле —
      // точка едет со страницей, как стояла: ход снят, сдвиг — переменной (Hero.module.css).
      if (drop && dotScrub) {
        const pulled = scrollY < 0;
        const held = dotScrub.anim.playState === "idle";
        if (pulled) {
          if (!held) dotScrub.anim.cancel();
          put(drop, "--drop-y", `${px(dropLift(scrollY, h))}px`);
        } else if (held) {
          if (timeline) dotScrub.anim.play();
          else {
            dotScrub.anim.pause();
            dotScrub.t = Number.NaN;
          }
        }
        // Пульс в покое (Hero.module.css): размах плавно сходит на нет за первые BREATH px
        // прокрутки и так же возвращается наверху; без размаха пульс на паузе — не тикает.
        const breath = smooth(Math.max(0, Math.min(1, 1 - scrollY / BREATH)));
        put(drop, "--breath", breath.toFixed(3));
        put(drop, "animation-play-state", breath > 0 ? "" : "running, paused");
      }
      setVar("--drop-offset", "20px");

      // Трасса — с первого пикселя прокрутки.
      put(trail, "visibility", scrollY > 0 ? "visible" : "hidden");
      // Без ScrollTimeline ходы ведёт проход, и точка сходила бы с изгиба, который едет со
      // страницей: трафарет тогда на экране (.onScreen) и уезжает вверх отсюда же, вместе с
      // точкой, как прежде; чернила в нём — на столько же вниз.
      if (!timeline) {
        const shift = Math.min(px(scrollY), trailEnd);
        put(trail, "transform", `translateY(${trailTop - shift}px)`);
        put(ink, "transform", `translateY(${shift - trailTop + px(dropLift(scrollY, h))}px)`);
        for (const s of scrubs) if (s !== dotScrub || scrollY >= 0) seek(s, Math.max(0, scrollY));

        // Нахлёст на стыке: начало трассы ещё и в слое страницы, вместе с линией Hero. При
        // прокрутке мимо Lenis (палец, клавиатура) трафарет на экране на кадр отстаёт — отрезок
        // закрывает щель. Лежит на прямом участке трассы (20px и прелюдия до колена; на телефоне
        // колено сразу), не ниже точки, на 1px уже линии — в покое не виден. Вверх щели нет —
        // и отрезка нет.
        const up = scrollY < lastY;
        lastY = scrollY;
        const dotVh = ((scrollY + px(dropLift(scrollY, h))) / h) * 100;
        const straight = 20 + ((phoneLayout() ? 0 : PRELUDE - 1) * h) / 100;
        const reach = Math.min(straight, ((dotVh - 43) * h) / 100 + 20);
        // top по смыслу постоянен, но дробный шум менял бы d каждый кадр — округляем до 0,1px.
        const top = Math.round((0.93 * h - sectionTop) * 10) / 10;
        const end = Math.round((top + reach) * 10) / 10;
        const bridge = scrollY > 0 && !up && reach > 0 ? `M${w / 2} ${top} V${end}` : "";
        if (bridgeRef.current && bridge !== bridgeKey) {
          bridgeKey = bridge;
          bridgeRef.current.setAttribute("d", bridge);
        }
      }

      // Покачивание элементов пункта — только пока пункт (до ~160px за его рамкой) на экране
      // и уже проявился. Секция целиком выше экрана — блоки тоже, их не трогаем.
      for (let i = 0; i < BLOCKS.length && rect.bottom >= 0; i++) {
        const top = rect.top + L.tops[i];
        const appear = (APPEAR * h - top) / (APPEAR_LEN * h);
        const seen = appear > 0 && top < h + 160 && top + heights[i] > -160;
        put(blockEls[i], "--art-play", seen ? "running" : "paused");
      }
    };

    // Прыжок петли футера наверх (LOOP_EVENT, прыжок — в том же вызове сразу за событием) идёт
    // посреди кадра, когда scroll этого кадра уже разослан: кадр показал бы старое состояние —
    // трассу у стыка с Hero. Общий проход — сразу после прыжка.
    const onLoop = () => queueMicrotask(syncScroll);
    window.addEventListener(LOOP_EVENT, onLoop);
    const off = onScroll(section, update);
    return () => {
      window.removeEventListener(LOOP_EVENT, onLoop);
      off();
      for (const s of scrubs) s.anim.cancel();
    };
  }, []);

  return (
    <section ref={sectionRef} className={styles.scene2} data-scene="scene2">
      <div ref={trailRef} className={styles.trail}>
        <div ref={inkRef} className={styles.ink}>
          <div ref={fadeRef} className={styles.fade} />
        </div>
      </div>
      <svg className={styles.bridge} aria-hidden="true">
        <path
          ref={bridgeRef}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>

      {BLOCKS.map((block, i) => (
        <aside
          key={block.title}
          className={`${styles.block} ${block.side === "right" ? styles.right : styles.left} ${styles[`block${i + 1}`]}`}
        >
          <div className={styles.art} aria-hidden="true">
            {ART[i].map((art, j) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: состав элементов постоянный
                key={j}
                className={`${styles[art.slot]} ${art.phone === false ? styles.noPhone : ""}`}
                // Покачивание — у каждого элемента со своим сдвигом по фазе (группа значков — с общим).
                style={{
                  animationDelay: `${-(((i * 3 + (art.sync ?? j)) * 1.7) % 5)}s`,
                  ...art.style,
                }}
              >
                {art.el}
              </div>
            ))}
          </div>
          <h2>{block.title}</h2>
          <p>{block.body}</p>
          <ul className={styles.tags}>
            {block.tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        </aside>
      ))}
    </section>
  );
}
