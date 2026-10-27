// Страницы кейсов (/works/<slug>/, components/case). Карточка кейса — в cardsData.ts (там же
// slug), здесь — всё, что есть только на странице. Шаблон — как в анкете владельцу: задача
// с цифрами «как было», три решения с картинками, пара картинок, цифры результата, отзыв.
// Сроков на странице нет (вариант D2, docs/12-case-page.md): ни недель, ни этапов по времени.
// Порядок «следующего кейса» — как здесь, по кругу. Картинки — public/works/<slug>/.
// example — пометка «пример» на странице: пока тексты и цифры — заглушки.

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const img = (slug: string, name: string) => `${BASE}/works/${slug}/${name}.svg`;

export type CaseImage = {
  src: string;
  alt: string; // что на картинке — для экранных чтецов
  ratio?: "4/3" | "3/4"; // по умолчанию 4/3
};

export type CaseData = {
  slug: string;
  example?: boolean;
  summary: string; // одна фраза первого экрана и описания ссылки, до 160 знаков
  url?: string; // живой проект
  task: string; // абзац «как было»
  before: { value: string; note: string }[]; // 2–3 факта «было»
  beforeImage: CaseImage;
  solution: { title: string; text: string; image: CaseImage }[]; // 3 пункта
  gallery: [CaseImage, CaseImage]; // пара: телефон (3/4) и широкая
  galleryNote: string;
  results: { value: string; note: string }[]; // 2–4 цифры, без сроков проекта
  resultsSource: string; // откуда цифры: «данные клиента»
  quote?: { text: string; who: string }; // who — должность и тип компании, без имени
  services: string[]; // что делали
  need?: string; // «что нужно» в заявке в конце кейса — пилюля из NEEDS (lib/brief.ts)
};

export const CASES: CaseData[] = [
  {
    slug: "studio-site",
    example: true,
    summary: "Сайт-лента для студии: одна линия ведёт через услуги, работы, этапы и цены к заявке.",
    task: "Прошлый сайт был каталогом из шести страниц: услуги, работы и цены жили отдельно, до заявки доходил один посетитель из ста. Нужен был сайт, который сам показывает уровень студии.",
    before: [
      { value: "6 страниц", note: "до заявки — четыре перехода" },
      { value: "1 из 100", note: "посетителей оставлял заявку" },
      { value: "40 секунд", note: "в среднем на сайте" },
    ],
    beforeImage: {
      src: img("studio-site", "before"),
      alt: "Было: шесть отдельных страниц со ссылками друг на друга",
    },
    solution: [
      {
        title: "Одна линия через всю страницу",
        text: "Точка ведёт от первого экрана к заявке: услуги, работы, этапы и цены — станции на одном пути.",
        image: { src: img("studio-site", "line"), alt: "Линия пути через сцены сайта" },
      },
      {
        title: "Работы туннелем",
        text: "Кейсы по одному вылетают из точки и встают в окно чтения, в конце собираются в сетку. Нажатие — и вы внутри проекта.",
        image: {
          src: img("studio-site", "tunnel"),
          alt: "Туннель работ: карточки вылетают из точки",
        },
      },
      {
        title: "Цена до звонка",
        text: "Прайс по типу проекта со сроками: порядок цены виден сразу, а заявка уходит с уже выбранным типом.",
        image: { src: img("studio-site", "price"), alt: "Прайс по типам проектов" },
      },
    ],
    gallery: [
      { src: img("studio-site", "mobile"), alt: "Сайт на телефоне", ratio: "3/4" },
      { src: img("studio-site", "brief"), alt: "Заявка-конверт" },
    ],
    galleryNote:
      "на телефоне — та же лента, без упрощённой версии · заявка складывается в конверт с выбранным типом проекта",
    results: [
      { value: "×3", note: "заявок с сайта" },
      { value: "2,5 мин", note: "в среднем на сайте" },
      { value: "1", note: "страница вместо шести" },
    ],
    resultsSource: "данные студии",
    services: ["Концепция", "Дизайн", "3D и анимация", "Разработка"],
    need: "Сайт",
  },
];

export const caseBySlug = (slug: string) => CASES.find((c) => c.slug === slug) ?? null;

export function nextCase(slug: string): CaseData {
  const i = CASES.findIndex((c) => c.slug === slug);
  return CASES[(i + 1) % CASES.length];
}
