import type { CSSProperties, ReactNode } from "react";

// Элементы вокруг пунктов Сцены 2 — по три на пункт, в стиле картинок первого экрана
// (public/assets/hero): плоско, пастель пункта (currentColor), чёрное и белое, рамки 1.5,
// скругления 4–6. Декор не должен выглядеть нажимаемым: без кнопок, полей ввода и призывов.
// Координаты viewBox — пиксели при ширине 1440; размер — в em слоя (.art).
// Место (slot) — вокруг текста, см. Scene2.module.css; phone: false — не показывать на телефоне.
export type Slot = "topOut" | "out" | "bottom" | "in";
export type Art = { slot: Slot; el: ReactNode; phone?: false; style?: CSSProperties };

const K = "#0a0a0a";
const G = { fill: K, fillOpacity: 0.16 };
const line = { stroke: K, strokeWidth: 1.5 };

function Svg({ w, h, children }: { w: number; h: number; children: ReactNode }) {
  return (
    <svg width={`${w / 10}em`} height={`${h / 10}em`} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
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
