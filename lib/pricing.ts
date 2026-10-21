// Прайс Сцены 5: данные и чистая функция estimate().
// ЧЕРНОВЫЕ ЦИФРЫ — их выставит владелец студии. Деньги — в тыс. ₽, сроки — в неделях.

export type TypeId = "landing" | "builder" | "corp" | "shop" | "unique" | "ai";
export type ScaleId = "s" | "m" | "l" | "xl";
export type AddonId = "anim" | "3d" | "ds" | "en" | "copy" | "cms" | "seo" | "support";

// type: null — тип ещё не выбран (вход в сцену).
export type Selection = { type: TypeId | null; scale: ScaleId; addons: AddonId[] };

// base — цена среднего размера без дополнений; hints — что значит каждый размер для типа.
export const TYPES: {
  id: TypeId;
  title: string;
  note: string;
  base: number;
  weeks: [number, number];
  hints: Record<ScaleId, string>;
}[] = [
  {
    id: "landing",
    title: "Лендинг",
    note: "Одна страница под продукт или запуск",
    base: 450,
    weeks: [4, 6],
    hints: { s: "до 5 блоков", m: "≈ 8 блоков", l: "≈ 12 блоков", xl: "15+ блоков" },
  },
  {
    id: "builder",
    title: "На конструкторе",
    note: "Tilda или Webflow — дальше правите сами",
    base: 350,
    weeks: [3, 5],
    hints: { s: "≈ 3 страницы", m: "≈ 6 страниц", l: "≈ 12 страниц", xl: "20+ страниц" },
  },
  {
    id: "corp",
    title: "Корпоративный",
    note: "Компания, услуги, кейсы, команда",
    base: 1000,
    weeks: [8, 12],
    hints: { s: "≈ 5 страниц", m: "≈ 10 страниц", l: "≈ 20 страниц", xl: "40+ страниц" },
  },
  {
    id: "shop",
    title: "Магазин",
    note: "Каталог, корзина, оплата, доставка",
    base: 1800,
    weeks: [10, 16],
    hints: { s: "≈ 50 товаров", m: "≈ 200 товаров", l: "≈ 1000 товаров", xl: "5000+ товаров" },
  },
  {
    id: "unique",
    title: "Уникальный",
    note: "Сервис, портал, личный кабинет",
    base: 3000,
    weeks: [16, 24],
    hints: { s: "≈ 10 экранов", m: "≈ 25 экранов", l: "≈ 50 экранов", xl: "80+ экранов" },
  },
  // Заглушка: база, сроки и подсказки — правдоподобные, точные выставит владелец студии.
  {
    id: "ai",
    title: "ИИ и автоматизация",
    note: "Чат-боты, интеграции, CRM и 1С",
    base: 600,
    weeks: [4, 8],
    hints: { s: "1 сценарий", m: "≈ 3 сценария", l: "≈ 6 сценариев", xl: "10+ сценариев" },
  },
];

// k — множитель цены; сроки растут медленнее, как √k.
export const SCALES: { id: ScaleId; title: string; k: number }[] = [
  { id: "s", title: "Компактный", k: 0.8 },
  { id: "m", title: "Средний", k: 1 },
  { id: "l", title: "Большой", k: 1.4 },
  { id: "xl", title: "Очень большой", k: 1.8 },
];

// pct — процент к работам, fixed — тыс. ₽ сверху, wk — недель к верхней границе срока.
// monthly — помесячно, в диапазон не входит.
export const ADDONS: {
  id: AddonId;
  title: string;
  pct?: number;
  fixed?: number;
  wk?: number;
  monthly?: boolean;
}[] = [
  { id: "anim", title: "Анимация", pct: 20, wk: 1 },
  { id: "3d", title: "3D / WebGL", pct: 40, wk: 3 },
  { id: "ds", title: "Дизайн-система", pct: 15, wk: 2 },
  { id: "en", title: "Английская версия", pct: 20, wk: 1 },
  { id: "copy", title: "Тексты", fixed: 120, wk: 1 },
  { id: "cms", title: "CMS-админка", fixed: 200, wk: 2 },
  { id: "seo", title: "SEO-база", fixed: 70 },
  { id: "support", title: "Поддержка", monthly: true },
];

// На входе тип не выбран: цена — нижняя граница по всем типам.
export const DEFAULT_SELECTION: Selection = { type: null, scale: "m", addons: [] };

// Вилка вокруг расчёта и шаг округления, тыс. ₽.
const RANGE: [number, number] = [0.9, 1.3];
const ROUND = 50;

export type Estimate = {
  lo: number;
  hi: number;
  weeks: [number, number];
  price: string;
  term: string;
};

const NB = " ";
const sum = (values: (number | undefined)[]) => values.reduce<number>((s, v) => s + (v ?? 0), 0);

const mln = (v: number) => String(Math.round(v / 10) / 100).replace(".", ",");

// Тыс. ₽ → «400 – 600 тыс. ₽»; от миллиона — обе границы в миллионах: «0,9 – 1,3 млн ₽».
export function formatPrice(lo: number, hi: number): string {
  if (hi < 1000) return `${lo}${NB}– ${hi}${NB}тыс.${NB}₽`;
  return `${mln(lo)}${NB}– ${mln(hi)}${NB}млн${NB}₽`;
}

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

// Цена = база × k × (1 + Σ%) + Σ фикс.; вилка −10…+30%, округление до 50 тыс.
// Тип не выбран — нижняя граница по всем типам с теми же размером и дополнениями:
// «от 300 тыс. ₽», «от 3 недель».
export function estimate({ type, scale, addons }: Selection): Estimate {
  if (!type) {
    const all = TYPES.map((x) => estimate({ type: x.id, scale, addons }));
    const lo = Math.min(...all.map((e) => e.lo));
    const wk = Math.min(...all.map((e) => e.weeks[0]));
    const word = wk % 10 === 1 && wk % 100 !== 11 ? "недели" : "недель";
    return { lo, hi: lo, weeks: [wk, wk], price: formatFrom(lo), term: `от ${wk}${NB}${word}` };
  }
  const t = TYPES.find((x) => x.id === type) ?? TYPES[0];
  const k = SCALES.find((x) => x.id === scale)?.k ?? 1;
  const picked = ADDONS.filter((a) => addons.includes(a.id));
  const mid =
    t.base * k * (1 + sum(picked.map((a) => a.pct)) / 100) + sum(picked.map((a) => a.fixed));
  const lo = Math.round((mid * RANGE[0]) / ROUND) * ROUND;
  const hi = Math.round((mid * RANGE[1]) / ROUND) * ROUND;
  const weeks: [number, number] = [
    Math.round(t.weeks[0] * Math.sqrt(k)),
    Math.round(t.weeks[1] * Math.sqrt(k)) + sum(picked.map((a) => a.wk)),
  ];
  return { lo, hi, weeks, price: formatPrice(lo, hi), term: formatWeeks(...weeks) };
}

// Выбор ⇄ строка в адресе: «corp.m.anim,3d». Неизвестное — null (тип и размер)
// или выкидываем (дополнения).
export function encodeSelection({ type, scale, addons }: Selection): string {
  return `${type ?? ""}.${scale}.${addons.join(",")}`;
}

export function decodeSelection(value: string): Selection | null {
  const [type, scale, list = ""] = value.split(".");
  const t = TYPES.find((x) => x.id === type)?.id;
  const s = SCALES.find((x) => x.id === scale)?.id;
  if (!t || !s) return null;
  const addons = ADDONS.filter((a) => list.split(",").includes(a.id)).map((a) => a.id);
  return { type: t, scale: s, addons };
}
