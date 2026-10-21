"use client";

import { useEffect, useRef } from "react";
import { onScroll, setVar, viewportH } from "@/lib/scroll/onScroll";
import heroStyles from "../Hero/Hero.module.css";
import styles from "./Scene2.module.css";
import { ART, type Slot } from "./Scene2Art";

// Колена траектории. Phase отсчитывается от scroll = 43vh (момент фиксации точки в центре).
// 7vh «прелюдии» — ничтожная вертикальная прямая прежде чем начнётся первое колено.
const KNEES = [
  { start: 7, end: 107, amplitude: -32 },
  { start: 107, end: 207, amplitude: 18 },
  { start: 207, end: 307, amplitude: -26 },
  { start: 307, end: 407, amplitude: 14 },
];

// Телефон (< 768px, как мобильный блок Scene2.module.css): блоки широкие, колоколу между ними
// места нет. Точка идёт «серпантином»: держится в 13vw от края, пока напротив неё два блока
// колена, и в просвете между парами переходит на другую сторону. Опорные точки
// [phase, сдвиг в vw], между ними — косинусный переход. Из центра и в центр — там же, где
// на десктопе: стыки с Hero и Scene 3 те же. Позиции блоков в CSS посчитаны от этих точек.
const PHONE_PATH: [number, number][] = [
  [0, 0],
  [30, -37],
  [89, -37],
  [125, 37],
  [186, 37],
  [222, -37],
  [282, -37],
  [318, 37],
  [377, 37],
  [407, 0],
];

// Конец трассы (scroll, vh): точка вернулась в центр — конец последнего колена и серпантина.
// Дальше трасса уезжает вверх вместе со страницей, а её конец с точкой связывает упругая нить —
// прямая по центру: тянется и тончает (4px -> 1.2px). На входе в Сцену 3 (500vh, конец трассы
// в 20px от верха) она рвётся посередине, и за SNAP экрана прокрутки хвосты втягиваются:
// верхний — в конец трассы, нижний — в точку. Назад — всё обратно.
const TRAIL_END = 43 + 407;
const SNAP = 0.08;

// Скорость элемента пункта (Scene2Art) — доля параллакса блока, у каждого места своя и
// маленькая: за время жизни пункта элемент не доезжает до соседнего текста.
const ART_DEPTH: Record<Slot, number> = { topOut: 0.06, out: 0.1, bottom: 0.12, in: 0.08 };

// Каждый блок имеет triggerVh — scroll-позицию, на которой точка проходит «мимо» него.
// Раньше triggerVh-25 блок невидим, после triggerVh — полностью виден и остаётся
// видимым пока скроллим вниз. При обратной прокрутке выше triggerVh-25 блок исчезает.
type Block = {
  title: string;
  body: string;
  tags: string[];
  side: "left" | "right";
  trigger: number; // scrollVh, на котором блок становится полностью видимым
  parallaxY: number; // индивидуальный коэффициент Y-параллакса (глубина блока)
};

