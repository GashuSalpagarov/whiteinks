"use client";

import { invalidate } from "@react-three/fiber";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useLenis } from "@/app/providers";
import heroStyles from "@/components/scenes/Hero/Hero.module.css";
import { onScroll, setVar, viewportH } from "@/lib/scroll/onScroll";
import { r3fTunnel } from "@/r3f/tunnel";
import { CARDS_CONTENT, FINALE_LINE } from "./cardsData";
import styles from "./Scene3.module.css";
import { Scene3R3F } from "./Scene3R3F";

// Ход сцены — в экранах прокрутки, u: 0 — sticky встал (точка вошла в сцену), TOTAL — sticky
// отпускает: сетка уезжает вверх вместе со страницей, а точку от места покоя (dropRest) ведёт
// Сцена 4 — под свой веер.
const ENTRY = 0.1; // вход: из точки уже идёт поток частиц, первая карточка вылетает на 0.05
const REVEAL = 0.2; // за столько поток расходится от точки до камеры — пока летит первая карточка
const STEP = 0.7; // отрезок одной карточки
const FINALE = 0.5; // сборка сетки и пауза
const N = CARDS_CONTENT.length; // сетка финала — 3×2, в портрете 2×3: под шесть кейсов
const FINALE_AT = ENTRY + STEP * N;
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
const DROP_GAP = 26; // в портрете точка ждёт между сеткой и «Работы (06)»: зазор под неё
const ROLL = 0.4; // за столько, пока собирается сетка, точка скатывается к месту покоя
const GAP = 48; // от точки до карточки в окне чтения
const CAPTION_GAP = 80; // от точки до подписи: у точки гуще всего частицы
const GRID_GAP = 24;
const LABEL_H = 40; // подпись под плиткой сетки (с отступом от плитки)
const LABEL_H_COMPACT = 38; // она же на телефоне: только название, до двух строк
const TOP = 84; // ниже полосы шапки (72px)
const GRID_TOP = 76; // сетка финала в портрете — сразу под полосой шапки
// Блок под сеткой в портрете: «Работы (06)», строка и кнопка (Scene3.module.css).
const FINALE_H = 118;
const FINALE_H_WIDE = 152; // то же с текстом широкого экрана (планшет)
const LIFT = 56; // px, на телефоне карточка улетает вверх, не вырастая
const TILT = 8; // град, поворот карточки в туннеле

const launchAt = (i: number) => Math.max(ENTRY - 0.05, ENTRY + STEP * i - 0.1);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = (t: number) => t * (2 - t);
const easeInOut = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const num = (i: number) => String(i + 1).padStart(2, "0");
// Карточка: поля 12px и рамки 1.5px вокруг картинки 4:3 (Scene3.module.css).
const cardH = (w: number) => 27 + 0.75 * (w - 27);
const fitW = (maxH: number) => (maxH - 27) / 0.75 + 27;

type Box = { x: number; y: number; w: number; h: number };

