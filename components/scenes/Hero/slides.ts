// Слайды главного экрана: заголовок в три строки, подводка и три картинки вокруг неё.
// Тексты и картинки — заглушки, правьте здесь. Порядок картинок — по местам: большая сверху,
// средняя справа, небольшая снизу; пропорции мест — 4:3, 3:4 и 7:5 (другая обрежется по центру).
// Файлы — в public/assets/hero/; чтобы заменить картинку, достаточно заменить файл.

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const img = (name: string) => `${BASE}/assets/hero/${name}.svg`;

export type HeroSlide = {
  title: readonly [string, string, string];
  lead: string;
  images: readonly [string, string, string];
};

export const SLIDES: readonly HeroSlide[] = [
  {
    title: ["Создаём", "цифровые", "продукты"],
    lead: "Сайты, приложения и бренды — от идеи до запуска. Проектируем, рисуем и разрабатываем под ключ.",
    images: [img("browser"), img("app"), img("shapes")],
  },
  {
    title: ["Разрабатываем", "быстрые", "сайты"],
    lead: "Лендинги, магазины и порталы, которые работают на любом экране.",
    images: [img("shop"), img("type"), img("tiles")],
  },
  {
    title: ["Запускаем", "мобильные", "приложения"],
    lead: "iOS и Android — от прототипа до публикации в сторах.",
    images: [img("phones"), img("app"), img("shapes")],
  },
  {
    title: ["Строим", "сильные", "бренды"],
    lead: "Имя, логотип и айдентика, которые узнают с первого взгляда.",
    images: [img("brand"), img("type"), img("tiles")],
  },
];
