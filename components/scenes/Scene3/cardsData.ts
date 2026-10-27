// Кейсы Сцены 3: карточка и подпись в туннеле, плитка финальной сетки. Тексты — настоящие,
// согласованы с владельцем; у «Промо-сайта студии» цифры пока заглушка. Картинки — в
// public/assets/hero/: у настоящих кейсов WebP 1200×900 с экранами проекта на пастельном фоне,
// у промо-сайта — SVG. color — тот же фон (у SVG — первый прямоугольник): с ним картинка
// вписывается в карточку целиком.
// slug — страница кейса /works/<slug>/ (её содержимое — cases.ts): у карточки появляются ссылка
// «Смотреть кейс →» в подписи туннеля, и сама карточка и плитка сетки ведут в кейс. Без slug —
// просто карточка.

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const img = (file: string) => `${BASE}/assets/hero/${file}`;

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
    title: "ИИ-собеседник Memoridian",
    client: "White Inks",
    type: "Приложение · ИИ",
    year: "2026",
    result: "Помнит",
    resultNote: "тебя и близких — посмотреть и стереть можно в любой момент",
    image: img("card-memoridian.webp"),
    color: "#f7dccb",
  },
  {
    title: "Медиатека для компаний",
    client: "Picvario",
    type: "Интерфейсы",
    year: "2025",
    result: "100+",
    resultNote: "крупных клиентов пользуются системой",
    image: img("card-picvario.webp"),
    color: "#d3ebdd",
  },
  {
    title: "Прокат снаряжения",
    client: "Прокат «Адреналин», Архыз",
    type: "Бренд и сайт",
    year: "2026",
    result: "4 шага",
    resultNote: "бронь снаряжения на всю компанию",
    image: img("card-adrenalin.webp"),
    color: "#f4ebc3",
  },
  {
    title: "Портал телемедицины",
    client: "Doctis",
    type: "Сайт · сервис",
    year: "2022",
    result: "24/7",
    resultNote: "дежурный врач онлайн, ответ в течение 10 минут",
    image: img("card-doctis.webp"),
    color: "#dddaf5",
  },
  {
    title: "Сайт стоматологии",
    client: "Центр имплантации «Империя»",
    type: "Сайт",
    year: "2021",
    result: "1 поле",
    resultNote: "в форме записи — только телефон",
    image: img("card-imperia.webp"),
    color: "#d3ebdd",
  },
  {
    title: "Витрина анализов",
    client: "Doctis",
    type: "Каталог и заказ",
    year: "2022",
    result: "Без направления",
    resultNote: "цены в своём городе, лаборатория — на карте",
    image: img("card-doctis-analysis.webp"),
    color: "#f4ebc3",
  },
  {
    title: "Промо-сайт студии",
    client: "White Inks",
    type: "Сайт · 3D",
    year: "2026",
    result: "×3",
    resultNote: "заявок с сайта",
    image: img("browser.svg"),
    color: "#f7dccb",
    slug: "studio-site",
  },
];

// Сколько всего проектов у студии: подпись плитки «Все проекты» («24 проекта») и «+17» на ней —
// без показанных в сетке. Заглушка — впишите настоящее число.
export const PROJECTS_TOTAL = 24;

// Ссылка плитки «Все проекты». Страницы со всеми работами пока нет — заглушка (якорь без цели,
// страница не прокручивается); появится страница или внешний адрес — впишите его сюда.
export const WORKS_HREF = "#works";
