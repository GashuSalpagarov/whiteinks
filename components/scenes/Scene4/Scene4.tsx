"use client";

import { useEffect, useRef } from "react";
import { dropRest } from "@/components/scenes/Scene3/Scene3";
import { onScroll, viewportH } from "@/lib/scroll/onScroll";
import { PathLine, paintLine, placeLine } from "./PathLine";
import styles from "./Scene4.module.css";
import { paintList, StageList } from "./StageList";
import {
  appearAt,
  appearFrom,
  captionAt,
  dropAt,
  fanAt,
  growAt,
  N,
  STEPS,
  sceneAt,
  TOTAL_SCREENS,
  TOTAL_TERM,
} from "./stages";

const DOT_R = 6; // px, радиус точки (как .drop в Hero, 12px)
const DOT_Y = 20; // дом точки — на 20px ниже центра экрана, как в Сценах 2 и 3
const START_SCALE = 0.04; // первая карточка растёт из точки от 4% размера, как в туннеле Сцены 3
const RISE = 20; // px, на столько ниже блок слева начинает всплывать

// Точка входа — где Сцена 3 оставляет точку, когда отпускает свой sticky: место покоя под её
// сеткой (dropRest в Scene3.tsx — один источник для обеих сцен). Отсюда точка плывёт в центр
// первой карточки.
const entryPoint = (w: number, h: number) => dropRest(w, h);

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut = (t: number) => t * (2 - t);
const num = (i: number) => String(i + 1).padStart(2, "0");
// Карточка: поля 12px и рамки 1.5px вокруг картинки 4:3 (как в Сцене 3).
const cardH = (w: number) => 27 + 0.75 * (w - 27);
const fitW = (h: number) => (h - 27) / 0.75 + 27;

