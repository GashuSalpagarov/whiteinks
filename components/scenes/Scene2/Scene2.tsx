'use client';

import { useEffect, useRef } from 'react';
import { onScroll, setVar, viewportH } from '@/lib/scroll/onScroll';
import styles from './Scene2.module.css';
import { ART } from './Scene2Art';

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

// Каждый блок имеет triggerVh — scroll-позицию, на которой точка проходит «мимо» него.
// Раньше triggerVh-25 блок невидим, после triggerVh — полностью виден и остаётся
// видимым пока скроллим вниз. При обратной прокрутке выше triggerVh-25 блок исчезает.
type Block = {
  title: string;
  body: string;
  tags: string[];
  side: 'left' | 'right';
  trigger: number; // scrollVh, на котором блок становится полностью видимым
  parallaxY: number; // индивидуальный коэффициент Y-параллакса (глубина блока)
};

// Услуги. Неразрывный пробел (\u00a0) — перед тире и внутри названия Telegram Mini App.
const BLOCKS: Block[] = [
  // Колено 0 — точка идёт влево, блоки справа
  {
    title: 'Сайты под ключ',
    body: 'Корпоративные сайты и лендинги: от структуры и текстов до запуска и аналитики.',
    tags: ['Лендинги', 'Корпоративные', 'Каталоги', 'Промо'],
    side: 'right',
    trigger: 75,
    parallaxY: 0.22,
  },
  {
    title: 'Интернет-магазины',
    body: 'Каталог, корзина, оплата и доставка\u00a0— магазин, который удобно вести и легко растить.',
    tags: ['Каталог', 'Оплата и доставка', '1С и CRM'],
    side: 'right',
    trigger: 120,
    parallaxY: 0.32,
  },
  // Колено 1 — точка идёт вправо, блоки слева
  {
    title: 'Продуктовая аналитика',
    body: 'Изучаем аудиторию и конкурентов до разработки, чтобы продукт решал настоящие задачи.',
    tags: ['Интервью', 'Конкуренты', 'CJM', 'Прототипы'],
    side: 'left',
    trigger: 175,
    parallaxY: 0.18,
  },
  {
    title: 'UX/UI-дизайн',
    body: 'Проектируем сценарии и рисуем интерфейсы, понятные с первого экрана.',
    tags: ['Интерфейсы', 'Дизайн-системы', 'Анимация', '3D'],
    side: 'left',
    trigger: 220,
    parallaxY: 0.28,
  },
  // Колено 2 — точка идёт влево, блоки справа
  {
    title: 'Брендинг',
    body: 'Имя, логотип и айдентика, которые узнают сразу, и бренд-бук, чтобы их сохранить.',
    tags: ['Нейминг', 'Логотип', 'Айдентика', 'Бренд-бук'],
    side: 'right',
    trigger: 275,
    parallaxY: 0.26,
  },
  {
    title: 'Мобильные приложения и Telegram\u00a0Mini\u00a0App',
    body: 'iOS, Android и приложения внутри Telegram\u00a0— от прототипа до публикации.',
    tags: ['iOS', 'Android', 'Telegram Mini App'],
    side: 'right',
    trigger: 320,
    parallaxY: 0.20,
  },
  // Колено 3 — точка идёт вправо, блоки слева
  {
    title: 'ИИ и автоматизация',
    body: 'Чат-боты на нейросетях и автоматизация рутины: связываем сайт, CRM и 1С, чтобы заявки и документы шли сами.',
    tags: ['ИИ-боты', 'Интеграции', 'CRM и 1С', 'Бизнес-процессы'],
    side: 'left',
    trigger: 375,
    parallaxY: 0.30,
  },
  {
    title: 'Поддержка, развитие и SEO',
    body: 'Дорабатываем, следим за стабильностью и приводим клиентов из поиска.',
    tags: ['Поддержка', 'Доработки', 'SEO', 'Аналитика'],
    side: 'left',
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
function getBlockParallaxX(scrollVh: number, triggerVh: number, side: 'left' | 'right'): number {
  const factor = 0.06;
  const maxOffset = 3; // vw — максимальный сдвиг к линии
  const towardCenterSign = side === 'right' ? -1 : 1;
  const raw = towardCenterSign * (scrollVh - triggerVh) * factor;
  // Clamp в обе стороны
  return Math.max(-maxOffset, Math.min(maxOffset, raw));
}

// Телефон и короткий ландшафт: параллакса нет — он сводил блоки друг с другом и с трассой.
// Блок проявляется по своему месту на экране (top, px): снизу — с подъёмом на 24px, а выше
// 80px гаснет, не заходя под шапку (её полоса — 72px).
function getCompactBlock(top: number, h: number): { opacity: number; rise: number } {
  const appear = Math.max(0, Math.min(1, (0.92 * h - top) / (0.26 * h)));
  const leave = Math.max(0, Math.min(1, (top - 80) / (0.12 * h)));
  return { opacity: Math.min(appear, leave), rise: (1 - appear) * 24 };
}

function buildPathD(scrollVh: number, w: number, h: number): string {
  if (scrollVh <= 41) return '';

  const phone = w < 768;
  const points: [number, number][] = [];

  // Начало пути — конец линии Hero (точка покоя, 93vh): вместе они читаются как одна линия.
  const labelX = w * 0.5;
  const labelY = ((93 - scrollVh) * h) / 100;
  points.push([labelX, labelY]);

  // 20px — тот же сдвиг точки вниз, что выставляется через --drop-offset.
  // Трасса должна заканчиваться ровно у точки, поэтому добавляем к каждому sample.
  const dropYOffset = 20;
  const startS = 43;
  const step = 0.6;
  let lastS = startS;
  for (let s = startS; s <= scrollVh; s += step) {
    const dropX = getDropX(s, phone);
    const x = ((50 + dropX) * w) / 100;
    const y = ((50 + s - scrollVh) * h) / 100 + dropYOffset;
    points.push([x, y]);
    lastS = s;
  }

  // Если шаг не попал точно в текущий scroll — добавим финальную точку,
  // чтобы трасса заканчивалась ровно у точки.
  if (scrollVh - lastS > 0.01) {
    const finalDropX = getDropX(scrollVh, phone);
    points.push([((50 + finalDropX) * w) / 100, h * 0.5 + dropYOffset]);
  }

  if (points.length < 2) return '';
  if (points.length === 2) {
    return `M${points[0][0]} ${points[0][1]} L${points[1][0]} ${points[1][1]}`;
  }

  // Catmull-Rom через cubic Bezier — кривая проходит через все sample points
  // с C1-гладкостью.
  let d = `M${points[0][0]} ${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i + 2 < points.length ? points[i + 2] : points[i + 1];

    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;

    d += ` C${c1x} ${c1y} ${c2x} ${c2y} ${p2[0]} ${p2[1]}`;
  }
  return d;
}

export function Scene2() {
  const sectionRef = useRef<HTMLElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const bridgeRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const blockEls = section.querySelectorAll<HTMLElement>('aside');
    let pathKey = '';
    let bridgeKey = '';
    let lastY = 0;
    // Без движения блоки видны всегда (Scene2.module.css) — и элементы вместе с ними.
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const update = () => {
      const w = window.innerWidth;
      // Общая высота экрана (как --ih в CSS): на телефоне vh больше innerHeight.
      const h = viewportH();
      if (!h) return; // иначе scrollVh = NaN
      const scrollVh = (window.scrollY / h) * 100;
      const phone = w < 768;
      const compact = phone || h <= 500; // телефон или короткий ландшафт
      const dropX = getDropX(scrollVh, phone);

      // X-смещение точки — отсюда. Y-смещение и фиксация — Hero.
      setVar('--drop-x', `${dropX}vw`);

      // После Hero-фазы (scrollVh > 43) сдвигаем точку на 20px вниз — единый
      // уровень с Scene 3, где точка попадает в gap финальной сетки.
      if (scrollVh > 43) {
        setVar('--drop-offset', '20px');
      }

      // Трасса плавно гаснет в конце Scene 2: к scrollVh 500 — полностью прозрачна.
      const trailOpacity = Math.max(0, Math.min(1, (500 - scrollVh) / 70));
      setVar('--trail-opacity', `${trailOpacity}`);

      // Секция целиком выше экрана — блоки тоже (параллакс отстаёт от скролла). Их переменные
      // дальше не трогаем: каждая смена пересчитывает стили всей страницы.
      const rect = section.getBoundingClientRect();
      const blocksGone = rect.bottom < 0;
      const tops: number[] = [];
      const ops: number[] = [];
      for (let i = 0; i < BLOCKS.length && !blocksGone; i++) {
        const block = BLOCKS[i];
        if (compact) {
          const { opacity, rise } = getCompactBlock(rect.top + blockEls[i].offsetTop, h);
          setVar(`--block-${i + 1}-opacity`, `${opacity}`);
          setVar(`--block-${i + 1}-y`, `${rise}px`);
          setVar(`--block-${i + 1}-x`, '0vw');
          tops[i] = rect.top + blockEls[i].offsetTop + rise;
          ops[i] = still ? 1 : opacity;
          continue;
        }
        const opacity = getBlockOpacity(scrollVh, block.trigger);
        const y = (getBlockParallaxY(scrollVh, block.trigger, block.parallaxY) * h) / 100;
        setVar(`--block-${i + 1}-opacity`, `${opacity}`);
        setVar(`--block-${i + 1}-y`, `${y}px`);
        setVar(
          `--block-${i + 1}-x`,
          `${getBlockParallaxX(scrollVh, block.trigger, block.side)}vw`,
        );
        tops[i] = rect.top + blockEls[i].offsetTop + y;
        ops[i] = still ? 1 : opacity;
      }
      // Элементы пункта (Scene2Art) видны вместе с ним: прозрачность у них — его. Далеко от
      // экрана (и вся секция выше него) они выключены целиком: каждая смена переменных
      // пересчитывает стили всей страницы, и лишние узлы его утяжеляют. Покачивание — только
      // пока пункт с элементами (до ~160px за его рамкой) на экране.
      for (let i = 0; i < BLOCKS.length; i++) {
        const bottom = tops[i] + blockEls[i].offsetHeight;
        const near = !blocksGone && ops[i] > 0 && tops[i] < 1.5 * h && bottom > -0.5 * h;
        const seen = near && tops[i] < h + 160 && bottom > -160;
        setVar(`--block-${i + 1}-art-show`, near ? 'block' : 'none');
        setVar(`--block-${i + 1}-art-play`, seen ? 'running' : 'paused');
      }

      // Путь (до ~1800 точек) строим, только если трасса видна и что-то сдвинулось.
      const key = trailOpacity > 0 ? `${scrollVh} ${w} ${h}` : '';
      if (pathRef.current && key !== pathKey) {
        pathKey = key;
        pathRef.current.setAttribute('d', key && buildPathD(scrollVh, w, h));
      }

      // Нахлёст на стыке: начало трассы ещё и в слое страницы, вместе с линией Hero. При прокрутке
      // мимо Lenis (палец, клавиатура) fixed-трасса на кадр отстаёт — отрезок закрывает щель.
      // Лежит на прямом участке трассы (20px и прелюдия до колена; на телефоне колено сразу), не
      // ниже точки, на 1px уже линии — в покое не виден. Вверх щели нет — и отрезка нет.
      const up = window.scrollY < lastY;
      lastY = window.scrollY;
      const straight = 20 + ((phone ? 0 : KNEES[0].start - 1) * h) / 100;
      const reach = Math.min(straight, ((scrollVh - 43) * h) / 100 + 20);
      const top = ((93 - scrollVh) * h) / 100 - rect.top;
      const bridge = scrollVh > 43 && !up ? `M${w / 2} ${top} V${top + reach}` : '';
      if (bridgeRef.current && bridge !== bridgeKey) {
        bridgeKey = bridge;
        bridgeRef.current.setAttribute('d', bridge);
      }
    };

    return onScroll(section, update);
  }, []);

  return (
    <section ref={sectionRef} className={styles.scene2} data-scene="scene2">
      <svg className={styles.trail} aria-hidden="true">
        <path
          ref={pathRef}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
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
          className={`${styles.block} ${block.side === 'right' ? styles.right : styles.left} ${styles[`block${i + 1}`]}`}
        >
          <div className={styles.art} aria-hidden="true">
            {ART[i].map((art, j) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: состав элементов постоянный
                key={j}
                className={`${styles[art.slot]} ${art.phone === false ? styles.noPhone : ''}`}
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
