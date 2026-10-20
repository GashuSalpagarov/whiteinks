"use client";

import { invalidate } from "@react-three/fiber";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useLenis } from "@/app/providers";
import { onScroll, setVar, viewportH } from "@/lib/scroll/onScroll";
import { r3fTunnel } from "@/r3f/tunnel";
import { CARDS_CONTENT, FINALE_LINE, LEAD } from "./cardsData";
import styles from "./Scene3.module.css";
import { Scene3R3F } from "./Scene3R3F";

// Ход сцены — в экранах прокрутки, u: 0 — sticky встал (точка вошла в сцену), TOTAL — sticky
// отпускает: сетка уезжает вверх вместе со страницей, а Сцена 4 роняет точку по линии вниз.
const ENTRY = 0.3; // заголовок «Работы»
const STEP = 0.8; // отрезок одной карточки
const FINALE = 0.5; // сборка сетки и пауза
const N = CARDS_CONTENT.length; // сетка финала — 2×2, под четыре кейса
const FINALE_AT = ENTRY + STEP * N;
const TOTAL = FINALE_AT + FINALE;

// Отрезок карточки: вылетает из точки (на 0.1 раньше начала отрезка — пока гаснет прошлая;
// первая — когда гаснет заголовок), за APPROACH долетает до окна чтения, стоит HOLD (половину
// отрезка), за DEPART улетает.
const APPROACH = 0.3;
const HOLD = 0.4;
const DEPART = 0.2;
const START_SCALE = 0.04; // размер у точки — доля размера в окне чтения
const DEPART_SCALE = 0.35; // на столько вырастает, улетая: до шапки не дотягивается
const ASSEMBLE = 0.3; // карточки вылетают из точки по местам сетки
const STAGGER = 0.03; // вразнобой, по очереди

const DOT_Y = 20; // --drop-offset: точка на 20px ниже центра экрана, как в Сценах 2 и 4
const GAP = 48; // от точки до карточки в окне чтения
const CAPTION_GAP = 80; // от точки до подписи: у точки гуще всего частицы
const GRID_GAP = 24;
const LABEL_H = 40; // подпись под плиткой сетки
const TILT = 8; // град, поворот карточки в туннеле

const launchAt = (i: number) => Math.max(ENTRY, ENTRY + STEP * i - 0.1);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = (t: number) => t * (2 - t);
const num = (i: number) => String(i + 1).padStart(2, "0");
// Карточка: поля 12px и рамки 1.5px вокруг картинки 4:3 (Scene3.module.css).
const cardH = (w: number) => 27 + 0.75 * (w - 27);
const fitW = (maxH: number) => (maxH - 27) / 0.75 + 27;

type Box = { x: number; y: number; w: number; h: number };

