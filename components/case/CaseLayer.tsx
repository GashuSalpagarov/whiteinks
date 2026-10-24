"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLenis } from "@/app/providers";
import { SKIP_EVENT } from "@/components/scenes/Hero/HeroScrollLock";
import { CARDS_CONTENT, cardScrollY, caseBySlug, nextCase } from "@/components/scenes/Scene3";
import { openBrief } from "@/lib/brief";
import {
  CASE_OPEN_EVENT,
  type CaseOpenDetail,
  caseHref,
  caseSlugFrom,
  HOME_HREF,
} from "@/lib/caseRoute";
import { syncScroll, viewportH } from "@/lib/scroll/onScroll";
import { SITE_TITLE } from "@/lib/site";
import { goToStation, STATIONS } from "@/lib/stations";
import styles from "./Case.module.css";
import { back, type CaseActions, CaseView, sideOf } from "./CaseView";

// Слой кейса поверх главной (вариант A «Сквозь карточку», docs/12-case-page.md). Главная под
// ним смонтирована и стоит: прокрутку держат Lenis (stop) и html[data-case-open] (overflow),
// у слоя — своя прокрутка. Адрес — /works/<slug>/ через history.pushState: «назад» браузера
// и свои кнопки выхода закрывают слой, и главная там же, где была. Переходы — Web Animations
// (transform и opacity, без своих циклов кадров); ход по прокрутке слоя — в его событии scroll.

const DOT_Y = 20; // точка — на 20px ниже центра экрана, как в туннеле Сцены 3
const FLY = 980; // мс: карточка выпрямляется и летит на зрителя — мы проходим сквозь неё
const T0 = 640; // мс: с этого момента из точки собирается первый экран кейса
const FADE = 300; // мс: без движения (prefers-reduced-motion) — затухание
const SWAP = 0.96; // доля блока «Дальше»: первый экран следующего кейса собран — подмена
const SCROLL_KEYS = new Set(["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "]);
const PRICES = STATIONS.findIndex((s) => s.scene === "scene5");

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const prog = (v: number, a: number, b: number) => clamp01((v - a) / (b - a));
const out2 = (t: number) => 1 - (1 - t) ** 2;
const out3 = (t: number) => 1 - (1 - t) ** 3;
const in3 = (t: number) => t ** 3;
const io2 = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const OUT2 = "cubic-bezier(0.5, 1, 0.89, 1)";
const OUT3 = "cubic-bezier(0.33, 1, 0.68, 1)";
const IO2 = "cubic-bezier(0.45, 0, 0.55, 1)";

const titleOf = (slug: string) =>
  `${CARDS_CONTENT.find((c) => c.slug === slug)?.title ?? ""} — кейс White Inks`;
const vp = () => ({ x: window.innerWidth / 2, y: viewportH() / 2 + DOT_Y });
type Point = ReturnType<typeof vp>;

// Карточка Сцены 3, сквозь которую входим и выходим, и её подпись.
type Source = { card: HTMLElement; caption: HTMLElement | null };

// Карточка кейса на главной и подпись с её ссылкой «Смотреть кейс →» — если карточка сейчас
// видна (стоит в окне чтения или в сетке).
function sourceOf(slug: string): Source | null {
  const card = document.querySelector<HTMLElement>(`[data-case="${slug}"]`);
  const r = card?.getBoundingClientRect();
  if (!card || !r || Number.parseFloat(card.style.opacity) < 0.5) return null;
  if (r.bottom < 0 || r.top > window.innerHeight) return null;
  const link = [...document.querySelectorAll<HTMLElement>(`a[href="${caseHref(slug)}"]`)].find(
    (a) => a !== card && !a.closest("[role=dialog]"),
  );
  return { card, caption: link?.parentElement ?? null };
}

