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

// Раскладка картинок каждого слайда — по утверждённому макету (экран 1600×853): left, top
// и width — доли экрана, четвёртое — пропорция (ширина / высота), её держим точно. Телефон:
// большая (первая) слева или справа над заголовком, band — какая из двух других под индикатором.
type Spec = readonly [left: number, top: number, width: number, aspect: number];
type Layout = { desk: readonly Spec[]; left: boolean; band: 1 | 2 };
const LAYOUTS: readonly Layout[] = [
  {
    desk: [
      [0.641, 0.072, 0.3, 3 / 2],
      [0.847, 0.49, 0.132, 3 / 5],
      [0.591, 0.65, 0.171, 1],
    ],
    left: false,
    band: 2,
  },
  {
    desk: [
      [0.691, 0.061, 0.25, 1],
      [0.588, 0.617, 0.141, 3 / 4],
      [0.765, 0.584, 0.221, 3 / 2],
    ],
    left: true,
    band: 1,
  },
  {
    desk: [
      [0.765, 0.055, 0.218, 3 / 4],
      [0.547, 0.099, 0.176, 1],
      [0.632, 0.661, 0.288, 16 / 9],
    ],
    left: false,
    band: 2,
  },
  {
    desk: [
      [0.579, 0.066, 0.347, 3 / 2],
      [0.871, 0.485, 0.118, 2 / 3],
      [0.685, 0.678, 0.153, 1],
    ],
    left: true,
    band: 1,
  },
];

const hit = (a: Box, b: Box) => a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;
const grow = (b: Box, d: number): Box => ({ l: b.l - d, t: b.t - d, r: b.r + d, b: b.b + d });

// Варианты, как картинке r уйти от o: четыре сдвига и четыре обрезки со стороны o (дальний
// край и центр по другой оси на месте), пропорция a сохраняется.
function dodge(r: Box, o: Box, a: number): Box[] {
  const w = r.r - r.l;
  const h = r.b - r.t;
  const cx = (r.l + r.r) / 2;
  const cy = (r.t + r.b) / 2;
  const byW = (l: number, rr: number) => ({
    l,
    r: rr,
    t: cy - (rr - l) / a / 2,
    b: cy + (rr - l) / a / 2,
  });
  const byH = (t: number, b: number) => ({
    l: cx - ((b - t) * a) / 2,
    r: cx + ((b - t) * a) / 2,
    t,
    b,
  });
  return [
    { l: o.r, r: o.r + w, t: r.t, b: r.b },
    { l: o.l - w, r: o.l, t: r.t, b: r.b },
    { l: r.l, r: r.r, t: o.b, b: o.b + h },
    { l: r.l, r: r.r, t: o.t - h, b: o.t },
    byW(o.r, r.r),
    byW(r.l, o.l),
    byH(o.b, r.b),
    byH(r.t, o.t),
  ];
}

// Внутрь рамки k: сдвиг, а если не влезает — уменьшение с центром на месте.
function clamp(r: Box, k: Box): Box {
  const w = r.r - r.l;
  const h = r.b - r.t;
  const s = Math.min(1, (k.r - k.l) / w, (k.b - k.t) / h);
  const l = Math.max(k.l, Math.min(r.l + (w - w * s) / 2, k.r - w * s));
  const t = Math.max(k.t, Math.min(r.t + (h - h * s) / 2, k.b - h * s));
  return { l, t, r: l + w * s, b: t + h * s };
}

