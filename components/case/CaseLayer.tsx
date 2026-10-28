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
import styles from "./Case.module.css";
import { back, type CaseActions, CaseView } from "./CaseView";

// Слой кейса поверх главной (вариант D2 «Рассказ», docs/12-case-page.md). Главная под ним
// смонтирована и стоит: прокрутку держит Lenis (stop), а html[data-case-open] ставит на паузу
// анимации главной (слайды и пульс Hero, Hero.module.css); у слоя — своя прокрутка. Адрес — /works/<slug>/ через history.pushState: «назад» браузера и свои кнопки
// выхода закрывают слой, и главная там же, где была. Переходы — Web Animations (transform и
// opacity, без своих циклов кадров); ход по прокрутке слоя — один проход в его событии scroll.

const DOT_Y = 20; // точка туннеля — на 20px ниже центра экрана
const FLY = 700; // мс: карточка туннеля встаёт в рамку обложки (и обратно)
const NEXT = 300; // мс: «ещё проект →» — от нажатия до выхода обложки нового кейса из точки
const FADE = 300; // мс: без движения (prefers-reduced-motion) — затухание
const SCROLL_KEYS = new Set(["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "]);

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const OUT3 = "cubic-bezier(0.33, 1, 0.68, 1)";
const IO3 = "cubic-bezier(0.65, 0, 0.35, 1)";

const titleOf = (slug: string) =>
  `${CARDS_CONTENT.find((c) => c.slug === slug)?.title ?? ""} — кейс White Inks`;
const vp = () => ({ x: window.innerWidth / 2, y: viewportH() / 2 + DOT_Y });
type Point = ReturnType<typeof vp>;

// Карточка Сцены 3, через которую входим и выходим, и её подпись.
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
  const frame = grabFrame(card.querySelector("video"), el);
  holder.append(el);
  const m =
    /translate\((-?[\d.]+)px, (-?[\d.]+)px\) scale\((-?[\d.]+)\).*rotateY\((-?[\d.]+)deg\)/.exec(
      card.style.transform,
    );
  const pose = m ? { x: +m[1], y: +m[2], s: +m[3], tilt: +m[4] } : { x: 0, y: 0, s: 1, tilt: 0 };
  const o = Number.parseFloat(card.style.opacity) || 1;
  return { el, box, pose, o, frame };
}
type Flyer = ReturnType<typeof makeFlyer>;

// Видео-петля в карточке: копия сама не играет и показала бы постер — скачок в кадре нажатия.
// Поверх неё — кадр, на котором стоит видео (холст сразу за video копии, выше прежних); полёт
// сводит его в постер — с него обложка начинает петлю — и обратно.
function grabFrame(video: HTMLVideoElement | null | undefined, el: HTMLElement) {
  const copy = el.querySelector("video");
  if (!video || !copy?.parentElement || video.readyState < 2) return null;
  const c = document.createElement("canvas");
  c.width = video.videoWidth;
  c.height = video.videoHeight;
  c.getContext("2d")?.drawImage(video, 0, 0);
  c.className = video.className; // no-invert — как видео на втором круге
  c.style.cssText = "position:absolute;inset:0;width:100%;height:100%";
  copy.parentElement.style.position = "relative";
  copy.after(c);
  return c;
}

// Копия карточки: как она стоит на главной и как ушла в точку (12px, без наклона).
function poses(f: Flyer, V: Point) {
  const { box, pose } = f;
  const t = (x: number, y: number, s: number, tilt: number) =>
    `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${s.toFixed(4)}) perspective(1200px) rotateY(${tilt.toFixed(2)}deg)`;
  return {
    card: t(pose.x, pose.y, pose.s, pose.tilt),
    dot: t(V.x - box.x - box.w / 2, V.y - box.y - box.h / 2, 12 / box.w, 0),
  };
}

// Прозрачность у точки: карточка, выходя из неё, проявляется за первые 15% пути.
const outOfDot = (o: number) => [{ opacity: 0 }, { opacity: o, offset: 0.15 }, { opacity: o }];

type Box = { x: number; y: number; w: number; h: number };
const REST = "translate(0px, 0px) scale(1) perspective(1200px) rotateY(0deg)";

