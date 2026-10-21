"use client";

import { useEffect, useRef } from "react";
import { dropRest } from "@/components/scenes/Scene3/Scene3";
import { onScroll, viewportH } from "@/lib/scroll/onScroll";
import { PathLine, paintLine, placeLine } from "./PathLine";
import styles from "./Scene4.module.css";
import { paintList, StageList } from "./StageList";
import { captionAt, dropAt, fanAt, N, STEPS, sceneAt, TOTAL_SCREENS, TOTAL_TERM } from "./stages";

const DOT_R = 6; // px, радиус точки (как .drop в Hero, 12px)

// Точка входа — где Сцена 3 оставляет точку, когда отпускает свой sticky: место покоя под её
// сеткой (dropRest в Scene3.tsx — один источник для обеих сцен). Отсюда точка уходит под веер.
const entryPoint = (w: number, h: number) => dropRest(w, h);

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const num = (i: number) => String(i + 1).padStart(2, "0");
// Карточка: поля 12px и рамки 1.5px вокруг картинки 4:3 (как в Сцене 3).
const cardH = (w: number) => 27 + 0.75 * (w - 27);
const fitW = (h: number) => (h - 27) / 0.75 + 27;

// entry — точка входа на экране, ax/py — ось веера (там встаёт капля), D — шаг веера, град.
// Линия — только на выходе: в координатах кадра от оси до его низа, видна её часть до капли.
type Geo = {
  key: string;
  entry: { x: number; y: number };
  ax: number;
  py: number;
  D: number;
  top: number;
  span: number;
};

