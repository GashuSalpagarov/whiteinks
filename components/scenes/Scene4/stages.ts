// Сцена 4 «Веер»: этапы работы и раскладка прокрутки по ним. Единственное место, где прогресс
// секции превращается в «что сейчас происходит» — для веера карточек, чек-листа, подписей и капли.

import { formatWeeks, TYPES } from "@/lib/pricing";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const art = (name: string) => `${BASE}/assets/stages/${name}.svg`;

// Тексты — заглушки, поправить здесь. Сроки сходятся с «Корпоративным» из lib/pricing.ts.
// color — фон картинки (как первый прямоугольник в её SVG).
export const STEPS = [
  {
    word: "Бриф",
    does: "Созвон, разбираем задачу, цели и ограничения",
    gets: "Бриф на 2 страницы и смета",
    term: "3–5 дней",
    image: art("1-brief"),
    color: "#f4ebc3",
  },
  {
    word: "Стратегия",
    does: "Изучаем рынок, конкурентов и аудиторию",
    gets: "Структура сайта и план работ",
    term: "1–2 недели",
    image: art("2-strategy"),
    color: "#d3ebdd",
  },
  {
    word: "Дизайн",
    does: "Макеты ключевых страниц и анимаций",
    gets: "Макеты в Figma, два круга правок",
    term: "2–3 недели",
    image: art("3-design"),
    color: "#dddaf5",
  },
  {
    word: "Разработка",
    does: "Вёрстка, анимации, CMS, проверка на устройствах",
    gets: "Рабочий сайт на тестовом адресе",
    term: "3–5 недель",
    image: art("4-dev"),
    color: "#f7dccb",
  },
  {
    word: "Запуск",
    does: "Перенос на домен, аналитика, SEO-база",
    gets: "Живой сайт, обучение и поддержка",
    term: "1 неделя",
    image: art("5-launch"),
    color: "#d3ebdd",
  },
];
export const N = STEPS.length;

const corp = TYPES.find((t) => t.id === "corp") ?? TYPES[0];
export const TOTAL_TERM = formatWeeks(...corp.weeks);

// Раскладка прокрутки, в экранах: s = 0 — секция вошла снизу (Сцена 3 отпускает свой sticky,
// и её сетка уезжает вверх со страницей), s = 1 — сцена встала на место. Пока она въезжает,
// точка плывёт из точки входа (entryPoint в Scene4.tsx) в центр первой карточки, а заголовок и
// строки чек-листа всплывают по очереди. Встала — из точки сразу растёт первая карточка.
const ENTRY = 1;
const STAGE = 0.75; // этап: карточка встаёт (первая — растёт из точки), веер раскрывается
const OUTRO = 0.75; // веер раскрыт; капля выходит из-под веера и падает вниз, в Сцену 5
export const TOTAL_SCREENS = ENTRY + N * STAGE + OUTRO;

// Доли этапа: карточка встаёт (первая растёт из точки за GROW_FIRST — четверть экрана, как
// вылет карточки туннеля Сцены 3); подпись этапа проявляется и (кроме последнего) гаснет.
const OPEN: [number, number] = [0, 0.24];
const GROW_FIRST: [number, number] = [0, 0.33];
const CAP_IN: [number, number] = [0.06, 0.18];
const CAP_OUT: [number, number] = [0.9, 1];
// Доли выхода: капля стоит под веером, потом падает с ускорением за нижний край.
const DROP: [number, number] = [0.15, 0.95];
// Вход: точка плывёт в центр первой карточки (доли ENTRY); каждый блок слева всплывает за
// APPEAR экрана.
const GLIDE: [number, number] = [0.1, 1];
const APPEAR = 0.25;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const seg = (v: number, [a, b]: [number, number]) => clamp01((v - a) / (b - a));
const smooth = (t: number) => t * t * (3 - 2 * t);