// Копия карточки поверх всего — летит она, а сама карточка на это время скрыта. Место — как
// у карточки на экране: её место в sticky Сцены 3 плюс transform, который пишет Сцена 3.
function makeFlyer(card: HTMLElement, holder: HTMLElement) {
  const sticky = card.offsetParent as HTMLElement;
  const r = sticky.getBoundingClientRect();
  const el = card.cloneNode(true) as HTMLElement;
  el.removeAttribute("href");
  el.removeAttribute("data-case");
  el.setAttribute("aria-hidden", "true");
  const box = {
    x: r.left + Number.parseFloat(card.style.left),
    y: r.top + Number.parseFloat(card.style.top),
    w: card.offsetWidth,
    h: card.offsetHeight,
  };
  el.style.left = `${box.x}px`;
  el.style.top = `${box.y}px`;
  el.style.visibility = "";
  el.style.pointerEvents = "none"; // у карточки-ссылки свои pointer-events
  // Номер в сетке спрятан (Scene3.module.css) — у копии так же.
  const badge = card.lastElementChild;
  const copy = el.lastElementChild as HTMLElement | null;
  if (badge && copy) copy.style.opacity = getComputedStyle(badge).opacity;
  holder.append(el);
  const m =
    /translate\((-?[\d.]+)px, (-?[\d.]+)px\) scale\((-?[\d.]+)\).*rotateY\((-?[\d.]+)deg\)/.exec(
      card.style.transform,
    );
  const pose = m ? { x: +m[1], y: +m[2], s: +m[3], tilt: +m[4] } : { x: 0, y: 0, s: 1, tilt: 0 };
  const o = Number.parseFloat(card.style.opacity) || 1;
  return { el, box, pose, o };
}

