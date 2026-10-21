// Прайс Сцены 5: каталог без выбора — ориентиры «от» по типам, размеры и дополнения.
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

// k — множитель цены к среднему размеру; сроки растут медленнее, как √k.
export const SCALES: { title: string; k: number }[] = [
  { title: "Компактный", k: 0.8 },
  { title: "Средний", k: 1 },
  { title: "Большой", k: 1.4 },
  { title: "Очень большой", k: 1.8 },
];

// pct — процент к работам, fixed — тыс. ₽ сверху, monthly — помесячно, отдельно от цены.
export const ADDONS: { title: string; pct?: number; fixed?: number; monthly?: boolean }[] = [
  { title: "Анимация", pct: 20 },
  { title: "3D / WebGL", pct: 40 },
  { title: "Дизайн-система", pct: 15 },
  { title: "Английская версия", pct: 20 },
  { title: "Тексты", fixed: 120 },
  { title: "CMS-админка", fixed: 200 },
  { title: "SEO-база", fixed: 70 },
  { title: "Поддержка", monthly: true },
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

// Ориентир типа — компактный размер без дополнений: нижняя граница вилки (−10%) с шагом
// 50 тыс. — «от 300 тыс. ₽»; срок — «от 4 недель».
const SMALL = SCALES[0].k;

export function fromPrice(base: number): string {
  return formatFrom(Math.round((base * SMALL * 0.9) / 50) * 50);
}

export function fromWeeks([lo]: [number, number]): string {
  const w = Math.round(lo * Math.sqrt(SMALL));
  return `от ${w}${NB}${w % 10 === 1 && w % 100 !== 11 ? "недели" : "недель"}`;
}
