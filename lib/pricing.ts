// Прайс Сцены 5 — цены и сроки «от» по типам работ. Срок «Корпоративного» сходится с этапами
// Сцены 4 (stages.ts). Цены выставил владелец студии. Деньги — в тыс. ₽.

export type TypeId =
  | "landing"
  | "builder"
  | "corp"
  | "shop"
  | "integr"
  | "unique"
  | "ai"
  | "app"
  | "tma"
  | "support"
  | "seo";

// from — цена «от», term — минимальный срок. Помесячные услуги — без срока: from у них — цена в
// месяц.
// includes — что входит: ЗАГЛУШКИ, тексты выставит владелец. short — то же одной короткой
// строкой (каталог на телефоне), только слова из includes.
export const TYPES: {
  id: TypeId;
  title: string;
  includes: string;
  short: string;
  from: number;
  term?: string;
}[] = [
  {
    id: "landing",
    title: "Лендинг",
    includes: "Дизайн и вёрстка, адаптив, формы заявок, аналитика",
    short: "Дизайн и вёрстка",
    from: 50,
    term: "от 1 недели",
  },
  {
    id: "builder",
    title: "Шаблонное решение",
    includes: "Шаблон на Tilda или Webflow и обучение — дальше правите сами",
    short: "Tilda или Webflow",
    from: 30,
    term: "от 3 дней",
  },
  {
    id: "corp",
    title: "Корпоративный",
    includes: "Структура, дизайн и разработка: услуги, кейсы, команда",
    short: "Услуги и кейсы",
    from: 150,
    term: "от 3 недель",
  },
  {
    id: "shop",
    title: "Магазин",
    includes: "Каталог, корзина, оплата и доставка, связка с 1С",
    short: "Каталог и оплата",
    from: 200,
    term: "от 4 недель",
  },
  {
    id: "integr",
    title: "Интеграции с 1С и CRM",
    includes: "Обмен данными с сайтом: заказы, остатки, клиенты и заявки",
    short: "Обмен данными",
    from: 30,
    term: "от 1 недели",
  },
  {
    id: "unique",
    title: "Уникальный сервис",
    includes: "Портал или личный кабинет: от прототипа до запуска",
    short: "Портал или кабинет",
    from: 350,
    term: "от 6 недель",
  },
  {
    id: "ai",
    title: "ИИ и автоматизация",
    includes: "Чат-бот на нейросети, интеграции с CRM и 1С",
    short: "Чат-бот на нейросети",
    from: 150,
    term: "от 2 недель",
  },
  {
    id: "app",
    title: "Приложение",
    includes: "iOS и Android: от прототипа до публикации в сторах",
    short: "iOS и Android",
    from: 450,
    term: "от 8 недель",
  },
  {
    id: "tma",
    title: "Telegram Mini App",
    includes: "Магазин, запись или сервис прямо в Telegram",
    short: "Магазин или запись",
    from: 120,
    term: "от 2 недель",
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
