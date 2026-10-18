// Этапы Сцены 4 и раскладка скролла по ним — единственное место, где q (прогресс секции)
// превращается в «этап + прогресс внутри него». Им пользуются и DOM (точка, подписи),
// и шейдер (через Scene4R3F).

// Переход к слову: как оно собирается из облака, в которое растаяло прошлое. Шаг 3 даст
// каждому переходу свой характер — это просто другие числа (и, если нужно, новые поля).
export type Transition = {
  turb: number; // сила завихрений
  scale: number; // размер вихрей: больше — мельче
  drift: [number, number]; // снос течения (x, y вниз), единицы S за всё время потока
  bleed: number; // насколько буквы растекаются, единицы S
  seed: [number, number]; // сдвиг в поле шума: у каждого перехода свой рисунок
  melt: [number, number]; // старое слово тает в облако (доли отрезка)
  pull: [number, number]; // облако стягивается к новому слову, в нём проступают буквы
  cond: [number, number]; // новое слово густеет до чёткого края
};

export type Stage = {
  word: string;
  line: string; // строка подписи под словом
  vh: number; // длина отрезка в vh скролла
  into?: Transition; // переход к этому слову (у первого — капля и удар)
};

const GENERIC: Omit<Transition, "seed"> = {
  turb: 0.4,
  scale: 1.3,
  drift: [0, 0],
  bleed: 0.05,
  melt: [0.1, 0.5],
  pull: [0.4, 0.72],
  cond: [0.58, 0.85],
};

// Первый отрезок — шаг 1 как есть: капля, рябь, облако, «Бриф» (q этапа 0..1).
// Дальше — переход: удержание прошлого слова с подписью, таяние, облако, сборка, удержание.
export const STAGES: Stage[] = [
  { word: "Бриф", line: "Из хаоса чернил — к ясной задаче", vh: 250 },
  // Шаг 3: потоки делятся на каналы.
  {
    word: "Стратегия",
    line: "Выбираем, куда и как идём",
    vh: 170,
    into: { ...GENERIC, seed: [3.1, 7.7] },
  },
  // Шаг 3: поверхностное натяжение стягивает в чёткую форму.
  {
    word: "Дизайн",
    line: "Находим форму и характер",
    vh: 170,
    into: { ...GENERIC, seed: [11.3, -4.2] },
  },
  // Шаг 3: кристаллизация в сетку.
  {
    word: "Разработка",
    line: "Собираем продукт по кирпичику",
    vh: 170,
    into: { ...GENERIC, seed: [-6.5, 9.4] },
  },
  // Шаг 3: в конце все чернила втягиваются в одну каплю, и она стартует вверх.
  {
    word: "Запуск",
    line: "Выпускаем и ведём дальше",
    vh: 200,
    into: { ...GENERIC, seed: [8.8, 2.6] },
  },
];

// Высота секции в vh = сумма отрезков.
export const TOTAL_VH = STAGES.reduce((sum, s) => sum + s.vh, 0);

// Этап 1 (доли его q): капля касается воды — дальше эстафету берут чернила.
export const IMPACT_Q = 0.12;
export const IMPACT_Y = 0.58; // точка удара по вертикали, доля высоты экрана (x — центр)
export const DROP_FADE = 0.012; // за столько q этапа CSS-точка гаснет поверх ядра чернил

// Подпись этапа видна, пока его слово собрано: проявляется, когда оно стало чётким,
// и гаснет перед таянием в следующем отрезке.
const CAPTION_IN = 0.85; // = конец сборки (COND_END этапа 1, cond[1] переходов)
const CAPTION_FADE = 0.08;

const STARTS = STAGES.map((_, i) => STAGES.slice(0, i).reduce((sum, s) => sum + s.vh, 0));

// q секции → этап и прогресс внутри его отрезка.
export function stageAt(q: number): { index: number; local: number } {
  const vh = q * TOTAL_VH;
  let index = 0;
  while (index < STAGES.length - 1 && vh >= STARTS[index + 1]) index++;
  return { index, local: Math.max(0, Math.min(1, (vh - STARTS[index]) / STAGES[index].vh)) };
}

// q секции, на котором слово этапа уже собрано и подписано (для reduced motion).
export function formedQ(index: number): number {
  return (STARTS[index] + STAGES[index].vh * 0.99) / TOTAL_VH;
}

// Непрозрачность подписи этапа i при текущем положении скролла.
export function captionOpacity(i: number, index: number, local: number): number {
  const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
  if (index === i) return clamp01((local - CAPTION_IN) / CAPTION_FADE);
  const melt0 = STAGES[i + 1]?.into?.melt[0];
  if (index === i + 1 && melt0 !== undefined) return clamp01((melt0 - local) / CAPTION_FADE);
  return 0;
}

// Слово: шрифт сайта, у всех один кегль (WORD_VW ширины, но не больше WORD_VH высоты);
// длинное ужимается, чтобы влезть в WORD_MAX_W ширины экрана.
export const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
export const LETTER_SPACING = -0.02; // em
const WORD_VW = 0.2;
const WORD_VH = 0.36;
const WORD_MAX_W = 0.8;

// Ширина слова в em — так же, как его рисует generateTextSDF: по буквам, с трекингом.
const advances = new Map<string, number>();
function advanceEm(word: string): number {
  let em = advances.get(word);
  if (em === undefined) {
    const ctx = document.createElement("canvas").getContext("2d");
    if (!ctx) return 3;
    ctx.font = `500 100px ${FONT}`;
    em = LETTER_SPACING * ([...word].length - 1);
    for (const ch of word) em += ctx.measureText(ch).width / 100;
    advances.set(word, em);
  }
  return em;
}

// Кегль слова этапа и его ширина, CSS px.
export function wordFit(word: string, w: number, h: number): { size: number; width: number } {
  const em = advanceEm(word);
  const size = Math.min(WORD_VW * w, WORD_VH * h, (WORD_MAX_W * w) / em);
  return { size, width: size * em };
}
