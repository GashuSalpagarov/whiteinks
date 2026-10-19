// Слайды главного экрана: заголовок в три строки, подводка и три картинки вокруг неё.
// Тексты и картинки — заглушки, правьте здесь. Порядок картинок — как в раскладке слайда
// (LAYOUTS в HeroSlides.tsx): первая — большая. Файлы — в public/assets/hero/; чтобы заменить
// картинку, достаточно заменить файл.
// Место картинки может быть другой пропорции, чем файл. bg — цвет фона картинки: с ним она
// вписывается целиком, а поля места заливаются этим цветом (так у заглушек: важное не
// обрезается). Без bg — заполняет место с обрезкой по центру (для фотографий).

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const img = (name: string, bg?: string) => ({ src: `${BASE}/assets/hero/${name}.svg`, bg });

// Фоны заглушек — как у первого прямоугольника в их SVG.
const PEACH = "#f7dccb";
const MINT = "#d3ebdd";
const LAVENDER = "#dddaf5";
const CREAM = "#f4ebc3";

export type HeroImage = { src: string; bg?: string };

export type HeroSlide = {
  title: readonly [string, string, string];
  lead: string;
  images: readonly [HeroImage, HeroImage, HeroImage];
};

export const SLIDES: readonly HeroSlide[] = [
  {
    title: ["Создаём", "цифровые", "продукты"],
    lead: "Сайты, приложения и бренды — от идеи до запуска. Проектируем, рисуем и разрабатываем под ключ.",
    images: [img("browser", PEACH), img("app", MINT), img("shapes", LAVENDER)],
  },
  {
    title: ["Разрабатываем", "быстрые", "сайты"],
    lead: "Лендинги, магазины и порталы, которые работают на любом экране, быстро грузятся и приводят клиентов.",
    images: [img("shop", LAVENDER), img("type", PEACH), img("tiles", MINT)],
  },
  {
    title: ["Запускаем", "мобильные", "приложения"],
    lead: "iOS и Android — от прототипа до публикации в сторах. Продумываем сценарии и поддерживаем после релиза.",
    images: [img("phones", CREAM), img("app", MINT), img("shapes", LAVENDER)],
  },
  {
    title: ["Строим", "сильные", "бренды"],
    lead: "Имя, логотип и айдентика, которые узнают с первого взгляда. Собираем бренд-бук и все носители.",
    images: [img("brand", CREAM), img("type", PEACH), img("tiles", MINT)],
  },
];
