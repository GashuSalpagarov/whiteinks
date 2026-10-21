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
// Доигрывание, мс: от петли наружу растекаются чернила — фон вокруг круга заливается до углов
// экрана (FLOOD_MS), круг остаётся светлым; если петля больше круга Hero, чернила сходятся
// к нему от края петли (RESIZE_MS); HOLD_MS — и прыжок.
const FLOOD_MS = 620;
const RESIZE_MS = 420;
const HOLD_MS = 60;

// Контакты — ЗАГЛУШКИ, одно место на весь сайт: BRIEF_CONFIG в lib/brief.ts.
const { telegram, email } = BRIEF_CONFIG;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

// Обратный цвет (как filter: invert(1)): rgb(10, 10, 10) → rgb(245, 245, 245).
const invert = (rgb: string) =>
  `rgb(${(rgb.match(/\d+(\.\d+)?/g) ?? ["0", "0", "0"])
    .slice(0, 3)
    .map((v) => 255 - Number(v))
    .join(", ")})`;

// Круг интро Hero на экране после прыжка наверх (scrollY = 0) — как .pill в Hero.module.css:
// на телефоне (< 768px) — 140px в (74%, --y1), --y1 — от общей высоты экрана (--ih);
// иначе — 180px в центре Hero.
function heroCircle() {
  const hero = document.querySelector<HTMLElement>('[data-scene="hero"]');
  const w = window.innerWidth;
  const top = hero ? hero.getBoundingClientRect().top + window.scrollY : 0;
  if (w < 768) {
    const h = viewportH();
    const y1 = h * 0.3 + Math.max(h * -0.03, h * 0.22 - w * 0.352);
    return { x: w * 0.74, y: top + y1, r: 70 };
  }
  return { x: w / 2, y: top + (hero?.offsetHeight ?? window.innerHeight) / 2, r: 90 };
}

