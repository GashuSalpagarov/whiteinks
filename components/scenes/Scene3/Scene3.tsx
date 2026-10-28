"use client";

import { invalidate } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { useLenis } from "@/app/providers";
import heroStyles from "@/components/scenes/Hero/Hero.module.css";
import skipStyles from "@/components/ui/Skip.module.css";
import { caseHref, openCase } from "@/lib/caseRoute";
import { phoneLayout } from "@/lib/phoneLayout";
import { onScroll, setVar, viewportH } from "@/lib/scroll/onScroll";
import { r3fTunnel } from "@/r3f/tunnel";
import { CARDS_CONTENT, PROJECTS_TOTAL, WORKS_HREF } from "./cardsData";
import styles from "./Scene3.module.css";
import { Scene3R3F } from "./Scene3R3F";

// Ход сцены — в экранах прокрутки, u: 0 — sticky встал (точка вошла в сцену), TOTAL — sticky
// отпускает: сетка уезжает вверх вместе со страницей, а точку от места покоя (dropRest) ведёт
// Сцена 4 — под свой веер.
const ENTRY = 0.1; // вход: из точки уже идёт поток частиц, первая карточка вылетает на 0.05
const REVEAL = 0.2; // за столько поток расходится от точки до камеры — пока летит первая карточка
const STEP = 0.7; // отрезок одной карточки
const FINALE = 0.5; // сборка сетки и пауза
const N = CARDS_CONTENT.length; // кейсов всего — все в сетке
const TUNNEL = 5; // в туннеле — первые пять, остальные — только в сетке
const FINALE_AT = ENTRY + STEP * TUNNEL;
const TOTAL = FINALE_AT + FINALE;

// Отрезок карточки: вылетает из точки (на 0.1 раньше начала отрезка — пока гаснет прошлая;
// первая — на 0.05), за APPROACH долетает до окна чтения, стоит HOLD, за DEPART улетает.
// Стоянка с подписью — 0.4 экрана.
const APPROACH = 0.25;
const HOLD = 0.4;
const DEPART = 0.15;
const START_SCALE = 0.04; // размер у точки — доля размера в окне чтения
const DEPART_SCALE = 0.35; // на столько вырастает, улетая: до шапки не дотягивается
const ASSEMBLE = 0.25; // карточки вылетают из точки по местам сетки
const STAGGER = 0.02; // вразнобой, по очереди

const DOT_Y = 20; // --drop-offset: точка на 20px ниже центра экрана, как в Сцене 2
const DROP_GAP = 26; // в портрете точка ждёт под сеткой: зазор под неё
const ROLL = 0.4; // за столько, пока собирается сетка, точка скатывается к месту покоя
const BREATH_IN = 0.08; // пульс в покое нарастает, пока точка докатывается
const BREATH_OUT = 0.05; // и сходит на нет до конца сцены — к Сцене 4 она ровно 12px
const SETTLE = FINALE_AT + 0.05 + ROLL; // сетка собрана целиком, точка — на месте покоя
// «Пропустить» туннель: видна, пока летят карточки; нажатие — пролёт Lenis к собранной сетке.
const SKIP_FROM = 0.05;
const SKIP_TO = 3.5;
const GAP = 48; // от точки до карточки в окне чтения
const CAPTION_GAP = 80; // от точки до подписи: у точки гуще всего частицы
const GRID_GAP = 24;
const LABEL_H = 40; // подпись под плиткой сетки (с отступом от плитки)
const LABEL_H_COMPACT = 38; // она же на телефоне: только название, до двух строк
const TOP = 84; // ниже полосы шапки (72px)
const GRID_TOP = 76; // сетка финала в портрете — сразу под полосой шапки
const LIFT = 56; // px, на телефоне карточка улетает вверх, не вырастая
const TILT = 8; // град, поворот карточки в туннеле

const launchAt = (i: number) => Math.max(ENTRY - 0.05, ENTRY + STEP * i - 0.1);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = (t: number) => t * (2 - t);
const easeInOut = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const num = (i: number) => String(i + 1).padStart(2, "0");
// «21 проект», «24 проекта», «19 проектов».
const projects = (n: number) => {
  const d = n % 10;
  const dd = n % 100;
  if (d === 1 && dd !== 11) return `${n} проект`;
  if (d >= 2 && d <= 4 && (dd < 12 || dd > 14)) return `${n} проекта`;
  return `${n} проектов`;
};
// Карточка: поля 12px и рамки 1.5px вокруг картинки 4:3 (Scene3.module.css).
const cardH = (w: number) => 27 + 0.75 * (w - 27);
const fitW = (maxH: number) => (maxH - 27) / 0.75 + 27;

