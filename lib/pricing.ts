// Прайс Сцены 5 — цены «от» по типам работ; срок «Корпоративного» берёт и Сцена 4.
// Цены выставил владелец студии, сроки пока черновые. Деньги — в тыс. ₽, сроки — в неделях.

export type TypeId =
  | "landing"
  | "builder"
  | "corp"
  | "shop"
  | "unique"
  | "ai"
  | "app"
  | "tma"
  | "support"
  | "seo";

// from — цена «от», weeks — срок среднего размера. Помесячные услуги — без срока: from у них —
// цена в месяц.
// includes — что входит: ЗАГЛУШКИ, тексты выставит владелец. short — то же одной короткой
// строкой (каталог на телефоне), только слова из includes.
export const TYPES: {
  id: TypeId;
  title: string;
  includes: string;
  short: string;
  from: number;
  weeks?: [number, number];
}[] = [
  {
    id: "landing",
    title: "Лендинг",
    includes: "Дизайн и вёрстка, адаптив, формы заявок, аналитика",
    short: "Дизайн и вёрстка",
    from: 50,
    weeks: [4, 6],
  },
  {
    id: "builder",
    title: "Шаблонное решение",
    includes: "Шаблон на Tilda или Webflow и обучение — дальше правите сами",
    short: "Tilda или Webflow",
    from: 30,
    weeks: [1, 2],
  },
  {
    id: "corp",
    title: "Корпоративный",
    includes: "Структура, дизайн и разработка: услуги, кейсы, команда",
    short: "Услуги и кейсы",
    from: 150,
    weeks: [8, 12],
  },
  {
    id: "shop",
    title: "Магазин",
    includes: "Каталог, корзина, оплата и доставка, связка с 1С",
    short: "Каталог и оплата",
    from: 200,
    weeks: [10, 16],
  },
  {
    id: "unique",
    title: "Уникальный сервис",
    includes: "Портал или личный кабинет: от прототипа до запуска",
    short: "Портал или кабинет",
    from: 350,
    weeks: [16, 24],
  },
  {
    id: "ai",
    title: "ИИ и автоматизация",
    includes: "Чат-бот на нейросети, интеграции с CRM и 1С",
    short: "Чат-бот на нейросети",
    from: 150,
    weeks: [4, 8],
  },
  {
    id: "app",
    title: "Приложение",
    includes: "iOS и Android: от прототипа до публикации в сторах",
    short: "iOS и Android",
    from: 450,
    weeks: [11, 16],
  },
  {
    id: "tma",
    title: "Telegram Mini App",
    includes: "Магазин, запись или сервис прямо в Telegram",
    short: "Магазин или запись",
    from: 120,
    weeks: [5, 8],
  },
  {
    id: "support",
    title: "Поддержка",
    includes: "Доработки, обновления, мониторинг и резервные копии",
    short: "Доработки",
    from: 10,
  },
  {
    id: "seo",
    title: "SEO и продвижение",
    includes: "Аудит, семантика, тексты и отчёт о позициях",
    short: "Аудит и семантика",
    from: 15,
  },
];

const NB = " ";

const mln = (v: number) => String(Math.round(v / 10) / 100).replace(".", ",");

// Нижняя граница одной строкой: «от 700 тыс. ₽», «от 1,3 млн ₽».
export function formatFrom(v: number): string {
  return `от ${v < 1000 ? `${v}${NB}тыс.` : `${mln(v)}${NB}млн`}${NB}₽`;
}

function weeksWord(n: number): string {
  const d = n % 10;
  const dd = n % 100;
  if (d === 1 && dd !== 11) return "неделя";
  if (d >= 2 && d <= 4 && (dd < 12 || dd > 14)) return "недели";
  return "недель";
}

export function formatWeeks(lo: number, hi: number): string {
  return `${lo}–${hi}${NB}${weeksWord(hi)}`;
}

// Срок компактного размера (−20 % к среднему): растёт медленнее цены, как √k, — «от 4 недель».
const SMALL = 0.8;

export function fromWeeks([lo]: [number, number]): string {
  const w = Math.round(lo * Math.sqrt(SMALL));
  return `от ${w}${NB}${w % 10 === 1 && w % 100 !== 11 ? "недели" : "недель"}`;
}
