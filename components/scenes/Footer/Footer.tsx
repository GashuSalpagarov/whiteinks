"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useLenis } from "@/app/providers";
import { BRIEF_CONFIG } from "@/lib/brief";
import { onScroll, viewportH } from "@/lib/scroll/onScroll";
import styles from "./Footer.module.css";

// Новый круг пути. detail.from — с какого момента интро (мс) Hero продолжает: футер отдаёт
// ровно кадр «вдоха» круга (pillBreath, 3,9 с в Hero.module.css). Слушают Hero, HeroScrollLock
// и HeroSlides.
export const LOOP_EVENT = "whiteinks:loop";
export const LOOP_FROM_MS = 3900;
// Футер доигрывает переход (петля → круг Hero): HeroScrollLock держит прокрутку до LOOP_EVENT.
export const HOLD_EVENT = "whiteinks:hold";

// Прокрутка у конца зоны стихла (и палец отпущен) — переход доигрывается сам. Быстрый свайп
// долетает до конца, но начнётся всё только после остановки: петля уже видна целиком.
const SETTLE_MS = 160;
// Доигрывание, мс: круг вздрагивает, петля заливается в круг (FILL_*), с MOVE круг встаёт на место
// круга Hero, к CLOSE_MS — прыжок наверх.
const FILL_FROM = 140;
const FILL_TO = 620;
const MOVE = 640;
const CLOSE_MS = 1420;

// Контакты — ЗАГЛУШКИ, одно место на весь сайт: BRIEF_CONFIG в lib/brief.ts.
const { telegram, email } = BRIEF_CONFIG;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

// Радиус петли — как у круга интро Hero (.pill: 180px, на телефоне < 768px — 140px): в этот круг
// она и превращается.
const loopRadius = () => (window.innerWidth < 768 ? 70 : 90);

// Круг интро Hero на экране после прыжка наверх (scrollY = 0) — как .pill в Hero.module.css:
// на телефоне — в (74%, --y1), --y1 — от общей высоты экрана (--ih), иначе — в центре Hero.
function heroCircle() {
  const hero = document.querySelector<HTMLElement>('[data-scene="hero"]');
  const w = window.innerWidth;
  const top = hero ? hero.getBoundingClientRect().top + window.scrollY : 0;
  if (w < 768) {
    const h = viewportH();
    return { x: w * 0.74, y: top + h * 0.3 + Math.max(h * -0.03, h * 0.22 - w * 0.352) };
  }
  return { x: w / 2, y: top + (hero?.offsetHeight ?? window.innerHeight) / 2 };
}

