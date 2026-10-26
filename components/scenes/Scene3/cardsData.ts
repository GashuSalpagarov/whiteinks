// Кейсы Сцены 3: карточка и подпись в туннеле, плитка финальной сетки. Тексты и цифры —
// заглушки, правьте здесь. Картинки — в public/assets/hero/; color — фон картинки (как первый
// прямоугольник в её SVG): с ним она вписывается в карточку целиком.
// slug — страница кейса /works/<slug>/ (её содержимое — cases.ts): у карточки появляются ссылка
// «Смотреть кейс →» в подписи туннеля, и сама карточка и плитка сетки ведут в кейс. Без slug —
// просто карточка.

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
  slug?: string;
};

// Порядок — и в туннеле (первые пять), и в сетке: все семь и белая «Все проекты», 4×2 на
// широком экране и 2×4 в портрете — одинаковые фоны не встают рядом.
export const CARDS_CONTENT: CardContent[] = [
  {
    title: "ИИ-ассистент",
    client: "Служба доставки",
    type: "ИИ и автоматизация",
    year: "2025",
    result: "70%",
    resultNote: "обращений закрывает без оператора",
    image: img("phones"),
    color: "#f4ebc3",
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
    slug: "e-commerce",
  },
  {
    title: "Промо-сайт студии",
    client: "White Inks",
    type: "Сайт · 3D",
    year: "2026",
    result: "×3",
    resultNote: "заявок с сайта",
    image: img("browser"),
    color: "#f7dccb",
    slug: "studio-site",
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
  },
  {
    title: "Шрифт для издания",
    client: "Городской журнал",
    type: "Типографика",
    year: "2024",
    result: "4 начертания",
    resultNote: "кириллица и латиница",
    image: img("type"),
    color: "#f7dccb",
  },
  {
    title: "Онлайн-редактор",
    client: "Сервис для команд",
    type: "Интерфейсы",
    year: "2024",
    result: "−40%",
    resultNote: "времени на сборку макета",
    image: img("shapes"),
    color: "#dddaf5",
  },
];

// Сколько всего проектов у студии: подпись плитки «Все проекты» («24 проекта») и «+17» на ней —
// без показанных в сетке. Заглушка — впишите настоящее число.
export const PROJECTS_TOTAL = 24;

// Ссылка плитки «Все проекты». Страницы со всеми работами пока нет — заглушка (якорь без цели,
// страница не прокручивается); появится страница или внешний адрес — впишите его сюда.
export const WORKS_HREF = "#works";