// Услуги. Неразрывный пробел (\u00a0) — перед тире и внутри названия Telegram Mini App.
const BLOCKS: Block[] = [
  // Колено 0 — точка идёт влево, блоки справа
  {
    title: "Сайты под ключ",
    body: "Корпоративные сайты и лендинги: от структуры и текстов до запуска и аналитики.",
    tags: ["Лендинги", "Корпоративные", "Каталоги", "Промо"],
    side: "right",
    trigger: 75,
    parallaxY: 0.22,
  },
  {
    title: "Интернет-магазины",
    body: "Каталог, корзина, оплата и доставка\u00a0— магазин, который удобно вести и легко растить.",
    tags: ["Каталог", "Оплата и доставка", "1С и CRM"],
    side: "right",
    trigger: 120,
    parallaxY: 0.32,
  },
  // Колено 1 — точка идёт вправо, блоки слева
  {
    title: "Продуктовая аналитика",
    body: "Изучаем аудиторию и конкурентов до разработки, чтобы продукт решал настоящие задачи.",
    tags: ["Интервью", "Конкуренты", "CJM", "Прототипы"],
    side: "left",
    trigger: 175,
    parallaxY: 0.18,
  },
  {
    title: "UX/UI-дизайн",
    body: "Проектируем сценарии и рисуем интерфейсы, понятные с первого экрана.",
    tags: ["Интерфейсы", "Дизайн-системы", "Анимация", "3D"],
    side: "left",
    trigger: 220,
    parallaxY: 0.28,
  },
  // Колено 2 — точка идёт влево, блоки справа
  {
    title: "Брендинг",
    body: "Имя, логотип и айдентика, которые узнают сразу, и бренд-бук, чтобы их сохранить.",
    tags: ["Нейминг", "Логотип", "Айдентика", "Бренд-бук"],
    side: "right",
    trigger: 275,
    parallaxY: 0.26,
  },
  {
    title: "Мобильные приложения и Telegram\u00a0Mini\u00a0App",
    body: "iOS, Android и приложения внутри Telegram\u00a0— от прототипа до публикации.",
    tags: ["iOS", "Android", "Telegram Mini App"],
    side: "right",
    trigger: 320,
    parallaxY: 0.2,
  },
  // Колено 3 — точка идёт вправо, блоки слева
  {
    title: "ИИ и автоматизация",
    body: "Чат-боты на нейросетях и автоматизация рутины: связываем сайт, CRM и 1С, чтобы заявки и документы шли сами.",
    tags: ["ИИ-боты", "Интеграции", "CRM и 1С", "Бизнес-процессы"],
    side: "left",
    trigger: 375,
    parallaxY: 0.3,
  },
  {
    title: "Поддержка, развитие и SEO",
    body: "Дорабатываем, следим за стабильностью и приводим клиентов из поиска.",
    tags: ["Поддержка", "Доработки", "SEO", "Аналитика"],
    side: "left",
    trigger: 420,
    parallaxY: 0.24,
  },
];

function getDropX(scrollVh: number, phone: boolean): number {
  if (scrollVh < 43) return 0;
  const phase = scrollVh - 43;
  if (phone) {
    for (let i = 1; i < PHONE_PATH.length; i++) {
      const [p1, x1] = PHONE_PATH[i];
      if (phase >= p1) continue;
      const [p0, x0] = PHONE_PATH[i - 1];
      return x0 + (x1 - x0) * 0.5 * (1 - Math.cos((Math.PI * (phase - p0)) / (p1 - p0)));
    }
    return 0;
  }
  for (const knee of KNEES) {
    if (phase >= knee.start && phase < knee.end) {
      const local = (phase - knee.start) / (knee.end - knee.start);
      // Косинусная колоколообразная: производная = 0 на границах колена,
      // что даёт плавный переход между коленами без излома.
      return knee.amplitude * 0.5 * (1 - Math.cos(2 * Math.PI * local));
    }
  }
  return 0;
}

// Opacity монотонно по scroll: до triggerVh-fadeRange — 0, после triggerVh — 1,
// между ними — линейно. При обратной прокрутке возвращается в 0.
function getBlockOpacity(scrollVh: number, triggerVh: number): number {
  const fadeRange = 25;
  if (scrollVh >= triggerVh) return 1;
  if (scrollVh < triggerVh - fadeRange) return 0;
  return (scrollVh - (triggerVh - fadeRange)) / fadeRange;
}

// Y-параллакс: блок отстаёт от скролла на индивидуальный фактор — разная «глубина» для разных блоков.
function getBlockParallaxY(scrollVh: number, triggerVh: number, factor: number): number {
  return (scrollVh - triggerVh) * factor;
}

// X-параллакс монотонный: блок дрейфует только в сторону линии (к центру viewport)
// при увеличении скролла. Ограничен по максимальному смещению, чтобы не наезжать на линию.
function getBlockParallaxX(scrollVh: number, triggerVh: number, side: "left" | "right"): number {
  const factor = 0.06;
  const maxOffset = 3; // vw — максимальный сдвиг к линии
  const towardCenterSign = side === "right" ? -1 : 1;
  const raw = towardCenterSign * (scrollVh - triggerVh) * factor;
  // Clamp в обе стороны
  return Math.max(-maxOffset, Math.min(maxOffset, raw));
}

// Телефон и короткий ландшафт: параллакса нет — он сводил блоки друг с другом и с трассой.
// Блок проявляется по своему месту на экране (top, px): снизу — с подъёмом на 24px. Дальше
// остаётся и уезжает вверх вместе со страницей — под шапку с её полосой (Hero.module.css).
function getCompactBlock(top: number, h: number): { opacity: number; rise: number } {
  const appear = Math.max(0, Math.min(1, (0.92 * h - top) / (0.26 * h)));
  return { opacity: appear, rise: (1 - appear) * 24 };
}