// entry — точка входа на экране, ax — ось веера по горизонтали, cy — центр первой карточки (там
// точка лежит под веером), lift — от него до оси, edge — от него до места, где точка ещё под
// нижним краем карточки, D — шаг веера, град. Линия — только на выходе: в координатах кадра от
// центра карточки до низа кадра (span), видна её часть до капли. appear — блоки слева и с
// какого s каждый всплывает.
type Geo = {
  key: string;
  entry: { x: number; y: number };
  ax: number;
  cy: number;
  lift: number;
  edge: number;
  D: number;
  span: number;
  appear: { el: HTMLElement; from: number }[];
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
    // Верх элемента в кадре, px.
    const topIn = (el: HTMLElement) => {
      let y = 0;
      for (let e: HTMLElement | null = el; e && e !== sticky; e = e.offsetParent as HTMLElement) {
        y += e.offsetTop;
      }
      return y;
    };
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

    // Раскладка — при смене размера экрана. Широкий экран: заголовок и чек-лист слева, веер
    // по центру (центр первой карточки — дом точки), подпись справа от него. Короткий
    // ландшафт — так же, всё мельче. Телефон и планшет в портрете: заголовок, чек-лист и подпись
    // сверху, веер внизу.
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
        // Под осью — только нижние углы раскрытого веера: на невысоком телефоне ось ниже, иначе
        // карточка заходит на подпись.
        py = Math.round(h - (h < 720 ? 64 : 116));
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
        // ниже заголовка. Широкий: первая карточка — вокруг дома точки, ось — под ней; но не
        // выше, чем на 90px под чек-листом: на узком широком экране (1024) левые карточки
        // раскрытого веера иначе заходят на его строки.
        r0 = short ? 22 : 40;
        D = short ? 7 : 13;
        py = Math.round(h - 56);
        cw = short
          ? Math.min(0.3 * w, fitW((py - r0 - bottom(head) - 14) / 1.06))
          : Math.min(400, 0.26 * w);
        if (!short) py = Math.round(Math.max(h / 2 + DOT_Y + cardH(cw) / 2 + r0, bottom(map) + 90));
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
      // Линия — из-под веера вниз: её рисует падающая капля, начало — в центре первой карточки,
      // под карточками; у низа кадра её продолжает трасса Сцены 5.
      const cy = py - r0 - ch / 2;
      placeLine(lineRef.current, dx, cy, h - cy);
      // Блоки слева всплывают по очереди: каждый — когда со страницей поднимается до линии; на
      // телефоне она выше точки (текст идёт поперёк её пути), иначе — на 0.8 экрана.
      const line = mode === "tall" ? Math.min(entry.y, cy) - 24 : 0.8 * h;
      const items = [...(head?.children ?? []), ...(map?.children ?? [])] as HTMLElement[];
      const appear = items.map((el) => ({ el, from: appearFrom(topIn(el), line, h) }));
      const edge = ch / 2 - DOT_R - 1;
      return { key, entry, ax: dx, cy, lift: ch / 2 + r0, edge, D, span: h - cy, appear };
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
      const { entry, ax, cy, lift, edge, D, span } = geo;
      // Без движения — всё сразу на местах: первая карточка уже стоит, пока сцена въезжает.
      const at = sceneAt(s);
      const sc = reduced && at.stage < 0 ? { ...at, stage: 0, u: 1 } : at;

      // Вход: заголовок, подпись под ним и строки чек-листа всплывают по очереди, пока сцена
      // въезжает; показанное дальше не гаснет.
      for (const a of geo.appear) rise(a.el, appearAt(s, a.from, reduced));

      // Веер: rel — 0 стоит прямо, > 0 уже в веере слева, (−1; 0) — выходит справа. Первая
      // карточка не выходит, а растёт из точки — из своего центра, как карточки туннеля Сцены 3:
      // от 4% размера, сначала быстро (сдвиг держит центр на месте при масштабе от оси веера).
      const q = fanAt(sc, reduced);
      const g = growAt(sc, reduced);
      for (let j = 0; j < N; j++) {
        const rel = q - j;
        const card = cardRefs.current[j];
        if (j === 0 && g < 1) {
          const k = START_SCALE + (1 - START_SCALE) * easeOut(g);
          const dy = (-(1 - k) * lift).toFixed(1);
          put(card, g > 0 ? clamp01(g / 0.32) : 0, `translateY(${dy}px) scale(${k.toFixed(4)})`);
        } else if (rel <= -1) {
          // Ещё не вышедшая — без поворота: повёрнутая вправо, она расширяла бы страницу.
          put(card, 0);
        } else put(card, clamp01((rel + 1) / 0.45), `rotate(${(-D * rel).toFixed(2)}deg)`);
        mark(card, "on", j === sc.stage && sc.out === 0 ? "true" : "false");
      }
      paintList(mapRef.current, sc, reduced);
      for (let i = 0; i < N; i++) {
        const o = captionAt(i, sc, reduced);
        put(capRefs.current[i], o, `translateY(${((1 - o) * 12).toFixed(1)}px)`);
      }

      // Капля. До входа сцены точкой управляет Сцена 3 — не трогаем. Общую точку (.drop) Сцена 3
      // гасит уже со сборки сетки, а ровно на её месте встаёт своя — её двигаем своим transform:
      // переменные на корне каждым кадром пересчитывали бы стили всей страницы. Своя точка —
      // уже с того пикселя, где секция касается низа экрана: там Сцена 3 свою гасит.
      if (rect.top > h) {
        put(dotRef.current, 0);
        return;
      }
      const { glide, fall } = dropAt(sc);
      // Как только Сцена 3 отпустила сетку, точка плывёт с места покоя под ней в центр первой
      // карточки — туда, где та окажется, когда сцена встанет на место; оттуда карточка и
      // растёт. Дальше точка лежит под веером: карточки её закрывают. На выходе капля ждёт под
      // самым нижним краем карточки (её ещё не видно), выходит из-под веера и падает за нижний
      // край кадра, за ней — линия, её дальше продолжает трасса Сцены 5. Кадр уходит вверх со
      // страницей.
      const frame = rect.top > 0 ? rect.top : Math.min(0, rect.bottom - h); // верх кадра
      const x = lerp(entry.x, ax, glide);
      const y =
        sc.out > 0 ? lerp(cy + edge, h + 2 * DOT_R, fall * fall) + frame : lerp(entry.y, cy, glide);
      const line = reduced || fall >= 1 ? 1 : fall > 0 ? clamp01((y - frame - cy) / span) : 0;
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
            <div className={styles.preview}>
              {/* Цветное поле вокруг вписанной картинки — её собственный фон: на втором круге
                  (инверсия палитры, globals.css) img возвращается в свои цвета вместе с полем. */}
              {/* biome-ignore lint/performance/noImgElement: статический экспорт, файлы из public как есть */}
              <img src={step.image} alt="" style={{ background: step.color }} />
            </div>
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