// Раскладка экрана: окно чтения каждой карточки и её подписи, плитки сетки, блок финала.
// Широкий экран: карточки по очереди слева и справа от точки, подпись — с другой стороны; сетка
// 3×2 вокруг центра экрана (две колонки слева, одна справа), справа от сетки — заголовок и
// кнопка. Портрет (телефон, планшет): карточка над точкой, подпись под ней; сетка 2×3 (центр —
// между вторым и третьим рядом), заголовок и кнопка под сеткой. Точка в финале — не в сетке, а
// под ней (rest).
// Сверху — полоса шапки (72px), снизу — 16px поля: если тесно, меньше становятся карточки и
// плитки, а не текст.
function layout(w: number, h: number) {
  const dx = w / 2;
  const dy = h / 2 + DOT_Y;
  const portrait = w < h;
  // Телефон или короткий экран: подписи короче (тот же порог — в Scene3.module.css).
  const compact = w < 768 || h <= 500;
  const read: Box[] = [];
  const caption: Box[] = [];
  const tilt: number[] = [];
  for (let i = 0; i < N; i++) {
    if (portrait) {
      const cw = Math.min(w - 40, fitW(dy - 24 - TOP));
      const ch = cardH(cw);
      const x = (w - cw) / 2;
      read.push({ x, y: dy - 24 - ch, w: cw, h: ch });
      caption.push({ x, y: dy + 28, w: cw, h: 0 });
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

  // Сетка: cols × rows, слева от центра — leftCols колонок, над ним — upRows рядов.
  const gap = portrait ? (compact ? 10 : 12) : compact ? 16 : GRID_GAP;
  const labelH = compact ? LABEL_H_COMPACT : LABEL_H;
  const cols = portrait ? 2 : 3;
  const leftCols = portrait ? 1 : 2;
  const upRows = portrait ? 2 : 1;
  // Справа от сетки: заголовок, строка и кнопка (на коротком экране — всё, что осталось до края).
  const textGap = compact ? 16 : 48;
  const margin = compact ? 12 : 32;
  const textW = compact ? 200 : Math.max(200, Math.min(320, 0.17 * w));
  // Ширина плитки — по самому тесному: колонки слева и справа от точки, ряды над ней и под ней.
  const room = portrait
    ? [dx - gap / 2 - 20, w - dx - gap / 2 - 20]
    : [(dx - margin - 1.5 * gap) / 2, w - dx - gap / 2 - textGap - textW - margin];
  const rowH = portrait
    ? Math.min(
        (dy - GRID_TOP - 1.5 * gap) / 2 - labelH,
        h - 16 - (compact ? FINALE_H : FINALE_H_WIDE) - DROP_GAP - gap / 2 - labelH - dy,
      )
    : Math.min(dy - gap / 2 - TOP - labelH, h - dy - gap / 2 - 16 - labelH);
  const tw = Math.min(room[0], room[1], fitW(rowH));
  const th = cardH(tw);
  const tile: Box[] = CARDS_CONTENT.map((_, i) => ({
    x: dx + gap / 2 + ((i % cols) - leftCols) * (tw + gap),
    y: dy + gap / 2 + (Math.floor(i / cols) - upRows) * (th + labelH + gap),
    w: tw,
    h: th,
  }));
  const bottom = tile[N - 1].y + th + labelH;
  // Портрет: блок финала — под сеткой, шириной с неё (но не уже 335px); иначе — справа от сетки.
  const blockW = Math.max(2 * tw + gap, Math.min(w - 40, 335));
  const finale = portrait
    ? { x: dx - blockW / 2, y: bottom + DROP_GAP, w: blockW }
    : {
        x: dx + gap / 2 + tw + textGap,
        y: dy,
        w: compact ? w - margin - (dx + gap / 2 + tw + textGap) : textW,
      };
  const labelGap = compact ? 6 : 8;
  // Место покоя точки в финале: по центру — в портрете между сеткой и блоком финала, иначе
  // у низа экрана (на 52px выше края, но не на подписях плиток).
  const rest = {
    x: dx,
    y: portrait ? bottom + DROP_GAP / 2 : Math.min(h - 24, Math.max(h - 52, bottom + 16)),
  };
  return { dx, dy, portrait, compact, read, caption, tilt, tile, finale, labelGap, rest };
}

// Где Сцена 3 оставляет точку, когда отпускает свой sticky: отсюда её ведёт Сцена 4.
export const dropRest = (w: number, h: number) => layout(w, h).rest;

type Layout = ReturnType<typeof layout>;

// Место карточки в вёрстке: в туннеле — окно чтения, в финале — плитка сетки (там она стоит
// без масштаба, рамки остаются чёткими).
const boxOf = (L: Layout, i: number, u: number) => (u >= FINALE_AT ? L.tile[i] : L.read[i]);

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
  const dropRef = useRef<HTMLSpanElement>(null);
  const finaleRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const streamRef = useRef({ opacity: 0, reveal: 0 });
  const lenis = useLenis();

  // Пока страниц кейсов нет — к письму-заявке (Сцена 6), как «Связаться» в Hero.
  const toBrief = () => {
    const brief = document.querySelector<HTMLElement>('[data-scene="scene6"]');
    if (!brief) return;
    if (!lenis) {
      brief.scrollIntoView();
      return;
    }
    lenis.scrollTo(brief, {
      duration: 2.8,
      easing: (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
    });
  };

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let L: Layout | null = null;
    let shared: HTMLElement | null = null; // общая точка (.drop в Hero)
    let viewport = "";
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
      // Без движения — сразу собранная сетка, пока sticky стоит.
      const raw = -rect.top / h;
      const u = reduced ? (rect.top <= 0 ? TOTAL : 0) : Math.max(0, Math.min(TOTAL, raw));
      const stage = u >= FINALE_AT ? "grid" : "tunnel";
      const vp = `${w}x${h}`;
      if (vp !== viewport || !L) {
        viewport = vp;
        L = layout(w, h);
        written.clear();
        for (let i = 0; i < N; i++) {
          place(captionRefs.current[i], L.caption[i]);
          const t = L.tile[i];
          place(labelRefs.current[i], { x: t.x, y: t.y + t.h + L.labelGap, w: t.w });
        }
        place(finaleRef.current, L.finale);
        if (finaleRef.current) {
          finaleRef.current.dataset.side = L.portrait ? "below" : "right";
        }
      }
      // Номер на карточке — только в туннеле; карточки — на своих местах этапа.
      const sticky = stickyRef.current;
      if (sticky && (sticky.dataset.stage !== stage || written.size === 0)) {
        sticky.dataset.stage = stage;
        for (let i = 0; i < N; i++) place(cardRefs.current[i], boxOf(L, i, u));
      }
      for (let i = 0; i < N; i++) {
        const c = cardAt(L, i, u);
        put(cardRefs.current[i], c ? c.o : 0, c ? c.transform : "");
        // Подпись — пока карточка стоит в окне чтения.
        const t1 = launchAt(i) + APPROACH;
        const t2 = t1 + HOLD;
        const co =
          u >= FINALE_AT
            ? 0
            : Math.min(clamp01((u - t1 + 0.1) / 0.1), 1 - clamp01((u - t2) / 0.08));
        put(captionRefs.current[i], co, `translateY(${(1 - co) * 12}px)`);
        const f1 = FINALE_AT + i * STAGGER + ASSEMBLE;
        put(labelRefs.current[i], clamp01((u - f1 + 0.08) / 0.1));
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

      const fo = clamp01((u - FINALE_AT - 0.15) / 0.15);
      put(finaleRef.current, fo);
      // Кнопка в фокусе и под курсором — только пока финал виден.
      const vis = fo > 0 ? "visible" : "hidden";
      if (finaleRef.current && finaleRef.current.style.visibility !== vis) {
        finaleRef.current.style.visibility = vis;
      }

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
      const wait = finale && roll >= 1 ? "true" : "false";
      if (drop && drop.dataset.wait !== wait) drop.dataset.wait = wait;
      if (u > 0) setVar("--drop-offset", `${DOT_Y}px`);
      // Центр канваса (откуда летят частицы) — в точке. Рисует в канвасе только эта сцена, а до
      // неё он пуст — сдвиг постоянный: смена переменной на корне на входе в сцену пересчитывала
      // бы стили всей страницы.
      setVar("--canvas-y", `${DOT_Y}px`);
    };

    return onScroll(section, update);
  }, []);

  const cases = CARDS_CONTENT;
  return (
    <section
      ref={sectionRef}
      className={styles.scene3}
      style={{ height: `calc(var(--ih, 100vh) * ${TOTAL + 1})` }}
      data-scene="scene3"
      aria-label="Работы"
    >
      <div ref={stickyRef} className={styles.sticky}>
        {cases.map((c, i) => (
          <figure
            key={c.title}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            className={styles.card}
            style={{ zIndex: N - i }}
          >
            <div className={styles.preview}>
              {/* Цветное поле вокруг вписанной картинки — её собственный фон: на втором круге
                  (инверсия палитры, globals.css) img возвращается в свои цвета вместе с полем,
                  а рамки и белое поле карточки остаются в негативе. */}
              {/* biome-ignore lint/performance/noImgElement: статический экспорт, файлы из public как есть */}
              <img src={c.image} alt="" style={{ background: c.color }} />
            </div>
            <span className={styles.badge}>{num(i)}</span>
          </figure>
        ))}
        {cases.map((c, i) => (
          <div
            key={c.title}
            ref={(el) => {
              captionRefs.current[i] = el;
            }}
            className={styles.caption}
          >
            <p className={styles.count}>
              {num(i)} <span>/ {num(N - 1)}</span>
            </p>
            <h3 className={styles.title}>{c.title}</h3>
            <dl className={styles.meta}>
              <dt>Клиент</dt>
              <dd>{c.client}</dd>
              <dt>Тип</dt>
              <dd>{c.type}</dd>
              <dt>Год</dt>
              <dd>{c.year}</dd>
            </dl>
            <p className={styles.result}>{c.result}</p>
            <p className={styles.resultNote}>{c.resultNote}</p>
            {c.href && (
              <Link href={c.href} className={styles.link}>
                Смотреть кейс →
              </Link>
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
            <span>
              {c.type} · {c.year}
            </span>
          </p>
        ))}
        <div ref={finaleRef} className={styles.finale}>
          <p className={styles.finaleTitle}>
            Работы <sup>({num(N - 1)})</sup>
          </p>
          <p className={styles.finaleLine}>{FINALE_LINE}</p>
          <button type="button" className={styles.button} onClick={toBrief}>
            Запросить портфолио
          </button>
        </div>
      </div>
      <span ref={dropRef} className={styles.drop} aria-hidden="true" />
      <r3fTunnel.In>
        <Scene3R3F progressRef={progressRef} streamRef={streamRef} />
      </r3fTunnel.In>
    </section>
  );
}
