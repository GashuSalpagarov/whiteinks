// Страницы кейсов (/works/<slug>/, components/case). Карточка кейса — в cardsData.ts (там же
// slug), здесь — всё, что есть только на странице. Шаблон — как в анкете владельцу: задача
// с цифрами «как было», три решения с картинками, пара картинок, цифры результата, отзыв.
// Сроков на странице нет (вариант D2, docs/12-case-page.md): ни недель, ни этапов по времени.
// Порядок «следующего кейса» — как здесь, по кругу. Картинки — public/works/<slug>/.
// example — пометка «пример» на странице: пока тексты и цифры — заглушки.

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const img = (slug: string, file: string) => `${BASE}/works/${slug}/${file}`;

export type CaseImage = {
  src: string;
  alt: string; // что на картинке — для экранных чтецов
  ratio?: "4/3" | "3/4"; // по умолчанию 4/3
};

export type CaseData = {
  slug: string;
  showcase?: boolean; // своя страница вместо рассказа (components/case/memoridian, prokat)
  title?: string; // название для кейса без карточки в cardsData.ts
  unlisted?: boolean; // без карточки на главной: «ещё проект →» других кейсов сюда не ведёт
  example?: boolean;
  summary: string; // одна фраза первого экрана и описания ссылки, до 160 знаков
  url?: string; // живой проект
  task: string; // абзац «как было»
  before: { value: string; note: string }[]; // 2–3 факта «было»
  beforeImage: CaseImage;
  solution: { title: string; text: string; image: CaseImage }[]; // 3 пункта
  gallery: [CaseImage, CaseImage]; // пара: телефон (3/4) и широкая
  galleryNote: string;
  platforms?: string[]; // где ещё есть проект — строками на первом экране, рядом с обложкой
  results?: { value: string; note: string }[]; // 2–4 цифры, без сроков проекта
  resultsSource?: string; // откуда цифры: «данные клиента»
  // Результат без цифр — где проект живёт сейчас: строки площадок вместо таблицы цифр.
  launch?: {
    where: {
      name: string; // «Android»
      place: string; // «Google Play»
      note: string;
      status: string; // «вышло», «работает»
      url?: string;
    }[];
    note: string; // строка под площадками
    price: string;
    try: string; // «попробовать ↗» — куда ведёт «Начать бесплатно» на сайте проекта
  };
  quote?: { text: string; who: string }; // who — должность и тип компании, без имени
  services: string[]; // что делали
  need?: string; // «что нужно» в заявке в конце кейса — пилюля из NEEDS (lib/brief.ts)
};