type Box = { x: number; y: number; w: number; h: number };

// Раскладка экрана: окно чтения каждой карточки и её подписи, плитки сетки.
// Широкий экран: карточки по очереди слева и справа от точки, подпись — с другой стороны; сетка
// 4×2 на всю ширину между полями шапки — все кейсы и «Все проекты». Портрет (телефон, планшет):
// карточка над точкой, подпись под ней; сетка 2×4 (центр — между вторым и третьим рядом) —
// все кейсы и «Все проекты». Точка в финале — не в сетке, а под ней (rest).
// Сверху — полоса шапки (72px), снизу — 16px поля: если тесно, меньше становятся карточки и
// плитки (в портрете у плиток — только поле картинки по высоте), а не текст.
function layout(w: number, h: number) {
  const dx = w / 2;
  const dy = h / 2 + DOT_Y;
  const portrait = w < h;
  // Телефонная раскладка или короткий экран: подписи короче (тот же запрос — в Scene3.module.css).
  const compact = phoneLayout() || h <= 500;
  const read: Box[] = [];
  const caption: Box[] = [];
  const tilt: number[] = [];
  for (let i = 0; i < TUNNEL; i++) {
    if (portrait) {
      const cw = Math.min(w - 40, fitW(dy - 24 - TOP));
      const ch = cardH(cw);
      const x = (w - cw) / 2;
      read.push({ x, y: dy - 24 - ch, w: cw, h: ch });
      // Короткий телефон (375×548): карточка сильно уже экрана — подпись по ширине экрана, иначе
      // описание не влезает. Выше — по ширине карточки, чтобы край текста шёл по её рамке.
      const capW = h <= 600 ? w - 40 : cw;
      caption.push({ x: (w - capW) / 2, y: dy + 28, w: capW, h: 0 });
      tilt.push(0);
      continue;
    }
    const left = i % 2 === 0;
    const gap = compact ? 32 : GAP;
    const capGap = compact ? 48 : CAPTION_GAP;
    const margin = compact ? 24 : 64;
    const cw = Math.min(dx - gap - margin, fitW(compact ? h - 2 * TOP + 40 : h - 240));
    const ch = cardH(cw);
    const capW = Math.min(Math.max(440, 0.29 * w), dx - capGap - margin);
    read.push({ x: left ? dx - gap - cw : dx + gap, y: dy - ch / 2, w: cw, h: ch });
    caption.push({ x: left ? dx + capGap : dx - capGap - capW, y: dy - ch / 2 + 8, w: capW, h: 0 });
    tilt.push(left ? TILT : -TILT);
  }

  // Сетка: cols × rows, колонки поровну слева и справа от точки, все кейсы и «Все проекты».
  // Широкий экран — 4×2, над точкой — один ряд; портрет — 2×4, над точкой — два.
  const gap = portrait ? (compact ? 10 : 12) : compact ? 16 : GRID_GAP;
  // В портрете между колонками скатывается точка (12px) — зазор ей с запасом.
  const colGap = portrait ? 24 : gap;
  const labelH = compact ? LABEL_H_COMPACT : LABEL_H;
  const cols = portrait ? 2 : 4;
  const rows = portrait ? 4 : 2;
  const upRows = rows / 2; // рядов над точкой
  // Колонки — на всю ширину между полями шапки (32px, на телефоне и в коротком ландшафте — 20px).
  const margin = portrait || compact ? 20 : 32;
  const room = (w - 2 * margin - (cols - 1) * colGap) / cols;
  // Ширина плитки — по самому тесному: колонки и ряды над точкой и под ней. Телефон в портрете —
  // иначе: плитка по ширине, а не помещаются четыре ряда по высоте (от полосы шапки до места точки
  // под сеткой) — ниже поле картинки; сетка сдвигается в экран, если над точкой два ряда не встают.
  const phone = portrait && compact;
  const rowH = portrait
    ? Math.min(dy - GRID_TOP - 1.5 * gap, h - 16 - DROP_GAP - 1.5 * gap - dy) / 2 - labelH
    : Math.min(dy - gap / 2 - TOP - labelH, h - dy - gap / 2 - 16 - labelH);
  const tw = phone ? room : Math.min(room, fitW(rowH));
  const th = phone
    ? Math.min(cardH(tw), (h - GRID_TOP - 16 - DROP_GAP - (rows - 1) * gap) / rows - labelH)
    : cardH(tw);
  const pitch = th + labelH + gap;
  const y0 = dy + gap / 2 - upRows * pitch;
  const top = phone ? Math.max(GRID_TOP, Math.min(y0, h - 16 - DROP_GAP - rows * pitch + gap)) : y0;
  const tile: Box[] = Array.from({ length: N + 1 }, (_, i) => ({
    x: dx + colGap / 2 + ((i % cols) - cols / 2) * (tw + colGap),
    y: top + Math.floor(i / cols) * pitch,
    w: tw,
    h: th,
  }));
  const bottom = tile[N].y + th + labelH;
  const labelGap = compact ? 6 : 8;
  // Место покоя точки в финале: по центру под сеткой — в портрете сразу под ней, иначе у низа
  // экрана (на 52px выше края, но не на подписях плиток).
  const rest = {
    x: dx,
    y: portrait ? bottom + DROP_GAP / 2 : Math.min(h - 24, Math.max(h - 52, bottom + 16)),
  };
  return { dx, dy, portrait, compact, read, caption, tilt, tile, labelGap, rest, bottom };
}