// Что происходит при этом s: stage — текущий этап (−1 — до первого), u — доля этапа,
// lead — доля входа сцены (точка от места покоя под сеткой Сцены 3 плывёт в центр первой
// карточки), out — доля выхода.
export function sceneAt(s: number) {
  const lead = clamp01(s / ENTRY);
  const t = (s - ENTRY) / STAGE;
  if (t < 0) return { stage: -1, u: 0, lead, out: 0 };
  if (t < N) return { stage: Math.floor(t), u: t - Math.floor(t), lead, out: 0 };
  return { stage: N - 1, u: 1, lead, out: clamp01((s - ENTRY - N * STAGE) / OUTRO) };
}
export type Scene = ReturnType<typeof sceneAt>;

// Сколько карточек раскрыто — дробно, пока новая встаёт. Первая не выходит справа, а растёт
// из точки (growAt). Без движения — сразу целиком.
export function fanAt({ stage, u, out }: Scene, still: boolean): number {
  if (stage < 0) return -1;
  if (out > 0 || still || stage === 0) return stage;
  return stage - 1 + smooth(seg(u, OPEN));
}

// Первая карточка: доля роста из точки, 0..1 (без сглаживания — его даёт Scene4.tsx, как в Сцене 3).
export function growAt({ stage, u, out }: Scene, still: boolean): number {
  if (stage < 0) return 0;
  if (stage > 0 || out > 0 || still) return 1;
  return seg(u, GROW_FIRST);
}

// Подпись этапа i (блок справа): проявляется вместе с его карточкой.
export function captionAt(i: number, { stage, u, out }: Scene, still: boolean): number {
  if (still) return i === stage ? 1 : 0;
  if (i !== stage) return 0;
  if (out > 0) return 1;
  return Math.min(seg(u, CAP_IN), i < N - 1 ? 1 - seg(u, CAP_OUT) : 1);
}

// Строка чек-листа этапа i: off — впереди, on — текущий, done — пройден; grow — насколько
// текущая крупнее (растёт, пока встаёт её карточка; прошлая так же сжимается); strike — доля
// зачёркивания: прошлая зачёркивается, пока начинается следующий этап, «Запуск» — на выходе.
// Без движения — сразу итог: пройденные зачёркнуты, текущая крупная.
const GROW: [number, number] = [0, 0.16];
const STRIKE: [number, number] = [0, 0.14];
const STRIKE_LAST: [number, number] = [0, 0.2];
export function stageProgress(i: number, { stage, u, out }: Scene, still: boolean) {
  const state = i > stage ? "off" : i === stage ? "on" : "done";
  if (still) {
    return {
      state,
      grow: i === stage ? 1 : 0,
      strike: i < stage || (i === stage && out > 0) ? 1 : 0,
    };
  }
  let grow = 0;
  if (i === stage) grow = out > 0 ? 1 : smooth(seg(u, GROW));
  else if (i === stage - 1) grow = 1 - smooth(seg(u, GROW));
  let strike = 0;
  if (i < stage - 1) strike = 1;
  else if (i === stage - 1) strike = smooth(seg(u, STRIKE));
  else if (i === stage && out > 0) strike = smooth(seg(out, STRIKE_LAST));
  return { state, grow, strike };
}

// Капля: доля пути в центр первой карточки и падения из-под веера.
export function dropAt({ lead, out }: Scene) {
  return { glide: smooth(seg(lead, GLIDE)), fall: seg(out, DROP) };
}

// Вход блока слева (заголовок, подпись под ним, строка чек-листа), y — его верх в кадре, px:
// с какого s он всплывает — когда со страницей поднимается до линии line (px экрана); но так,
// чтобы к тому, как сцена встала, проявился весь. Тогда блоки идут по очереди сверху вниз.
export const appearFrom = (y: number, line: number, h: number) =>
  Math.max(0, Math.min(ENTRY - APPEAR, 1 - (line - y) / h));
export const appearAt = (s: number, from: number, still: boolean) =>
  still ? 1 : smooth(seg(s, [from, from + APPEAR]));