export function Scene4() {
  const sectionRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLOListElement>(null);
  const capRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const lineRef = useRef<HTMLDivElement>(null);
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
    const mark = (el: HTMLElement | null, name: string, value: string) => {
      if (el && el.dataset[name] !== value) el.dataset[name] = value;
    };

    // Раскладка — при смене размера экрана. Широкий экран: заголовок и чек-лист слева, веер
    // по центру (ось — на 0.8 высоты), подпись справа от него. Короткий ландшафт — так же,
    // всё мельче. Телефон и планшет в портрете: заголовок, чек-лист и подпись сверху, веер
    // внизу.
    const layout = (w: number, h: number, key: string): Geo => {
      const mode =
        w >= 700 && h <= 500 ? "short" : w >= 768 && !(w < h && w < 1000) ? "wide" : "tall";
      sticky.dataset.mode = mode;
      // Низкий телефон: в чек-листе только номера строкой, без строки «срок этапа» — веер влезает.
      const low = mode === "tall" && h < 600;
      sticky.dataset.low = String(low);
      const dx = w / 2;
      const entry = entryPoint(w, h);
      const head = headRef.current;
      const map = mapRef.current;
      const caps = capRefs.current;
      const capH = () => Math.max(...caps.map((c) => c?.offsetHeight ?? 0));
      let py: number;
      let cw: number;
      let r0: number;
      let D: number;
      if (mode === "tall") {
        place(head, 20, 84, w - 40);
        place(map, low ? 20 : 44, bottom(head) + 12, w - (low ? 40 : 64));
        const top = bottom(map) + 18;
        for (const c of caps) place(c, 20, top, w - 40);
        py = Math.round(h - (low ? 64 : h < 720 ? 96 : 116));
        r0 = 22;
        D = h < 720 ? 9 : 7.5;
        // Веер — между подписью и осью: раскрытый, он на ~8% выше стоящей карточки.
        const room = py - (top + capH()) - 16;
        const pref = h < 720 ? 150 : w >= 600 ? Math.min(320, 0.42 * w) : Math.min(220, 0.56 * w);
        cw = Math.max(96, Math.min(pref, fitW(room / 1.08 - r0)));
      } else {
        const short = mode === "short";
        place(head, 32, short ? 78 : 96, short ? 0.45 * w : Math.min(560, w - 64));
        place(map, short ? 32 : 56, bottom(head) + (short ? 12 : 40));
        // Короткий ландшафт: под осью — место для нижних углов раскрытого веера, над ним —
        // ниже заголовка.
        py = Math.round(short ? h - 56 : 0.8 * h);
        r0 = short ? 22 : 40;
        D = short ? 7 : 13;
        cw = short
          ? Math.min(0.3 * w, fitW((py - r0 - bottom(head) - 14) / 1.06))
          : Math.min(400, 0.26 * w);
        const x = dx + cw / 2 + (short ? 32 : 56);
        for (const c of caps) place(c, x, 0, w - 32 - x);
        const ch = cardH(cw);
        const y = short
          ? Math.max(84, py - r0 - ch / 2 - capH() / 2)
          : Math.max(150, py - r0 - ch - 10 + (ch - capH()) / 2 - 40);
        for (const c of caps) place(c, x, y);
      }
      const ch = cardH(cw);
      for (const card of cardRefs.current) {
        place(card, dx - cw / 2, py - r0 - ch, cw, ch);
        if (card) card.style.transformOrigin = `${cw / 2}px ${ch + r0}px`;
      }
      // Линия — от оси вниз: её рисует падающая капля, у низа кадра её продолжает трасса Сцены 5.
      const top = py;
      const span = h - top;
      placeLine(lineRef.current, dx, top, span);
      return { key, entry, ax: dx, py, D, top, span };
    };

    const update = () => {
      const rect = section.getBoundingClientRect();
      // Высота экрана — общая для сцен (на телефоне не прыгает с панелью браузера).
      const h = viewportH();
      const w = window.innerWidth;
      if (!(rect.height > 0) || !h) return;
      // s — экраны от входа секции снизу (когда отпускает sticky Сцены 3); s = 1 — сцена
      // встала на место.
      const s = Math.max(0, Math.min(TOTAL_SCREENS, (h - rect.top) / h));
      const key = `${w}x${h}`;
      if (geo?.key !== key) {
        geo = layout(w, h, key);
        written.clear();
      }
      const { entry, ax, py, D, top, span } = geo;
      const sc = sceneAt(s);

      // Веер: rel — 0 стоит прямо, > 0 уже в веере слева, (−1; 0) — выходит справа.
      const q = fanAt(sc, reduced);
      for (let j = 0; j < N; j++) {
        const rel = q - j;
        const card = cardRefs.current[j];
        // Ещё не вышедшая — без поворота: повёрнутая вправо, она расширяла бы страницу.
        if (rel <= -1) put(card, 0);
        else put(card, clamp01((rel + 1) / 0.45), `rotate(${(-D * rel).toFixed(2)}deg)`);
        mark(card, "on", j === sc.stage && sc.out === 0 ? "true" : "false");
      }
      paintList(mapRef.current, sc, reduced);
      for (let j = 0; j <= N; j++) {
        const o = captionAt(j, sc, reduced);
        put(capRefs.current[j], o, `translateY(${((1 - o) * 12).toFixed(1)}px)`);
      }

      // Капля. До входа сцены точкой управляет Сцена 3 — не трогаем. Общую точку (.drop) Сцена 3
      // гасит уже со сборки сетки, а ровно на её месте встаёт своя — её двигаем своим transform:
      // переменные на корне каждым кадром пересчитывали бы стили всей страницы.
      if (s <= 0) {
        put(dotRef.current, 0);
        return;
      }
      const { lead, fall } = dropAt(sc);
      // Как только Сцена 3 отпустила сетку, точка остаётся на месте покоя, а страница едет
      // вверх: веер въезжает снизу, его ось подхватывает точку и уводит на место (если место
      // покоя выше оси — на телефоне, — точка за время входа опускается к ней). Дальше точка
      // стоит под веером, без линии. В конце капля падает из оси за нижний край кадра, за ней —
      // линия, её дальше продолжает трасса Сцены 5. Кадр уходит вверх со страницей.
      const frame = rect.top > 0 ? rect.top : Math.min(0, rect.bottom - h); // верх кадра
      const x = fall > 0 ? ax : lerp(entry.x, ax, lead);
      const y =
        fall > 0
          ? lerp(py, h + 2 * DOT_R, fall * fall) + frame
          : Math.min(frame + py, entry.y + Math.max(0, py - entry.y) * lead);
      const line = reduced || fall >= 1 ? 1 : fall > 0 ? clamp01((y - frame - top) / span) : 0;
      paintLine(lineRef.current, line);
      put(
        dotRef.current,
        reduced || fall >= 1 ? 0 : 1,
        `translate(${x.toFixed(2)}px,${y.toFixed(2)}px)`,
      );
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
        {/* Первой — линия идёт под текстом и под карточками. */}
        <PathLine ref={lineRef} />
        <div ref={headRef} className={styles.head}>
          <h2 className={styles.title}>
            Как мы работаем <sup>({String(N).padStart(2, "0")})</sup>
          </h2>
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
            <div className={styles.preview} style={{ background: step.color }}>
              {/* biome-ignore lint/performance/noImgElement: статический экспорт, файлы из public как есть */}
              <img src={step.image} alt="" />
            </div>
            <span className={styles.badge}>{num(i)}</span>
          </figure>
        ))}
        <div
          ref={(el) => {
            capRefs.current[0] = el;
          }}
          className={styles.caption}
        >
          <p className={styles.count}>{String(N).padStart(2, "0")} этапов</p>
          <h3 className={styles.capTitle}>Весь путь</h3>
          <dl className={styles.meta}>
            <dt>От</dt>
            <dd>первого звонка</dd>
            <dt>До</dt>
            <dd>живого сайта и поддержки</dd>
          </dl>
          <p className={styles.term}>{TOTAL_TERM}</p>
          <p className={styles.note}>обычно, от брифа до запуска</p>
        </div>
        {STEPS.map((step, i) => (
          <div
            key={step.word}
            ref={(el) => {
              capRefs.current[i + 1] = el;
            }}
            className={styles.caption}
          >
            <p className={styles.count}>
              {num(i)} <span>/ {String(N).padStart(2, "0")}</span>
            </p>
            <h3 className={styles.capTitle}>{step.word}</h3>
            <dl className={styles.meta}>
              <dt>Делаем</dt>
              <dd>{step.does}</dd>
              <dt>Получаете</dt>
              <dd>{step.gets}</dd>
            </dl>
            <p className={styles.term}>{step.term}</p>
            <p className={styles.note}>срок этапа</p>
          </div>
        ))}
      </div>
      <span ref={dotRef} className={styles.dot} aria-hidden="true" />
    </section>
  );
}
