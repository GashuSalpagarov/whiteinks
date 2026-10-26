"use client";

import { useEffect, useRef } from "react";
import { dropRest } from "@/components/scenes/Scene3/Scene3";
import { phoneLayout } from "@/lib/phoneLayout";
import { phoneHold } from "@/lib/scroll/handoff";
import { onScroll, viewportH } from "@/lib/scroll/onScroll";
import { PathLine, paintLine, placeLine } from "./PathLine";
import styles from "./Scene4.module.css";
import { paintList, StageList } from "./StageList";
import {
  captionOn,
  captionRoll,
  dropAt,
  fanAt,
  growAt,
  N,
  PACE,
  PACE_TALL,
  type Pace,
  type Scene,
  STEPS,
  sceneAt,
  screensOf,
  TOTAL_SCREENS,
  TOTAL_TERM,
} from "./stages";

const DOT_R = 6; // px, радиус точки (как .drop в Hero, 12px)
const DOT_Y = 20; // дом точки — на 20px ниже центра экрана, как в Сценах 2 и 3
const START_SCALE = 0.04; // первая карточка растёт из точки от 4% размера, как в туннеле Сцены 3
const RISE = 20; // px, на столько ниже блок слева начинает всплывать
// Доля хода по стопке, за которую точка проходит под карточками — от просвета над стопкой до
// просвета под ней; остальное время она идёт по просветам и видна.
const DIVE = 0.12;
// Телефон: верх первой карточки веера — под шапкой, с запасом на углы раскрытого веера
// (на невысоком экране — 100px).
const TALL_TOP = 116;
const TALL_LIST = 20; // px, телефон: чек-лист от поля; дорога точки — между номерами и названиями
const TALL_BIG = 1.2; // текущая строка чек-листа крупнее во столько раз (--big в StageList.module.css)
const CATCH = 0.9; // доля экрана, на которой точку ловит Сцена 5 на телефоне (LOW в Scene5.tsx)
const META_SHIFT = 14; // px, сдвиг «делаем / получаете» при смене этапа на телефоне

// Точка входа — где Сцена 3 оставляет точку, когда отпускает свой sticky: место покоя под её
// сеткой (dropRest в Scene3.tsx — один источник для обеих сцен). Отсюда точка плывёт в центр
// первой карточки.
const entryPoint = (w: number, h: number) => dropRest(w, h);

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut = (t: number) => t * (2 - t);
const num = (i: number) => String(i + 1).padStart(2, "0");
// Карточка — картинка 4:3 без полей и рамок.
const cardH = (w: number) => 0.75 * w;
const fitW = (h: number) => h / 0.75;
const smooth = (t: number) => t * t * (3 - 2 * t);

// Дорога точки на телефоне, в координатах кадра: по центру до yb0 (под веером и из его оси),
// изгиб влево до xl за высоту b (S-кривая: x по smoothstep от высоты — то же, что кубическая
// кривая в трафарете), вдоль номеров чек-листа — строка row на этап, от yb1 до yL, изгиб обратно
// в центр до yc1 и дальше по центру в Сцену 5.
type Bend = {
  xl: number;
  yb0: number;
  yb1: number;
  yL: number;
  yc1: number;
  b: number;
  row: number;
};
const pathX = (p: Bend, cx: number, y: number) => {
  if (y <= p.yb0) return cx;
  if (y < p.yb1) return lerp(cx, p.xl, smooth((y - p.yb0) / p.b));
  if (y <= p.yL) return p.xl;
  if (y < p.yc1) return lerp(p.xl, cx, smooth((y - p.yL) / p.b));
  return cx;
};

// entry — точка входа на экране, ax — ось веера по горизонтали, top — верхний край первой
// карточки (оттуда она растёт), lift — от него до оси, D — шаг веера, град. above и below — где
// точка по центру видна над стопкой и под ней (просветы): above — у верхнего края стопки; below —
// под нижней кромкой первой карточки. Линия пути — в координатах кадра от from (место покоя точки
// под сеткой Сцены 3) до низа кадра, длина span; видна её часть до точки. tall — телефон и
// вертикальный планшет (свой темп pace, своя дорога точки), ch — высота карточки.
type Geo = {
  key: string;
  tall: boolean;
  pace: Pace;
  entry: { x: number; y: number };
  ax: number;
  top: number;
  above: number;
  below: number;
  lift: number;
  ch: number;
  D: number;
  from: number;
  span: number;
  bend: Bend | null;
};