// Где Сцена 3 оставляет точку, когда отпускает свой sticky: отсюда её ведёт Сцена 4.
export const dropRest = (w: number, h: number) => layout(w, h).rest;

// Прокрутка страницы, на которой карточка i стоит в окне чтения (середина стоянки), — для слоя
// кейса (components/case): туда он ставит главную, когда кейс открыт по прямой ссылке и его
// закрывают. Кейсы только сетки (06–07) — сетка собрана, точка на месте покоя.
export function cardScrollY(i: number): number {
  const section = document.querySelector<HTMLElement>('[data-scene="scene3"]');
  if (!section) return 0;
  const u = i < TUNNEL ? launchAt(i) + APPROACH + HOLD / 2 : SETTLE;
  return Math.round(section.getBoundingClientRect().top + window.scrollY + u * viewportH());
}

type Layout = ReturnType<typeof layout>;

// Место карточки в вёрстке: в туннеле — окно чтения, в финале — плитка сетки (там она стоит
// без масштаба, рамки остаются чёткими). У плиток после туннельных (кейсы 06–07 и «Все проекты»)
// места в туннеле нет.
const boxOf = (L: Layout, i: number, u: number) =>
  u >= FINALE_AT || i >= TUNNEL ? L.tile[i] : L.read[i];