// Раскладка экрана: окно чтения каждой карточки и её подписи, плитки сетки (перекрестье —
// в точке), блок финала. Широкий экран: карточки по очереди слева и справа от точки, подпись —
// с другой стороны. Портрет (телефон): карточка над точкой, подпись под ней.
function layout(w: number, h: number) {
  const dx = w / 2;
  const dy = h / 2 + DOT_Y;
  const portrait = w < h;
  const read: Box[] = [];
  const caption: Box[] = [];
  const tilt: number[] = [];
  for (let i = 0; i < N; i++) {
    if (portrait) {
      const cw = Math.min(w - 40, fitW(dy - 24 - 84));
      const ch = cardH(cw);
      read.push({ x: (w - cw) / 2, y: dy - 24 - ch, w: cw, h: ch });
      caption.push({ x: 20, y: dy + 28, w: w - 40, h: 0 });
      tilt.push(0);
      continue;
    }
    const left = i % 2 === 0;
    const cw = Math.min(dx - GAP - 64, fitW(h - 240));
    const ch = cardH(cw);
    const capW = Math.min(Math.max(440, 0.29 * w), dx - CAPTION_GAP - 64);
    read.push({ x: left ? dx - GAP - cw : dx + GAP, y: dy - ch / 2, w: cw, h: ch });
    caption.push({
      x: left ? dx + CAPTION_GAP : dx - CAPTION_GAP - capW,
      y: dy - ch / 2 + 8,
      w: capW,
      h: 0,
    });
    tilt.push(left ? TILT : -TILT);
  }
  const gap = portrait ? 12 : GRID_GAP;
  const textW = Math.max(200, Math.min(320, 0.17 * w));
  const tw = Math.min(
    portrait ? (w - 40 - gap) / 2 : dx - gap / 2 - 48 - textW - 32,
    fitW(dy - gap / 2 - 84 - LABEL_H),
    fitW(h - dy - gap / 2 - 24 - LABEL_H),
  );
  const th = cardH(tw);
  const tile: Box[] = [0, 1, 2, 3].map((i) => ({
    x: i % 2 ? dx + gap / 2 : dx - gap / 2 - tw,
    y: i < 2 ? dy - gap / 2 - LABEL_H - th : dy + gap / 2,
    w: tw,
    h: th,
  }));
  const bottom = dy + gap / 2 + th + LABEL_H;
  const finale = portrait
    ? { x: 20, y: bottom + 24, w: w - 40 }
    : { x: dx + gap / 2 + tw + 48, y: dy, w: textW };
  return { dx, dy, portrait, read, caption, tilt, tile, finale, bottom };
}

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
      s = 1 + DEPART_SCALE * k * k;
      o = 1 - k;
    }
  }
  const cx = L.dx + (target.x + target.w / 2 - L.dx) * s;
  const cy = L.dy + (target.y + target.h / 2 - L.dy) * s;
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
  const introRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const captionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const labelRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const exitRef = useRef<HTMLDivElement>(null);
  const finaleRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const opacityRef = useRef(0);
  const lenis = useLenis();

  // Пока страниц кейсов нет — к брифу (Сцена 5), как «Связаться» в Hero.
  const toBrief = () => {
    const brief = document.querySelector<HTMLElement>('[data-scene="scene5"]');
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
      const u = reduced ? (rect.top <= 0 ? TOTAL : 0) : Math.max(0, Math.min(TOTAL, -rect.top / h));
      const stage = u >= FINALE_AT ? "grid" : "tunnel";
      const vp = `${w}x${h}`;
      if (vp !== viewport || !L) {
        viewport = vp;
        L = layout(w, h);
        written.clear();
        for (let i = 0; i < N; i++) {
          place(captionRefs.current[i], L.caption[i]);
          const t = L.tile[i];
          place(labelRefs.current[i], { x: t.x, y: t.y + t.h + 8, w: t.w });
        }
        place(finaleRef.current, L.finale);
        if (finaleRef.current) finaleRef.current.dataset.side = L.portrait ? "below" : "right";
        place(exitRef.current, { x: L.dx, y: L.dy, w: 3, h: L.bottom - L.dy });
      }
      // Номер на карточке — только в туннеле; карточки — на своих местах этапа.
      const sticky = stickyRef.current;
      if (sticky && (sticky.dataset.stage !== stage || written.size === 0)) {
        sticky.dataset.stage = stage;
        for (let i = 0; i < N; i++) place(cardRefs.current[i], boxOf(L, i, u));
      }
      // Заголовок — с первого кадра сцены; гаснет, пока из точки вылетает первая карточка.
      const out = clamp01((u - ENTRY) / 0.1);
      put(introRef.current, Math.min(clamp01(u / 0.03), 1 - out), `translateY(${-24 * out}px)`);

      let reading = 0; // насколько видна подпись: поток под ней приглушаем
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
        reading = Math.max(reading, co);
        const f1 = FINALE_AT + i * STAGGER + ASSEMBLE;
        put(labelRefs.current[i], clamp01((u - f1 + 0.08) / 0.1));
      }
      // Поток частиц: с первого кадра, под подписью — вполсилы, к сборке сетки гаснет.
      // Канвас рисует по запросу (frameloop="demand"): сдвинулся p или поток — нужен кадр.
      const p = u / TOTAL;
      const flow =
        clamp01(u / 0.15) * (1 - 0.6 * reading) * (1 - clamp01((u - FINALE_AT + 0.15) / 0.25));
      if (p !== progressRef.current || flow !== opacityRef.current) invalidate();
      progressRef.current = p;
      opacityRef.current = flow;

      const fo = clamp01((u - FINALE_AT - 0.15) / 0.15);
      put(exitRef.current, fo);
      put(finaleRef.current, fo);
      // Кнопка в фокусе и под курсором — только пока финал виден.
      const vis = fo > 0 ? "visible" : "hidden";
      if (finaleRef.current && finaleRef.current.style.visibility !== vis) {
        finaleRef.current.style.visibility = vis;
      }

      // Точка видна всю сцену: из неё вылетают карточки, в финале она — в перекрестье сетки.
      setVar("--drop-opacity", "1");
      if (u > 0) {
        setVar("--drop-offset", `${DOT_Y}px`);
        setVar("--canvas-y", `${DOT_Y}px`); // центр канваса (откуда летят частицы) — в точке
      } else {
        setVar("--canvas-y", "0px");
      }
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
        <div ref={introRef} className={styles.intro}>
          <h2 className={styles.introTitle}>Работы</h2>
          <p className={styles.introLead}>{LEAD}</p>
        </div>
        {cases.map((c, i) => (
          <figure
            key={c.title}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            className={styles.card}
            style={{ zIndex: N - i }}
          >
            <div className={styles.preview} style={{ background: c.color }}>
              {/* biome-ignore lint/performance/noImgElement: статический экспорт, файлы из public как есть */}
              <img src={c.image} alt="" />
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
              {num(i)} · {c.title}
            </span>
            <span>
              {c.type} · {c.year}
            </span>
          </p>
        ))}
        <div ref={exitRef} className={styles.exit} />
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
      <r3fTunnel.In>
        <Scene3R3F progressRef={progressRef} opacityRef={opacityRef} />
      </r3fTunnel.In>
    </section>
  );
}
