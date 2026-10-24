import { fromBase, TYPES } from "@/lib/pricing";

// Адрес сайта для canonical, Open Graph, sitemap и микроразметки — без слеша в конце.
// SITE_ORIGIN — metadataBase: путь /whiteinks к файлам-картинкам Next добавляет сам (basePath).
// Появится свой домен — поменять оба адреса и убрать basePath в next.config.ts.
export const SITE_ORIGIN = "https://gashusalpagarov.github.io";
export const SITE_URL = `${SITE_ORIGIN}/whiteinks`;

export const SITE_NAME = "White Inks";
export const SITE_TITLE = "Разработка сайтов и приложений под ключ — студия White Inks";
// h1 главной (HeroSlides): на экране его роль играет крупный заголовок слайдов, но тот собран
// из букв для анимации и меняется — для поиска и скринридеров заголовок один, словами.
export const SITE_H1 =
  "White Inks — студия веб-разработки и дизайна: сайты, приложения и бренды под ключ";

export const SITE_DESCRIPTION =
  "Студия веб-разработки и дизайна: сайты под ключ, интернет-магазины, мобильные приложения и Telegram Mini App, ИИ-боты, брендинг.";

// Микроразметка главной (schema.org, JSON-LD): студия и её услуги с ценами «от» из того же
// прайса. Телефон, почту, Telegram (sameAs) и адрес добавить, когда в lib/brief.ts будут
// настоящие; с адресом тип — ProfessionalService.
export const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#org`,
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      description:
        "Студия веб-разработки и дизайна: сайты, приложения, ИИ-боты и брендинг под ключ.",
      areaServed: { "@type": "Country", name: "Россия" },
      makesOffer: TYPES.map((t) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: t.title, description: t.includes },
        priceSpecification: t.weeks
          ? {
              "@type": "PriceSpecification",
              minPrice: fromBase(t.base) * 1000,
              priceCurrency: "RUB",
            }
          : {
              "@type": "UnitPriceSpecification",
              minPrice: t.base * 1000,
              priceCurrency: "RUB",
              unitCode: "MON",
            },
      })),
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#site`,
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      inLanguage: "ru",
      publisher: { "@id": `${SITE_URL}/#org` },
    },
  ],
};