// Места для картинки без наложений на blocks, лучшие первыми: крупнее и ближе к макету.
function spots(r0: Box, a: number, blocks: Box[], k: Box): { r: Box; sc: number }[] {
  const out: { r: Box; sc: number }[] = [];
  const visit = (r: Box, depth: number) => {
    if (r.r - r.l < 72 || r.b - r.t < 72) return;
    const c = clamp(r, k);
    if (c.r - c.l < 72 || c.b - c.t < 72) return;
    const o = blocks.find((b) => hit(c, b));
    if (!o) {
      const d = Math.hypot(c.l + c.r - r0.l - r0.r, c.t + c.b - r0.t - r0.b) / 2;
      out.push({ r: c, sc: (c.r - c.l) * (c.b - c.t) * Math.exp(-d / 120) });
    } else if (depth < 3) for (const n of dodge(c, o, a)) visit(n, depth + 1);
  };
  visit(r0, 0);
  const seen = new Set<string>();
  return out
    .sort((x, y) => y.sc - x.sc)
    .filter(({ r }) => {
      const key = [r.l, r.t, r.r].map(Math.round).join();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

// Картинки по порядку; для каждой пробуем 6 лучших мест вместе с лучшей раскладкой остальных.
type Plan = { sc: number; list: (Box | null)[] };
function arrange(rs: Box[], as: number[], blocks: Box[], k: Box): Plan {
  if (!rs.length) return { sc: 0, list: [] };
  let best: Plan | null = null;
  for (const { r, sc } of spots(rs[0], as[0], blocks, k).slice(0, 6)) {
    const rest = arrange(rs.slice(1), as.slice(1), [...blocks, grow(r, 16)], k);
    if (!best || sc + rest.sc > best.sc) best = { sc: sc + rest.sc, list: [r, ...rest.list] };
  }
  if (best) return best;
  const rest = arrange(rs.slice(1), as.slice(1), blocks, k);
  return { sc: rest.sc, list: [null, ...rest.list] };
}

// Десктоп: места из макета (центр — в долях экрана, размер — от меньшего из масштабов по
// ширине и высоте), затем без наложений: не ближе 16px к кнопке, номерам индикатора, подводке
// и друг к другу, ниже шапки (88px), не за край и не левее подводки (там линия и заголовок).
// Подводке можно уступить, только если иначе картинки не помещаются.
function desktop(W: number, H: number, lead: Box, cta: Box, dots: Box, { desk }: Layout): Rect[] {
  const s = Math.min(W / 1600, H / 853);
  const rs = desk.map(([l, t, w, a]) => {
    const cx = (l + w / 2) * W;
    const cy = (t + (w * 1600) / a / 853 / 2) * H;
    const hw = (w * 1600 * s) / 2;
    return { l: cx - hw, r: cx + hw, t: cy - hw / a, b: cy + hw / a };
  });
  const as = desk.map((d) => d[3]);
  const k = { l: lead.l - 8, t: 88, r: W - 16, b: H - 16 };
  const ui = [grow(cta, 16), grow({ ...dots, t: dots.t + 13, b: dots.b - 13 }, 16)];
  let { list } = arrange(rs, as, [...ui, grow(lead, 16)], k);
  if (list.includes(null)) list = arrange(rs, as, ui, k).list;
  return list.map((r) => r && [r.l, r.t, r.r - r.l, r.b - r.t]);
}

// Телефон: над заголовком (ниже полосы шапки 72px) — большая и меньшая рядом, большая слева
// или справа; под индикатором (12px от номеров) — третья у левого поля, над кнопкой (12px)
// и левее середины экрана (линия туда не заходит). Мало места — меньше, совсем мелких нет.
function phone(
  W: number,
  title: number,
  dots: Box,
  cta: Box,
  { desk, left, band }: Layout,
): Rect[] {
  const a = desk.map((d) => d[3]);
  const small = 3 - band;
  const top = 88;
  const free = title - 12 - top;
  const h = Math.min(free, (W - 56) / (a[0] + 0.8 * a[small]));
  const hs = 0.8 * h;
  const bandTop = dots.b - 2;
  const bh = cta.t - 12 - bandTop;
  const hb = Math.min(bh, (W / 2 - 36) / a[band]);
  const out: Rect[] = [null, null, null];
  if (h >= 64) out[0] = [left ? 20 : W - 20 - h * a[0], top + (free - h) / 2, h * a[0], h];
  if (Math.min(hs, hs * a[small]) >= 48) {
    out[small] = [left ? W - 20 - hs * a[small] : 20, title - 12 - hs, hs * a[small], hs];
  }
  if (Math.min(hb, hb * a[band]) >= 48) out[band] = [20, bandTop + (bh - hb) / 2, hb * a[band], hb];
  return out;
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
    const ctaEl = root?.querySelector<HTMLElement>(`.${styles.cta}`);
    const dotsEl = root?.querySelector<HTMLElement>(`.${styles.dots}`);
    if (!root || !h1 || !leadEl || !ctaEl || !dotsEl) return;
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
          (row.children[i] as HTMLElement).style.setProperty(
            "--fit",
            `${Number.isFinite(fit) ? fit : 1}`,
          );
        }
      });

      const lead = box(leadEl);
      root.style.setProperty("--lead-b", `${lead.b}px`);
      const H = viewportH();
      const cta = box(ctaEl);
      const dots = box(dotsEl);
      // Места картинок всех слайдов подряд: по три на слайд, в порядке slides.ts.
      const rects = matchMedia("(max-height: 500px)").matches
        ? []
        : SLIDES.flatMap((_, i) => {
            const at = LAYOUTS[i % LAYOUTS.length];
            return mobile
              ? phone(W, rows[0].offsetTop, dots, cta, at)
              : desktop(W, H, lead, cta, dots, at);
          });
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
      {SLIDES.map((s, i) =>
        s.images.map((im, k) => (
          <div
            key={`${s.title[0]} ${im.src}`}
            className={styles.slot}
            style={{ "--i": k } as CSSProperties}
          >
            {/* biome-ignore lint/performance/noImgElement: статический экспорт, файлы из public как есть */}
            <img
              className={on(i)}
              src={im.src}
              alt=""
              style={im.bg ? { background: im.bg, objectFit: "contain" } : undefined}
            />
          </div>
        )),
      )}

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