// Рамка обложки первого экрана до того, как кейс отрисован: полёт стартует в кадре нажатия. Числа —
// из Case.module.css (.sec, .r, .hero, .back, .heroMedia, .cover), менять вместе; отрисованный кейс
// сверяет цель с настоящей рамкой (flyIn). Обложка — 7 из 12 колонок правой части.
function coverBox(): Box {
  const W = window.innerWidth;
  const at = (x: number, y: number, w: number) => ({ x, y, w, h: w * 0.75 + 6.75 });
  if (W < 768) return at(44, 96 + 22.5 + 14, W - 64);
  return at(W * 0.25 + 56, 100 + 22.5 + 18, (Math.min(1040, W * 0.75 - 112) * 7) / 12);
}

// Копия карточки встаёт в рамку обложки: её разметка — сразу размером и на месте обложки, а
// transform в начале повторяет карточку на главной. В конце transform пустой — и копия совпадает
// с настоящей обложкой без шва. Возвращает transform начала.
function landOn(f: Flyer, b: Box) {
  const { box, pose } = f;
  Object.assign(f.el.style, {
    left: `${b.x}px`,
    top: `${b.y}px`,
    width: `${b.w}px`,
    height: `${b.h}px`,
  });
  const dx = box.x + box.w / 2 + pose.x - (b.x + b.w / 2);
  const dy = box.y + box.h / 2 + pose.y - (b.y + b.h / 2);
  return `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${((box.w * pose.s) / b.w).toFixed(4)}) perspective(1200px) rotateY(${pose.tilt.toFixed(2)}deg)`;
}

// Геометрия прокрутки слоя: места элементов в статье без transform (offsetTop), пересчёт — на
// resize и смену размеров статьи.
function relY(el: HTMLElement, root: Element) {
  let y = 0;
  let n: HTMLElement | null = el;
  while (n && n !== root) {
    y += n.offsetTop;
    n = n.offsetParent as HTMLElement | null;
  }
  return y;
}

