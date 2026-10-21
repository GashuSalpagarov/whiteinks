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
// точка уже идёт из точки входа (entryPoint в Scene4.tsx) в ось веера.
const ENTRY = 1;
const INTRO = 0.1; // сцена стоит, подпись — «Весь путь»
const STAGE = 0.75; // этап: новая карточка выходит справа и встаёт, веер раскрывается
const OUTRO = 0.75; // веер раскрыт; капля падает из оси вниз, в Сцену 5
const START = ENTRY + INTRO;
export const TOTAL_SCREENS = START + N * STAGE + OUTRO;

// Доли этапа: карточка встаёт; подпись этапа проявляется и (кроме последнего) гаснет.
const OPEN: [number, number] = [0, 0.24];
const CAP_IN: [number, number] = [0.06, 0.18];
const CAP_OUT: [number, number] = [0.9, 1];
// Доли выхода: капля стоит в оси, потом падает с ускорением за нижний край.
const DROP: [number, number] = [0.3, 0.95];

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const seg = (v: number, [a, b]: [number, number]) => clamp01((v - a) / (b - a));
const smooth = (t: number) => t * t * (3 - 2 * t);

// Что происходит при этом s: stage — текущий этап (−1 — до первого), u — доля этапа,
// lead — доля входа сцены (точка от места покоя под сеткой Сцены 3 уходит под веер), out — доля
// выхода.
export function sceneAt(s: number) {
  const lead = clamp01(s / ENTRY);
  const t = (s - START) / STAGE;
  if (t < 0) return { stage: -1, u: 0, lead, out: 0 };
  if (t < N) return { stage: Math.floor(t), u: t - Math.floor(t), lead, out: 0 };
  return { stage: N - 1, u: 1, lead, out: clamp01((s - START - N * STAGE) / OUTRO) };
}
export type Scene = ReturnType<typeof sceneAt>;

// Сколько карточек раскрыто — дробно, пока новая встаёт. Без движения — сразу целиком.
export function fanAt({ stage, u, out }: Scene, still: boolean): number {
  if (stage < 0) return -1;
  if (out > 0 || still) return stage;
  return stage - 1 + smooth(seg(u, OPEN));
}

// Подписи: 0 — «Весь путь» (до первого этапа), 1..N — этапы.
export function captionAt(j: number, { stage, u, out }: Scene, still: boolean): number {
  if (still) return j === stage + 1 ? 1 : 0;
  if (j === 0) return stage < 0 ? 1 : stage === 0 ? 1 - seg(u, [0, CAP_IN[0]]) : 0;
  const i = j - 1;
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

// Капля: доля пути к оси и падения из неё.
export function dropAt({ lead, out }: Scene) {
  return { lead, fall: seg(out, DROP) };
}