// Трасса целиком, в координатах страницы при прокрутке 0: точка на прокрутке s (vh) стоит
// в (50vw + getDropX(s), 50vh + s + 20px). Строится раз на размер экрана, на экране её двигает
// transform, а видна она только выше точки (Scene2.module.css, .trail).
function buildTrail(w: number, h: number): string {
  const phone = w < 768;
  // Начало — конец линии Hero (точка покоя, 93vh): вместе они читаются как одна линия. 20px —
  // сдвиг точки вниз после Hero (--drop-offset).
  const points: [number, number][] = [[w * 0.5, h * 0.93]];
  const n = Math.ceil((TRAIL_END - 43) / 0.6);
  for (let i = 0; i <= n; i++) {
    const s = 43 + ((TRAIL_END - 43) * i) / n;
    points.push([((50 + getDropX(s, phone)) * w) / 100, ((50 + s) * h) / 100 + 20]);
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

export function Scene2() {
  const sectionRef = useRef<HTMLElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);
  const trailSvgRef = useRef<SVGSVGElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const tailRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const bridgeRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const trail = trailRef.current;
    const trailSvg = trailSvgRef.current;
    const thread = threadRef.current;
    const tail = tailRef.current;
    const path = pathRef.current;
    if (!section || !trail || !trailSvg || !thread || !tail || !path) return;
    const blockEls = [...section.querySelectorAll<HTMLElement>("aside")];
    const artEls = blockEls.map((el, i) =>
      [...el.querySelectorAll<HTMLElement>(`.${styles.art} > *`)].map((art, j) => ({
        el: art,
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
    let drop: HTMLElement | null = null;
    let trailSize = "";
    let bridgeKey = "";
    let lastY = 0;
    const update = () => {
      const w = window.innerWidth;
      // Общая высота экрана (как --ih в CSS): на телефоне vh больше innerHeight.
      const h = viewportH();
      if (!h) return; // иначе scrollVh = NaN
      const scrollY = window.scrollY;
      const scrollVh = (scrollY / h) * 100;
      const phone = w < 768;
      const compact = phone || h <= 500; // телефон или короткий ландшафт

      // Сначала замеры, потом записи: замер после записи заново пересчитывал бы стили.
      // Секция целиком выше экрана — блоки тоже (параллакс отстаёт от скролла), их не трогаем.
      const rect = section.getBoundingClientRect();
      const blocksGone = rect.bottom < 0;
      const tops = blocksGone ? [] : blockEls.map((el) => rect.top + el.offsetTop);
      const heights = blocksGone ? [] : blockEls.map((el) => el.offsetHeight);

      // X-смещение точки — отсюда, Y-смещение и фиксация — Hero. Переменная — на самой точке
      // (она в вёрстке Hero), а не на корне: меняется почти каждый кадр.
      if (!drop?.isConnected) drop = document.querySelector<HTMLElement>(`.${heroStyles.drop}`);
      if (drop) put(drop, "--drop-x", `${getDropX(scrollVh, phone)}vw`);

      // После Hero-фазы (scrollVh > 43) сдвигаем точку на 20px вниз — единый
      // уровень с Scene 3, где точка попадает в gap финальной сетки.
      if (scrollVh > 43) {
        setVar("--drop-offset", "20px");
      }

      // Трасса: путь — раз на размер экрана, дальше только сдвиг вверх вместе со страницей
      // (transform без перерисовки) — целыми пикселями экрана, чтобы линия не размывалась.
      // Конец трассы, ушедший за верх экрана, дальше не двигаем.
      if (trailSize !== `${w} ${h}`) {
        trailSize = `${w} ${h}`;
        path.setAttribute("d", buildTrail(w, h));
      }
      put(trail, "visibility", scrollVh > 43 ? "visible" : "hidden");
      if (scrollVh > 43) {
        const dpr = window.devicePixelRatio || 1;
        const px = (v: number) => Math.round(v * dpr) / dpr;
        const shift = px(scrollY);
        put(trailSvg, "transform", `translateY(${-Math.min(shift, 5 * h + 40)}px)`);
        // Нить: верх — у конца трассы, низ обрезан по центру точки; ширина — scaleX от 4px.
        const dot = h / 2 + 20;
        const end = ((50 + TRAIL_END) * h) / 100 + 20 - shift; // конец трассы на экране
        const full = dot - 20; // длина нити в миг разрыва
        const k = Math.max(0, Math.min(1, (shift - 5 * h) / (SNAP * h)));
        // Порвалась — хвосты (по половине) сжимаются плавно (smoothstep) и толстеют обратно.
        const e = k * k * (3 - 2 * k);
        const half = (full / 2) * (1 - e);
        if (k === 0) {
          const top = Math.min(dot, end);
          const sx = (4 - 2.8 * Math.min(1, (dot - top) / full)) / 4;
          put(thread, "transform", `translateY(${px(top)}px) scaleX(${sx.toFixed(3)})`);
          put(tail, "transform", "scaleY(0)");
        } else if (half > 0) {
          const sx = ((1.2 + 2.8 * e) / 4).toFixed(3);
          put(thread, "transform", `translateY(${px(dot - half)}px) scaleX(${sx})`);
          put(
            tail,
            "transform",
            `translateY(${px(end)}px) scaleX(${sx}) scaleY(${(half / dot).toFixed(4)})`,
          );
        } else {
          put(thread, "transform", `translateY(${px(dot)}px)`);
          put(tail, "transform", "scaleY(0)");
        }
      }

      // Блок: прозрачность и сдвиг (параллакс, на телефоне — подъём при появлении), элементы
      // пункта (Scene2Art) — на свою долю его сдвига. Блок дальше полэкрана от экрана не
      // трогаем. Покачивание — только пока пункт с элементами (до ~160px за его рамкой) на экране.
      for (let i = 0; i < BLOCKS.length && !blocksGone; i++) {
        const block = BLOCKS[i];
        let opacity: number;
        let y: number; // px
        let x = 0; // vw
        if (compact) {
          const c = getCompactBlock(tops[i], h);
          opacity = c.opacity;
          y = c.rise;
        } else {
          opacity = getBlockOpacity(scrollVh, block.trigger);
          y = (getBlockParallaxY(scrollVh, block.trigger, block.parallaxY) * h) / 100;
          x = getBlockParallaxX(scrollVh, block.trigger, block.side);
        }
        const el = blockEls[i];
        const top = tops[i] + y;
        const seen = opacity > 0 && top < h + 160 && top + heights[i] > -160;
        put(el, "--art-play", seen ? "running" : "paused");
        if (top > 1.5 * h || top + heights[i] < -0.5 * h) continue;
        put(el, "opacity", `${opacity}`);
        put(el, "transform", `translate(${x}vw, ${y}px)`);
        for (const art of artEls[i]) put(art.el, "translate", `0 ${y * art.depth}px`);
      }

      // Нахлёст на стыке: начало трассы ещё и в слое страницы, вместе с линией Hero. При прокрутке
      // мимо Lenis (палец, клавиатура) fixed-трасса на кадр отстаёт — отрезок закрывает щель.
      // Лежит на прямом участке трассы (20px и прелюдия до колена; на телефоне колено сразу), не
      // ниже точки, на 1px уже линии — в покое не виден. Вверх щели нет — и отрезка нет.
      const up = scrollY < lastY;
      lastY = scrollY;
      const straight = 20 + ((phone ? 0 : KNEES[0].start - 1) * h) / 100;
      const reach = Math.min(straight, ((scrollVh - 43) * h) / 100 + 20);
      // top по смыслу постоянен, но дробный шум менял бы d каждый кадр — округляем до 0,1px.
      const top = Math.round((((93 - scrollVh) * h) / 100 - rect.top) * 10) / 10;
      const end = Math.round((top + reach) * 10) / 10;
      const bridge = scrollVh > 43 && !up ? `M${w / 2} ${top} V${end}` : "";
      if (bridgeRef.current && bridge !== bridgeKey) {
        bridgeKey = bridge;
        bridgeRef.current.setAttribute("d", bridge);
      }
    };

    return onScroll(section, update);
  }, []);

  return (
    <section ref={sectionRef} className={styles.scene2} data-scene="scene2">
      <div ref={trailRef} className={styles.trail}>
        <svg ref={trailSvgRef} aria-hidden="true">
          <path
            ref={pathRef}
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div ref={threadRef} className={styles.thread} />
        <div ref={tailRef} className={styles.tail} />
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
                // Покачивание — у каждого элемента со своим сдвигом по фазе.
                style={{ animationDelay: `${-(((i * 3 + j) * 1.7) % 5)}s`, ...art.style }}
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
