import type { CSSProperties, ReactNode } from "react";

// Элементы вокруг пунктов Сцены 2 — по три на пункт, в стиле картинок первого экрана
// (public/assets/hero): плоско, пастель пункта (currentColor), чёрное и белое, рамки 1.5,
// скругления 4–6. Декор не должен выглядеть нажимаемым: без кнопок, полей ввода и призывов.
// Координаты viewBox — пиксели при ширине 1440; размер — в em слоя (.art).
// Место (slot) — вокруг текста, см. Scene2.module.css; phone: false — не показывать на телефоне.
// Слот gap — значки в промежутках между услугами, только на телефоне до 767px (GAP в конце файла);
// sync — качаться одной фазой с элементом номер sync того же пункта.
export type Slot = "topOut" | "out" | "bottom" | "in" | "gap";
export type Art = {
  slot: Slot;
  el: ReactNode;
  phone?: false;
  style?: CSSProperties;
  sync?: number;
};

const K = "#0a0a0a";
const G = { fill: K, fillOpacity: 0.16 };
const line = { stroke: K, strokeWidth: 1.5 };

// no-invert (globals.css): на втором круге (перевёрнутая палитра) элементы — в своих цветах,
// как картинки; переворачиваются только текст, трасса и фон. k — масштаб без перерисовки.
function Svg({ w, h, k = 1, children }: { w: number; h: number; k?: number; children: ReactNode }) {
  return (
    <svg
      className="no-invert"
      width={`${(w * k) / 10}em`}
      height={`${(h * k) / 10}em`}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function Label({
  x,
  y,
  size = 12,
  fill = K,
  anchor = "middle",
  children,
}: {
  x: number;
  y: number;
  size?: number;
  fill?: string;
  anchor?: "start" | "middle";
  children: string;
}) {
  return (
    <text x={x} y={y} fontSize={size} fontWeight={500} fill={fill} textAnchor={anchor}>
      {children}
    </text>
  );
}

const Cursor = () => (
  <Svg w={20} h={26}>
    <path
      d="M2.5 2.5v19l5-4.6 3.4 7.4 3.4-1.5-3.4-7.3h6.6z"
      fill={K}
      stroke="#fff"
      strokeWidth={1.5}
      strokeLinejoin="round"
    />
  </Svg>
);

// Круглая иконка: фон и содержимое (обводка 1.8 — как у иконок, читается в 44px).
const Round = ({ bg, children }: { bg: string; children: ReactNode }) => (
  <Svg w={44} h={44}>
    <circle cx={22} cy={22} r={21.25} fill={bg} stroke={K} strokeWidth={1.5} />
    {children}
  </Svg>
);

const Swatches = ({ column }: { column?: boolean }) => {
  const fills = ["currentColor", K, "#fff", "currentColor"];
  const n = column ? 3 : 4;
  return (
    <Svg w={column ? 22 : 92} h={column ? 70 : 22}>
      {fills.slice(0, n).map((fill, i) => {
        const x = column ? 11 : 11 + i * 23.3;
        const y = column ? 11 + i * 24 : 11;
        return column ? (
          <circle key={x + y} cx={x} cy={y} r={10.25} fill={fill} stroke={K} strokeWidth={1.5} />
        ) : (
          <rect
            key={x}
            x={x - 10.25}
            y={y - 10.25}
            width={20.5}
            height={20.5}
            rx={4}
            fill={fill}
            stroke={K}
            strokeWidth={1.5}
            fillOpacity={i === 3 ? 0.45 : 1}
          />
        );
      })}
    </Svg>
  );
};

export const ART: Art[][] = [
  // 1. Сайты под ключ: окно браузера, курсор у его угла, макет блока сайта
  [
    {
      slot: "topOut",
      el: (
        <Svg w={100} h={74}>
          <rect x={0.75} y={0.75} width={98.5} height={72.5} rx={6} fill="#fff" {...line} />
          <circle cx={9} cy={9} r={2.2} fill={K} />
          <circle cx={16} cy={9} r={2.2} {...G} />
          <circle cx={23} cy={9} r={2.2} {...G} />
          <path d="M.75 17.25h98.5" {...line} />
          <rect x={9} y={25} width={82} height={22} rx={4} fill="currentColor" />
          <rect x={9} y={54} width={50} height={5} rx={2.5} fill={K} />
          <rect x={9} y={63} width={32} height={4} rx={2} {...G} />
        </Svg>
      ),
    },
    {
      slot: "out",
      el: <Cursor />,
      style: { top: "-3.8em", left: "calc(100% + 1.2em)" },
      phone: false,
    },
    {
      slot: "in",
      phone: false,
      el: (
        <Svg w={100} h={52}>
          <rect width={100} height={52} rx={6} fill="currentColor" />
          <rect x={11} y={12} width={54} height={7} rx={3.5} fill={K} />
          <rect x={11} y={27} width={74} height={3.5} rx={1.75} {...G} />
          <rect x={11} y={36} width={50} height={3.5} rx={1.75} {...G} />
        </Svg>
      ),
    },
  ],
  // 2. Интернет-магазины: карточка товара, корзина, ценник
  [
    {
      slot: "out",
      el: (
        <Svg w={74} h={94}>
          <rect width={74} height={94} rx={6} fill="currentColor" />
          <circle cx={37} cy={35} r={21} fill="#fff" />
          <rect x={11} y={65} width={40} height={5} rx={2.5} {...G} />
          <Label x={11} y={86} anchor="start">
            2 490 ₽
          </Label>
        </Svg>
      ),
    },
    {
      slot: "bottom",
      el: (
        <Svg w={80} h={32}>
          <path
            d="M11 .75h65.25a3 3 0 0 1 3 3v24.5a3 3 0 0 1-3 3H11L.75 16z"
            fill="#fff"
            {...line}
            strokeLinejoin="round"
          />
          <circle cx={12} cy={16} r={2.3} fill={K} />
          <Label x={47} y={20.5}>
            2 490 ₽
          </Label>
        </Svg>
      ),
    },
    {
      slot: "in",
      el: (
        <Round bg="currentColor">
          <path
            d="M11.5 13h4l3.6 14.5h12.4l3-10.3H17"
            fill="none"
            stroke={K}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx={20.5} cy={32} r={1.9} fill={K} />
          <circle cx={29.5} cy={32} r={1.9} fill={K} />
        </Round>
      ),
      phone: false,
    },
  ],
  // 3. Продуктовая аналитика: стикер, столбики, поиск
  [
    {
      slot: "topOut",
      el: (
        <Svg w={64} h={64}>
          <g transform="rotate(-6 32 32)">
            <rect x={7} y={7} width={50} height={50} rx={4} fill="currentColor" />
            <rect x={15} y={19} width={30} height={4} rx={2} fill={K} />
            <rect x={15} y={29} width={34} height={4} rx={2} {...G} />
            <rect x={15} y={39} width={22} height={4} rx={2} {...G} />
          </g>
        </Svg>
      ),
    },
    {
      slot: "out",
      el: (
        <Round bg={K}>
          <circle cx={20} cy={20} r={7.5} fill="none" stroke="#fff" strokeWidth={2} />
          <path d="M25.5 25.5l6 6" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" />
        </Round>
      ),
      phone: false,
    },
    {
      slot: "in",
      phone: false,
      el: (
        <Svg w={86} h={62}>
          <rect x={0.75} y={0.75} width={84.5} height={60.5} rx={6} fill="#fff" {...line} />
          <rect x={12} y={34} width={11} height={16} rx={2} fill="currentColor" />
          <rect x={28} y={24} width={11} height={26} rx={2} fill="currentColor" />
          <rect x={44} y={29} width={11} height={21} rx={2} fill="currentColor" />
          <rect x={60} y={13} width={11} height={37} rx={2} fill={K} />
        </Svg>
      ),
    },
  ],
  // 4. UX/UI-дизайн: рамка выделения, курсор, образцы цветов
  [
    {
      slot: "out",
      el: (
        <Svg w={92} h={66}>
          <rect x={11} y={11} width={70} height={44} rx={4} fill="currentColor" />
          <rect x={5} y={5} width={82} height={56} fill="none" {...line} />
          {[
            [5, 5],
            [87, 5],
            [5, 61],
            [87, 61],
          ].map(([x, y]) => (
            <rect
              key={x * 100 + y}
              x={x - 3.5}
              y={y - 3.5}
              width={7}
              height={7}
              fill="#fff"
              {...line}
            />
          ))}
        </Svg>
      ),
    },
    { slot: "bottom", el: <Swatches /> },
    { slot: "in", el: <Cursor />, phone: false },
  ],
  // 5. Брендинг: знак, «Aa», образцы цветов
  [
    {
      slot: "topOut",
      el: (
        <Svg w={54} h={54}>
          <rect width={54} height={54} rx={6} fill={K} />
          <text x={27} y={37.5} fontSize={29} fontWeight={600} fill="#fff" textAnchor="middle">
            W
          </text>
        </Svg>
      ),
    },
    { slot: "out", el: <Swatches column />, phone: false },
    {
      slot: "in",
      phone: false,
      el: (
        <Svg w={72} h={66}>
          <rect width={72} height={66} rx={6} fill="currentColor" />
          <text x={11} y={38} fontSize={27} fontWeight={500} fill={K}>
            Aa
          </text>
          <rect x={11} y={49} width={30} height={4} rx={2} {...G} />
        </Svg>
      ),
    },
  ],
  // 6. Мобильные приложения и Telegram Mini App: телефон, Telegram, облачко
  [
    {
      slot: "out",
      el: (
        <Svg w={46} h={84}>
          <rect x={0.75} y={0.75} width={44.5} height={82.5} rx={9} fill="#fff" {...line} />
          <rect x={5.5} y={12} width={35} height={60} rx={3} fill="currentColor" />
          <rect x={17} y={5.5} width={12} height={3} rx={1.5} fill={K} />
          <rect x={11} y={20} width={20} height={4} rx={2} fill={K} />
          <rect x={11} y={29} width={14} height={4} rx={2} fill="#fff" />
        </Svg>
      ),
    },
    {
      slot: "in",
      el: (
        <Round bg={K}>
          <path
            d="M11.5 21.3 31.3 13.6c.9-.35 1.7.25 1.45 1.3l-3.3 15.6c-.25 1.05-.9 1.3-1.8.8l-5-3.7-2.4 2.3c-.3.3-.55.5-1.05.5l.35-5.1 9.2-8.3c.4-.36-.1-.56-.6-.2l-11.4 7.2-4.9-1.55c-1.05-.33-1.07-1.06.25-1.55z"
            fill="#fff"
          />
        </Round>
      ),
      phone: false,
    },
    {
      slot: "bottom",
      phone: false,
      el: (
        <Svg w={92} h={40}>
          <path
            d="M17 0h58a17 17 0 0 1 0 34H22l-9 6 1.5-6.2A17 17 0 0 1 17 0z"
            fill="currentColor"
          />
          <Label x={46} y={21.5}>
            Mini App
          </Label>
        </Svg>
      ),
    },
  ],
  // 7. ИИ и автоматизация: чат-бот, искра, схема из трёх узлов
  [
    {
      slot: "topOut",
      el: (
        <Svg w={124} h={42}>
          <path
            d="M17 .75h90a16.25 16.25 0 0 1 0 32.5H24l-9.5 7.5 1.6-7.6A16.25 16.25 0 0 1 17 .75z"
            fill="#fff"
            {...line}
            strokeLinejoin="round"
          />
          <circle cx={17} cy={17} r={4} fill={K} />
          <Label x={28} y={21.5} anchor="start">
            Чем помочь?
          </Label>
        </Svg>
      ),
    },
    {
      slot: "out",
      el: (
        <Svg w={28} h={28}>
          <path
            d="M14 0c1 8.6 5.4 13 14 14-8.6 1-13 5.4-14 14-1-8.6-5.4-13-14-14 8.6-1 13-5.4 14-14z"
            fill={K}
          />
        </Svg>
      ),
      phone: false,
    },
    {
      slot: "in",
      phone: false,
      el: (
        <Svg w={116} h={26}>
          <path d="M34 13h12M80 13h22" {...line} />
          <rect width={34} height={26} rx={4} fill="currentColor" />
          <rect x={46.75} y={0.75} width={32.5} height={24.5} rx={4} fill="#fff" {...line} />
          <circle cx={108} cy={13} r={6} fill={K} />
        </Svg>
      ),
    },
  ],
  // 8. Поддержка, развитие и SEO: результат поиска, растущий график, шестерёнка
  [
    {
      slot: "out",
      el: (
        <Svg w={132} h={54}>
          <rect x={0.75} y={0.75} width={130.5} height={52.5} rx={6} fill="#fff" {...line} />
          <circle cx={17} cy={17} r={7} fill="currentColor" {...line} />
          <text x={17} y={20.5} fontSize={10} fontWeight={600} fill={K} textAnchor="middle">
            1
          </text>
          <rect x={31} y={13.5} width={62} height={7} rx={3.5} fill={K} />
          <rect x={31} y={26} width={44} height={3} rx={1.5} fill={K} fillOpacity={0.35} />
          <rect x={11} y={37} width={98} height={4} rx={2} {...G} />
        </Svg>
      ),
    },
    {
      slot: "bottom",
      phone: false,
      el: (
        <Svg w={86} h={62}>
          <rect width={86} height={62} rx={6} fill="currentColor" />
          <path
            d="M13 48l17-13 13 7 25-23"
            fill="none"
            stroke={K}
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx={68} cy={19} r={4} fill={K} />
        </Svg>
      ),
    },
    {
      slot: "in",
      el: (
        <Round bg="#fff">
          <circle
            cx={22}
            cy={22}
            r={10.5}
            fill="none"
            stroke={K}
            strokeWidth={4}
            strokeDasharray="3.3 4.95"
          />
          <circle cx={22} cy={22} r={8} fill="currentColor" stroke={K} strokeWidth={2.2} />
          <circle cx={22} cy={22} r={2.6} fill={K} />
        </Round>
      ),
      phone: false,
    },
  ],
];

// ---------- Значки в промежутках между услугами (только телефон, слот gap) ----------
// Три размера при слое 7px: S 24px — метки и наклейки, M 44px — круги и плитки, L 80–88px —
// карточки. Стоят группами внахлёст: внутри пары — у правого края колонки; в переходе между
// парами — под верхней парой, вместе с её нынешним элементом, пока трасса ещё у своего края
// (над следующей парой, где трасса подходит, — пауза). Наклон — только у наклеек S.

// Пастель соседней услуги, о которой значок, — как --accent пунктов в Scene2.module.css.
const PEACH = "#f7dccb";
const MINT = "#d3ebdd";
const LILAC = "#dddaf5";
const CREAM = "#f4ebc3";

// Круг M: рисунок — в сетке 44, как у Round.
const Disc = ({ bg, children }: { bg: string; children: ReactNode }) => (
  <Svg w={60} h={60} k={1.05}>
    <circle cx={30} cy={30} r={29.25} fill={bg} {...line} />
    <g transform="scale(1.3636)">{children}</g>
  </Svg>
);

// Пятиконечная звезда отзыва.
const star = (cx: number, cy: number) =>
  Array.from({ length: 10 }, (_, k) => {
    const a = (Math.PI / 5) * k - Math.PI / 2;
    const r = k % 2 ? 3.2 : 7;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");

const ICON = {
  // S
  badge: (
    <Svg w={34} h={34}>
      <circle cx={17} cy={17} r={16.25} fill={K} />
      <text x={17} y={23} fontSize={17} fontWeight={600} fill="#fff" textAnchor="middle">
        1
      </text>
    </Svg>
  ),
  check: (
    <Svg w={34} h={34}>
      <circle cx={17} cy={17} r={16.25} fill="currentColor" {...line} />
      <path
        d="M10.5 17.5l4.5 4.5 8.5-9"
        fill="none"
        stroke={K}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  ),
  cursor: (
    <Svg w={26} h={34}>
      <path
        transform="scale(1.3)"
        d="M2.5 2.5v19l5-4.6 3.4 7.4 3.4-1.5-3.4-7.3h6.6z"
        fill={K}
        stroke="#fff"
        strokeWidth={1.15}
        strokeLinejoin="round"
      />
    </Svg>
  ),
  drop: (
    <Svg w={26} h={34}>
      <path
        d="M13 1.5S2.25 13.5 2.25 21.5a10.75 10.75 0 0 0 21.5 0C23.75 13.5 13 1.5 13 1.5z"
        fill="currentColor"
        {...line}
        strokeLinejoin="round"
      />
    </Svg>
  ),
  spark: (
    <Svg w={34} h={34}>
      <path
        d="M17 1.5c1 9.4 5.1 13.5 14.5 14.5C22.1 17 18 21.1 17 30.5 16 21.1 11.9 17 2.5 16 11.9 15 16 10.9 17 1.5z"
        fill={K}
      />
    </Svg>
  ),
  up: (
    <Svg w={34} h={34}>
      <circle cx={17} cy={17} r={16.25} fill="#fff" {...line} />
      <path
        d="M11 23l12-12M14.5 11H23v8.5"
        fill="none"
        stroke={K}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  ),
  // M
  cart: (
    <Disc bg="currentColor">
      <path
        d="M11.5 13h4l3.6 14.5h12.4l3-10.3H17"
        fill="none"
        stroke={K}
        strokeWidth={1.3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={20.5} cy={32} r={1.9} fill={K} />
      <circle cx={29.5} cy={32} r={1.9} fill={K} />
    </Disc>
  ),
  pie: (
    <Svg w={60} h={60} k={1.05}>
      <circle cx={30} cy={30} r={29.25} fill="#fff" {...line} />
      <path
        d="M30 30V.75A29.25 29.25 0 0 1 55.33 44.63z"
        fill="currentColor"
        {...line}
        strokeLinejoin="round"
      />
      <path d="M30 30L55.33 44.63A29.25 29.25 0 0 1 30 59.25z" fill={K} />
    </Svg>
  ),
  pen: (
    <Svg w={90} h={56}>
      <path d="M8 48C14 18 76 18 82 48" fill="none" {...line} />
      <path d="M23 18.5h44" {...line} />
      <circle cx={23} cy={18.5} r={3.5} fill="currentColor" {...line} />
      <circle cx={67} cy={18.5} r={3.5} fill="currentColor" {...line} />
      {[
        [41.5, 15],
        [4.5, 44.5],
        [78.5, 44.5],
      ].map(([x, y]) => (
        <rect key={x} x={x} y={y} width={7} height={7} fill="#fff" {...line} />
      ))}
    </Svg>
  ),
  type: (
    <Svg w={64} h={58}>
      <rect width={64} height={58} rx={6} fill="currentColor" />
      <Label x={10} y={34} size={24} anchor="start">
        Aa
      </Label>
      <rect x={10} y={43} width={28} height={4} rx={2} {...G} />
    </Svg>
  ),
  app: (
    <Svg w={62} h={62}>
      <rect x={0.75} y={0.75} width={60.5} height={60.5} rx={14} fill="currentColor" {...line} />
      <text x={31} y={41} fontSize={27} fontWeight={600} fill={K} textAnchor="middle">
        W
      </text>
    </Svg>
  ),
  bot: (
    <Disc bg="currentColor">
      <rect
        x={12.5}
        y={16}
        width={19}
        height={14}
        rx={4}
        fill="#fff"
        stroke={K}
        strokeWidth={1.1}
      />
      <circle cx={18.5} cy={23} r={1.7} fill={K} />
      <circle cx={25.5} cy={23} r={1.7} fill={K} />
      <path d="M22 16v-3.5" stroke={K} strokeWidth={1.1} strokeLinecap="round" />
      <circle cx={22} cy={11.5} r={1.5} fill={K} />
    </Disc>
  ),
  gear: (
    <Disc bg="#fff">
      <circle
        cx={22}
        cy={22}
        r={10.5}
        fill="none"
        stroke={K}
        strokeWidth={3}
        strokeDasharray="3.3 4.95"
      />
      <circle cx={22} cy={22} r={8} fill="currentColor" stroke={K} strokeWidth={1.6} />
      <circle cx={22} cy={22} r={2.6} fill={K} />
    </Disc>
  ),
  code: (
    <Svg w={70} h={54}>
      <rect width={70} height={54} rx={6} fill="currentColor" />
      <path
        d="M25 19l-9 8 9 8M45 19l9 8-9 8M38 15l-6 24"
        fill="none"
        stroke={K}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  ),
  // L
  rating: (
    <Svg w={120} h={44}>
      <rect x={0.75} y={0.75} width={118.5} height={42.5} rx={8} fill="#fff" {...line} />
      {[0, 1, 2, 3, 4].map((i) => (
        <polygon key={i} points={star(18 + i * 19, 17)} fill={i < 4 ? K : "currentColor"} />
      ))}
      <rect x={11} y={31} width={58} height={4} rx={2} {...G} />
    </Svg>
  ),
  kpi: (
    <Svg w={114} h={66}>
      <rect x={0.75} y={0.75} width={112.5} height={64.5} rx={8} fill="#fff" {...line} />
      <text x={14} y={33} fontSize={20} fontWeight={600} fill={K}>
        +24%
      </text>
      <path d="M90 28l7-8 7 8" fill="none" {...line} strokeLinecap="round" strokeLinejoin="round" />
      <rect x={14} y={45} width={86} height={7} rx={3.5} fill="currentColor" />
    </Svg>
  ),
  layout: (
    <Svg w={120} h={56}>
      <rect x={0.75} y={0.75} width={118.5} height={54.5} rx={8} fill="#fff" {...line} />
      <rect x={10} y={10} width={46} height={36} rx={4} fill="currentColor" />
      <rect x={64} y={10} width={46} height={15} rx={4} {...G} />
      <rect x={64} y={31} width={46} height={15} rx={4} {...G} />
    </Svg>
  ),
  note: (
    <Svg w={124} h={46}>
      <rect x={0.75} y={0.75} width={122.5} height={44.5} rx={10} fill="#fff" {...line} />
      <rect x={9} y={9} width={28} height={28} rx={7} fill="currentColor" />
      <rect x={45} y={13} width={56} height={5} rx={2.5} fill={K} />
      <rect x={45} y={26} width={40} height={4} rx={2} {...G} />
    </Svg>
  ),
};

// Место: t/b — px от нижнего/верхнего края блока (top/bottom: calc(100% + …)), l/r — px от края
// колонки в координатах слоя: у блоков слева слой отражён, «справа» на экране пишется как l,
// а наклон (turn) — с обратным знаком. sync — фаза покачивания группы (см. Art).
type At = { t?: number; b?: number; l?: number; r?: number; turn?: number };
const gap = (el: ReactNode, { t, b, l, r, turn }: At, sync: number, color?: string): Art => ({
  slot: "gap",
  el,
  sync,
  style: {
    top: t === undefined ? undefined : `calc(100% + ${t}px)`,
    bottom: b === undefined ? undefined : `calc(100% + ${b}px)`,
    left: l === undefined ? undefined : `${l}px`,
    right: r === undefined ? undefined : `${r}px`,
    rotate: turn ? `${turn}deg` : undefined,
    color,
  },
});

// В конец пунктов: номера нынешних элементов не меняются (по ним берёт элементы Сцена 5).
const GAP: [number, Art[]][] = [
  // Сайты → Магазины: отзыв, корзина и счётчик — под «Сайтами», у правого края
  [
    0,
    [
      gap(ICON.rating, { t: 1, r: 40 }, 3, MINT),
      gap(ICON.cart, { t: -8, r: 8 }, 3, MINT),
      gap(ICON.badge, { t: -14, r: 0 }, 3),
    ],
  ],
  // Магазины → Аналитика: под «Магазинами» к карточке товара (нынешней) слева — показатель
  // продаж и диаграмма, на её углу — наклейка «оплачено»
  [
    1,
    [
      gap(ICON.kpi, { t: 32, r: 40 }, 0, LILAC),
      gap(ICON.pie, { t: 33, r: 112 }, 0, LILAC),
      gap(ICON.check, { t: 12, r: 0, turn: -8 }, 0),
    ],
  ],
  // Аналитика → UX/UI: макет, кривая поверх него и курсор на её узле
  [
    2,
    [
      gap(ICON.layout, { t: -6, l: 40 }, 3, CREAM),
      gap(ICON.pen, { t: -6, l: 0 }, 3, CREAM),
      gap(ICON.cursor, { t: 7, l: 14 }, 3),
    ],
  ],
  // UX/UI → Брендинг: под «UX/UI» между рамкой и образцами (нынешними) — шрифт и капля цвета
  [
    3,
    [
      gap(ICON.type, { t: 26, r: 92 }, 0, PEACH),
      gap(ICON.drop, { t: 50, r: 128, turn: -10 }, 0, PEACH),
    ],
  ],
  // Брендинг → Приложения: уведомление, значок приложения и счётчик
  [
    4,
    [
      gap(ICON.note, { t: -2, r: 34 }, 3, MINT),
      gap(ICON.app, { t: -8, r: 6 }, 3, MINT),
      gap(ICON.badge, { t: -14, r: 0 }, 3),
    ],
  ],
  // Приложения → ИИ: под «Приложениями» к телефону (нынешнему) — бот и искра
  [5, [gap(ICON.bot, { t: 34, r: 24 }, 0, LILAC), gap(ICON.spark, { t: 22, r: 60 }, 0)]],
  // ИИ → Поддержка: код, шестерёнка и рост
  [
    6,
    [
      gap(ICON.code, { t: -5, l: 34 }, 3, CREAM),
      gap(ICON.gear, { t: -8, l: 0 }, 3, CREAM),
      gap(ICON.up, { t: -13, l: 70 }, 3),
    ],
  ],
];
for (const [i, arts] of GAP) ART[i].push(...arts);
