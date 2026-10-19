"use client";

import {
  type CSSProperties,
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from "react";
import { LOOP_EVENT } from "@/components/scenes/Footer";
import { onScroll, viewportH } from "@/lib/scroll/onScroll";
import styles from "./Hero.module.css";
import { SLIDES } from "./slides";

// Слайды Hero: заголовок (по буквам), подводка и три картинки. Листаются сами каждые 5 с — по
// animationend полоски активного номера (5 с в CSS), поэтому пауза — это просто пауза анимации
// (Hero ушёл с экрана, вкладка скрыта), а без анимаций (reduced motion) автопрокрутки нет.
// Отсчёт первого слайда — после интро; новый круг пути — сразу слайд 1 и отсчёт заново.
const INTRO_MS = 7200; // как в HeroScrollLock
const ROWS = [styles.word1, styles.word2, styles.word3];

type Rect = readonly [x: number, y: number, w: number, h: number] | null;
type Box = { l: number; t: number; r: number; b: number };

const box = (el: HTMLElement): Box => ({
  l: el.offsetLeft,
  t: el.offsetTop,
  r: el.offsetLeft + el.offsetWidth,
  b: el.offsetTop + el.offsetHeight,
});

// Один раз (шрифт не меняется): ширины слов в долях кегля и кернинг для букв. Буквы — отдельные
// inline-block, кернинг между ними теряется; возвращаем его отступом справа, чтобы на смене
// буквы стояли ровно там же, где цельное слово (иначе в «Ра» скачок до 5px).
function measure(h1: HTMLElement): number[][] {
  const probe = document.createElement("span");
  probe.style.cssText = "position:absolute;visibility:hidden;white-space:pre";
  h1.append(probe);
  const size = Number.parseFloat(getComputedStyle(h1).fontSize);
  const cache = new Map<string, number>();
  const em = (s: string) => {
    let v = cache.get(s);
    if (v === undefined) {
      probe.textContent = s;
      v = probe.getBoundingClientRect().width / size;
      cache.set(s, v);
    }
    return v;
  };
  for (const letters of h1.querySelectorAll<HTMLElement>(`.${styles.letters}`)) {
    const ch = [...letters.children] as HTMLElement[];
    ch.forEach((el, i) => {
      const a = el.textContent ?? "";
      const b = ch[i + 1]?.textContent;
      const k = b ? em(a + b) - em(a) - em(b) : 0;
      el.style.marginRight = Math.abs(k) > 1e-4 ? `${k}em` : "";
    });
  }
  const widths = SLIDES.map((s) => s.title.map(em));
  probe.remove();
  return widths;
}

// Десктоп — россыпь вокруг подводки по утверждённому макету (1440×900, u = 14.4px): большая
// над ней справа, средняя справа, небольшая под ней правее кнопки, над индикатором.
// u — от ширины, на низких экранах от высоты. Не помещается без наложений — не показываем.
function desktop(W: number, H: number, lead: Box, cta: Box, dots: Box): Rect[] {
  const u = Math.min(W / 100, H * 0.016);
  const bottom = lead.t - 7.15 * u;
  const h0 = Math.min(16.5 * u, bottom - 96);
  const w1 = 11 * u;
  const x1 = Math.min(lead.r + 9.4 * u, W - 32 - w1);
  const y2 = lead.b + 3.1 * u;
  const h2 = Math.min(10 * u, dots.t - 2 - y2);
  const x2 = Math.max(lead.l + 11.9 * u, cta.r + 32);
  return [
    h0 >= 80 ? [lead.l + 16.3 * u, bottom - h0, (h0 * 4) / 3, h0] : null,
    x1 >= lead.r + 24 ? [x1, lead.t - 3.33 * u, w1, (w1 * 4) / 3] : null,
    h2 >= 48 && x2 + 1.4 * h2 <= W - 32 ? [x2, y2, 1.4 * h2, h2] : null,
  ];
}

// Телефон — большая справа над заголовком (ниже полосы шапки 72px), две поменьше — в полосе
// между индикатором и кнопкой: 7:5 слева сверху, 3:4 правее и ниже. Правее середины экрана
// они не заходят — линия левее неё не бывает. Мало места (короткий экран) — меньше картинок.
function phone(W: number, title: number, cta: Box, dots: Box): Rect[] {
  const top = 88;
  const h0 = Math.min(0.3 * W, title - 12 - top);
  const bandTop = dots.b + 12;
  const band = cta.t - 12 - bandTop;
  const g = Math.min(band, (W / 2 - 48) / 1.44);
  const y = bandTop + (band - g) / 2;
  return [
    h0 >= 64 ? [W - 20 - (h0 * 4) / 3, top + (title - 12 - top - h0) / 2, (h0 * 4) / 3, h0] : null,
    g >= 64 ? [20 + 0.84 * g + 12, y + 0.2 * g, 0.6 * g, 0.8 * g] : null,
    g >= 64 ? [20, y, 0.84 * g, 0.6 * g] : null,
  ];
}

export function HeroSlides({
  hero,
  children,
}: {
  hero: RefObject<HTMLElement | null>;
  children: ReactNode;
}) {
  const h1Ref = useRef<HTMLHeadingElement>(null);
  const leadRef = useRef<HTMLParagraphElement>(null);
  const dotsRef = useRef<HTMLDivElement>(null);
  // Активный слайд и только что ушедший (он уезжает вверх, остальные ждут снизу).
  const [[slide, prev], setPair] = useState<[number, number]>([0, -1]);
  const [live, setLive] = useState(false);
  const [away, setAway] = useState(false);
  const [hidden, setHidden] = useState(false);

  // Кегль длинных слов и места картинок — после загрузки шрифта и на resize (в следующем кадре:
  // к нему общий onScroll уже обновит --ih, от которой считается вёрстка на телефоне).
  useEffect(() => {
    const root = hero.current;
    const h1 = h1Ref.current;
    const leadEl = leadRef.current;
    const dotsEl = dotsRef.current;
    const ctaEl = root?.querySelector<HTMLElement>(`.${styles.cta}`);
    if (!root || !h1 || !leadEl || !dotsEl || !ctaEl) return;
    let widths: number[][] | null = null;
    let frame = 0;

    const layout = () => {
      const em = widths;
      if (!em) return;
      const W = root.clientWidth;
      const mobile = matchMedia("(max-width: 767px)").matches;
      // Слово — правым краем у линии, левее поля 32px не заходит; на телефоне — от поля 20px
      // до линии (она не левее 74% ширины на высоте заголовка) с зазором 24px.
      const size = Number.parseFloat(getComputedStyle(h1).fontSize);
      const rows = [...h1.querySelectorAll<HTMLElement>(`.${styles.word}`)];
      const room = rows.map((row) => {
        const cs = getComputedStyle(row);
        return mobile
          ? W * 0.74 - 24 - Number.parseFloat(cs.left)
          : W - Number.parseFloat(cs.right) - 32;
      });
      em.forEach((words, i) => {
        const fit = Math.min(1, ...room.map((r, k) => (r - 1) / (words[k] * size)));
        for (const row of rows) {
          // NaN в --fit делает кегль невалидным — слово схлопывается в ноль.
          (row.children[i] as HTMLElement).style.setProperty("--fit", `${Number.isFinite(fit) ? fit : 1}`);
        }
      });

      const lead = box(leadEl);
      root.style.setProperty("--lead-b", `${lead.b}px`);
      const cta = box(ctaEl);
      const dots = box(dotsEl);
      const rects = matchMedia("(max-height: 500px)").matches
        ? []
        : mobile
          ? phone(W, rows[0].offsetTop, cta, dots)
          : desktop(W, viewportH(), lead, cta, dots);
      root.querySelectorAll<HTMLElement>(`.${styles.slot}`).forEach((el, k) => {
        const r = rects[k];
        el.style.display = r ? "block" : "";
        if (!r) return;
        el.style.left = `${r[0]}px`;
        el.style.top = `${r[1]}px`;
        el.style.width = `${r[2]}px`;
        el.style.height = `${r[3]}px`;
      });
    };

    // Замер — после load: в проде гидратация бывает раньше, чем применились стили, и замер
    // по голому h1 давал NaN (заголовок пропадал при первом заходе, без кэша).
    let alive = true;
    const init = () =>
      document.fonts.ready.then(() => {
        if (!alive) return;
        widths = measure(h1);
        layout();
      });
    if (document.readyState === "complete") init();
    else window.addEventListener("load", init, { once: true });
    const onResize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(layout);
    };
    window.addEventListener("resize", onResize);
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      window.removeEventListener("load", init);
      window.removeEventListener("resize", onResize);
    };
  }, [hero]);

  // Интро и каждый новый круг пути: слайд 1, отсчёт — после интро.
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let timer = 0;
    const start = () => {
      setPair([0, -1]);
      setLive(reduced);
      clearTimeout(timer);
      if (!reduced) timer = window.setTimeout(() => setLive(true), INTRO_MS);
    };
    start();
    window.addEventListener(LOOP_EVENT, start);
    return () => {
      clearTimeout(timer);
      window.removeEventListener(LOOP_EVENT, start);
    };
  }, []);

  // Пауза: Hero ушёл с экрана (общий onScroll) или вкладка скрыта. Там же — картинки гаснут,
  // подходя к шапке: к 72px от верха (полоса шапки на телефоне, ниже логотипа, телефона
  // и бургера на десктопе) прозрачны, гаснут за 12% высоты экрана, как блоки Сцены 2.
  useEffect(() => {
    const root = hero.current;
    if (!root) return;
    const slots = [...root.querySelectorAll<HTMLElement>(`.${styles.slot}`)];
    const onVisibility = () => setHidden(document.hidden);
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    const unsubscribe = onScroll(root, () => {
      const rect = root.getBoundingClientRect();
      setAway(rect.bottom <= 0);
      for (const el of slots) {
        if (!el.offsetParent) continue;
        const room = Math.max(1, Math.min(0.12 * viewportH(), el.offsetTop - 72));
        const fade = Math.max(0, Math.min(1, (rect.top + el.offsetTop - 72) / room));
        el.style.setProperty("--fade", `${fade}`);
      }
    });
    return () => {
      unsubscribe();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [hero]);

  const n = SLIDES.length;
  const on = (i: number) => (i === slide ? ` ${styles.on}` : i === prev ? ` ${styles.out}` : "");
  const go = (i: number) => {
    if (live && i !== slide) setPair([i, slide]);
  };
  const next = () => setPair(([s]) => [(s + 1) % n, s]);

  return (
    <>
      {[0, 1, 2].map((k) => (
        <div key={k} className={styles.slot} style={{ "--i": k } as CSSProperties}>
          {SLIDES.map((s, i) => (
            // biome-ignore lint/performance/noImgElement: статический экспорт, файлы из public как есть
            <img key={s.title[0]} className={on(i)} src={s.images[k]} alt="" />
          ))}
        </div>
      ))}

      <h1 ref={h1Ref} className={styles.title}>
        <span className={styles.srOnly}>{SLIDES[slide].title.join(" ")}</span>
        {ROWS.map((row, r) => (
          <span key={row} className={`${styles.word} ${row}`} aria-hidden="true">
            {SLIDES.map((s, i) => {
              const letters = [...s.title[r]];
              return (
                <span
                  key={s.title[0]}
                  className={`${styles.sw}${on(i)}`}
                  style={{ "--n": letters.length } as CSSProperties}
                >
                  <span className={styles.whole}>{s.title[r]}</span>
                  <span className={styles.letters}>
                    {letters.map((ch, j) => (
                      // biome-ignore lint/suspicious/noArrayIndexKey: буквы повторяются, порядок постоянный
                      <span key={j} style={{ "--i": j } as CSSProperties}>
                        {ch}
                      </span>
                    ))}
                  </span>
                </span>
              );
            })}
          </span>
        ))}
      </h1>
      <p ref={leadRef} className={styles.lead}>
        {SLIDES.map((s, i) => (
          <span key={s.title[0]} className={`${styles.leadText}${on(i)}`}>
            {s.lead}
          </span>
        ))}
      </p>

      {children}

      <div
        ref={dotsRef}
        className={`${styles.dots}${live ? ` ${styles.live}` : ""}${away || hidden ? ` ${styles.paused}` : ""}`}
      >
        {SLIDES.map((s, i) => (
          <button
            key={s.title[0]}
            type="button"
            className={`${styles.dot}${i === slide ? ` ${styles.on}` : ""}`}
            aria-label={`Слайд ${i + 1} из ${n}`}
            aria-current={i === slide ? "true" : undefined}
            onClick={() => go(i)}
          >
            {String(i + 1).padStart(2, "0")}
            <span className={styles.bar} onAnimationEnd={next} />
          </button>
        ))}
      </div>
    </>
  );
}
