// Прайс Сцены 5 — ориентиры «от» по типам работ; срок «Корпоративного» берёт и Сцена 4.
// ЧЕРНОВЫЕ ЦИФРЫ — их выставит владелец студии. Деньги — в тыс. ₽, сроки — в неделях.

export type TypeId = "landing" | "builder" | "corp" | "shop" | "unique" | "ai";

// base — цена среднего размера без дополнений, weeks — его срок.
// includes — что входит: ЗАГЛУШКИ, тексты выставит владелец.
export const TYPES: {
  id: TypeId;
  title: string;
  includes: string;
  base: number;
  weeks: [number, number];
}[] = [
  {
    id: "landing",
    title: "Лендинг",
    includes: "Дизайн и вёрстка, адаптив, формы заявок, аналитика",
    base: 450,
    weeks: [4, 6],
  },
  {
    id: "builder",
    title: "На конструкторе",
    includes: "Сборка на Tilda или Webflow и обучение — дальше правите сами",
    base: 350,
    weeks: [3, 5],
  },
  {
    id: "corp",
    title: "Корпоративный",
    includes: "Структура, дизайн и разработка: услуги, кейсы, команда",
    base: 1000,
    weeks: [8, 12],
  },
  {
    id: "shop",
    title: "Магазин",
    includes: "Каталог, корзина, оплата и доставка, связка с 1С",
    base: 1800,
    weeks: [10, 16],
  },
  {
    id: "unique",
    title: "Уникальный",
    includes: "Сервис, портал или личный кабинет: от прототипа до запуска",
    base: 3000,
    weeks: [16, 24],
  },
  // Заглушка: база и сроки — правдоподобные, точные выставит владелец студии.
  {
    id: "ai",
    title: "ИИ и автоматизация",
    includes: "Чат-бот на нейросети, интеграции с CRM и 1С",
    base: 600,
    weeks: [4, 8],
  },
];

const NB = " ";

const mln = (v: number) => String(Math.round(v / 10) / 100).replace(".", ",");

// Нижняя граница одной строкой: «от 700 тыс. ₽», «от 1,3 млн ₽».
function formatFrom(v: number): string {
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

// Ориентир типа — компактный размер (−20 % к среднему) без дополнений: нижняя граница вилки
// (−10%) с шагом 50 тыс. — «от 300 тыс. ₽»; срок растёт медленнее цены, как √k, — «от 4 недель».
const SMALL = 0.8;

export function fromPrice(base: number): string {
  return formatFrom(Math.round((base * SMALL * 0.9) / 50) * 50);
}

export function fromWeeks([lo]: [number, number]): string {
  const w = Math.round(lo * Math.sqrt(SMALL));
  return `от ${w}${NB}${w % 10 === 1 && w % 100 !== 11 ? "недели" : "недель"}`;
}