// Последний экран пути: белый футер в нижней части экрана, линия пути спускается по центру
// и кончается точкой (пунктир или чернила — как путь Сцены 6 над ним, Footer.module.css).
// Дальше зона, где футер стоит внизу, а петля рисуется ровно там, где на следующем круге стоит
// круг интро Hero: точка по прокрутке отступает по своей линии к этому кругу (линия за ней
// втягивается) и обводит его; пунктир круга проступает, как только она вошла на окружность.
// Петля замкнулась и прокрутка стихла — круг остаётся светлым, а от петли наружу растекаются
// чернила и заливают фон до краёв экрана (если петля больше круга Hero — чернила сходятся к нему
// от её края), всё прочее гаснет. Это уже первый кадр Hero следующего круга: светлый круг на
// тёмном в перевёрнутой палитре. Прыжок: палитра переворачивается (html[data-palette], см.
// globals.css), страница — наверх, Hero продолжает интро с «вдоха» этого круга — на экране не
// меняется ничего. Reduced motion: зоны нет, футер — конец страницы, «↺ замкнуть круг».
export function Footer() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);
  const contactsRef = useRef<HTMLDivElement>(null);
  const loopRef = useRef<SVGSVGElement>(null);
  const diskRef = useRef<HTMLSpanElement>(null);
  const floodRef = useRef<HTMLSpanElement>(null);
  const [copied, setCopied] = useState(false);
  const lenis = useLenis();

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const dot = dotRef.current;
    const contacts = contactsRef.current;
    const loop = loopRef.current;
    const disk = diskRef.current;
    const flood = floodRef.current;
    if (!section || !stage || !dot || !contacts || !loop || !disk || !flood) return;
    const ghost = loop.querySelector("circle");
    const trace = loop.querySelector("path");
    const pen = loop.querySelector(`.${styles.pen}`);
    if (!ghost || !trace || !pen) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let last = "";
    let jumped = false;
    let playing = false;
    let touching = false;
    let settle = 0;
    let lastZ = 0;
    let viewport = "";
    // Геометрия на экране, пока футер стоит внизу (sticky): d — точка футера, c — круг Hero
    // (центр, радиус петли r и круга Hero rh), e — где точка входит в петлю (a0 — её угол),
    // back — сколько точка отступает по линии до e, fade — петля ляжет на подпись.
    const g = {
      dx: 0,
      dy: 0,
      cx: 0,
      cy: 0,
      r: 0,
      rh: 0,
      ex: 0,
      ey: 0,
      a0: 0,
      back: 0,
      fade: false,
    };

    const layout = () => {
      const h = window.innerHeight;
      const fh = stage.offsetHeight;
      const c = heroCircle();
      g.dx = dot.offsetLeft + dot.offsetWidth / 2;
      g.dy = h - fh + dot.offsetTop + dot.offsetHeight / 2;
      g.cx = c.x;
      g.cy = c.y;
      g.rh = c.r;
      // Круг Hero на линии (десктоп) — петля его размера, точка входит сверху. Сбоку от линии
      // (телефон) — петля касается линии, точка входит по касательной; она чуть больше круга
      // Hero и при заливке сжимается до него от центра.
      if (Math.abs(c.x - g.dx) < 1) {
        g.r = c.r;
        g.a0 = -Math.PI / 2;
      } else {
        g.r = Math.abs(c.x - g.dx);
        g.a0 = c.x > g.dx ? Math.PI : 0;
      }
      g.ex = g.cx + g.r * Math.cos(g.a0);
      g.ey = g.cy + g.r * Math.sin(g.a0);
      g.back = Math.max(0, g.dy - g.ey);
      const ax = 2 * g.cx - g.ex;
      const ay = 2 * g.cy - g.ey;
      ghost.setAttribute("cx", `${g.cx}`);
      ghost.setAttribute("cy", `${g.cy}`);
      ghost.setAttribute("r", `${g.r}`);
      // По часовой от точки входа: на касательной — дальше в ту же сторону, что шла точка.
      trace.setAttribute(
        "d",
        `M${g.ex} ${g.ey} A${g.r} ${g.r} 0 1 1 ${ax} ${ay} A${g.r} ${g.r} 0 1 1 ${g.ex} ${g.ey}`,
      );
      // Подпись — в координатах экрана, пока футер стоит внизу.
      const s = stage.getBoundingClientRect();
      const k = contacts.getBoundingClientRect();
      const top = k.top - s.top + h - fh;
      g.fade =
        k.right > g.cx - g.r - 4 &&
        k.left < g.cx + g.r + 4 &&
        top + k.height > g.cy - g.r - 4 &&
        top < g.cy + g.r + 4;
    };

    const togglePalette = () => {
      const root = document.documentElement;
      if (root.dataset.palette) delete root.dataset.palette;
      else root.dataset.palette = "inverted";
    };

    // Слои перехода — в исходное: после прыжка футер внизу страницы, а круг уже в Hero.
    const restore = () => {
      playing = false;
      last = "";
      section.classList.remove(styles.closing);
      section.removeAttribute("data-loop");
      for (const el of [disk, flood]) for (const a of el.getAnimations()) a.cancel();
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

    // Петля замкнулась: доигрываем сами (WAAPI), прокрутку держит HeroScrollLock. Всё — в центре
    // круга Hero, только масштаб, без сдвига. Чернила (.flood, обратный фону цвет — фон Hero
    // следующего круга) растут от наружного края петли до самого дальнего угла экрана и встают
    // под обводку — она сливается с ними. Круг (.disk) над ними — от внутреннего края обводки
    // до петли; его цвет из цвета бумаги становится обратным цветом линии — ровно цветом круга
    // Hero следующего круга. Если петля больше круга Hero, круг сжимается до него.
    const close = () => {
      if (playing || jumped) return;
      playing = true;
      jumped = true;
      window.dispatchEvent(new Event(HOLD_EVENT));
      const w = window.innerWidth;
      const h = window.innerHeight;
      const far = Math.hypot(Math.max(g.cx, w - g.cx), Math.max(g.cy, h - g.cy)) + 2;
      // Место — раскладкой (left/top, дробные px — как у круга Hero), анимируется только масштаб:
      // край круга отрисован так же, как у него, без пересэмплирования слоя.
      const place = (el: HTMLElement, r: number) => {
        el.style.left = `${g.cx - r}px`;
        el.style.top = `${g.cy - r}px`;
        el.style.width = `${2 * r}px`;
        el.style.height = `${2 * r}px`;
      };
      const at = (k: number) => `scale(${k})`;
      const resize = Math.abs(g.r - g.rh) > 0.5 ? RESIZE_MS : 0;
      const total = FLOOD_MS + resize + HOLD_MS;
      const cs = getComputedStyle(section);
      const paper = cs.backgroundColor;
      const ink = invert(cs.color);
      place(flood, far);
      place(disk, g.rh);
      section.classList.add(styles.closing);
      flood.animate([{ transform: at((g.r + 2) / far) }, { transform: at(1) }], {
        duration: FLOOD_MS,
        easing: "cubic-bezier(0.5, 0, 0.3, 1)",
        fill: "forwards",
      });
      const fill = disk.animate(
        [
          { offset: 0, transform: at((g.r - 2) / g.rh), backgroundColor: paper },
          {
            offset: FLOOD_MS / total,
            transform: at(g.r / g.rh),
            backgroundColor: ink,
            easing: "cubic-bezier(0.65, 0, 0.35, 1)",
          },
          { offset: (FLOOD_MS + resize) / total, transform: at(1), backgroundColor: ink },
          { offset: 1, transform: at(1), backgroundColor: ink },
        ],
        { duration: total, fill: "forwards" },
      );
      fill.onfinish = teleport;
    };

    const update = () => {
      if (playing) return;
      const rect = section.getBoundingClientRect();
      const h = window.innerHeight;
      const fh = stage.offsetHeight;
      // Футер встаёт низом экрана, когда верх секции — на stuck. Зона — всё, что секция длиннее
      // футера: столько он стоит внизу, а точка рисует петлю.
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

      // Путь точки по прогрессу зоны, с постоянной скоростью: сначала назад по линии до входа
      // в петлю (линия за ней втягивается), потом по кругу. --cut — на сколько укорочена линия.
      const z1 = reduced ? 0 : z;
      const ring = 2 * Math.PI * g.r;
      const s = z1 * (g.back + ring);
      const cut = Math.min(s, g.back);
      const turn = clamp01((s - g.back) / ring);
      const a = g.a0 + turn * 2 * Math.PI;
      const px = s <= g.back ? g.dx : g.cx + g.r * Math.cos(a);
      const py = s <= g.back ? g.dy - s : g.cy + g.r * Math.sin(a);
      // Низ линии на экране: над футером она — ::before секции, её режем снизу (--clip).
      // Футер до зоны едет со страницей, в зоне стоит на stuck.
      const lineEnd = Math.max(rect.top, stuck) + (g.dy - stuck) - cut;
      const clip = Math.max(0, rect.bottom - lineEnd);
      const cap = g.fade ? 1 - clamp01((z1 - 0.02) / 0.1) : 1;
      const next = `${z1}|${clip}`;
      if (next !== last) {
        last = next;
        section.toggleAttribute("data-loop", z1 > 0);
        section.style.setProperty("--cut", `${cut}px`);
        section.style.setProperty("--clip", `${clip}px`);
        section.style.setProperty("--turn", `${turn}`);
        // Пунктир круга — только когда точка вошла на окружность: проступает за первые 8% обвода.
        section.style.setProperty("--ghost-o", `${clamp01(turn / 0.08)}`);
        section.style.setProperty("--cap", `${cap}`);
        pen.setAttribute("cx", `${px}`);
        pen.setAttribute("cy", `${py}`);
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
        <span ref={dotRef} className={styles.dot} aria-hidden="true" />
        <div ref={contactsRef} className={styles.contacts}>
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
      {/* Петля — на экране (fixed), там, где на следующем круге стоит круг Hero: пунктир пути,
          линия и точка. Координаты — в Footer.tsx (layout, update). */}
      <svg ref={loopRef} className={styles.loop} aria-hidden="true">
        <circle className={styles.ghost} />
        <path className={styles.trace} pathLength={1} />
        <circle className={styles.pen} r={6} />
      </svg>
      {/* Чернила вокруг круга и сам круг — в центре круга Hero, только масштаб. */}
      <span ref={floodRef} className={styles.flood} aria-hidden="true" />
      <span ref={diskRef} className={styles.disk} aria-hidden="true" />
    </section>
  );
}