// Последний экран пути: белый футер в нижней части экрана, линия пути спускается по центру
// и кончается точкой (пунктир или чернила — как путь Сцены 5 над ним, Footer.module.css).
// Дальше зона, где футер стоит внизу, а линия по прокрутке уходит из точки в петлю: точка
// обводит круг слева от линии (пунктир заранее показывает путь). Петля замкнулась и прокрутка
// стихла — круг заливается, встаёт на место круга интро Hero и прыжок: палитра переворачивается
// (html[data-palette], см. globals.css), страница — наверх, Hero продолжает интро с «вдоха»
// этого круга. Каждый круг меняет палитру — один чистый переворот кадра: чёрный круг на белом
// становится белым на чёрном. Reduced motion: зоны нет, петля нарисована, «↺ замкнуть круг».
export function Footer() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);
  const loopRef = useRef<SVGSVGElement>(null);
  const ringRef = useRef<SVGGElement>(null);
  const diskRef = useRef<HTMLSpanElement>(null);
  const [copied, setCopied] = useState(false);
  const lenis = useLenis();

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const dot = dotRef.current;
    const loop = loopRef.current;
    const ring = ringRef.current;
    const disk = diskRef.current;
    if (!section || !stage || !dot || !loop || !ring || !disk) return;
    const ghost = ring.querySelector("circle");
    const trace = ring.querySelector("path");
    if (!ghost || !trace) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let last = "";
    let jumped = false;
    let playing = false;
    let touching = false;
    let settle = 0;
    let lastZ = 0;
    let viewport = "";
    // Петля в координатах футера: касается линии в точке (x, y), центр — на r левее.
    const g = { x: 0, y: 0, r: 0 };

    const layout = () => {
      g.r = loopRadius();
      g.x = dot.offsetLeft + dot.offsetWidth / 2;
      g.y = dot.offsetTop + dot.offsetHeight / 2;
      const { x, y, r } = g;
      ghost.setAttribute("cx", `${x - r}`);
      ghost.setAttribute("cy", `${y}`);
      ghost.setAttribute("r", `${r}`);
      // От касания вниз, по часовой — линия плавно продолжается в кольцо.
      trace.setAttribute(
        "d",
        `M${x} ${y} A${r} ${r} 0 1 1 ${x - 2 * r} ${y} A${r} ${r} 0 1 1 ${x} ${y}`,
      );
      disk.style.width = `${2 * r}px`;
      disk.style.height = `${2 * r}px`;
    };

    const togglePalette = () => {
      const root = document.documentElement;
      if (root.dataset.palette) delete root.dataset.palette;
      else root.dataset.palette = "inverted";
    };

    // Слои перехода — в исходное: после прыжка футер внизу страницы, а круг уже в Hero.
    const restore = () => {
      playing = false;
      section.classList.remove(styles.closing);
      for (const el of [disk, loop, ring]) for (const a of el.getAnimations()) a.cancel();
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

    // Петля замкнулась: доигрываем сами (WAAPI), прокрутку держит HeroScrollLock.
    const close = () => {
      if (playing || jumped) return;
      playing = true;
      jumped = true;
      window.dispatchEvent(new Event(HOLD_EVENT));
      const s = stage.getBoundingClientRect();
      const cx = s.left + g.x - g.r;
      const cy = s.top + g.y;
      const p = heroCircle();
      const at = (x: number, y: number, k: number) =>
        `translate(${x - g.r}px, ${y - g.r}px) scale(${k})`;
      section.classList.add(styles.closing);
      ring.animate(
        [{ transform: "scale(1)" }, { transform: "scale(0.955)" }, { transform: "scale(1)" }],
        {
          duration: 280,
          easing: "ease-in-out",
        },
      );
      // Кольцо уходит, когда круг его накрыл: обводка на 2px шире круга.
      loop.animate([{ opacity: 1 }, { opacity: 1, offset: 0.999 }, { opacity: 0 }], {
        duration: MOVE,
        fill: "forwards",
      });
      const move = disk.animate(
        [
          { offset: 0, transform: at(cx, cy, 0) },
          {
            offset: FILL_FROM / CLOSE_MS,
            transform: at(cx, cy, 0),
            easing: "cubic-bezier(0.33, 1, 0.68, 1)",
          },
          { offset: FILL_TO / CLOSE_MS, transform: at(cx, cy, 1) },
          {
            offset: MOVE / CLOSE_MS,
            transform: at(cx, cy, 1),
            easing: "cubic-bezier(0.65, 0, 0.35, 1)",
          },
          { offset: 1, transform: at(p.x, p.y, 1) },
        ],
        { duration: CLOSE_MS, fill: "forwards" },
      );
      move.onfinish = teleport;
    };

    const update = () => {
      if (playing) return;
      const rect = section.getBoundingClientRect();
      const h = window.innerHeight;
      const fh = stage.offsetHeight;
      // Футер встаёт низом экрана, когда верх секции — на stuck. Зона — всё, что секция длиннее
      // футера: столько он стоит внизу, а точка обводит петлю.
      const stuck = h - fh;
      const zone = rect.height - fh;
      const scrolled = stuck - rect.top;
      const z = zone > 0 ? clamp01(scrolled / zone) : 0;

      // Resize посреди зоны: страница сменила длину, и браузер сдвинул скролл (у края — сразу
      // в конец зоны, то есть в прыжок). Возвращаем ту же долю зоны и в этом проходе не прыгаем.
      // Панель браузера на телефоне долю не меняет — тогда и скролл не трогаем.
      const vp = `${window.innerWidth}x${h}`;
      if (vp !== viewport) {
        const was = viewport;
        viewport = vp;
        layout();
        last = "";
        const y = window.scrollY + rect.top - stuck + lastZ * zone;
        // Нативно, не через Lenis: его граница прокрутки после resize ещё старая.
        if (was && lastZ > 0 && Math.abs(y - window.scrollY) > 1) {
          window.scrollTo(0, y);
          return;
        }
      }
      lastZ = z;
      if (z < 0.5) jumped = false;

      // Петля — по прогрессу зоны; без анимаций она нарисована сразу. Точка идёт по кругу:
      // смещение от касания. На телефоне подпись под точкой — петля проходит по ней, подпись
      // гаснет в начале зоны и возвращается, если прокрутить назад.
      const k = reduced ? 1 : z;
      const a = k * Math.PI * 2;
      const dx = g.r * Math.cos(a) - g.r;
      const dy = g.r * Math.sin(a);
      const cap = 1 - clamp01((k - 0.04) / 0.16);
      const next = `${k}|${dx}|${dy}`;
      if (next !== last) {
        last = next;
        section.style.setProperty("--k", `${k}`);
        section.style.setProperty("--dx", `${dx}px`);
        section.style.setProperty("--dy", `${dy}px`);
        section.style.setProperty("--cap", `${cap}`);
      }

      // Конец зоны (≥ 1px до низа страницы) — один переход на круг, когда прокрутка стихла.
      window.clearTimeout(settle);
      if (reduced || jumped || zone <= 0 || scrolled < zone - 1) return;
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

  // Почта — копируется; не вышло (нет доступа к буферу) — открываем письмо.
  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      window.location.href = `mailto:${email}`;
    }
  };

  return (
    <section ref={sectionRef} className={styles.footer} data-scene="footer" aria-label="Контакты">
      <div ref={stageRef} className={styles.stage}>
        <span className={styles.line} aria-hidden="true" />
        {/* Петля: пунктир пути и сама линия; координаты — в Footer.tsx (layout). */}
        <svg ref={loopRef} className={styles.loop} aria-hidden="true">
          <g ref={ringRef} className={styles.ring}>
            <circle className={styles.ghost} />
            <path className={styles.trace} pathLength={1} />
          </g>
        </svg>
        <span ref={dotRef} className={styles.dot} aria-hidden="true" />
        <div className={styles.contacts}>
          <a
            href={`https://t.me/${telegram.replace(/^@/, "")}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Telegram {telegram} <span aria-hidden="true">↗</span>
          </a>
          <button type="button" className={styles.mail} onClick={copyEmail} aria-live="polite">
            {copied ? "почта скопирована" : email}
          </button>
          <button type="button" className={styles.again} onClick={again}>
            ↺ замкнуть круг
          </button>
        </div>
        <p className={styles.fine}>
          <Link href="/privacy">Политика конфиденциальности</Link>
          <Link href="/consent">Согласие на обработку данных</Link>
          <span className={styles.copy}>© 2026 White Inks</span>
        </p>
      </div>
      {/* Круг, в который заливается петля: на экране (fixed), встаёт на место круга Hero. */}
      <span ref={diskRef} className={styles.disk} aria-hidden="true" />
    </section>
  );
}