// Карточка i при u: transform от её места в вёрстке и прозрачность; null — не видна. Как в
// перспективе, смещение от точки растёт вместе с размером: карточка летит по лучу из точки.
function cardAt(L: Layout, i: number, u: number) {
  const r = boxOf(L, i, u);
  let target = L.read[i];
  let s: number;
  let o: number;
  let tilt = 0;
  let lift = 0;
  const f0 = FINALE_AT + i * STAGGER;
  if (u >= f0) {
    target = L.tile[i];
    s = START_SCALE + (1 - START_SCALE) * easeOut(clamp01((u - f0) / ASSEMBLE));
    o = clamp01((u - f0) / 0.06);
  } else {
    if (i >= TUNNEL) return null; // только в сетке: вылетают из точки при сборке
    const t0 = launchAt(i);
    const t1 = t0 + APPROACH;
    const t2 = t1 + HOLD;
    if (u <= t0 || u >= t2 + DEPART) return null;
    tilt = L.tilt[i];
    if (u < t1) {
      s = START_SCALE + (1 - START_SCALE) * easeOut((u - t0) / APPROACH);
      o = clamp01((u - t0) / 0.08);
    } else if (u < t2) {
      s = 1;
      o = 1;
    } else {
      const k = (u - t2) / DEPART;
      if (L.portrait) {
        s = 1;
        lift = LIFT * k;
        o = (1 - k) ** 2;
      } else {
        s = 1 + DEPART_SCALE * k * k;
        o = 1 - k;
      }
    }
  }
  const cx = L.dx + (target.x + target.w / 2 - L.dx) * s;
  const cy = L.dy + (target.y + target.h / 2 - L.dy) * s - lift;
  const x = cx - (r.x + r.w / 2);
  const y = cy - (r.y + r.h / 2);
  const scale = (s * target.w) / r.w;
  return {
    transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${scale.toFixed(4)}) perspective(1200px) rotateY(${tilt}deg)`,
    o,
  };
}

export function Scene3() {
  const sectionRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const captionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const labelRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const allRef = useRef<HTMLAnchorElement>(null); // плитка «Все проекты»
  const allLabelRef = useRef<HTMLParagraphElement>(null);
  const dropRef = useRef<HTMLSpanElement>(null);
  const progressRef = useRef(0);
  const streamRef = useRef({ opacity: 0, reveal: 0 });
  const skipRef = useRef<HTMLButtonElement>(null);
  const flying = useRef(false); // идёт пролёт по «пропустить»
  const lenis = useLenis();

  // Пролёт к собранной сетке (SETTLE) — Lenis, 1–1,5 с, с торможением в конце: карточки быстро
  // пролетают, экран не меняется рывком. Без Lenis (reduced motion) туннеля нет — и кнопки.
  const skipTunnel = () => {
    const section = sectionRef.current;
    if (!section || !lenis) return;
    const h = viewportH();
    const target = section.getBoundingClientRect().top + window.scrollY + SETTLE * h;
    const screens = Math.abs(target - window.scrollY) / h;
    flying.current = true;
    skipRef.current?.classList.remove(skipStyles.on);
    lenis.scrollTo(target, {
      duration: Math.min(1.5, 1 + 0.12 * screens),
      easing: (t) => 1 - (1 - t) ** 3,
    });
  };

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const videos = [...section.querySelectorAll("video")];
    let playing = false;
    let L: Layout | null = null;
    let shared: HTMLElement | null = null; // общая точка (.drop в Hero)
    let viewport = "";
    // Плитки сетки и их подписи по местам раскладки: кейсы и «Все проекты».
    const tiles = [...cardRefs.current, allRef.current];
    const labels = [...labelRefs.current, allLabelRef.current];
    let skipShown = false;
    // Последние записанные стили: пишем только изменившиеся.
    const written = new Map<HTMLElement, string>();
    const put = (el: HTMLElement | null, opacity: number, transform = "") => {
      if (!el) return;
      const css = `${opacity}|${transform}`;
      if (written.get(el) === css) return;
      written.set(el, css);
      el.style.opacity = `${opacity}`;
      el.style.transform = transform;
    };
    const place = (el: HTMLElement | null, b: { x: number; y: number; w: number; h?: number }) => {
      if (!el) return;
      el.style.left = `${b.x}px`;
      el.style.top = `${b.y}px`;
      el.style.width = `${b.w}px`;
      if (b.h) el.style.height = `${b.h}px`;
    };

    const update = () => {
      const w = window.innerWidth;
      const h = viewportH();
      if (!h) return;
      const rect = section.getBoundingClientRect();
      // Видео карточек — только пока сцена на экране (батарея телефона). play() отклонён (iOS в
      // режиме экономии) — остаётся постер.
      const play = !reduced && rect.top < h && rect.bottom > 0;
      if (play !== playing) {
        playing = play;
        for (const v of videos) {
          if (play) v.play().catch(() => {});
          else v.pause();
        }
      }
      // Без движения — сразу собранная сетка, пока sticky стоит.
      const raw = -rect.top / h;
      const u = reduced ? (rect.top <= 0 ? TOTAL : 0) : Math.max(0, Math.min(TOTAL, raw));
      const stage = u >= FINALE_AT ? "grid" : "tunnel";
      const vp = `${w}x${h}`;
      if (vp !== viewport || !L) {
        viewport = vp;
        L = layout(w, h);
        written.clear();
        for (let i = 0; i < TUNNEL; i++) place(captionRefs.current[i], L.caption[i]);
        // «Пропустить» — внизу по центру. В портрете подпись под точкой бывает до самого низа
        // (375×548): тогда пилюля справа в строке номера «01 / 05» — она там короткая.
        const pill = skipRef.current;
        if (pill) {
          pill.classList.remove(skipStyles.inRow);
          const caps = captionRefs.current.filter((c) => c !== null);
          const low = Math.max(0, ...caps.map((c) => c.offsetTop + c.offsetHeight));
          const free = h - Number.parseFloat(getComputedStyle(pill).bottom) - pill.offsetHeight;
          const row = L.portrait && low + 12 > free && caps[0]?.firstElementChild;
          pill.classList.toggle(skipStyles.inRow, !!row);
          if (row instanceof HTMLElement) {
            pill.style.setProperty(
              "--skip-top",
              `${caps[0].offsetTop + row.offsetTop + row.offsetHeight / 2}px`,
            );
          }
        }
        for (let i = 0; i <= N; i++) {
          const t = L.tile[i];
          place(labels[i], { x: t.x, y: t.y + t.h + L.labelGap, w: t.w });
        }
      }
      // Номер на карточке — только в туннеле; карточки — на своих местах этапа.
      const sticky = stickyRef.current;
      if (sticky && (sticky.dataset.stage !== stage || written.size === 0)) {
        sticky.dataset.stage = stage;
        for (let i = 0; i <= N; i++) place(tiles[i], boxOf(L, i, u));
      }
      // Sticky отпущен: сетка уезжает медленнее страницы — её низ уходит за верх экрана (в
      // коротком ландшафте — под полосу шапки) ровно тогда, когда через экран встаёт Сцена 4. Так
      // между сеткой и Сценой 4 нет пустой линии; Сцена 4 по-прежнему берёт точку с места покоя.
      // В портрете — вместе со страницей: сетка там почти до низа экрана, а линия Сцены 4 тянется
      // от места покоя точки под ней — отстающая сетка наезжала бы на линию.
      const gone = L.compact ? GRID_TOP : 0;
      const lag = reduced || L.portrait ? 0 : clamp01(raw - TOTAL) * (h - L.bottom + gone);
      const shift = lag ? `translateY(${lag.toFixed(1)}px)` : "";
      if (sticky && sticky.style.transform !== shift) sticky.style.transform = shift;
      for (let i = 0; i <= N; i++) {
        const c = cardAt(L, i, u);
        put(tiles[i], c ? c.o : 0, c ? c.transform : "");
        // Карточка с кейсом — ссылка: ловит клики и фокус, только пока видна (невидимые стоят
        // на своих местах поверх других).
        const tile = tiles[i];
        const vis = c && c.o > 0 ? "" : "hidden";
        if (i < N && tile && CARDS_CONTENT[i].slug && tile.style.visibility !== vis) {
          tile.style.visibility = vis;
        }
        const f1 = FINALE_AT + i * STAGGER + ASSEMBLE;
        put(labels[i], clamp01((u - f1 + 0.08) / 0.1));
        if (i === N) {
          // «Все проекты» — ссылка: в фокусе и под курсором, только пока плитка видна.
          const all = allRef.current;
          const vis = c && c.o > 0 ? "visible" : "hidden";
          if (all && all.style.visibility !== vis) all.style.visibility = vis;
        }
        if (i >= TUNNEL) continue; // подпись в окне чтения — только у кейсов туннеля
        // Подпись — пока карточка стоит в окне чтения.
        const t1 = launchAt(i) + APPROACH;
        const t2 = t1 + HOLD;
        const co =
          u >= FINALE_AT
            ? 0
            : Math.min(clamp01((u - t1 + 0.1) / 0.1), 1 - clamp01((u - t2) / 0.08));
        const caption = captionRefs.current[i];
        put(caption, co, `translateY(${(1 - co) * 12}px)`);
        // Погасшая подпись не ловит нажатий: подписи через одну стоят на одном месте.
        const cv = co > 0 ? "" : "hidden";
        if (caption && caption.style.visibility !== cv) caption.style.visibility = cv;
      }
      // Поток частиц: уже идёт и с первого кадра сцены расходится из точки — пока летит первая
      // карточка, становится виден целиком, до камеры. Тексту не мешает: под строками подписей —
      // белая подложка (Scene3.module.css). На тесных экранах тише, к сборке сетки гаснет.
      // Канвас рисует по запросу (frameloop="demand"): сдвинулся p или поток — нужен кадр.
      const p = u / TOTAL;
      const reveal = easeOut(clamp01(u / REVEAL));
      const opacity = (L.compact ? 0.75 : 1) * (1 - clamp01((u - FINALE_AT + 0.15) / 0.25));
      const stream = streamRef.current;
      if (p !== progressRef.current || opacity !== stream.opacity || reveal !== stream.reveal) {
        invalidate();
      }
      progressRef.current = p;
      stream.opacity = opacity;
      stream.reveal = reveal;

      // Точка: в туннеле — общая (.drop) в центре, из неё вылетают карточки. С финала общую гасим,
      // а ровно на её месте встаёт своя: пока собирается сетка, она скатывается к месту покоя и
      // ждёт там с лёгким пульсом. Когда sticky отпускает (raw > TOTAL), точку ведёт Сцена 4.
      // Прозрачность общей — переменной на ней самой, не на корне: смена на корне пересчитывала бы
      // стили всей страницы (~750 узлов — запинка ровно на старте сборки).
      const finale = u >= FINALE_AT && raw <= TOTAL;
      if (!shared?.isConnected) shared = document.querySelector<HTMLElement>(`.${heroStyles.drop}`);
      const sharedOpacity = u >= FINALE_AT ? "0" : "1";
      if (shared && shared.style.getPropertyValue("--drop-opacity") !== sharedOpacity) {
        shared.style.setProperty("--drop-opacity", sharedOpacity);
      }
      const roll = easeInOut(clamp01((u - FINALE_AT - 0.05) / ROLL));
      const drop = dropRef.current;
      put(drop, finale ? 1 : 0, `translate(${L.dx}px, ${lerp(L.dy, L.rest.y, roll).toFixed(2)}px)`);
      // Размах пульса в покое (Scene3.module.css): нарастает, пока точка докатывается (BREATH_IN),
      // и сходит на нет к концу сцены (BREATH_OUT) — Сцена 4 берёт точку ровно 12px.
      const breath = finale
        ? easeInOut(
            Math.min(
              clamp01((u - SETTLE + BREATH_IN) / BREATH_IN),
              clamp01((TOTAL - u) / BREATH_OUT),
            ),
          )
        : 0;
      const wait = breath > 0 ? "true" : "false";
      if (drop && drop.dataset.wait !== wait) drop.dataset.wait = wait;
      const b = breath.toFixed(3);
      if (drop && drop.style.getPropertyValue("--breath") !== b)
        drop.style.setProperty("--breath", b);
      if (u > 0) setVar("--drop-offset", `${DOT_Y}px`);
      // «Пропустить» — пока стоит туннель и летят карточки, не во время своего же пролёта.
      if (flying.current && (u >= SKIP_TO || u <= 0)) flying.current = false;
      const skip = !flying.current && u > SKIP_FROM && u < SKIP_TO;
      if (skip !== skipShown) {
        skipShown = skip;
        skipRef.current?.classList.toggle(skipStyles.on, skip);
      }
      // Центр канваса (откуда летят частицы) — в точке. Рисует в канвасе только эта сцена, а до
      // неё он пуст — сдвиг постоянный: смена переменной на корне на входе в сцену пересчитывала
      // бы стили всей страницы.
      setVar("--canvas-y", `${DOT_Y}px`);
    };

    return onScroll(section, update);
  }, []);

  const cases = CARDS_CONTENT;
  return (
    <>
      <section
        ref={sectionRef}
        className={styles.scene3}
        style={{ height: `calc(var(--ih, 100vh) * ${TOTAL + 1})` }}
        data-scene="scene3"
        aria-label="Работы"
      >
        <div ref={stickyRef} className={styles.sticky}>
          {cases.map((c, i) => {
            const ref = (el: HTMLElement | null) => {
              cardRefs.current[i] = el;
            };
            const inner = (
              <>
                <div className={styles.preview}>
                  {/* Цветное поле вокруг вписанной картинки — её собственный фон: на втором круге
                    (инверсия палитры, globals.css) img возвращается в свои цвета вместе с полем,
                    а рамки и белое поле карточки остаются в негативе. */}
                  {c.video ? (
                    // Петля вместо картинки, пока грузится — постер. Грузится и играет, только пока
                    // сцена на экране (update ниже), при «меньше движения» — нет; no-invert — как
                    // img на втором круге.
                    <video
                      className="no-invert"
                      src={c.video}
                      poster={c.image}
                      muted
                      loop
                      playsInline
                      preload="none"
                      style={{ background: c.color }}
                    />
                  ) : (
                    <>
                      {/* biome-ignore lint/performance/noImgElement: статический экспорт, файлы из public как есть */}
                      <img src={c.image} alt="" style={{ background: c.color }} />
                    </>
                  )}
                </div>
                <span className={styles.badge}>{num(i)}</span>
              </>
            );
            const slug = c.slug;
            if (!slug) {
              return (
                <figure key={c.title} ref={ref} className={styles.card} style={{ zIndex: N - i }}>
                  {inner}
                </figure>
              );
            }
            // Карточка с кейсом — ссылка в него: нажатие — пролёт сквозь неё (слой кейса).
            // nofollow — роботам страницы кейсов не показываем (docs/12-case-page.md).
            return (
              <a
                key={c.title}
                ref={ref}
                href={caseHref(slug)}
                rel="nofollow"
                className={`${styles.card} ${styles.caseCard}`}
                style={{ zIndex: N - i }}
                aria-label={`Кейс: ${c.title}`}
                data-case={slug}
                onClick={(e) =>
                  openCase(e, {
                    slug,
                    card: cardRefs.current[i],
                    caption: captionRefs.current[i] ?? null,
                  })
                }
              >
                {inner}
              </a>
            );
          })}
          {/* Последняя плитка сетки — вход на страницу всех проектов: стопка рамок («+17» — сколько
            ещё, без показанных в сетке) и стрелка. Видна и ловит клики только в сетке (visibility
            пишет update). */}
          <a
            ref={allRef}
            href={WORKS_HREF}
            className={`${styles.card} ${styles.all}`}
            aria-label={`Все проекты: ${projects(PROJECTS_TOTAL)}`}
          >
            <div className={`${styles.preview} ${styles.allField}`}>
              <div className={styles.stack}>
                <span />
                <span />
                <span>+{PROJECTS_TOTAL - N}</span>
              </div>
              <span className={styles.arrow}>→</span>
            </div>
          </a>
          {cases.slice(0, TUNNEL).map((c, i) => (
            <div
              key={c.title}
              ref={(el) => {
                captionRefs.current[i] = el;
              }}
              className={styles.caption}
            >
              <p className={styles.count}>
                {num(i)} <span>/ {num(TUNNEL - 1)}</span>
              </p>
              <h3 className={styles.title}>{c.title}</h3>
              <p className={styles.kind}>
                <span>{c.type}</span>
              </p>
              {c.about && <p className={styles.about}>{c.about}</p>}
              {c.slug && (
                <a
                  href={caseHref(c.slug)}
                  rel="nofollow"
                  className={styles.link}
                  onClick={(e) =>
                    c.slug &&
                    openCase(e, {
                      slug: c.slug,
                      card: cardRefs.current[i],
                      caption: captionRefs.current[i],
                    })
                  }
                >
                  Смотреть кейс →
                </a>
              )}
            </div>
          ))}
          {cases.map((c, i) => (
            <p
              key={c.title}
              ref={(el) => {
                labelRefs.current[i] = el;
              }}
              className={styles.label}
            >
              <span>
                <span className={styles.labelNum}>{num(i)} · </span>
                {c.title}
              </span>
              <span>{c.type}</span>
            </p>
          ))}
          <p ref={allLabelRef} className={styles.label}>
            <span>Все проекты</span>
            <span>{projects(PROJECTS_TOTAL)}</span>
          </p>
        </div>
        <span ref={dropRef} className={styles.drop} aria-hidden="true" />
        <r3fTunnel.In>
          <Scene3R3F progressRef={progressRef} streamRef={streamRef} />
        </r3fTunnel.In>
      </section>
      {/* Слоем страницы, вне сцены (components/ui/Skip.module.css); видна, пока летят карточки. */}
      <button
        ref={skipRef}
        type="button"
        className={skipStyles.skip}
        aria-label="Пропустить туннель работ"
        onClick={skipTunnel}
      >
        пропустить
      </button>
    </>
  );
}