export function Scene4() {
  const sectionRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLOListElement>(null);
  const capRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const lineRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);
  const inkRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const sticky = stickyRef.current;
    if (!section || !sticky) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let geo: Geo | null = null;
    // Последние записанные стили: пишем только изменившиеся.
    const written = new Map<HTMLElement, string>();
    const put = (el: HTMLElement | null, opacity: number, transform = "") => {
      if (!el) return;
      const css = `${opacity}|${transform}`;
      if (written.get(el) === css) return;
      written.set(el, css);
      el.style.opacity = `${opacity}`;
      el.style.transform = transform;
      el.style.visibility = opacity > 0.001 ? "visible" : "hidden";
    };
    const place = (el: HTMLElement | null, x: number, y: number, w?: number, h?: number) => {
      if (!el) return;
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      if (w !== undefined) el.style.width = `${w}px`;
      if (h !== undefined) el.style.height = `${h}px`;
    };
    const bottom = (el: HTMLElement | null) => (el ? el.offsetTop + el.offsetHeight : 0);
    // Блоки слева по порядку сверху: подводка, строки чек-листа.
    const items = [
      ...(headRef.current?.children ?? []),
      ...(mapRef.current?.children ?? []),
    ] as HTMLElement[];
    // Части подписей: на телефоне их пишет проход (срок — «счётчиком», остальное — сдвигом).
    const parts = capRefs.current.map((c) => {
      const [term, note, meta] = [...(c?.children ?? [])] as HTMLElement[];
      return { term: term?.firstElementChild as HTMLElement | null, note, meta };
    });
    // Блок слева всплывает: прозрачность и сдвиг вверх (свойством translate — transform у строк
    // чек-листа занят их ростом).
    const rise = (el: HTMLElement, o: number) => {
      const css = o.toFixed(3);
      if (written.get(el) === css) return;
      written.set(el, css);
      el.style.opacity = css;
      el.style.translate = `0 ${((1 - o) * RISE).toFixed(1)}px`;
    };
    const mark = (el: HTMLElement | null, name: string, value: string) => {
      if (el && el.dataset[name] !== value) el.dataset[name] = value;
    };
    // Блоки всплывают по очереди сверху вниз (переход — в CSS).
    for (const [i, el] of items.entries()) el.style.transitionDelay = `${i * 40}ms`;

    // Раскладка — при смене размера экрана. Широкий экран: подводка и чек-лист слева, веер
    // по центру (центр первой карточки — дом точки), подпись справа от него. Короткий
    // ландшафт — так же, всё мельче. Телефон и планшет в портрете: веер крупно сверху, на линии;
    // под ним две колонки по сторонам линии — подводка и чек-лист слева, подпись справа.
    const layout = (w: number, h: number, key: string): Geo => {
      const mode = w >= 700 && h <= 500 ? "short" : phoneLayout() ? "tall" : "wide";
      const tall = mode === "tall";
      sticky.dataset.mode = mode;
      const pace = tall ? PACE_TALL : PACE;
      section.style.height = `calc(var(--ih, 100vh) * ${screensOf(pace)})`;
      const dx = w / 2;
      const entry = entryPoint(w, h);
      const head = headRef.current;
      const map = mapRef.current;
      const caps = capRefs.current;
      // Части подписей пишет только телефонный проход — на другой раскладке они как в CSS.
      if (!tall) {
        for (const p of parts) {
          for (const el of [p.term, p.note, p.meta]) {
            if (!el) continue;
            el.style.opacity = "";
            el.style.transform = "";
            el.style.visibility = "";
          }
        }
      }
      let py: number;
      let cw: number;
      let r0: number;
      let D: number;
      let bend: Bend | null = null;
      if (tall) {
        // Снизу вверх: дорога точки — изгиб из оси веера влево, пять строк чек-листа, изгиб
        // обратно в центр к высоте, где точку ловит Сцена 5; над ней — веер, сколько позволяет
        // ширина. Остаток высоты — строкам чек-листа: блок этапов доходит до поимки, низ не пустует.
        const top = h < 700 ? 100 : TALL_TOP;
        const catchY = Math.round(CATCH * h);
        const b = Math.round(Math.max(56, Math.min(90, 0.09 * h)));
        const least = Math.round(Math.max(28, Math.min(44, 0.052 * h)));
        r0 = 22;
        D = 5.5;
        cw = Math.min(w - 64, 520, fitW(catchY - 8 - 2 * b - 5 * least - top - r0));
        py = Math.round(top + cardH(cw) + r0);
        const row = Math.round(Math.max(least, Math.min(56, (catchY - 8 - 2 * b - py) / 5)));
        const yb0 = py + 8;
        const yb1 = yb0 + b;
        const yL = yb1 + 5 * row;
        // Чек-лист — по левому краю, строка на этап: номера слева от дороги, названия справа —
        // дорога идёт между ними, как ось с подписями (зазор — в StageList.module.css). Подпись
        // этапа — правее чек-листа (с запасом на крупную текущую строку), с первой строки.
        if (map) {
          map.style.setProperty("--row", `${row}px`);
          map.style.width = "";
        }
        place(map, TALL_LIST, yb1);
        const [n, word] = [...(map?.firstElementChild?.children ?? [])] as HTMLElement[];
        const xl =
          n && word ? TALL_LIST + (n.offsetLeft + n.offsetWidth + word.offsetLeft) / 2 : 46;
        bend = { xl, yb0, yb1, yL, yc1: yL + b, b, row };
        const x0 = Math.round(TALL_LIST + (map?.offsetWidth ?? 0) * TALL_BIG + 14);
        for (const c of caps) place(c, x0, yb1 - 4, w - 20 - x0);
        const capBottom = yb1 - 4 + Math.max(...caps.map((c) => c?.offsetHeight ?? 0));
        // Итог «Пять этапов · обычно 8–12 недель» — в конце дороги: справа от точки, где она
        // уходит в Сцену 5, под подписью этапа.
        const lx = Math.max(x0, Math.round(dx + 16));
        place(head, lx, 0, w - 20 - lx);
        const hh = head?.offsetHeight ?? 0;
        place(head, lx, Math.round(Math.max(capBottom + 16, catchY - hh / 2)));
      } else {
        const short = mode === "short";
        map?.style.removeProperty("--row");
        // Подводка — не ближе 24px к середине: там идёт линия пути.
        place(head, 32, short ? 78 : 96, Math.min(short ? 0.45 * w : 560, dx - 56));
        place(map, short ? 32 : 56, bottom(head) + (short ? 12 : 40));
        // Короткий ландшафт: под осью — место для нижних углов раскрытого веера, над ним —
        // ниже подводки. Широкий: первая карточка — вокруг дома точки, ось — под ней; но не
        // выше, чем на 90px под чек-листом: на узком широком экране (1024) левые карточки
        // раскрытого веера иначе заходят на его строки.
        r0 = short ? 22 : 40;
        D = short ? 7 : 13;
        py = Math.round(h - 56);
        cw = short
          ? Math.min(0.3 * w, fitW((py - r0 - bottom(head) - 14) / 1.06))
          : Math.min(400, 0.26 * w);
        if (!short) py = Math.round(Math.max(h / 2 + DOT_Y + cardH(cw) / 2 + r0, bottom(map) + 90));
        // Подпись — справа от карточки: крупный срок вровень с её верхом.
        const x = dx + cw / 2 + (short ? 32 : 56);
        for (const c of caps) place(c, x, py - r0 - cardH(cw), w - 32 - x);
      }
      const ch = cardH(cw);
      for (const card of cardRefs.current) {
        place(card, dx - cw / 2, py - r0 - ch, cw, ch);
        if (card) card.style.transformOrigin = `${cw / 2}px ${ch + r0}px`;
      }
      // Линия пути — от места покоя точки под сеткой Сцены 3 до низа кадра, под текстом и
      // карточками. В координатах кадра её начало стоит на месте: сетка Сцены 3 и кадр уезжают
      // вверх вместе со страницей. У низа кадра её продолжает линия Сцены 5.
      const from = entry.y - h;
      placeLine(lineRef.current, dx, from, h - from);
      // Телефон: дорога с изгибами — трафарет (маска из SVG) от места покоя до низа кадра, под ним
      // чернила (inkRef): их низ — на высоте точки. Прямая линия там не нужна.
      const trail = trailRef.current;
      if (lineRef.current) lineRef.current.hidden = tall;
      if (trail) trail.hidden = !tall;
      if (inkRef.current) delete inkRef.current.dataset.f;
      if (trail && bend) {
        const H = h - from;
        const at = (v: number) => (v - from).toFixed(1);
        const { xl, yb0, yb1, yL, yc1, b } = bend;
        const d = `M${dx} 0V${at(yb0)}C${dx} ${at(yb0 + b / 3)} ${xl} ${at(yb0 + (2 * b) / 3)} ${xl} ${at(yb1)}V${at(yL)}C${xl} ${at(yL + b / 3)} ${dx} ${at(yL + (2 * b) / 3)} ${dx} ${at(yc1)}V${H}`;
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${H}"><path d="${d}" fill="none" stroke="#000" stroke-width="4"/></svg>`;
        const url = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
        place(trail, 0, from, w, H);
        trail.style.setProperty("mask-image", url);
        trail.style.setProperty("-webkit-mask-image", url);
      }
      const t0 = py - r0 - ch;
      return {
        key,
        tall,
        pace,
        entry,
        ax: dx,
        top: t0,
        above: t0 - 9,
        below: py - r0 + 9,
        lift: ch + r0,
        ch,
        D,
        from,
        span: h - from,
        bend,
      };
    };

    const update = () => {
      const rect = section.getBoundingClientRect();
      // Высота экрана — общая для сцен (на телефоне не прыгает с панелью браузера).
      const h = viewportH();
      const w = window.innerWidth;
      if (!(rect.height > 0) || !h) return;
      const key = `${w}x${h}`;
      if (geo?.key !== key) {
        geo = layout(w, h, key);
        written.clear();
      }
      const { tall, pace, entry, ax, top, above, below, lift, ch, D, from, span, bend } = geo;
      // s — экраны от входа секции снизу (когда отпускает sticky Сцены 3); s = 1 — сцена
      // встала на место.
      const total = screensOf(pace);
      const s = Math.max(0, Math.min(total, (h - rect.top) / h));
      // Точка и линия — в координатах кадра (точка лежит в нём, под карточками): пока кадр
      // едет вместе со страницей, их двигает браузер, а проход только доводит. Линия и точка
      // пишутся одним проходом в одних координатах — под пальцем точка от линии не отрывается.
      // frame — верх кадра на экране. До входа сцены точкой управляет Сцена 3 — не трогаем.
      const frame = rect.top > 0 ? rect.top : Math.min(0, rect.bottom - h);
      const low = Number.isFinite(phoneHold.low) ? phoneHold.low : h - DOT_R;
      const before = rect.top > h;

      // Телефон: этапы ведёт точка. Вход (кадр едет со страницей) — от места покоя под сеткой
      // Сцены 3 по центру, под веером, изгибом влево к первой строке чек-листа; стоянка — по
      // строке на этап, вдоль номеров; выход — изгибом в центр к высоте, где её ловит Сцена 5;
      // кадр поехал вверх — стоит на этой высоте экрана, пока до неё не дойдёт низ кадра.
      // Текущий этап — строка, у которой точка; доля этапа — сколько строки она прошла.
      // Широкий экран и короткий ландшафт — по прокрутке (stages.ts), без движения — сразу итог.
      let tallY = 0;
      let sc: Scene;
      if (tall && bend) {
        const n = N * pace.stage; // экранов на чек-лист
        tallY =
          rect.bottom < h
            ? low - frame
            : s <= 1
              ? from + (bend.yb1 - from) * s
              : s <= 1 + n
                ? bend.yb1 + ((bend.yL - bend.yb1) * (s - 1)) / n
                : bend.yL + ((low - bend.yL) * (s - 1 - n)) / pace.outro;
        const lead = clamp01(s);
        const t = (tallY - bend.yb1) / bend.row;
        const k = Math.floor(t);
        sc =
          t < 0
            ? { stage: 0, u: 0, lead, out: 0 }
            : t < N
              ? { stage: k, u: t - k, lead, out: 0 }
              : {
                  stage: N - 1,
                  u: 1,
                  lead,
                  out: clamp01((tallY - bend.yL) / Math.max(1, low - bend.yL)),
                };
      } else {
        const at = sceneAt(s, pace);
        sc = reduced && at.stage < 0 ? { ...at, stage: 0, u: 1 } : at;
      }

      // Подводка и строки чек-листа всплывают по очереди, когда из точки начинает расти первая
      // карточка (переход — в CSS); показанное дальше не гаснет. Телефон: колонки въезжают
      // вместе с кадром, уже на местах.
      const on = sc.stage >= 0;
      for (const el of items) rise(el, on ? 1 : 0);

      // Веер: rel — 0 стоит прямо, > 0 уже в веере слева, (−1; 0) — выходит справа. Первая
      // карточка не выходит, а растёт из точки, как карточки туннеля Сцены 3: от 4% размера,
      // сначала быстро. Широкий экран: рост — от верхнего края (сдвиг держит его на месте при
      // масштабе от оси веера), прозрачность — по порогу с переходом в CSS. Телефон: всё по
      // прокрутке — первая карточка растёт, пока точка идёт от её верха к центру, и центр едет
      // за точкой; новая карточка въезжает справа непрозрачной.
      const q = fanAt(sc, reduced);
      const g = tall ? (reduced ? 1 : clamp01((tallY - top) / (ch / 2))) : growAt(sc, reduced);
      for (let j = 0; j < N; j++) {
        const rel = q - j;
        const card = cardRefs.current[j];
        if (j === 0 && g < 1) {
          const k = START_SCALE + (1 - START_SCALE) * easeOut(g);
          let dy = -(1 - k) * lift;
          if (tall) {
            // Центр карточки — от точки к своему месту; масштаб — от оси веера.
            const cy = top + ch / 2;
            dy = cy + (tallY - cy) * (1 - g) - (top + lift - (lift - ch / 2) * k);
          }
          put(card, g > 0 ? 1 : 0, `translateY(${dy.toFixed(1)}px) scale(${k.toFixed(4)})`);
        } else if (rel <= -1) {
          // Ещё не вышедшая — без поворота: повёрнутая вправо, она расширяла бы страницу.
          put(card, 0);
        } else if (tall) {
          const tx = Math.max(0, -rel) * 0.85 * w;
          put(card, 1, `translateX(${tx.toFixed(1)}px) rotate(${(-D * rel).toFixed(2)}deg)`);
        } else put(card, 1, `rotate(${(-D * rel).toFixed(2)}deg)`);
        mark(card, "on", j === sc.stage && sc.out === 0 ? "true" : "false");
      }
      paintList(mapRef.current, sc, reduced);
      for (let i = 0; i < N; i++) mark(capRefs.current[i], "on", String(captionOn(i, sc)));
      if (tall) {
        for (let i = 0; i < N; i++) {
          const p = parts[i];
          const { roll, show, shift } = captionRoll(i, sc, reduced);
          const move = `translateY(${(shift * META_SHIFT).toFixed(1)}px)`;
          put(p.term, 1, `translateY(${(roll * 100).toFixed(2)}%)`);
          put(p.note, i === sc.stage ? 1 : 0);
          put(p.meta, show, move);
        }
      }

      if (before) {
        put(dotRef.current, 0);
        paintLine(lineRef.current, 0);
        paintLine(inkRef.current, 0);
        return;
      }
      let x = ax;
      let y: number; // точка в координатах кадра
      if (tall && bend) {
        x = pathX(bend, ax, tallY);
        y = tallY;
      } else {
        const { glide, walk } = dropAt(sc, entry.y - above, h);
        // Как только Сцена 3 отпустила сетку, точка плывёт с места покоя под ней к верхнему
        // краю стопки (above) — туда, где он окажется, когда сцена встанет на место. Дальше, все
        // этапы и выход, она идёт по стопке вниз, к высоте, где её ловит Сцена 5: у нижнего края
        // или, если каталог выше экрана, на low (lib/scroll/handoff.ts). Точка и линия — под
        // карточками, как под бумагой конверта Сцены 6: белая кромка карточки обрывает линию.
        // Чтобы точку было видно, она идёт по просветам: над стопкой и под ней — с одной
        // скоростью, а под карточками проходит быстро, за DIVE хода (на широком экране — пока
        // растёт первая карточка, над стопкой там просвета нет). Кадр поехал вверх — точка стоит
        // на высоте экрана, то есть идёт по кадру, пока до неё не дошёл его низ.
        x = lerp(entry.x, ax, glide);
        const edge = top - 9; // ниже — точку закрывает кромка верхней карточки
        const out = Math.min(below, low);
        const la = edge - above; // просвет над стопкой
        const lb = low - out; // просвет под ней
        const qa = la + lb > 0 ? ((1 - DIVE) * la) / (la + lb) : 0; // доля хода над стопкой
        const ys =
          sc.stage < 0
            ? lerp(entry.y, above, glide)
            : walk < qa
              ? lerp(above, edge, walk / qa)
              : walk < qa + DIVE
                ? lerp(edge, out, (walk - qa) / DIVE)
                : lerp(out, low, (walk - qa - DIVE) / (1 - qa - DIVE));
        y = ys - frame;
      }
      // Низ кадра дошёл до точки — её ведёт Сцена 5: ловит её здесь же. Чернила — до центра
      // точки: на телефоне — низ слоя под трафаретом дороги, иначе — конец прямой линии.
      const gone = reduced || rect.bottom <= low + DOT_R;
      const f = gone ? 1 : clamp01((y - from) / span);
      paintLine(tall ? inkRef.current : lineRef.current, f);
      put(dotRef.current, gone ? 0 : 1, `translate(${x.toFixed(2)}px,${y.toFixed(2)}px)`);
    };

    return onScroll(section, update);
  }, []);

  return (
    <section
      ref={sectionRef}
      className={styles.scene4}
      style={{ height: `calc(var(--ih, 100vh) * ${TOTAL_SCREENS})` }}
      data-scene="scene4"
      aria-label="Как мы работаем"
    >
      <div ref={stickyRef} className={styles.sticky}>
        {/* Первой — линия идёт под текстом и под карточками; точка — над линией, под карточками. */}
        <PathLine ref={lineRef} />
        {/* Телефон: дорога точки с изгибами — трафарет, под ним чернила (Scene4.module.css). */}
        <div ref={trailRef} className={styles.trail} aria-hidden="true" hidden>
          <div ref={inkRef} />
        </div>
        <span ref={dotRef} className={styles.dot} aria-hidden="true" />
        {/* Название сцены — общей подписью в шапке (components/ui/SceneLabel). */}
        <div ref={headRef}>
          <p className={styles.lead}>
            <span className={styles.leadLong}>Пять этапов от первого звонка до запуска</span>
            <span className={styles.leadShort}>Пять этапов</span> · обычно <b>{TOTAL_TERM}</b>
          </p>
        </div>
        <StageList ref={mapRef} />
        {STEPS.map((step, i) => (
          <figure
            key={step.word}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            className={styles.card}
            style={{ zIndex: 10 + i }}
          >
            {/* Фон картинки — её же цвет: край карточки ровный, без просветов; на втором круге
                (инверсия палитры, globals.css) img возвращается в свои цвета вместе с ним. */}
            {/* biome-ignore lint/performance/noImgElement: статический экспорт, файлы из public как есть */}
            <img src={step.image} alt="" style={{ background: step.color }} />
            <span className={styles.badge}>{num(i)}</span>
          </figure>
        ))}
        {STEPS.map((step, i) => (
          <div
            key={step.word}
            ref={(el) => {
              capRefs.current[i] = el;
            }}
            className={styles.caption}
          >
            {/* Срок — в своём окне: на телефоне он прокручивается «счётчиком». */}
            <p className={styles.term}>
              <span>{step.term}</span>
            </p>
            <p className={styles.note}>срок этапа</p>
            <dl className={styles.meta}>
              <dt>Делаем</dt>
              <dd>{step.does}</dd>
              <dt>Получаете</dt>
              <dd>{step.gets}</dd>
            </dl>
          </div>
        ))}
      </div>
    </section>
  );
}