export const CASES: CaseData[] = [
  {
    slug: "memoridian",
    showcase: true,
    summary:
      "Помощник, который помнит человека и его дела. Наш продукт: мы сделали его от имени до приложения.",
    url: "https://memoridian.com",
    task: "Memoridian мы делали для себя: хотелось ассистента, который помнит важное о нас и наших близких. На русском такого не было. Дела, еда и деньги жили в разных приложениях — мы начали с нуля и собрали их в один чат.",
    before: [
      { value: "С нуля", note: "ни имени, ни знака, ни кода" },
      { value: "Не было", note: "ассистента с памятью на русском" },
      { value: "Порознь", note: "дела, еда и деньги — отдельно" },
    ],
    beforeImage: {
      src: img("memoridian", "before.webp"),
      alt: "Первая встреча: Мемо здоровается, а страница «Память» пока пустая — она сложится из разговоров",
    },
    solution: [
      {
        title: "Имя, знак и Мемо",
        text: "Придумали имя, букву M из бусин и Мемо — оранжевого маскота. Характер настраивается: с шутками или без, мягко или прямо, коротко или подробно.",
        image: {
          src: img("memoridian", "brand.webp"),
          alt: "Мемо и экран настроек его характера",
        },
      },
      {
        title: "Свой движок поверх моделей",
        text: "Ответы пишут внешние модели. Наше — память, карточки из обычных фраз, сервисы и выбор модели под задачу. Что Мемо запомнил, видно в «Памяти»: можно поправить или стереть.",
        image: {
          src: img("memoridian", "memory.webp"),
          alt: "Фраза в чате становится карточкой «Память», рядом — страница «Память» с портретом, близкими и делами",
        },
      },
      {
        title: "Один чат для дел, денег и билетов",
        text: "Записывает траты, еду и дела со слов, ведёт тренировки. Ищет поезда, самолёты, экскурсии и кино. Купить помогает во встроенном браузере: форму заполняет Мемо, оплата — за человеком.",
        image: {
          src: img("memoridian", "search.webp"),
          alt: "Поезда в чате и покупка билетов в кино во встроенном браузере: форма заполнена, «Оплатить» — за человеком",
        },
      },
    ],
    gallery: [
      {
        src: img("memoridian", "mobile.webp"),
        alt: "Главная приложения на телефоне: Мемо и плитки задач, памяти, заметок, калорий и финансов",
        ratio: "3/4",
      },
      {
        src: img("memoridian", "desktop.webp"),
        alt: "Веб-версия в браузере: напоминание и калории в одном чате",
      },
    ],
    galleryNote: "на телефоне и в браузере — один Мемо, одна память",
    platforms: ["Android — в Google Play", "iPhone — в App Store"],
    launch: {
      where: [
        {
          name: "Android",
          place: "Google Play",
          note: "приложение для телефона",
          status: "вышло",
          url: "https://play.google.com/store/apps/details?id=com.memoridian",
        },
        {
          name: "iPhone",
          place: "App Store",
          note: "приложение для iPhone",
          status: "вышло",
        },
        {
          name: "Браузер",
          place: "app.memoridian.com",
          note: "на компьютере и телефоне",
          status: "работает",
          url: "https://app.memoridian.com/",
        },
      ],
      note: "Память одна на всех трёх: начатое в телефоне продолжается в браузере.",
      price: "начать — бесплатно, дальше от 199 ₽ в месяц",
      try: "https://app.memoridian.com/",
    },
    services: ["Брендинг", "Сайты под ключ", "Мобильные приложения", "ИИ и автоматизация"],
    need: "Приложение",
  },
  {
    // Своя страница (components/case/picvario): поля рассказа только ради типа.
    slug: "picvario",
    showcase: true,
    summary:
      "Интерфейс медиатеки для компаний: сетка файлов, карточка файла, поиск, фильтры и версия для телефона.",
    task: "Интерфейс, в котором компании хранят, ищут и отдают фото и видео.",
    before: [],
    beforeImage: { src: img("picvario", "library.webp"), alt: "Медиатека: сетка файлов" },
    solution: [],
    gallery: [
      { src: img("picvario", "phone-grid.webp"), alt: "Сетка на телефоне", ratio: "3/4" },
      { src: img("picvario", "library.webp"), alt: "Медиатека в окне браузера" },
    ],
    galleryNote: "",
    services: [],
    need: "Сайт",
  },
  {
    // Своя страница (components/case/prokat): поля рассказа здесь заполнены только ради типа.
    slug: "prokat",
    showcase: true,
    summary:
      "Бренд и сайт для самого первого проката в истории Архыза: знак-молния, плакатный стиль и бронь снаряжения в четыре шага.",
    task: "Сайт для проката, который открылся в Архызе первым и держит три точки на улице Ленина.",
    before: [],
    beforeImage: { src: img("prokat", "first.webp"), alt: "Самый первый прокат в истории Архыза" },
    solution: [],
    gallery: [
      { src: img("prokat", "duo-phone.webp"), alt: "Сайт на телефоне", ratio: "3/4" },
      { src: img("prokat", "duo-window.webp"), alt: "Сайт в окне браузера" },
    ],
    galleryNote: "",
    services: ["Брендинг", "Сайты под ключ"],
    need: "Сайт",
  },
  {
    // Своя страница (components/case/doctis): поля рассказа только ради типа.
    slug: "doctis",
    showcase: true,
    summary:
      "Сайт сервиса телемедицины: от поиска врача до записи на консультацию, на компьютере и на телефоне.",
    task: "Сайт сервиса телемедицины: от поиска врача до записи на консультацию, на компьютере и на телефоне.",
    before: [],
    beforeImage: { src: img("doctis", "search.webp"), alt: "Поиск на главной" },
    solution: [],
    gallery: [
      { src: img("doctis", "duo-phone.webp"), alt: "Главная на телефоне", ratio: "3/4" },
      { src: img("doctis", "duo-window.webp"), alt: "Главная в окне браузера" },
    ],
    galleryNote: "",
    services: [],
    need: "Сайт",
  },
  {
    // Своя страница (components/case/imperia): поля рассказа только ради типа.
    slug: "imperia",
    showcase: true,
    summary:
      "Сайт центра стоматологии под ключ: услуги, цены, врачи и запись с формой в одно поле.",
    task: "Сайт центра стоматологии под ключ: услуги, цены, врачи и запись с формой в одно поле.",
    before: [],
    beforeImage: { src: img("imperia", "form.webp"), alt: "Форма записи на главной" },
    solution: [],
    gallery: [
      { src: img("imperia", "phone-prices.webp"), alt: "Цены на телефоне", ratio: "3/4" },
      { src: img("imperia", "prices.webp"), alt: "Страница цен" },
    ],
    galleryNote: "",
    services: [],
    need: "Сайт",
  },
  {
    // Своя страница (components/case/doctis-analysis): поля рассказа только ради типа. Стоит перед
    // Globaldrive, чтобы «ещё проект →» с него по-прежнему вёл на Memoridian.
    slug: "doctis-analysis",
    showcase: true,
    summary:
      "Раздел сайта Doctis: найти анализы, сравнить лаборатории на карте и увидеть итог заказа.",
    task: "Раздел сайта Doctis: найти анализы, сравнить лаборатории на карте и увидеть итог заказа.",
    before: [],
    beforeImage: { src: img("doctis-analysis", "tiles.webp"), alt: "Витрина анализов" },
    solution: [],
    gallery: [
      { src: img("doctis-analysis", "duo-phone.webp"), alt: "Карта на телефоне", ratio: "3/4" },
      { src: img("doctis-analysis", "duo-window.webp"), alt: "Витрина в окне браузера" },
    ],
    galleryNote: "",
    services: [],
    need: "Сайт",
  },
  {
    // Своя страница (components/case/globaldrive), карточки на главной нет: поля рассказа только ради типа.
    slug: "globaldrive",
    showcase: true,
    title: "Магазин техники Globaldrive",
    unlisted: true,
    summary:
      "Интерфейс интернет-магазина техники: каталог, поиск, фильтры, страница товара, запчасти по схемам и версия для телефона.",
    task: "Интернет-магазин лодочных моторов, снегоходов, квадроциклов и запчастей к ним.",
    before: [],
    beforeImage: { src: img("globaldrive", "menu.webp"), alt: "Меню каталога магазина" },
    solution: [],
    gallery: [
      { src: img("globaldrive", "duo-phone.webp"), alt: "Магазин на телефоне", ratio: "3/4" },
      { src: img("globaldrive", "duo-window.webp"), alt: "Магазин в окне браузера" },
    ],
    galleryNote: "",
    services: [],
    need: "Магазин",
  },
  {
    // Своя страница (components/case/animals-travel), карточки на главной нет: поля рассказа только ради типа.
    slug: "animals-travel",
    showcase: true,
    title: "Сайт перевозок Animals Travel",
    unlisted: true,
    summary:
      "Сайт компании, которая перевозит домашних животных: услуги, каталог переносок, цены, форма заявки и версия для телефона.",
    task: "Сайт компании, которая перевозит домашних животных в другой город и другую страну.",
    before: [],
    beforeImage: { src: img("animals-travel", "slide-train.webp"), alt: "Первый экран сайта" },
    solution: [],
    gallery: [
      { src: img("animals-travel", "duo-phone.webp"), alt: "Сайт на телефоне", ratio: "3/4" },
      { src: img("animals-travel", "duo-window.webp"), alt: "Сайт в окне браузера" },
    ],
    galleryNote: "",
    services: [],
    need: "Сайт",
  },
  {
    // Своя страница (components/case/edgeconf), карточки на главной нет: поля рассказа только ради типа.
    slug: "edgeconf",
    showcase: true,
    title: "Видеоплатформа EdgeConf",
    unlisted: true,
    summary:
      "Видеоплатформа, которую мы построили: конференции и вебинары без регистрации, кабинет стриминга и настройка плеера.",
    task: "Видеозвонки, вебинары и стриминг для бизнеса.",
    before: [],
    beforeImage: { src: img("edgeconf", "cards.webp"), alt: "Плитки конференции и вебинара" },
    solution: [],
    gallery: [
      { src: img("edgeconf", "player.webp"), alt: "Настройки плеера", ratio: "3/4" },
      { src: img("edgeconf", "duo-start.webp"), alt: "Стартовый экран" },
    ],
    galleryNote: "",
    services: [],
    need: "Приложение",
  },
  {
    // Своя страница (components/case/edgecenter): поля рассказа только ради типа.
    slug: "edgecenter",
    showcase: true,
    summary:
      "Личный кабинет облачного провайдера: дашборд, разделы CDN, облака и защиты, роли, уведомления и вход в аккаунт.",
    task: "Личный кабинет сервисов облачного провайдера.",
    before: [],
    beforeImage: { src: img("edgecenter", "signin.webp"), alt: "Страница входа в кабинет" },
    solution: [],
    gallery: [
      { src: img("edgecenter", "signin-phone.webp"), alt: "Вход на телефоне", ratio: "3/4" },
      { src: img("edgecenter", "dashboard.webp"), alt: "Дашборд кабинета" },
    ],
    galleryNote: "",
    services: [],
    need: "Приложение",
  },
  {
    // Своя страница (components/case/goroddorog), карточки на главной нет: поля рассказа только ради типа.
    slug: "goroddorog",
    showcase: true,
    title: "Сайт автошколы «Город Дорог»",
    unlisted: true,
    summary:
      "Сайт автошколы с онлайн-обучением: своя страница у каждого филиала, программы, расписание, автопарк и адаптивная версия.",
    task: "Сайт автошколы с маркетинговой воронкой для каждого филиала и функционалом для онлайн-обучения.",
    before: [],
    beforeImage: { src: img("goroddorog", "steps.webp"), alt: "Десять шагов до удостоверения" },
    solution: [],
    gallery: [
      { src: img("goroddorog", "phone-programs.webp"), alt: "Программы на телефоне", ratio: "3/4" },
      { src: img("goroddorog", "programs.webp"), alt: "Разделы на главной" },
    ],
    galleryNote: "",
    services: [],
    need: "Сайт",
  },
  {
    // Своя страница (components/case/doctis-crm), карточки на главной нет: поля рассказа только ради типа.
    slug: "doctis-crm",
    showcase: true,
    title: "CRM Doctis",
    unlisted: true,
    summary:
      "Рабочее место сотрудников телемедицины: задачи, страховые программы, клиники, врачи и статистика.",
    task: "Рабочее место сотрудников телемедицины.",
    before: [],
    beforeImage: { src: img("doctis-crm", "stats.webp"), alt: "Страница статистики" },
    solution: [],
    gallery: [
      { src: img("doctis-crm", "schedule.webp"), alt: "Расписание врача", ratio: "3/4" },
      { src: img("doctis-crm", "program.webp"), alt: "Форма страховой программы" },
    ],
    galleryNote: "",
    services: [],
    need: "Другое",
  },
  {
    // Своя страница (components/case/stroy-m), карточки на главной нет: поля рассказа только ради типа.
    slug: "stroy-m",
    showcase: true,
    title: "Магазин освещения Строй-М",
    unlisted: true,
    summary:
      "Интернет-магазин ламп и светильников: спокойный дизайн, яркие баннеры, умный фильтр и склады пяти поставщиков.",
    task: "Интернет-магазин осветительной продукции.",
    before: [],
    beforeImage: { src: img("stroy-m", "after.webp"), alt: "Первый экран магазина" },
    solution: [],
    gallery: [
      { src: img("stroy-m", "slide1.webp"), alt: "Баннер с галогенной лампой", ratio: "3/4" },
      { src: img("stroy-m", "catalog.webp"), alt: "Каталог с фильтром" },
    ],
    galleryNote: "",
    services: [],
    need: "Магазин",
  },
  {
    // Своя страница (components/case/kavkazstore), карточки на главной нет: поля рассказа только ради типа.
    slug: "kavkazstore",
    showcase: true,
    title: "Магазин «Кавказские умельцы»",
    unlisted: true,
    summary:
      "Интернет-магазин кавказских сувениров и подарков: витрина, каталог с фильтрами, карточка товара и версия для телефона.",
    task: "Интернет-магазин кавказских сувениров и подарков.",
    before: [],
    beforeImage: { src: img("kavkazstore", "showcase.webp"), alt: "Витрина на главной" },
    solution: [],
    gallery: [
      { src: img("kavkazstore", "phone-home.webp"), alt: "Витрина на телефоне", ratio: "3/4" },
      { src: img("kavkazstore", "product.webp"), alt: "Карточка товара" },
    ],
    galleryNote: "",
    services: [],
    need: "Магазин",
  },
  {
    // Своя страница (components/case/globaldrive-portal), карточки на главной нет: поля рассказа только ради типа.
    slug: "globaldrive-portal",
    showcase: true,
    title: "Корпоративный портал Globaldrive",
    unlisted: true,
    summary:
      "Личный кабинет сотрудника: меню портала, карточка, тесты, график работы, посещаемость и продажи.",
    task: "Корпоративный портал сотрудников Globaldrive.",
    before: [],
    beforeImage: {
      src: img("globaldrive-portal", "tests.webp"),
      alt: "Вкладка результатов тестов",
    },
    solution: [],
    gallery: [
      { src: img("globaldrive-portal", "phone.webp"), alt: "Портал на телефоне", ratio: "3/4" },
      { src: img("globaldrive-portal", "schedule.webp"), alt: "График работы" },
    ],
    galleryNote: "",
    services: [],
    need: "Другое",
  },
  {
    // Своя страница (components/case/arm), карточки на главной нет: поля рассказа только ради типа.
    slug: "arm",
    showcase: true,
    title: "АРМ сценариста Ситуационного центра Москвы",
    unlisted: true,
    summary:
      "Автоматизированное рабочее место сценариста в Ситуационном центре Москвы (Инцидент-центре): экраны зала, шаблоны раскладок и сценарий на ленте времени.",
    task: "Рабочее место для подготовки сценария мероприятия в Ситуационном центре Москвы.",
    before: [],
    beforeImage: { src: img("arm", "stage.webp"), alt: "Схема зала" },
    solution: [],
    gallery: [
      { src: img("arm", "modal.webp"), alt: "Окно содержимого экрана", ratio: "3/4" },
      { src: img("arm", "timeline.webp"), alt: "Лента времени" },
    ],
    galleryNote: "",
    services: [],
    need: "Другое",
  },
  {
    // Своя страница (components/case/arm-listener), карточки на главной нет: поля рассказа только ради типа.
    slug: "arm-listener",
    showcase: true,
    title: "АРМ слушателя Ситуационного центра Москвы",
    unlisted: true,
    summary:
      "Автоматизированное рабочее место участника заседаний в Ситуационном центре Москвы (Инцидент-центре): экран со слайдами, повестка, материалы и рассадка.",
    task: "Рабочее место участника заседаний в Ситуационном центре Москвы.",
    before: [],
    beforeImage: { src: img("arm-listener", "main.webp"), alt: "Экран заседания" },
    solution: [],
    gallery: [
      { src: img("arm-listener", "menu.webp"), alt: "Меню", ratio: "3/4" },
      { src: img("arm-listener", "materials.webp"), alt: "Материалы" },
    ],
    galleryNote: "",
    services: [],
    need: "Другое",
  },
  {
    // Своя страница (components/case/check-please), карточки на главной нет: поля рассказа только ради типа.
    slug: "check-please",
    showcase: true,
    title: "Приложение «Чек плиз»",
    unlisted: true,
    summary:
      "Приложение для заказа в кафе: на стол или самому забрать, меню, опции блюда, заказ и его статусы.",
    task: "Приложение для заказа в кафе.",
    before: [],
    beforeImage: { src: img("check-please", "new.webp"), alt: "Экран «Новый заказ»" },
    solution: [],
    gallery: [
      { src: img("check-please", "menu.webp"), alt: "Меню", ratio: "3/4" },
      { src: img("check-please", "status.webp"), alt: "Статус заказа" },
    ],
    galleryNote: "",
    services: [],
    need: "Приложение",
  },
  {
    // Своя страница (components/case/kanban), карточки на главной нет: поля рассказа только ради типа.
    slug: "kanban",
    showcase: true,
    title: "Таск-трекер Shortcut",
    unlisted: true,
    summary:
      "Сервис для работы над задачами в команде: доска, таймлайн, список и страница задачи, на компьютере и на телефоне.",
    task: "Сервис для работы над задачами в команде.",
    before: [],
    beforeImage: { src: img("kanban", "board.webp"), alt: "Доска задач" },
    solution: [],
    gallery: [
      { src: img("kanban", "phone-board.webp"), alt: "Доска на телефоне", ratio: "3/4" },
      { src: img("kanban", "timeline.webp"), alt: "Таймлайн" },
    ],
    galleryNote: "",
    services: [],
    need: "Приложение",
  },
  {
    // Своя страница (components/case/gbz), карточки на главной нет: поля рассказа только ради типа.
    slug: "gbz",
    showcase: true,
    title: "Городская база знаний Ситуационного центра Москвы",
    unlisted: true,
    summary:
      "Медиабанк Ситуационного центра Москвы (Инцидент-центра): альбомы, файлы, фильтр и загрузка новых материалов.",
    task: "Медиабанк Ситуационного центра города Москвы: фото и видео города в альбомах.",
    before: [],
    beforeImage: { src: img("gbz", "albums.webp"), alt: "Альбомы медиабанка" },
    solution: [],
    gallery: [
      { src: img("gbz", "hover.webp"), alt: "Плитка файла", ratio: "3/4" },
      { src: img("gbz", "page.webp"), alt: "Страница медиабанка" },
    ],
    galleryNote: "",
    services: [],
    need: "Другое",
  },
  {
    // Своя страница (components/case/sc-system), карточки на главной нет: поля рассказа только ради типа.
    slug: "sc-system",
    showcase: true,
    title: "Система Ситуационного центра Москвы",
    unlisted: true,
    summary:
      "Единая система Ситуационного центра Москвы (Инцидент-центра): сайт, заявки, бронирование залов, календарь и подготовка мероприятий.",
    task: "Единая система Ситуационного центра города Москвы: сайт, заявки, бронирование, календарь и мероприятия.",
    before: [],
    beforeImage: { src: img("sc-system", "table.webp"), alt: "Таблица заявок" },
    solution: [],
    gallery: [
      { src: img("sc-system", "site-m.webp"), alt: "Сайт на телефоне", ratio: "3/4" },
      { src: img("sc-system", "calendar.webp"), alt: "Календарь мероприятий" },
    ],
    galleryNote: "",
    services: [],
    need: "Другое",
  },
  {
    // Своя страница (components/case/dmcloud), карточки на главной нет: поля рассказа только ради типа.
    slug: "dmcloud",
    showcase: true,
    title: "Контроль качества DMCloud",
    unlisted: true,
    summary:
      "Веб-сервис для контроля качества в промышленности: сравнение плановой модели с результатом сканирования, отклонения цветом и допуски.",
    task: "Веб-сервис для контроля качества в промышленности: план, факт и допуски.",
    before: [],
    beforeImage: { src: img("dmcloud", "main.webp"), alt: "Экран сравнения" },
    solution: [],
    gallery: [
      { src: img("dmcloud", "props.webp"), alt: "Панель свойств", ratio: "3/4" },
      { src: img("dmcloud", "align.webp"), alt: "Автовыравнивание" },
    ],
    galleryNote: "",
    services: [],
    need: "Другое",
  },
  {
    // Своя страница (components/case/gameclub), карточки на главной нет: поля рассказа только ради типа.
    slug: "gameclub",
    showcase: true,
    title: "Система для игровых клубов GameClub",
    unlisted: true,
    summary:
      "Сеансы, бар, брони и отчёты для клубов с PlayStation и Xbox. Наш продукт: сайт, панель оператора, кабинет владельца и приложение для гостей.",
    url: "https://gmclb.ru",
    task: "Наш продукт для игровых клубов: учёт сеансов, бар, брони и отчёты.",
    before: [],
    beforeImage: { src: img("gameclub", "tiles.webp"), alt: "Плитки кабинок в панели оператора" },
    solution: [],
    gallery: [
      { src: img("gameclub", "club.webp"), alt: "Страница клуба на телефоне", ratio: "3/4" },
      { src: img("gameclub", "reports.webp"), alt: "Отчёт за день" },
    ],
    galleryNote: "",
    services: [],
    need: "Другое",
  },
];

export const caseBySlug = (slug: string) => CASES.find((c) => c.slug === slug) ?? null;

export function nextCase(slug: string): CaseData {
  const round = CASES.filter((c) => !c.unlisted || c.slug === slug);
  const i = round.findIndex((c) => c.slug === slug);
  return round[(i + 1) % round.length];
}
