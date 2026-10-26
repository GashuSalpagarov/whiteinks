"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useLenis } from "@/app/providers";
import { pathHandoff } from "@/lib/scroll/handoff";
import { onScroll, viewportH } from "@/lib/scroll/onScroll";
import styles from "./Footer.module.css";

// Новый круг пути. detail.from — с какого момента интро (мс) Hero продолжает: футер отдаёт
// ровно кадр «вдоха» круга (pillBreath, 2 с в Hero.module.css). Слушают Hero, HeroScrollLock
// и HeroSlides.
export const LOOP_EVENT = "whiteinks:loop";
export const LOOP_FROM_MS = 2000;
// Футер доигрывает переход (петля → круг Hero): HeroScrollLock держит прокрутку до LOOP_EVENT.
export const HOLD_EVENT = "whiteinks:hold";

// Прокрутка в конце стихла (и палец отпущен) — переход доигрывается сам. Быстрый свайп долетает
// до конца, но начнётся всё только после остановки: петля уже видна целиком.
const SETTLE_MS = 160;
// Доигрывание, мс: петля заливается светлым кругом, линия и точка гаснут (FILL_MS); чёрное
// поднимается на весь экран, а круг — на место круга Hero (RISE_MS); HOLD_MS — и прыжок.
const FILL_MS = 300;
const RISE_MS = 620;
const HOLD_MS = 60;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

// Обратный цвет (как filter: invert(1)): rgb(10, 10, 10) → rgb(245, 245, 245).
const invert = (rgb: string) =>
  `rgb(${(rgb.match(/\d+(\.\d+)?/g) ?? ["0", "0", "0"])
    .slice(0, 3)
    .map((v) => 255 - Number(v))
    .join(", ")})`;

// Круг интро Hero на экране после прыжка наверх (scrollY = 0): место и размер самого .pill —
// translate(-50%, -50%) ставит её центр в left/top, — без своей копии формулы Hero.
function heroCircle() {
  const hero = document.querySelector<HTMLElement>('[data-scene="hero"]');
  const pill = hero?.querySelector<HTMLElement>(':scope > div[aria-hidden="true"]');
  if (!hero || !pill) return { x: window.innerWidth / 2, y: viewportH() / 2, r: 90 };
  return {
    x: hero.offsetLeft + pill.offsetLeft,
    y: hero.offsetTop + pill.offsetTop,
    r: pill.offsetWidth / 2,
  };
}

