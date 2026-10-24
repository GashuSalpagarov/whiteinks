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
export const TOTAL_TERM = corp.weeks ? formatWeeks(...corp.weeks) : "";

// Раскладка прокрутки, в экранах: s = 0 — секция вошла снизу (Сцена 3 отпускает свой sticky,
// и её сетка уезжает вверх со страницей), s = 1 — сцена встала на место. Пока она въезжает,
// точка плывёт из точки входа (entryPoint в Scene4.tsx) к верхнему краю первой карточки, слева
// пусто. Встала — из точки сразу растёт первая карточка, а подводка и строки чек-листа всплывают;
// дальше точка идёт по стопке вниз, под карточками.
const ENTRY = 1;
const STAGE = 0.4; // этап: карточка встаёт (первая — растёт из точки), веер раскрывается
const OUTRO = 0.4; // веер раскрыт; точка доходит по стопке до стыка со Сценой 5
export const TOTAL_SCREENS = ENTRY + N * STAGE + OUTRO;

// Доли этапа. Первая половина — движение: карточка встаёт (первая растёт из точки за GROW_FIRST —
// 0,2 экрана, как вылет карточки туннеля Сцены 3). Дальше — пауза. Подпись этапа сменяется с его
// началом, без доли прокрутки: переход прозрачности — в CSS, остановка посреди смены не
// оставляет полупрозрачных подписей.
const OPEN: [number, number] = [0, 0.4];
const GROW_FIRST: [number, number] = [0, 0.5];
// Вход: точка плывёт к верхнему краю первой карточки (доли ENTRY).
const GLIDE: [number, number] = [0.1, 1];

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

// Подпись этапа i (блок справа) видна, пока идёт его этап.
export const captionOn = (i: number, { stage }: Scene) => i === stage;

// Строка чек-листа этапа i: off — впереди, on — текущий, done — пройден; grow — насколько
// текущая крупнее (растёт, пока встаёт её карточка; прошлая так же сжимается); strike — доля
// зачёркивания: прошлая зачёркивается, пока начинается следующий этап, «Запуск» — на выходе.
// Без движения — сразу итог: пройденные зачёркнуты, текущая крупная.
const GROW: [number, number] = [0, 0.3];
const STRIKE: [number, number] = [0, 0.3];
const STRIKE_LAST: [number, number] = [0, 0.3];
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

// Точка: glide — доля пути к верхнему краю первой карточки, walk — доля пути по стопке:
// равномерно по этапам и выходу, от начала первого этапа до конца выхода. rise — на сколько px
// точка за вход поднимается на экране (h — экран): сглаживание разгоняет её посередине в 1,5 раза,
// и при подъёме больше 0,6 экрана (тесная сетка Сцены 3 на планшете в портрете) она обгоняла бы
// кадр, который въезжает со страницей, — по пути шла бы назад. Тогда сглаживание мягче, ровно
// чтобы не быстрее страницы; на телефоне и десктопе подъём меньше — как было.
export function dropAt({ stage, u, lead, out }: Scene, rise = 0, h = 1) {
  const walk = stage < 0 ? 0 : (STAGE * (stage + u) + OUTRO * out) / (N * STAGE + OUTRO);
  const g = seg(lead, GLIDE);
  const soft = rise > 0 ? clamp01(2 * (((GLIDE[1] - GLIDE[0]) * ENTRY * h) / rise - 1)) : 1;
  return { glide: g + soft * (smooth(g) - g), walk };
}
