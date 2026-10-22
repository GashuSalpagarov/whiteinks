"use client";

import { useEffect, useRef } from "react";
import { LOOP_EVENT } from "@/components/scenes/Footer";
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

// Раскладка: места блоков (px от верха секции) и опорные точки трассы [phase, сдвиг в vw] —
// между ними косинусный переход. Phase отсчитывается от scroll = 43vh (момент фиксации точки
// в центре); точка на phase стоит в (phase − 7)vh + 20px от верха секции. Считается раз на размер
// экрана и высоты блоков (heights; below — насколько элемент пункта под блоком, со стороны
// трассы, ниже блока).
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
  } else if (w >= 768) {
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
    // Телефон (< 768px, как мобильный блок Scene2.module.css): блоки широкие, колоколу между ними
    // места нет. Точка идёт «серпантином»: в 13vw от края (±37vw), пока напротив неё пара блоков,
    // и между парами переходит на другую сторону. Верхний блок пары встаёт, когда переход пройден
    // на 0.85, нижний — через просвет 0.06 экрана; у края точка держится до низа пары и элемента
    // под ней со стороны трассы (below) и ещё 0.02 экрана — элемент снаружи, у края экрана, точка
    // минует уже выше него. Из центра и в центр — как на десктопе: стыки с Hero и Scene 3 те же.
    let y = 20 - 0.07 * h; // точка в миг фиксации
    let cross = 0.19 * h;
    for (let k = 0; k < 4; k++) {
      const side = k % 2 ? 37 : -37;
      keys.push([phase(y + cross), side]);
      const top = y + 0.85 * cross;
      tops.push(top, top + heights[2 * k] + 0.06 * h);
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
const ART_DEPTH: Record<Slot, number> = { topOut: 0.06, out: 0.1, bottom: 0.12, in: 0.08 };

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

// Блок проявляется, как только въехал снизу на экран (top, px) — с подъёмом на 24px: впереди
// видно, что дальше. Потом остаётся и уезжает вверх вместе со страницей — под шапку
// (на телефоне — с её полосой, Hero.module.css).
function getBlock(top: number, h: number): { opacity: number; rise: number } {
  const appear = Math.max(0, Math.min(1, (0.92 * h - top) / (0.26 * h)));
  return { opacity: appear, rise: (1 - appear) * 24 };
}

// Трасса целиком, в координатах страницы при прокрутке 0: точка на прокрутке s (vh) стоит
// в (50vw + getDropX(s), 50vh + s + 20px). Строится вместе с раскладкой, на экране её двигает
// transform, а видна она только выше точки (Scene2.module.css, .trail).
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

export function Scene2() {
  const sectionRef = useRef<HTMLElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);
  const trailSvgRef = useRef<SVGSVGElement>(null);
  const fadeRef = useRef<HTMLDivElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const bridgeRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const trail = trailRef.current;
    const fade = fadeRef.current;
    const trailSvg = trailSvgRef.current;
    const thread = threadRef.current;
    const path = pathRef.current;
    if (!section || !trail || !fade || !trailSvg || !thread || !path) return;
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
    let drop: HTMLElement | null = null;
    let layoutKey = "";
    let L: Layout = { tops: [], keys: [[0, 0]], end: 0 };
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

      // Сначала замеры, потом записи: замер после записи заново пересчитывал бы стили.
      const rect = section.getBoundingClientRect();
      const heights = blockEls.map((el) => el.offsetHeight);

      // Раскладка — на новый размер экрана и высоты блоков (догрузился шрифт), не каждый кадр:
      // места блоков, высота секции — до входа в Сцену 3, трасса — путь целиком, дальше только
      // сдвиг вверх вместе со страницей (transform без перерисовки).
      const key = `${w} ${h} ${heights.join(" ")}`;
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
        put(trailSvg, "height", `${((93 + L.end) * h) / 100 + 40}px`);
        path.setAttribute("d", buildTrail(w, h, L));
      }
      // Секция целиком выше экрана — блоки тоже, их не трогаем.
      const blocksGone = rect.bottom < 0;
      const tops = L.tops.map((top) => rect.top + top);

      // X-смещение точки — отсюда, Y-смещение и фиксация — Hero. Переменная — на самой точке
      // (она в вёрстке Hero), а не на корне: меняется почти каждый кадр.
      if (!drop?.isConnected) drop = document.querySelector<HTMLElement>(`.${heroStyles.drop}`);
      if (drop) put(drop, "--drop-x", `${getDropX(scrollVh, L.keys)}vw`);

      // После Hero-фазы (scrollVh > 43) сдвигаем точку на 20px вниз — единый
      // уровень с Scene 3, где точка попадает в gap финальной сетки.
      if (scrollVh > 43) {
        setVar("--drop-offset", "20px");
      }

      // Трасса — целыми пикселями экрана, чтобы линия не размывалась. Конец трассы, ушедший
      // за верх экрана, дальше не двигаем.
      put(trail, "visibility", scrollVh > 43 ? "visible" : "hidden");
      if (scrollVh > 43) {
        const dpr = window.devicePixelRatio || 1;
        const px = (v: number) => Math.round(v * dpr) / dpr;
        const shift = px(scrollY);
        const endVh = 43 + L.end;
        const endY = ((50 + endVh) * h) / 100 + 20; // конец трассы в странице
        const dot = h / 2 + 20;
        // Растворение: слой с маской (.fade) — на d от верха экрана, трасса и нить в нём —
        // на d обратно. До FADE — край маски над экраном, к входу в Сцену 3 — у точки.
        const f = Math.max(0, Math.min(1, ((shift / h) * 100 - (endVh + TAIL - FADE)) / FADE));
        const d = px((dot + EDGE * h) * f - EDGE * h);
        put(fade, "transform", `translateY(${d}px)`);
        put(trailSvg, "transform", `translateY(${-Math.min(shift, endY + 20) - d}px)`);
        // Нить: верх — у конца трассы (ушедшего за верх экрана — у верха), низ обрезан по центру точки.
        const top = px(Math.max(0, Math.min(dot, endY - shift)));
        put(thread, "transform", `translateY(${top - d}px)`);
      }

      // Блок: прозрачность и подъём при появлении, элементы пункта (Scene2Art) — на свою долю
      // подъёма. Блок дальше полэкрана от экрана не трогаем. Покачивание — только пока пункт
      // с элементами (до ~160px за его рамкой) на экране.
      for (let i = 0; i < BLOCKS.length && !blocksGone; i++) {
        const { opacity, rise } = getBlock(tops[i], h);
        const el = blockEls[i];
        const top = tops[i] + rise;
        const seen = opacity > 0 && top < h + 160 && top + heights[i] > -160;
        put(el, "--art-play", seen ? "running" : "paused");
        if (top > 1.5 * h || top + heights[i] < -0.5 * h) continue;
        put(el, "opacity", `${opacity}`);
        put(el, "transform", `translateY(${rise}px)`);
        for (const art of artEls[i]) put(art.el, "translate", `0 ${rise * art.depth}px`);
      }

      // Нахлёст на стыке: начало трассы ещё и в слое страницы, вместе с линией Hero. При прокрутке
      // мимо Lenis (палец, клавиатура) fixed-трасса на кадр отстаёт — отрезок закрывает щель.
      // Лежит на прямом участке трассы (20px и прелюдия до колена; на телефоне колено сразу), не
      // ниже точки, на 1px уже линии — в покое не виден. Вверх щели нет — и отрезка нет.
      const up = scrollY < lastY;
      lastY = scrollY;
      const straight = 20 + ((phone ? 0 : PRELUDE - 1) * h) / 100;
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

    // Прыжок петли футера наверх (LOOP_EVENT, прыжок — в том же вызове сразу за событием) идёт
    // посреди кадра, когда scroll этого кадра уже разослан: кадр показал бы старое состояние —
    // отрезок у стыка с Hero и блок у низа экрана. Общий проход — сразу после прыжка.
    const onLoop = () => queueMicrotask(syncScroll);
    window.addEventListener(LOOP_EVENT, onLoop);
    const off = onScroll(section, update);
    return () => {
      window.removeEventListener(LOOP_EVENT, onLoop);
      off();
    };
  }, []);

  return (
    <section ref={sectionRef} className={styles.scene2} data-scene="scene2">
      <div ref={trailRef} className={styles.trail}>
        <div ref={fadeRef} className={styles.fade}>
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
