// Этапы Сцены 4 и раскладка скролла по ним — единственное место, где q (прогресс секции)
// превращается в «этап + прогресс внутри него». Им пользуются и DOM (точка, подписи),
// и шейдер (через Scene4R3F).

// Характер чернил в переходе — ветка в шейдере (uTr.mode). Один материал, разное поведение.
export const MODE = {
  generic: 0, // просто тает и собирается
  streams: 1, // растекается тремя руслами, среднее несёт чернила дальше
  tension: 2, // поверхностное натяжение: гладкая капля, из неё лепится слово
  crystal: 3, // замерзает в решётку, слово складывается блоками слева направо
  updraft: 4, // восходящий поток; после удержания — стяжка в каплю и взлёт
} as const;

// Переход к слову: как оно собирается из облака, в которое растаяло прошлое.
// Окна — доли отрезка этапа.
export type Transition = {
  mode: number; // MODE
  turb: number; // сила завихрений
  scale: number; // размер вихрей: больше — мельче
  drift: [number, number]; // снос течения (x, y вниз), единицы S за всё время потока
  bleed: number; // насколько буквы растекаются, единицы S
  seed: [number, number]; // сдвиг в поле шума: у каждого перехода свой рисунок
  dive: number; // наезд сквозь облако: на столько вырастает облако к пику поведения
  melt: [number, number]; // старое слово тает в облако
  beh: [number, number]; // поведение чернил (MODE) набирает силу и отыгрывает
  pull: [number, number]; // облако стягивается к новому слову (crystal: блоки встают)
  cond: [number, number]; // новое слово густеет до чёткого края
  finale: [number, number]; // updraft: стяжка в каплю и взлёт; у остальных — за отрезком
};

export type Stage = {
  word: string;
  line: string; // строка подписи под словом
  vh: number; // длина отрезка в vh скролла
  into?: Transition; // переход к этому слову (у первого — капля и удар)
};

const NEVER: [number, number] = [2, 3];

// Первый отрезок — шаг 1 как есть: капля, рябь, облако, «Бриф» (q этапа 0..1).
// Дальше — переход: удержание прошлого слова с подписью, таяние, поведение, сборка,
// удержание. Последний отрезок длиннее: после удержания «Запуска» — финал сцены.
export const STAGES: Stage[] = [
  { word: "Бриф", line: "Из хаоса чернил — к ясной задаче", vh: 250 },
  {
    word: "Стратегия",
    line: "Выбираем, куда и как идём",
    vh: 170,
    into: {
      mode: MODE.streams,
      turb: 0.3,
      scale: 1.3,
      drift: [0, 0],
      bleed: 0.04,
      seed: [3.1, 7.7],
      dive: 0.12,
      melt: [0.1, 0.42],
      beh: [0.2, 0.62],
      pull: [0.46, 0.74],
      cond: [0.6, 0.85],
      finale: NEVER,
    },
  },
  {
    word: "Дизайн",
    line: "Находим форму и характер",
    vh: 170,
    into: {
      mode: MODE.tension,
      turb: 0.35,
      scale: 1.2,
      drift: [0, 0],
      bleed: 0.04,
      seed: [11.3, -4.2],
      dive: 0.1,
      melt: [0.1, 0.4],
      beh: [0.22, 0.5],
      pull: [0.3, 0.55],
      cond: [0.55, 0.85],
      finale: NEVER,
    },
  },
  {
    word: "Разработка",
    line: "Собираем продукт по кирпичику",
    vh: 170,
    into: {
      mode: MODE.crystal,
      turb: 0.4,
      scale: 1.3,
      drift: [0, 0],
      bleed: 0.05,
      seed: [-6.5, 9.4],
      dive: 0.12,
      melt: [0.1, 0.4],
      beh: [0.28, 0.5],
      pull: [0.44, 0.76],
      cond: [0.74, 0.85],
      finale: NEVER,
    },
  },
  {
    word: "Запуск",
    line: "Выпускаем и ведём дальше",
    vh: 250,
    // Переход — в первых ~170vh отрезка (окна ×0.68), дальше удержание и финал.
    into: {
      mode: MODE.updraft,
      turb: 0.45,
      scale: 1.2,
      drift: [0, -0.1],
      bleed: 0.05,
      seed: [8.8, 2.6],
      dive: 0.15,
      melt: [0.07, 0.3],
      beh: [0.12, 0.42],
      pull: [0.28, 0.5],
      cond: [0.4, 0.58],
      finale: [0.76, 1],
    },
  },
];

// Высота секции в vh = сумма отрезков.
export const TOTAL_VH = STAGES.reduce((sum, s) => sum + s.vh, 0);

// Этап 1 (доли его q): капля касается воды — дальше эстафету берут чернила.
export const IMPACT_Q = 0.12;
export const IMPACT_Y = 0.58; // точка удара по вертикали, доля высоты экрана (x — центр)
export const DROP_FADE = 0.012; // за столько q этапа CSS-точка гаснет поверх ядра чернил

// Подпись этапа видна, пока его слово собрано: проявляется, когда оно стало чётким,
// и гаснет перед таянием (или финалом).
const FIRST_FORMED = 0.85; // этап 1: COND_END в шейдере
const CAPTION_FADE = 0.08;

const STARTS = STAGES.map((_, i) => STAGES.slice(0, i).reduce((sum, s) => sum + s.vh, 0));

// q секции → этап и прогресс внутри его отрезка.
export function stageAt(q: number): { index: number; local: number } {
  const vh = q * TOTAL_VH;
  let index = 0;
  while (index < STAGES.length - 1 && vh >= STARTS[index + 1]) index++;
  return { index, local: Math.max(0, Math.min(1, (vh - STARTS[index]) / STAGES[index].vh)) };
}

// Доля отрезка, с которой слово этапа собрано.
function formedAt(i: number): number {
  return STAGES[i].into?.cond[1] ?? FIRST_FORMED;
}

// q секции, на котором слово этапа уже собрано и подписано (для reduced motion).
export function formedQ(index: number): number {
  return (STARTS[index] + STAGES[index].vh * (formedAt(index) + 0.05)) / TOTAL_VH;
}

// Непрозрачность подписи этапа i при текущем положении скролла.
export function captionOpacity(i: number, index: number, local: number): number {
  const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
  const out = STAGES[i].into?.finale[0] ?? 2; // свой финал — подпись гаснет перед ним
  if (index === i) {
    return Math.min(
      clamp01((local - formedAt(i)) / CAPTION_FADE),
      clamp01((out - local) / CAPTION_FADE),
    );
  }
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

// Облако перехода от слова a к слову b: во сколько раз оно растягивается (не шире
// CLOUD_MAX_W экрана) и насколько раздуто новое слово в облачной фазе (единицы S;
// у широких слов меньше — по бокам остаётся воздух).
const CLOUD_MAX_W = 0.7;
const DILATE = 0.16;
export function cloudFrame(a: number, b: number, w: number, h: number) {
  const fa = wordFit(STAGES[a].word, w, h);
  const fb = wordFit(STAGES[b].word, w, h);
  const S = Math.min(h, w * 0.625); // как unitS() в шейдере
  const stretchX = Math.min(fb.width, CLOUD_MAX_W * w) / fa.width;
  const dilate = Math.max(0.05, Math.min(DILATE, (0.46 * w - fb.width / 2) / S));
  return { stretch: [stretchX, fb.size / fa.size] as const, dilate };
}
