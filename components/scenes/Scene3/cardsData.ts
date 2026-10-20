// Кейсы Сцены 3: карточка и подпись в туннеле, плитка финальной сетки. Тексты и цифры —
// заглушки, правьте здесь. Картинки — в public/assets/hero/; color — фон картинки (как первый
// прямоугольник в её SVG): с ним она вписывается в карточку целиком.
// tag — ключ для брифа (Сцена 5, «Похожие кейсы»), на сайте не показывается.
// href — страница кейса. Пока страниц нет, ссылки «Смотреть кейс» в подписи нет; появится
// /cases/<slug>/ — впишите адрес сюда, и ссылка покажется.

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const img = (name: string) => `${BASE}/assets/hero/${name}.svg`;

export type CardContent = {
  title: string;
  client: string;
  type: string;
  year: string;
  result: string;
  resultNote: string;
  image: string;
  color: string;
  tag: string;
  href?: string;
};

export const CARDS_CONTENT: CardContent[] = [
  {
    title: "Промо-сайт студии",
    client: "White Inks",
    type: "Сайт · 3D",
    year: "2026",
    result: "6 недель",
    resultNote: "от идеи до запуска",
    image: img("browser"),
    color: "#f7dccb",
    tag: "Web",
  },
  {
    title: "Мобильный банк",
    client: "Частный банк",
    type: "Приложение",
    year: "2025",
    result: "4,8 ★",
    resultNote: "оценка в магазинах приложений",
    image: img("app"),
    color: "#d3ebdd",
    tag: "Mobile",
  },
  {
    title: "Бренд-система",
    client: "ИТ-стартап",
    type: "Брендинг",
    year: "2025",
    result: "120 стр.",
    resultNote: "гайдлайнов и шаблонов",
    image: img("brand"),
    color: "#f4ebc3",
    tag: "Branding",
  },
  {
    title: "E-commerce платформа",
    client: "Оптовый дистрибьютор",
    type: "Платформа",
    year: "2024",
    result: "×2",
    resultNote: "заказов онлайн за год",
    image: img("shop"),
    color: "#dddaf5",
    tag: "Platform",
  },
];

// Строка под заголовком на входе и текст финала.
export const LEAD = "4 проекта · сайты, приложения, бренды · 2024–2026";
export const FINALE_LINE =
  "Избранные проекты. Остальные покажем по запросу — вместе с вашей задачей.";
