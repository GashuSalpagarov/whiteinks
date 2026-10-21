// Кейсы Сцены 3: карточка и подпись в туннеле, плитка финальной сетки. Тексты и цифры —
// заглушки, правьте здесь. Картинки — в public/assets/hero/; color — фон картинки (как первый
// прямоугольник в её SVG): с ним она вписывается в карточку целиком.
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
  href?: string;
};

// Порядок — и в туннеле, и в сетке (3×2 и 2×3): одинаковые фоны не встают рядом.
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
  },
  {
    title: "Промо-сайт студии",
    client: "White Inks",
    type: "Сайт · 3D",
    year: "2026",
    result: "6 недель",
    resultNote: "от идеи до запуска",
    image: img("browser"),
    color: "#f7dccb",
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

// Строка финала под «Работы (06)».
export const FINALE_LINE = "Остальные проекты покажем по запросу.";