function measure(content: HTMLElement, scroller: HTMLElement, dot: HTMLElement | null) {
  const H = viewportH();
  const dy = H / 2 + DOT_Y;
  const all = (sel: string) => [...content.querySelectorAll<HTMLElement>(sel)];
  const x = dot ? dot.offsetLeft + dot.offsetWidth / 2 : 0;
  // Письмо в конце закрывает ось (телефон: оно на всю ширину) — с его верхнего края точка уходит
  // в него, как линия под подложку (data-under). Иначе — никогда.
  const letter = content.querySelector<HTMLElement>("[data-letter]");
  const plate = letter?.firstElementChild?.getBoundingClientRect();
  const under =
    letter && plate && plate.left < x ? relY(letter, content) : Number.POSITIVE_INFINITY;
  return {
    H,
    dy,
    x, // ось (--x в Case.module.css)
    under, // где начинается письмо, если оно закрывает ось
    path: content.offsetHeight - H + dy, // длина пути: до точки в конце прокрутки
    maxS: scroller.scrollHeight - scroller.clientHeight,
    // data-d — задержка всплытия, мс.
    rises: all("[data-rise]").map((el) => ({
      el,
      top: relY(el, content),
      delay: Number(el.dataset.d) || 0,
    })),
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
  // Вся статья или только первый экран: на входе остальное рисуется, когда карточка встала в
  // обложку, — первая задача после нажатия короткая, а пролёт к этому времени уже идёт.
  const [full, setFull] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLElement>(null);
  const flyerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<HTMLDivElement>(null);
  const inkRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);
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
    fly: null as { f: Flyer; box: Box } | null, // копия карточки на входе и её цель
    after: null as (() => void) | null,
    focus: null as HTMLElement | null,
    swapping: false,
    geo: null as Geometry | null,
    written: new Map<HTMLElement, string>(),
    risen: new WeakSet<HTMLElement>(),
    // Без движения — известно сразу, до первого прохода по прокрутке (прямой заход).
    reduced:
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    rest: false, // на входе остальная статья ещё не дорисована
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

  // Один проход по прокрутке слоя: чернила до точки, всплытие текста, ожидание точки в конце
  // пути. Пишет только изменившееся.
  const update = () => {
    const g = S.geo;
    const scroller = scrollRef.current;
    if (!g || !scroller) return;
    const y = scroller.scrollTop;
    const ink = inkRef.current;
    if (ink) put(ink, "", `scaleY(${clamp01((y + g.dy) / g.path).toFixed(4)})`);
    // Всплытие — один раз: верх блока дошёл до 90% экрана (или прокрутка в самом конце) — блок
    // проявляется за 600 мс и остаётся, на обратном ходу не гаснет. До того ждёт невидимым.
    if (!S.reduced) {
      const end = y >= g.maxS - 1;
      for (const r of g.rises) {
        if (S.risen.has(r.el)) continue;
        if (end || r.top - y < g.H * 0.9) {
          S.risen.add(r.el);
          put(r.el, "", "");
          r.el.animate(
            [
              { opacity: 0, transform: "translateY(22px)" },
              { opacity: 1, transform: "none" },
            ],
            { duration: 600, delay: r.delay, easing: OUT3, fill: "backwards" },
          );
        } else put(r.el, "0", "translateY(22px)");
      }
    }
    const dot = dotRef.current;
    const wait = y >= g.maxS - 1 ? "true" : "false";
    if (dot && dot.dataset.wait !== wait) dot.dataset.wait = wait;
    const under = y + g.dy >= g.under ? "true" : "false";
    if (dot && dot.dataset.under !== under) dot.dataset.under = under;
  };

  // Текст гаснет (выход, следующий кейс) — точка снова видна: из неё выходит карточка.
  const surface = () => {
    if (dotRef.current) dotRef.current.dataset.under = "false";
  };

  const relayout = () => {
    const content = contentRef.current;
    const scroller = scrollRef.current;
    if (!content || !scroller) return;
    S.geo = measure(content, scroller, dotRef.current);
    S.written.clear();
  };

  // Точка вздрагивает (Case.module.css, data-pulse) — приняла карточку.
  const pulse = (delay: number) => {
    window.setTimeout(
      () => {
        const dot = dotRef.current;
        if (!dot) return;
        dot.dataset.pulse = "";
        window.setTimeout(() => dot.removeAttribute("data-pulse"), 460);
      },
      Math.max(0, delay),
    );
  };

  // Главная под кейсом: Lenis стоит, жесты и клавиши до неё не доходят (слушатели слоя), место
  // прокрутки запомнено — с ним она и вернётся. Фокус и клики (inert) — по окончании входа:
  // inert пересчитывает стили всей главной, на телефоне это заметная задержка нажатия.
  const lockHome = () => {
    S.homeY = window.scrollY;
    lenisRef.current?.stop();
    document.documentElement.dataset.caseOpen = "";
  };
  const inertHome = (on: boolean) => {
    const main = document.querySelector("main");
    if (main && main.inert !== on) main.inert = on;
  };
  const unlockHome = () => {
    inertHome(false);
    lenisRef.current?.start();
    delete document.documentElement.dataset.caseOpen;
  };

  const show = (s: string, source: Source | null) => {
    S.phase = "opening";
    S.source = source;
    S.focus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    S.enter = source && !S.reduced ? "fly" : "fade";
    document.title = titleOf(s);
    lockHome();
    if (S.enter === "fly" && source) {
      // Карточка летит в рамку обложки с кадра нажатия; кейс (пока — первый экран) рисуется
      // задачей после этого кадра: пролёт уже на композиторе, раскладка его не задерживает.
      takeOff(source);
      requestAnimationFrame(() =>
        window.setTimeout(() => {
          if (S.phase !== "opening") return; // успели выйти («назад», Esc)
          setFull(false);
          setSlug(s);
        }, 0),
      );
    } else {
      setFull(true);
      setSlug(s);
    }
  };

  const takeOff = (source: Source) => {
    const holder = flyerRef.current;
    if (!holder) return;
    S.t0 = performance.now();
    const f = makeFlyer(source.card, holder);
    const box = coverBox();
    S.fly = { f, box };
    const t = { duration: FLY, easing: IO3, fill: "forwards" } as const;
    S.anims = [f.el.animate([{ transform: landOn(f, box) }, { transform: REST }], t)];
    if (f.o < 1) S.anims.push(f.el.animate([{ opacity: f.o }, { opacity: 1 }], t));
    if (f.frame) S.anims.push(f.frame.animate([{ opacity: 1 }, { opacity: 0 }], t));
    // В сетке номер спрятан — в обложке он есть: проявляется в полёте.
    const badge = f.el.lastElementChild as HTMLElement | null;
    if (badge?.style.opacity === "0") badge.animate([{ opacity: 0 }, { opacity: 1 }], t);
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

  // Задержка от нажатия: кейс отрисовался позже, чем карточка начала полёт.
  const at = (ms: number) => ms - (performance.now() - S.t0);
  const sections = () => [...(contentRef.current?.querySelectorAll(":scope > section") ?? [])];
  // Первый экран всплывает по строкам. Порядок — сверху вниз по экрану (на телефоне цифра стоит
  // ниже текста, хотя в разметке выше).
  const heroIn = (delay: number) =>
    [...(contentRef.current?.querySelectorAll("[data-hi]") ?? [])]
      .map((el) => ({ el, top: el.getBoundingClientRect().top }))
      .sort((a, b) => a.top - b.top)
      .map(({ el }, i) =>
        el.animate(
          [
            { opacity: 0, transform: "translateY(16px)" },
            { opacity: 1, transform: "none" },
          ],
          { duration: 440, delay: delay + i * 45, easing: OUT3, fill: "backwards" },
        ),
      );

  // Вход: копия карточки летит в рамку обложки, слой с линией и точкой на своих местах проявляется
  // под ней (линия не едет — иначе прошла бы сквозь всплывающий текст); вокруг обложки всплывает
  // текст первого экрана. Долетела — её сменяет настоящая обложка.
  const flyIn = () => {
    const content = contentRef.current;
    if (!content) return;
    const anims = [...S.anims];
    const cover = content.querySelector<HTMLElement>("[data-cover]");
    if (cover && S.fly) {
      // Цель — настоящая рамка: если раскладка разошлась с coverBox(), поправить полёт на ходу.
      const r = cover.getBoundingClientRect();
      const b = S.fly.box;
      if (Math.abs(r.left - b.x) + Math.abs(r.top - b.y) + Math.abs(r.width - b.w) > 1) {
        const box = { x: r.left, y: r.top, w: r.width, h: r.height };
        (S.anims[0].effect as KeyframeEffect).setKeyframes([
          { transform: landOn(S.fly.f, box) },
          { transform: REST },
        ]);
      }
      // Настоящая обложка проявляется под копией в самом конце полёта.
      const swap = cover.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 120,
        delay: at(FLY - 120),
        fill: "backwards",
      });
      swap.finished.then(
        () => flyerRef.current?.replaceChildren(),
        () => {},
      );
      anims.push(swap);
    }
    const fade = { duration: 420, delay: at(60), easing: "ease-out", fill: "backwards" } as const;
    for (const el of [stageRef.current, headerRef.current]) {
      if (el) anims.push(el.animate([{ opacity: 0 }, { opacity: 1 }], fade));
    }
    anims.push(...heroIn(at(FLY * 0.55)));
    settle(anims, () => flyerRef.current?.replaceChildren());
    // Остальная статья — когда карточка встала в обложку (пролёт ведёт композитор).
    S.rest = true;
    window.setTimeout(() => setFull(true), Math.max(0, at(FLY + 60)));
  };

  // Остальная статья дорисована на входе — проявляется, пока ось доезжает.
  const restIn = () => {
    if (!S.rest) return;
    S.rest = false;
    for (const el of sections().slice(1)) {
      el.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 400,
        delay: at(FLY + 200),
        fill: "backwards",
      });
    }
  };

  const fadeIn = () => {
    const root = rootRef.current;
    if (!root) return;
    settle([root.animate([{ opacity: 0 }, { opacity: 1 }], { duration: FADE, fill: "backwards" })]);
  };

  // Следующий кейс: строки первого экрана всплывают сразу; точка вздрагивает, и из неё выходит
  // обложка нового кейса. Остальная статья — следом.
  const swapIn = () => {
    const cover = contentRef.current?.querySelector<HTMLElement>("[data-cover]");
    const dot = dotRef.current;
    const land = Math.max(0, at(NEXT));
    if (cover && dot) {
      const c = cover.getBoundingClientRect();
      const d = dot.getBoundingClientRect();
      const dx = d.left + d.width / 2 - (c.left + c.width / 2);
      const dy = d.top + d.height / 2 - (c.top + c.height / 2);
      const t = { duration: 600, delay: land, fill: "backwards" } as const;
      cover.animate(
        [
          {
            transform: `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${(12 / c.width).toFixed(4)})`,
          },
          { transform: "none" },
        ],
        { ...t, easing: OUT3 },
      );
      cover.animate(outOfDot(1), t);
    }
    pulse(land);
    heroIn(0);
    S.rest = true;
    window.setTimeout(() => setFull(true), Math.max(0, at(NEXT + 400)));
  };

  // Видео-петля обложки — с первого кадра (он же постер): после полёта карточки, иначе сразу.
  const playCover = () => {
    if (S.reduced) return;
    const v = contentRef.current?.querySelector<HTMLVideoElement>("[data-cover] video");
    v?.play().catch(() => {}); // iOS в экономии — постер
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
        playCover();
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

  // Выход: текст гаснет, слой гаснет. Обложка на экране — карточка летит с её места на своё место в
  // туннеле (или в сетке). Кейс пролистан и обложки не видно — ось возвращается в центр, к точке
  // туннеля, и карточка выходит из точки, как уходит в неё следующий кейс.
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
    surface();
    document.title = SITE_TITLE;
    const direct = !S.source;
    // Главная всё время стояла; если её всё же сдвинули (тап по строке состояния iOS) — на место.
    if (!direct && Math.abs(window.scrollY - S.homeY) > 1) {
      window.scrollTo(0, S.homeY);
      syncScroll();
    }
    const source = S.source ?? placeHome(slug);
    const holder = flyerRef.current;
    const content = contentRef.current;
    const g = S.geo;
    if (S.reduced || !source || !holder || !content || !g) {
      const root = rootRef.current;
      if (!root) return done();
      root
        .animate([{ opacity: 1 }, { opacity: 0 }], { duration: FADE, fill: "forwards" })
        .finished.then(done, done);
      return;
    }
    S.source = source;
    if (direct) {
      S.hide = source.card.animate([{ opacity: 0 }, { opacity: 0 }], {
        duration: 1,
        fill: "forwards",
      });
    }
    const cover = content.querySelector<HTMLElement>("[data-cover]");
    const cr = cover?.getBoundingClientRect();
    const onScreen = !!cr && cr.bottom > 80 && cr.top < window.innerHeight - 40;
    for (const el of sections())
      el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, fill: "forwards" });
    // Из точки — ось сначала возвращается в центр, к точке туннеля.
    if (!onScreen) {
      const dx = window.innerWidth / 2 - g.x;
      for (const el of [pathRef.current, dotRef.current]) {
        el?.animate([{ transform: "none" }, { transform: `translateX(${dx}px)` }], {
          duration: 420,
          easing: IO3,
          fill: "forwards",
        });
      }
    }
    // Главная впервые рисуется на этом месте (прямой заход) — дадим ей кадр.
    const delay = (onScreen ? 0 : 380) + (direct ? 80 : 0);
    const f = makeFlyer(source.card, holder);
    const p = poses(f, vp());
    let fly: Animation;
    if (onScreen && cover && cr) {
      // С места обложки: копия (разметка — как у карточки на главной) сначала накрывает обложку.
      cover.animate([{ opacity: 0 }, { opacity: 0 }], { duration: 1, fill: "forwards" });
      const from = `translate(${(cr.left + cr.width / 2 - f.box.x - f.box.w / 2).toFixed(1)}px, ${(cr.top + cr.height / 2 - f.box.y - f.box.h / 2).toFixed(1)}px) scale(${(cr.width / f.box.w).toFixed(4)}) perspective(1200px) rotateY(0deg)`;
      fly = f.el.animate([{ transform: from }, { transform: p.card }], {
        duration: FLY,
        delay,
        easing: IO3,
        fill: "both",
      });
      // Под кадром карточки — кадр обложки: полёт начинается с того, что было на экране.
      grabFrame(cover.querySelector("video"), f.el);
      f.frame?.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: FLY,
        delay,
        easing: IO3,
        fill: "both",
      });
      const badge = f.el.lastElementChild as HTMLElement | null;
      if (badge?.style.opacity === "0") {
        badge.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FLY, delay, fill: "both" });
      }
    } else {
      const grow = { duration: 560, delay, fill: "both" } as const;
      fly = f.el.animate([{ transform: p.dot }, { transform: p.card }], { ...grow, easing: OUT3 });
      f.el.animate(outOfDot(f.o), grow);
    }
    for (const el of [stageRef.current, headerRef.current]) {
      el?.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 320,
        delay: delay + (onScreen ? 160 : 0),
        easing: "ease-out",
        fill: "forwards",
      });
    }
    if (source.caption) {
      source.caption.animate([{ opacity: 0, transform: "translateY(-12px)" }, {}], {
        duration: 320,
        delay: delay + (onScreen ? 500 : 400),
        easing: "ease-out",
        fill: "backwards",
      });
      S.capFade?.cancel();
      S.capFade = null;
    }
    fly.finished.then(done, done);
  };

  const done = () => {
    // Затухание слоя (без движения) держит opacity: 0 — снять, иначе следующий кейс не виден.
    for (const a of rootRef.current?.getAnimations() ?? []) a.cancel();
    S.hide?.cancel();
    S.hide = null;
    S.capFade?.cancel();
    S.capFade = null;
    flyerRef.current?.replaceChildren();
    S.phase = "closed";
    S.source = null;
    S.fly = null;
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

  // Следующий кейс («ещё проект →» под формой): текст гаснет, линия и точка остаются, из точки
  // выходит обложка нового кейса; адрес меняется на месте (запись истории та же — «назад» ведёт на
  // главную). Без движения — затухание. Адрес — задачей после кадра нажатия (смена адреса
  // перерисовывает дерево Next), подмена — как только текст погас (сначала только первый экран).
  const goNext = () => {
    if (S.phase !== "open" || !slug || S.swapping) return;
    const content = contentRef.current;
    if (!content) return;
    const n = nextCase(slug).slug;
    S.swapping = true;
    surface();
    S.t0 = performance.now();
    requestAnimationFrame(() =>
      window.setTimeout(() => {
        // Своё состояние без служебного Next (__NA): так Next узнаёт о новом адресе.
        window.history.replaceState({ whiteinksCase: n, fromHome: S.fromHome }, "", caseHref(n));
        document.title = titleOf(n);
      }, 0),
    );
    // Выход теперь — на карточку нового кейса: прежнюю вернуть на главную, новую найдёт placeHome().
    S.hide?.cancel();
    S.hide = null;
    S.capFade?.cancel();
    S.capFade = null;
    S.source = null;
    const swap = (enter: "swap" | "swapFade") => () => {
      S.enter = enter;
      setFull(enter === "swapFade");
      setSlug(n);
    };
    if (S.reduced) {
      content
        .animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: "forwards" })
        .finished.then(swap("swapFade"), () => {});
      return;
    }
    const fades = sections().map((el) =>
      el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, fill: "forwards" }),
    );
    Promise.all(fades.map((a) => a.finished)).then(swap("swap"), () => {});
  };

  const act: CaseActions = {
    close: () => close(),
    next: () => goNext(),
    // «Обсудить проект» в шапке: конверт в конце кейса на экране и открыт — курсор в его поле
    // «телефон»; иначе (и после отправки: поле в закрытом конверте недоступно) — окно заявки
    // поверх кейса (components/ui/BriefModal): растёт из нажатой кнопки, закрыли — снова в кейсе,
    // на той же кнопке.
    discuss: (e) => {
      const input = contentRef.current?.querySelector<HTMLInputElement>('input[name="phone"]');
      const r = input?.getBoundingClientRect();
      const top = headerRef.current?.getBoundingClientRect().bottom ?? 0;
      if (input && r && !input.closest("[inert]") && r.top > top && r.bottom < window.innerHeight)
        input.focus({ preventScroll: true });
      else openBrief(e.currentTarget);
    },
  };
  const fn = useRef({ open, leave, show, update, relayout, restIn, act });
  fn.current = { open, leave, show, update, relayout, restIn, act };

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
      // Прямой заход по ссылке, перезагрузка на кейсе или «назад» на запись кейса со страницы вне
      // главной. fromHome из history.state тут не берём: запись главной перед кейсом — от прежней
      // загрузки, history.back() открыл бы главную заново, с заставкой. Выход — как при прямом
      // заходе: в туннель к карточке кейса.
      S.phase = "open";
      S.fromHome = false;
      lockHome();
      inertHome(true);
    }
    S.swapping = false;
    const scroller = scrollRef.current;
    if (scroller) scroller.scrollTop = 0;
    fn.current.relayout();
    fn.current.update();
    const enter = S.enter;
    S.enter = null;
    if (enter !== "fly") playCover();
    if (enter === "fly") flyIn();
    else if (enter === "fade") fadeIn();
    else if (enter === "swap") swapIn();
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

  // Статья дорисована целиком (на входе): раскладка и проявление остального.
  useLayoutEffect(() => {
    if (!full || !slug) return;
    fn.current.relayout();
    fn.current.update();
    fn.current.restIn();
  }, [full, slug]);

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
        <div ref={scrollRef} className={styles.scroll} tabIndex={-1}>
          <article ref={contentRef} key={c.slug} className={styles.content}>
            <div ref={pathRef} className={styles.path} aria-hidden="true">
              <div className={styles.ghost} />
              <div ref={inkRef} className={styles.ink} />
            </div>
            <CaseView c={c} act={act} full={full} />
          </article>
        </div>
        <span ref={dotRef} className={styles.dot} aria-hidden="true" />
      </div>
      <header key="header" ref={headerRef} className={styles.header}>
        <a className={styles.logo} href={HOME_HREF} onClick={back(act.close)}>
          White Inks.
        </a>
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