// Пролёт: карточка выпрямляется, её центр идёт к точке схода, сама она растёт впятеро и гаснет.
// Кадры — по формулам макета (у размера, сдвига и наклона свои кривые), между ними — прямо.
function flight(f: ReturnType<typeof makeFlyer>, V: Point): Keyframe[] {
  const { box, pose, o } = f;
  const cx = box.x + box.w / 2 + pose.x;
  const cy = box.y + box.h / 2 + pose.y;
  const frames: Keyframe[] = [];
  for (let k = 0; k <= 24; k++) {
    const t = (k / 24) * FLY;
    const mv = io2(prog(t, 40, 700));
    const s = pose.s * (1 + 4.6 * in3(prog(t, 40, FLY)));
    const x = pose.x + (V.x - cx) * mv * 0.9;
    const y = pose.y + (V.y - cy) * mv * 0.9;
    const tilt = pose.tilt * (1 - mv);
    frames.push({
      transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${s.toFixed(4)}) perspective(1200px) rotateY(${tilt.toFixed(2)}deg)`,
      opacity: o * (1 - prog(t, 560, FLY)),
    });
  }
  return frames;
}

// Сдвиг элемента к точке: из неё он вылетает (или в неё уходит).
const toDot = (el: Element, V: Point) => {
  const r = el.getBoundingClientRect();
  return [V.x - (r.left + r.width / 2), V.y - (r.top + r.height / 2)];
};

// Геометрия прокрутки слоя: места элементов в статье без transform (offsetTop), пересчёт — на
// resize и смену размеров статьи.
function rel(el: HTMLElement, root: Element) {
  let x = 0;
  let y = 0;
  let n: HTMLElement | null = el;
  while (n && n !== root) {
    x += n.offsetLeft;
    y += n.offsetTop;
    n = n.offsetParent as HTMLElement | null;
  }
  return { x, y, cx: x + el.offsetWidth / 2, cy: y + el.offsetHeight / 2, h: el.offsetHeight };
}

function measure(content: HTMLElement, scroller: HTMLElement) {
  const W = window.innerWidth;
  const H = viewportH();
  const V = { x: W / 2, y: H / 2 + DOT_Y };
  const portrait = W < H;
  const all = (sel: string) => [...content.querySelectorAll<HTMLElement>(sel)];
  const flies = all("[data-fly]").map((el) => ({
    el,
    side: Number(el.dataset.fly),
    ...rel(el, content),
  }));
  const rises = all("[data-rise]").map((el) => ({ el, top: rel(el, content).y }));
  const chapters = all("[data-ch]").map((el) => ({
    word: el.dataset.ch ?? "",
    top: rel(el, content).y,
  }));
  const next = content.querySelector<HTMLElement>("[data-next]");
  const stick = next?.firstElementChild as HTMLElement | null;
  const part = (el: HTMLElement | null) => (el && stick ? { el, ...rel(el, stick) } : null);
  const ncard = part(next?.querySelector<HTMLElement>("[data-ncard]") ?? null);
  return {
    W,
    H,
    V,
    portrait,
    flies,
    rises,
    chapters,
    maxS: scroller.scrollHeight - scroller.clientHeight,
    next: next ? { top: rel(next, content).y, h: next.offsetHeight } : null,
    ncard,
    tilt: portrait ? 0 : next?.dataset.side === "l" ? 8 : -8,
    ncap: next?.querySelector<HTMLElement>("[data-ncap]") ?? null,
    n3cover: part(next?.querySelector<HTMLElement>("[data-n3] [data-cover]") ?? null),
    n3parts: all("[data-n3] [data-hr] > *"),
  };
}
type Geometry = ReturnType<typeof measure>;

export function CaseLayer({ initial }: { initial?: string }) {
  const lenis = useLenis();
  // Открытый кейс — из адреса (на сервере — из маршрута). Не из пропса на клиенте: вернувшись
  // «назад» на запись «/», сделанную поверх /works/<slug>/, Next покажет то же дерево страницы.
  const [slug, setSlug] = useState<string | null>(() => {
    if (typeof window === "undefined") return initial ?? null;
    const s = caseSlugFrom(window.location.pathname);
    return s && caseBySlug(s) ? s : null;
  });
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLElement>(null);
  const flyerRef = useRef<HTMLDivElement>(null);
  const inkRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const lenisRef = useRef(lenis);
  const S = useRef({
    phase: "closed" as "closed" | "opening" | "open" | "closing",
    // Кейс открыт с главной (запись до него — главная): выход — history.back().
    fromHome: false,
    source: null as Source | null,
    hide: null as Animation | null, // карточка скрыта, пока открыт кейс
    capFade: null as Animation | null,
    enter: null as "fly" | "fade" | "swap" | "swapFade" | null,
    anims: [] as Animation[],
    after: null as (() => void) | null,
    focus: null as HTMLElement | null,
    swapping: false,
    word: "Работы",
    geo: null as Geometry | null,
    written: new Map<HTMLElement, string>(),
    reduced: false,
    homeY: 0,
    t0: 0, // нажатие: от него — задержки входа
  }).current;

  const put = (el: HTMLElement, opacity: string, transform: string) => {
    const css = `${opacity}|${transform}`;
    if (S.written.get(el) === css) return;
    S.written.set(el, css);
    el.style.opacity = opacity;
    el.style.transform = transform;
  };

  // Подпись главы в шапке — перекатом, как на главной (SceneLabel).
  const label = (word: string) => {
    const box = labelRef.current;
    if (!box || word === S.word) return;
    S.word = word;
    const old = [...box.children] as HTMLElement[];
    const span = document.createElement("span");
    span.textContent = word;
    box.append(span);
    const ease = "cubic-bezier(0.65, 0, 0.35, 1)";
    if (S.reduced) {
      for (const o of old) o.remove();
      return;
    }
    span.animate([{ transform: "translateY(1.5em)" }, { transform: "translateY(0)" }], {
      duration: 380,
      easing: ease,
    });
    for (const o of old) {
      o.animate(
        [
          { transform: "translateY(0)", opacity: 1 },
          { transform: "translateY(-1.5em)", opacity: 0 },
        ],
        { duration: 380, easing: ease, fill: "forwards" },
      ).finished.then(
        () => o.remove(),
        () => o.remove(),
      );
    }
  };

  // Один проход по прокрутке слоя: полёты из точки, всплытие текста, блок «Дальше», хвост
  // пунктира у конца пути, подпись главы. Пишет только изменившееся.
  const update = () => {
    const g = S.geo;
    const scroller = scrollRef.current;
    if (!g || !scroller) return;
    const y = scroller.scrollTop;
    const { H, V, portrait } = g;
    let q = -1;
    if (!S.reduced) {
      for (const f of g.flies) {
        const cy = f.cy - y;
        const land = portrait ? V.y - 22 - f.h / 2 : V.y;
        const p = prog(cy, H + f.h * 0.25, land);
        if (p >= 1) {
          put(f.el, "1", "none");
          continue;
        }
        const e = out3(p);
        const dx = (V.x - f.cx) * (1 - e);
        const dy = (V.y - cy) * (1 - e);
        const rot = portrait
          ? ""
          : ` perspective(1600px) rotateY(${(f.side * 10 * (1 - e)).toFixed(2)}deg)`;
        put(
          f.el,
          p <= 0 ? "0" : String(Math.min(1, p * 7)),
          `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${(0.04 + 0.96 * e).toFixed(4)})${rot}`,
        );
      }
      for (const r of g.rises) {
        const p = out2(prog(r.top - y, H * 0.9, H * 0.66));
        put(r.el, String(p), p >= 1 ? "none" : `translateY(${((1 - p) * 26).toFixed(1)}px)`);
      }
      // Дальше: карточка следующего кейса вылетает из точки в окно чтения (с наклоном, как в
      // туннеле), потом — сквозь неё, и из точки собирается его первый экран.
      if (g.next && g.ncard) {
        q = (y - g.next.top) / (g.next.h - H);
        const { el, cx, cy } = g.ncard;
        const off = Math.max(0, g.next.top - y); // блок ещё не встал — точка схода в его координатах
        const a = out3(prog(q, -0.12, 0.26));
        const thr = prog(q, 0.52, 0.8);
        let t: string;
        if (thr <= 0) {
          t = `translate(${((V.x - cx) * (1 - a)).toFixed(1)}px, ${((V.y - off - cy) * (1 - a)).toFixed(1)}px) scale(${(0.04 + 0.96 * a).toFixed(4)}) perspective(1200px) rotateY(${g.tilt}deg)`;
        } else {
          const mv = io2(thr);
          t = `translate(${((V.x - cx) * mv * 0.9).toFixed(1)}px, ${((V.y - cy) * mv * 0.9).toFixed(1)}px) scale(${(1 + 4.6 * in3(thr)).toFixed(4)}) perspective(1200px) rotateY(${(g.tilt * (1 - mv)).toFixed(2)}deg)`;
        }
        put(el, a <= 0 ? "0" : (Math.min(1, a * 6) * (1 - prog(q, 0.68, 0.8))).toFixed(3), t);
        if (g.ncap) {
          const c = out2(prog(q, 0.14, 0.3)) * (1 - prog(q, 0.52, 0.6));
          put(g.ncap, c.toFixed(3), `translateY(${((1 - c) * 16).toFixed(1)}px)`);
          const vis = c > 0.5 ? "" : "hidden";
          if (g.ncap.style.visibility !== vis) g.ncap.style.visibility = vis;
        }
        if (g.n3cover) {
          const e = out3(prog(q, 0.78, 0.92));
          const { el: c, cx: x3, cy: y3 } = g.n3cover;
          put(
            c,
            q < 0.78 ? "0" : "1",
            e >= 1
              ? "none"
              : `translate(${((V.x - x3) * (1 - e)).toFixed(1)}px, ${((V.y - y3) * (1 - e)).toFixed(1)}px) scale(${(0.04 + 0.96 * e).toFixed(4)})`,
          );
        }
        g.n3parts.forEach((p, i) => {
          const k = out2(prog(q, 0.8 + i * 0.014, 0.86 + i * 0.014));
          put(p, k.toFixed(3), k >= 1 ? "none" : `translateY(${((1 - k) * 18).toFixed(1)}px)`);
        });
      }
    }
    // Пунктир впереди точки кончается вместе с путём: у конца прокрутки — короче.
    const ghost = ghostRef.current;
    if (ghost) {
      const k = clamp01((g.maxS - y) / (H - V.y));
      const t = k >= 1 ? "" : `scaleY(${k.toFixed(4)})`;
      if (ghost.style.transform !== t) ghost.style.transform = t;
    }
    const dot = dotRef.current;
    const wait = y >= g.maxS - 1 ? "true" : "false";
    if (dot && dot.dataset.wait !== wait) dot.dataset.wait = wait;
    let word = g.chapters[0]?.word ?? "Работы";
    for (const c of g.chapters) if (c.top <= y + H * 0.5) word = c.word;
    label(q > 0.8 ? "Работы" : word);
    if (q >= SWAP && S.phase === "open") goNext(true);
  };

  const relayout = () => {
    const content = contentRef.current;
    const scroller = scrollRef.current;
    if (!content || !scroller) return;
    S.geo = measure(content, scroller);
    S.written.clear();
  };

  // Главная под кейсом: Lenis стоит, жесты и клавиши до неё не доходят (слушатели слоя), место
  // прокрутки запомнено — с ним она и вернётся. Фокус и клики (inert) — по окончании входа:
  // inert пересчитывает стили всей главной, на телефоне это заметная задержка нажатия.
  const lockHome = () => {
    S.homeY = window.scrollY;
    lenisRef.current?.stop();
  };
  const inertHome = (on: boolean) => {
    const main = document.querySelector("main");
    if (main && main.inert !== on) main.inert = on;
  };
  const unlockHome = () => {
    inertHome(false);
    lenisRef.current?.start();
  };

  const show = (s: string, source: Source | null) => {
    S.phase = "opening";
    S.source = source;
    S.focus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    S.enter = source && !S.reduced ? "fly" : "fade";
    S.word = "Работы";
    document.title = titleOf(s);
    lockHome();
    if (S.enter === "fly" && source) {
      // Пролёт — сразу, кейс рисуется следующей задачей: его первая раскладка (на телефоне —
      // сотни мс) идёт, пока карточка уже летит (анимация — на композиторе).
      takeOff(source);
      window.setTimeout(() => setSlug(s), 0);
    } else setSlug(s);
  };

  const takeOff = (source: Source) => {
    const holder = flyerRef.current;
    if (!holder) return;
    S.t0 = performance.now();
    const f = makeFlyer(source.card, holder);
    S.anims = [f.el.animate(flight(f, vp()), { duration: FLY, fill: "forwards" })];
    S.hide = source.card.animate([{ opacity: 0 }, { opacity: 0 }], {
      duration: 1,
      fill: "forwards",
    });
    S.capFade =
      source.caption?.animate([{ opacity: 0, transform: "translateY(-12px)" }], {
        duration: 320,
        easing: "ease-out",
        fill: "forwards",
      }) ?? null;
  };

  // Нажали карточку или «Смотреть кейс →» в Сцене 3.
  const open = (d: CaseOpenDetail) => {
    if (S.phase !== "closed" || !caseBySlug(d.slug)) return;
    S.fromHome = true;
    window.history.pushState({ whiteinksCase: d.slug, fromHome: true }, "", caseHref(d.slug));
    show(d.slug, d.card ? { card: d.card, caption: d.caption } : null);
  };

  // Вход: карточка Сцены 3 летит на зрителя, слой проявляется под ней, из точки собирается
  // первый экран, линия прорастает из точки вверх.
  const flyIn = () => {
    const content = contentRef.current;
    if (!content) return;
    const V = vp();
    const anims = [...S.anims];
    // Задержки — от нажатия: кейс отрисовался чуть позже, чем взлетела карточка.
    const at = (ms: number) => ms - (performance.now() - S.t0);
    const fadeIn = {
      duration: 450,
      delay: at(250),
      easing: "ease-out",
      fill: "backwards",
    } as const;
    for (const el of [stageRef.current, headerRef.current]) {
      if (el) anims.push(el.animate([{ opacity: 0 }, { opacity: 1 }], fadeIn));
    }
    const cover = content.querySelector<HTMLElement>("[data-hero] [data-cover]");
    if (cover) {
      const [dx, dy] = toDot(cover, V);
      anims.push(
        cover.animate(
          [
            { transform: `translate(${dx}px, ${dy}px) scale(0.04)` },
            { transform: "translate(0px, 0px) scale(1)" },
          ],
          { duration: 760, delay: at(T0), easing: OUT3, fill: "backwards" },
        ),
        cover.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: 120,
          delay: at(T0),
          fill: "backwards",
        }),
      );
    }
    const parts = content.querySelector("[data-hero] [data-hr]")?.children ?? [];
    [...parts].forEach((el, i) => {
      anims.push(
        el.animate(
          [
            { opacity: 0, transform: "translateY(22px)" },
            { opacity: 1, transform: "none" },
          ],
          { duration: 460, delay: at(T0 + 380 + i * 70), easing: OUT2, fill: "backwards" },
        ),
      );
    });
    const grow = { duration: 840, delay: at(T0 + 260), easing: IO2, fill: "backwards" } as const;
    if (inkRef.current)
      anims.push(
        inkRef.current.animate([{ transform: "scaleY(0)" }, { transform: "scaleY(1)" }], grow),
      );
    if (ghostRef.current)
      anims.push(ghostRef.current.animate([{ opacity: 0 }, { opacity: 1 }], grow));
    settle(anims, () => flyerRef.current?.replaceChildren());
  };

  const fadeIn = () => {
    const root = rootRef.current;
    if (!root) return;
    settle([root.animate([{ opacity: 0 }, { opacity: 1 }], { duration: FADE, fill: "backwards" })]);
  };

  // Вход доигран — кейс открыт.
  const settle = (anims: Animation[], then?: () => void) => {
    S.anims = anims;
    Promise.all(anims.map((a) => a.finished)).then(
      () => {
        if (S.phase !== "opening") return;
        S.phase = "open";
        S.anims = [];
        inertHome(true);
        then?.();
      },
      () => {},
    );
  };

  // Выход из кейса: кнопки, Esc, «назад» браузера. after — что сделать на главной потом.
  const close = (after?: () => void) => {
    if (S.phase === "closed" || S.phase === "closing") return;
    S.after = after ?? null;
    if (S.fromHome) {
      window.history.back(); // popstate → leave()
      return;
    }
    window.history.pushState(null, "", HOME_HREF);
    leave();
  };

  // Прямой заход: главную — к карточке кейса в туннеле (или к сетке), без заставки.
  const placeHome = (s: string): Source | null => {
    for (const a of document.getAnimations()) {
      if (a instanceof CSSAnimation && a.playState === "running") {
        if (a.effect?.getTiming().iterations !== Number.POSITIVE_INFINITY) a.finish();
      }
    }
    window.dispatchEvent(new CustomEvent(SKIP_EVENT, { detail: { in: 0 } }));
    const i = CARDS_CONTENT.findIndex((c) => c.slug === s);
    window.scrollTo(0, cardScrollY(i));
    syncScroll();
    return sourceOf(s);
  };

  const leave = () => {
    if (S.phase === "closed" || S.phase === "closing") return;
    if (!slug) {
      // «Назад» раньше, чем кейс успел отрисоваться: просто вернуть карточку.
      for (const a of S.anims) a.cancel();
      S.anims = [];
      return done();
    }
    for (const a of S.anims) a.finish();
    S.anims = [];
    flyerRef.current?.replaceChildren();
    S.phase = "closing";
    document.title = SITE_TITLE;
    const direct = !S.source;
    // Главная всё время стояла; если её всё же сдвинули (тап по строке состояния iOS) — на место.
    if (!direct && Math.abs(window.scrollY - S.homeY) > 1) {
      window.scrollTo(0, S.homeY);
      syncScroll();
    }
    const source = S.source ?? placeHome(slug);
    const holder = flyerRef.current;
    if (S.reduced || !source || !holder) {
      const root = rootRef.current;
      if (!root) return done();
      root
        .animate([{ opacity: 1 }, { opacity: 0 }], { duration: FADE, fill: "forwards" })
        .finished.then(done, done);
      return;
    }
    S.source = source;
    // Главная впервые рисуется на этом месте (прямой заход) — дадим ей кадр.
    const delay = direct ? 80 : 0;
    if (direct) {
      S.hide = source.card.animate([{ opacity: 0 }, { opacity: 0 }], {
        duration: 1,
        fill: "forwards",
      });
    }
    const f = makeFlyer(source.card, holder);
    const fly = f.el.animate(flight(f, vp()), {
      duration: FLY,
      delay,
      direction: "reverse",
      fill: "both",
    });
    // Кейс гаснет быстро, пока карточка ещё прозрачная и огромная: сквозь неё — уже главная.
    const fadeOut = { duration: 380, delay, easing: "ease-out", fill: "forwards" } as const;
    for (const el of [stageRef.current, headerRef.current])
      el?.animate([{ opacity: 1 }, { opacity: 0 }], fadeOut);
    if (source.caption) {
      source.caption.animate([{ opacity: 0, transform: "translateY(-12px)" }, {}], {
        duration: 320,
        delay: delay + 640,
        easing: "ease-out",
        fill: "backwards",
      });
      S.capFade?.cancel();
      S.capFade = null;
    }
    fly.finished.then(done, done);
  };

  const done = () => {
    S.hide?.cancel();
    S.hide = null;
    S.capFade?.cancel();
    S.capFade = null;
    flyerRef.current?.replaceChildren();
    S.phase = "closed";
    S.source = null;
    S.fromHome = false;
    S.geo = null;
    unlockHome();
    S.focus?.focus({ preventScroll: true });
    S.focus = null;
    setSlug(null);
    const after = S.after;
    S.after = null;
    after?.();
  };

  // Следующий кейс: адрес меняется на месте (запись истории та же — «назад» ведёт на главную).
  // По прокрутке — подмена тем же кадром; кнопкой — пролёт до конца блока «Дальше» (без
  // движения — затухание).
  const goNext = (viaScroll: boolean) => {
    if (S.phase !== "open" || !slug || S.swapping) return;
    const scroller = scrollRef.current;
    if (!viaScroll && !S.reduced && scroller) {
      scroller.scrollTo({ top: S.geo?.maxS ?? scroller.scrollHeight, behavior: "smooth" });
      return;
    }
    const n = nextCase(slug).slug;
    S.swapping = true;
    // Своё состояние без служебного Next (__NA): так Next узнаёт о новом адресе.
    window.history.replaceState({ whiteinksCase: n, fromHome: S.fromHome }, "", caseHref(n));
    document.title = titleOf(n);
    if (viaScroll) {
      S.enter = "swap";
      setSlug(n);
      return;
    }
    const content = contentRef.current;
    if (!content) return;
    content
      .animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: "forwards" })
      .finished.then(
        () => {
          S.enter = "swapFade";
          setSlug(n);
        },
        () => {},
      );
  };

  const act: CaseActions = {
    close: () => close(),
    next: () => goNext(false),
    // Заявка из кейса — окно заявки поверх кейса (components/ui/BriefModal): растёт из нажатой
    // «Обсудить проект», закрыли — снова в кейсе, на той же кнопке.
    discuss: (e) => openBrief(e.currentTarget),
    prices: () => close(() => goToStation(PRICES, lenisRef.current)),
  };
  const fn = useRef({ open, leave, show, update, relayout, act });
  fn.current = { open, leave, show, update, relayout, act };

  // Lenis под кейсом стоит, даже если его запустит кто-то ещё (замок заставки HeroScrollLock).
  useEffect(() => {
    lenisRef.current = lenis;
    if (!lenis) return;
    const keep = () => {
      if (S.phase !== "closed" && !lenis.isStopped) lenis.stop();
    };
    keep();
    return lenis.on("scroll", keep);
  }, [lenis, S]);

  useEffect(() => {
    S.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const onOpen = (e: Event) => fn.current.open((e as CustomEvent<CaseOpenDetail>).detail);
    // «Назад» и «вперёд» браузера: ушли с кейса — закрыть; пришли на кейс — открыть.
    const onPop = () => {
      const s = caseSlugFrom(window.location.pathname);
      if (!s || !caseBySlug(s)) {
        if (S.phase === "opening" || S.phase === "open") fn.current.leave();
        return;
      }
      if (S.phase !== "closed") return;
      S.fromHome = !!window.history.state?.fromHome;
      fn.current.show(s, sourceOf(s));
    };
    window.addEventListener(CASE_OPEN_EVENT, onOpen);
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener(CASE_OPEN_EVENT, onOpen);
      window.removeEventListener("popstate", onPop);
    };
  }, [S]);

  // Кейс отрисован (открыли, подменили следующим, прямой заход): раскладка, первый проход,
  // вход. До отрисовки — чтобы первый кадр уже был верным.
  // biome-ignore lint/correctness/useExhaustiveDependencies: вход — по смене кейса
  useLayoutEffect(() => {
    if (!slug) return;
    if (S.phase === "closed") {
      // Прямой заход по ссылке (или «назад» на запись кейса со страницы вне главной).
      S.phase = "open";
      S.fromHome = !!window.history.state?.fromHome;
      lockHome();
      inertHome(true);
    }
    S.swapping = false;
    const scroller = scrollRef.current;
    if (scroller) scroller.scrollTop = 0;
    // Подмена по прокрутке: инерция колеса или пальца не уносит новый первый экран — полсекунды
    // слой не прокручивается.
    if (scroller && S.enter === "swap") {
      scroller.style.overflowY = "hidden";
      window.setTimeout(() => scroller.style.removeProperty("overflow-y"), 500);
    }
    fn.current.relayout();
    S.word = "Работы";
    const box = labelRef.current;
    if (box && box.textContent !== "Работы") box.innerHTML = "<span>Работы</span>";
    fn.current.update();
    const enter = S.enter;
    S.enter = null;
    if (enter === "fly") flyIn();
    else if (enter === "fade") fadeIn();
    else if (enter === "swapFade") {
      contentRef.current?.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 200,
        fill: "backwards",
      });
    }
    // Фокус — в прокрутку слоя: клавиши листают кейс (после подмены — новый).
    if (enter && !rootRef.current?.contains(document.activeElement)) {
      scroller?.focus({ preventScroll: true });
    }
  }, [slug]);

  // Пока слой открыт: прокрутка слоя, resize, колесо и касания — не дальше слоя (главную они
  // не двигают, замок заставки их не видит), Esc — выход.
  useEffect(() => {
    const root = rootRef.current;
    const scroller = scrollRef.current;
    const content = contentRef.current;
    if (!slug || !root || !scroller || !content) return;
    const onScrollLayer = () => fn.current.update();
    const onResize = () => {
      fn.current.relayout();
      fn.current.update();
    };
    // Жесты в прокрутке слоя — только ей (замок заставки и Lenis их не видят, overscroll-
    // behavior не пускает дальше); над шапкой прокрутки нет — иначе поехала бы главная.
    const header = headerRef.current;
    const stop = (e: Event) => e.stopPropagation();
    const block = (e: Event) => {
      e.stopPropagation();
      if (e.cancelable) e.preventDefault();
    };
    // Клавиши из слоя дальше не идут; стрелки и PageDown вне прокрутки (фокус в шапке) — не
    // листают главную. Esc закрывает кейс, где бы ни был фокус.
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") fn.current.act.close();
    };
    const onKey = (e: KeyboardEvent) => {
      e.stopPropagation();
      const t = e.target as Node;
      const press = e.key === " " && t instanceof HTMLButtonElement; // пробел на кнопке — нажатие
      if (SCROLL_KEYS.has(e.key) && !press && !scroller.contains(t)) e.preventDefault();
      onEsc(e);
    };
    scroller.addEventListener("scroll", onScrollLayer, { passive: true });
    window.addEventListener("resize", onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(content);
    scroller.addEventListener("wheel", stop, { passive: true });
    scroller.addEventListener("touchmove", stop, { passive: true });
    header?.addEventListener("wheel", block, { passive: false });
    header?.addEventListener("touchmove", block, { passive: false });
    root.addEventListener("keydown", onKey);
    window.addEventListener("keydown", onEsc);
    return () => {
      scroller.removeEventListener("scroll", onScrollLayer);
      window.removeEventListener("resize", onResize);
      ro.disconnect();
      scroller.removeEventListener("wheel", stop);
      scroller.removeEventListener("touchmove", stop);
      header?.removeEventListener("wheel", block);
      header?.removeEventListener("touchmove", block);
      root.removeEventListener("keydown", onKey);
      window.removeEventListener("keydown", onEsc);
    };
  }, [slug]);

  // Ушли со страницы (другой маршрут) — главная снова своя.
  // biome-ignore lint/correctness/useExhaustiveDependencies: только при размонтировании
  useEffect(
    () => () => {
      if (S.phase !== "closed") unlockHome();
    },
    [],
  );

  const c = slug ? caseBySlug(slug) : null;
  const i = c ? CARDS_CONTENT.findIndex((x) => x.slug === c.slug) : -1;
  // Слой есть всегда (в нём летит карточка), кейс в нём — пока открыт.
  if (!c) {
    return (
      <div ref={rootRef} className={styles.layer}>
        <div key="flyer" ref={flyerRef} className={styles.flyer} aria-hidden="true" />
      </div>
    );
  }
  return (
    <div
      ref={rootRef}
      className={styles.layer}
      role="dialog"
      aria-modal="true"
      aria-labelledby="case-title"
      data-lenis-prevent
    >
      {/* Слои по z-index (Case.module.css): сцена → летящая карточка → шапка. Держатель карточки —
          первым и с ключом: React не должен отдать его узел сцене при открытии. */}
      <div key="flyer" ref={flyerRef} className={styles.flyer} aria-hidden="true" />
      <div key="stage" ref={stageRef} className={styles.stage}>
        <div className={styles.bg} />
        <div ref={inkRef} className={styles.ink} />
        <div ref={ghostRef} className={styles.ghost} />
        <div ref={scrollRef} className={styles.scroll} tabIndex={-1}>
          <article ref={contentRef} key={c.slug} className={styles.content} data-side={sideOf(i)}>
            <CaseView c={c} next={nextCase(c.slug)} act={act} />
          </article>
        </div>
        <span ref={dotRef} className={styles.dot} aria-hidden="true" />
      </div>
      <header key="header" ref={headerRef} className={styles.header}>
        <a className={styles.logo} href={HOME_HREF} onClick={back(act.close)}>
          white inks.
        </a>
        <span
          ref={labelRef}
          className={styles.label}
          aria-hidden="true"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: слово ведёт label() — React его не перерисовывает
          dangerouslySetInnerHTML={{ __html: "<span>Работы</span>" }}
        />
        <button type="button" className={styles.cta} onClick={act.discuss}>
          Обсудить проект
        </button>
        <button
          type="button"
          className={styles.close}
          onClick={act.close}
          aria-label="Закрыть кейс"
        />
      </header>
    </div>
  );
}