// Конец пути. Под заявкой — белый воздух и строка: политика и согласие слева, © справа, ось пути
// между ними свободна (.end). Ниже — чёрный подвал на полэкрана (перевёрнутая палитра, .next):
// начало нового круга. Линия пути входит в него по центру, точка идёт по ней с постоянной
// скоростью и к концу страницы обводит петлю размером с круг интро Hero. Прокрутка стихла — петля
// заливается светлым кругом, чёрное поднимается на весь экран, а круг — на место круга Hero: это
// первый кадр следующего круга, и прыжок: палитра переворачивается (html[data-palette],
// globals.css), страница — наверх, Hero продолжает интро с «вдоха». Путь идёт со страницей
// (fixed — только слои доигрывания, прокрутка тогда закрыта): при прокрутке пальцем точка и
// линия не расходятся. Назад — так же, прокруткой. Reduced motion: перехода нет, линия
// кончается точкой в воздухе, в чёрном подвале — «↺ замкнуть круг».
export function Footer() {
  const sectionRef = useRef<HTMLElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLDivElement>(null);
  const floodRef = useRef<HTMLSpanElement>(null);
  const diskRef = useRef<HTMLSpanElement>(null);
  const lenis = useLenis();

  useEffect(() => {
    const section = sectionRef.current;
    const end = endRef.current;
    const next = nextRef.current;
    const flood = floodRef.current;
    const disk = diskRef.current;
    if (!section || !end || !next || !flood || !disk) return;
    const endDot = end.querySelector<HTMLElement>(`.${styles.dot}`);
    const endInk = end.querySelector<HTMLElement>(`.${styles.line} > span`);
    const nextDot = next.querySelector<HTMLElement>(`.${styles.dot}`);
    const nextInk = next.querySelector<HTMLElement>(`.${styles.line} > span`);
    const ghost = next.querySelector("circle");
    const trace = next.querySelector("path");
    if (!endDot || !endInk || !nextDot || !nextInk || !ghost || !trace) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let last = "";
    let jumped = false;
    let playing = false;
    let touching = false;
    let settle = 0;
    let viewport = "";
    // Геометрия. end — белый воздух со строкой; home — место точки без transform (от верха
    // футера), dy — оно же на экране, когда футер у низа экрана: высота стыка для Сцены 6 (--hand)
    // и запас, если она её не задала; rest — место точки без анимаций. next — чёрный подвал:
    // петля — центр (cx, cy) и радиус r круга Hero, lt — её верх; P — длина пути от верха футера
    // до конца петли.
    const g = {
      endH: 0,
      nextH: 0,
      home: 0,
      dy: 0,
      rest: 0,
      cx: 0,
      cy: 0,
      r: 0,
      lt: 0,
      ring: 0,
      P: 0,
    };

    const layout = () => {
      const h = viewportH();
      const c = heroCircle();
      g.endH = end.offsetHeight;
      g.nextH = next.offsetHeight;
      g.home = endDot.offsetTop + endDot.offsetHeight / 2;
      g.dy = h - g.endH + g.home;
      g.rest = 0.6 * (end.querySelector<HTMLElement>(`.${styles.fine}`)?.offsetTop ?? g.endH);
      g.cx = next.clientWidth / 2;
      g.r = c.r;
      // Петля — посередине чёрного.
      g.cy = g.nextH / 2;
      g.lt = Math.max(0, g.cy - g.r);
      g.ring = 2 * Math.PI * g.r;
      g.P = g.endH + g.lt + g.ring;
      section.style.setProperty("--lt", `${g.lt}px`);
      ghost.setAttribute("cx", `${g.cx}`);
      ghost.setAttribute("cy", `${g.cy}`);
      ghost.setAttribute("r", `${g.r}`);
      // По часовой от верха петли.
      trace.setAttribute(
        "d",
        `M${g.cx} ${g.lt} A${g.r} ${g.r} 0 1 1 ${g.cx} ${g.cy + g.r} A${g.r} ${g.r} 0 1 1 ${g.cx} ${g.lt}`,
      );
    };

    const togglePalette = () => {
      const root = document.documentElement;
      if (root.dataset.palette) delete root.dataset.palette;
      else root.dataset.palette = "inverted";
    };

    // В исходное: после прыжка футер внизу страницы, а круг уже в Hero.
    const restore = () => {
      playing = false;
      last = "";
      section.classList.remove(styles.closing);
      for (const el of [flood, disk]) for (const a of el.getAnimations()) a.cancel();
    };

    const teleport = () => {
      togglePalette();
      restore();
      window.dispatchEvent(new CustomEvent(LOOP_EVENT, { detail: { from: LOOP_FROM_MS } }));
      // immediate: без анимации и со сбросом скорости Lenis — пружина скорости Сцены 3 не
      // получит рывка от прыжка через всю страницу. force: HeroScrollLock уже остановил Lenis —
      // он же держит скролл, пока точка Hero не приземлится, и глотает инерцию колёсика.
      if (lenis) {
        lenis.scrollTo(0, { immediate: true, force: true });
      } else {
        window.scrollTo(0, 0);
      }
    };

    // Петля замкнулась и прокрутка стихла (прокрутку держит HeroScrollLock, HOLD_EVENT): петля
    // заливается светлым кругом, линия и точка гаснут (CSS, .closing); потом чёрное поднимается
    // с верха подвала на весь экран (.flood), а круг (.disk) — на место круга Hero. Только
    // opacity и transform. Цвета — обратные фону и линии: ровно фон и круг Hero следующего круга.
    const close = () => {
      if (playing || jumped) return;
      playing = true;
      jumped = true;
      window.dispatchEvent(new Event(HOLD_EVENT));
      const c = heroCircle();
      const n = next.getBoundingClientRect();
      const dx = n.left + g.cx - c.x;
      const dy = n.top + g.cy - c.y;
      const k = g.r / c.r;
      const total = FILL_MS + RISE_MS + HOLD_MS;
      const a = FILL_MS / total;
      const b = (FILL_MS + RISE_MS) / total;
      const ease = "cubic-bezier(0.65, 0, 0.35, 1)";
      disk.style.left = `${c.x - c.r}px`;
      disk.style.top = `${c.y - c.r}px`;
      disk.style.width = `${2 * c.r}px`;
      disk.style.height = `${2 * c.r}px`;
      disk.style.backgroundColor = invert(getComputedStyle(section).color);
      section.classList.add(styles.closing);
      const at = `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) scale(${k})`;
      flood.animate(
        [
          { offset: 0, transform: `translateY(${n.top.toFixed(2)}px)` },
          { offset: a, transform: `translateY(${n.top.toFixed(2)}px)`, easing: ease },
          { offset: b, transform: "translateY(0px)" },
          { offset: 1, transform: "translateY(0px)" },
        ],
        { duration: total, fill: "forwards" },
      );
      const fill = disk.animate(
        [
          { offset: 0, opacity: 0, transform: at },
          { offset: a, opacity: 1, transform: at, easing: ease },
          { offset: b, opacity: 1, transform: "translate(0px, 0px) scale(1)" },
          { offset: 1, opacity: 1, transform: "translate(0px, 0px) scale(1)" },
        ],
        { duration: total, fill: "forwards" },
      );
      fill.onfinish = teleport;
    };

    const update = () => {
      if (playing) return;
      const h = viewportH();
      const vh = window.innerHeight;
      // Смена экрана (и панели браузера на телефоне) — перемеряем; в этом проходе не прыгаем.
      const vp = `${window.innerWidth}x${h}x${vh}`;
      const resized = vp !== viewport;
      if (resized) {
        viewport = vp;
        layout();
        last = "";
      }
      const rect = section.getBoundingClientRect();
      const top = rect.top;

      // Точка пути переходит сюда из Сцены 6 на высоте pathHandoff.y и идёт по линии с постоянной
      // скоростью — через воздух мимо строки в чёрный подвал и по петле: к концу страницы петля
      // замкнута. Ловит, когда верх футера дошёл до её низа, и, пока он проходит через неё
      // (радиус 6px), она стоит там же, где её держит Сцена 6: половины совпадают. Позади
      // точки — чернила, впереди — пунктир. Без анимаций — точка в воздухе, линия до неё в
      // чернилах.
      const y6 = Number.isFinite(pathHandoff.y) ? pathHandoff.y : g.dy;
      const fin = vh - g.endH - g.nextH; // верх футера в конце страницы
      const caught = reduced || top <= y6 + 6;
      const d = y6 - top;
      const p = reduced
        ? g.rest
        : Math.min(g.P, d < 6 ? d : 6 + ((g.P - 6) * (d - 6)) / Math.max(1, y6 - fin - 6));
      const q = p - g.endH; // в чёрном подвале
      const turn = clamp01((q - g.lt) / g.ring);
      const ang = turn * 2 * Math.PI;
      const nx = q > g.lt ? g.r * Math.sin(ang) : 0;
      const ny = q > g.lt ? g.cy - g.r * Math.cos(ang) : q;
      const key = `${caught}|${p.toFixed(1)}`;
      if (key !== last) {
        last = key;
        const show = caught ? "1" : "0";
        endDot.style.opacity = show;
        nextDot.style.opacity = show;
        endDot.style.transform = `translateY(${(p - g.home).toFixed(1)}px)`;
        nextDot.style.transform = `translate(${nx.toFixed(1)}px, ${ny.toFixed(1)}px)`;
        // Чернила — долей высоты линии (scaleY от верха); в воздухе линия на 2px заходит в
        // Сцену 6 — стык без волосяного просвета.
        const inkEnd = reduced ? 1 : caught ? clamp01((p + 2) / (g.endH + 2)) : 0;
        const inkNext = caught && g.lt > 0 ? clamp01(q / g.lt) : 0;
        endInk.style.transform = `scaleY(${inkEnd.toFixed(4)})`;
        nextInk.style.transform = `scaleY(${inkNext.toFixed(4)})`;
        trace.style.strokeDashoffset = `${1 - turn}`;
      }

      // Конец страницы (≤ 1px до низа) — один переход на круг, когда прокрутка стихла. Ушли назад
      // так, что верх чёрного ниже трёх четвертей экрана, — переход снова возможен.
      if (top + g.endH > 0.75 * h) jumped = false;
      window.clearTimeout(settle);
      if (reduced || jumped || resized || rect.bottom > vh + 1) return;
      settle = window.setTimeout(() => {
        if (!touching) close();
      }, SETTLE_MS);
    };

    const onTouchStart = () => {
      touching = true;
    };
    const onTouchEnd = () => {
      touching = false;
      update();
    };
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });
    const unsubscribe = onScroll(section, update);
    return () => {
      unsubscribe();
      window.clearTimeout(settle);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
      restore();
    };
  }, [lenis]);

  // Без анимаций: сразу в начало — палитра перевёрнута, Hero уже в покое.
  const again = () => {
    const root = document.documentElement;
    if (root.dataset.palette) delete root.dataset.palette;
    else root.dataset.palette = "inverted";
    window.scrollTo(0, 0);
  };

  return (
    <section ref={sectionRef} className={styles.footer} data-scene="footer" aria-label="Подвал">
      {/* Воздух под заявкой и строка. Точка — первая 12px: по ней Сцена 6 считает стык
          (footerHome в Scene6.tsx). */}
      <div ref={endRef} className={styles.end}>
        <span className={styles.line} aria-hidden="true">
          <span />
        </span>
        <span className={styles.dot} aria-hidden="true" />
        <p className={styles.fine}>
          <span className={styles.docs}>
            <Link href="/privacy" prefetch={false}>
              политика обработки персональных данных
            </Link>
            <Link href="/consent" prefetch={false}>
              согласие на обработку персональных данных
            </Link>
          </span>
          <span className={styles.copy}>© 2026 White Inks</span>
        </p>
      </div>
      {/* Доигрывание: чёрное на весь экран и круг Hero следующего круга (fixed, Footer.tsx). Между
          воздухом и чёрным: первый блок футера читает Сцена 6, последний — карта пути. */}
      <span ref={floodRef} className={styles.flood} aria-hidden="true" />
      <span ref={diskRef} className={styles.disk} aria-hidden="true" />
      {/* Чёрный подвал на полэкрана — начало нового круга: линия, петля, точка. */}
      <div ref={nextRef} className={styles.next}>
        <span className={styles.line} aria-hidden="true">
          <span />
        </span>
        <svg className={styles.loop} aria-hidden="true">
          <circle className={styles.ghost} />
          <path className={styles.trace} pathLength={1} />
        </svg>
        <span className={styles.dot} aria-hidden="true" />
        <button type="button" className={styles.again} onClick={again}>
          ↺ замкнуть круг
        </button>
      </div>
    </section>
  );
}
