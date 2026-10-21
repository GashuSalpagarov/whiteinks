"use client";

import { useEffect, useRef, useState } from "react";
import { useLenis } from "@/app/providers";
import { LOOP_EVENT } from "@/components/scenes/Footer";
import { BRIEF_CONFIG } from "@/lib/brief";
import { onScroll, setVar, viewportH } from "@/lib/scroll/onScroll";
import { HeaderMenu, HeaderNav } from "./HeaderMenu";
import styles from "./Hero.module.css";
import { HeroScrollLock } from "./HeroScrollLock";
import { HeroSlides } from "./HeroSlides";

// Путь падения точки в px от левого верхнего угла Hero: из центра круга (центр экрана)
// в точку покоя (50vw, 93vh) мягкой S-кривой — сначала вправо, потом влево. В конец приходит
// вертикально, чтобы без излома продолжиться трассой Scene 2. Размах изгиба — min(3.5vw, 4vh),
// как --swing в Hero.module.css: по нему выставлены слова заголовка и CTA.
function buildFallPath(w: number, h: number): string {
  const x = w / 2;
  // Телефон (< 768px, как мобильный блок Hero.module.css): текст слева, линия справа —
  // от круга (74vw, y1) к пику 79vw на 60% и плавно к той же точке покоя (50vw, 93%).
  // y1 — как --y1 в CSS: около 30% высоты, на вытянутых экранах ниже, на коротких выше —
  // пустота над текстом и под ним до CTA примерно поровну. После пика линия ещё держится
  // справа (ручка 0.13 высоты), чтобы на коротких экранах не задеть подзаголовок.
  if (w < 768) {
    const y1 = h * 0.3 + Math.max(h * -0.03, h * 0.22 - w * 0.352);
    const yp = h * 0.6;
    return [
      `M${w * 0.74} ${y1}`,
      `C${w * 0.74} ${y1 + (yp - y1) * 0.4} ${w * 0.79} ${yp - (yp - y1) * 0.33} ${w * 0.79} ${yp}`,
      `C${w * 0.79} ${yp + h * 0.13} ${x} ${h * 0.8} ${x} ${h * 0.93}`,
    ].join(" ");
  }
  // Пики изгиба (касательная там вертикальна) — на высоте «цифровые» (58%, 0.6 размаха
  // вправо: ближе к старту, мягче) и «продукты» (74%, полный размах влево; в коротком
  // ландшафте строки реже — 78%, как в Hero.module.css).
  const a = Math.min(w * 0.035, h * 0.04);
  const p = h <= 500 ? 0.78 : 0.74;
  return [
    `M${x} ${h * 0.5}`,
    `C${x} ${h * 0.535} ${x + a * 0.6} ${h * 0.545} ${x + a * 0.6} ${h * 0.58}`,
    `S${x - a} ${h * (p - 0.06)} ${x - a} ${h * p}`,
    `S${x} ${h * 0.88} ${x} ${h * 0.93}`,
  ].join(" ");
}

export function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [fallPath, setFallPath] = useState("");
  const lenis = useLenis();

  // CTA ведёт к письму-заявке (Сцена 6) — плавным пролётом по всему пути. Пока интро
  // держит скролл (HeroScrollLock остановил Lenis), scrollTo без force ничего не делает.
  const goToBrief = () => {
    const brief = document.querySelector<HTMLElement>('[data-scene="scene6"]');
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
    requestAnimationFrame(() => setReady(true));
  }, []);

  // Новый круг пути (Footer): интро заново — с момента detail.from (мс; футер отдаёт кадр
  // «вдоха» круга, 3,9 с). Снимаем .ready, пересчитываем стили и возвращаем — CSS-анимации
  // стартуют в этом же кадре, и всем сразу ставим этот момент: Hero, шапке и меню (HeaderMenu —
  // следующий за шапкой элемент). Скролл держит HeroScrollLock.
  useEffect(() => {
    const restart = (e: Event) => {
      const hero = heroRef.current;
      if (!hero) return;
      const header = headerRef.current;
      hero.classList.remove(styles.ready);
      header?.classList.remove(styles.ready);
      hero.getBoundingClientRect();
      hero.classList.add(styles.ready);
      header?.classList.add(styles.ready);
      const from = (e as CustomEvent<{ from?: number }>).detail?.from ?? 0;
      if (!from) return;
      for (const root of [hero, header, header?.nextElementSibling]) {
        for (const a of root?.getAnimations({ subtree: true }) ?? []) {
          if (a instanceof CSSAnimation) a.currentTime = from;
        }
      }
    };
    window.addEventListener(LOOP_EVENT, restart);
    return () => window.removeEventListener(LOOP_EVENT, restart);
  }, []);

  // Путь считается от текущего вьюпорта: высота — общая viewportH() (в CSS это --ih), на
  // телефоне она не меняется, когда прячется панель браузера. Линия и точка анимируются
  // в долях пути, поэтому и при resize посреди интро остаются синхронными.
  useEffect(() => {
    const updatePath = () => setFallPath(buildFallPath(window.innerWidth, viewportH()));

    window.addEventListener("resize", updatePath);
    updatePath();

    return () => window.removeEventListener("resize", updatePath);
  }, []);

  // Hero отвечает только за фиксацию точки: до 43vh прокрутки она стоит у конца линии и едет
  // вместе со страницей (Hero.module.css), дальше — закреплена в центре экрана.
  // Горизонтальная траектория и контент сцены 2 — в Scene2.
  useEffect(() => {
    if (!heroRef.current) return;
    const updateOffset = () => {
      if (!dropRef.current) return;
      // Общая высота экрана, как у линии Hero и трассы Scene 2 (на мобильных CSS vh больше
      // innerHeight). При h = 0 точку не трогаем.
      const h = viewportH();
      if (!h) return;
      // Закреплённой точке сдвиг — с корня: 0, дальше свой ставят Сцены 2 и 3 (20px).
      setVar("--drop-offset", "0px");
      dropRef.current.classList.toggle(styles.dropPinned, window.scrollY >= 0.43 * h);
    };

    return onScroll(heroRef.current, updateOffset);
  }, []);

  return (
    <>
      <section
        ref={heroRef}
        className={`scene ${styles.hero} ${ready ? styles.ready : ""}`}
        data-scene="hero"
        id="hero"
      >
        <HeroScrollLock />

        <div className={styles.pill} aria-hidden="true" />
        <span className={styles.studioLabel}>White Inks</span>

        <svg className={styles.line} aria-hidden="true">
          <path className={styles.lineStroke} d={fallPath || undefined} pathLength={1} />
        </svg>
        <span
          className={styles.fallDot}
          style={fallPath ? { offsetPath: `path('${fallPath}')` } : undefined}
          aria-hidden="true"
        />

        {/* Заголовок, подводка, картинки и индикатор слайдов — HeroSlides.tsx, тексты — slides.ts. */}
        <HeroSlides hero={heroRef}>
          <button type="button" className={styles.cta} onClick={goToBrief}>
            Связаться
          </button>
        </HeroSlides>

        <div ref={dropRef} className={styles.drop} aria-hidden="true" />
      </section>

      {/* Шапка — вне слоя Hero (у него z-index 2): так она встаёт над сценами. */}
      <header ref={headerRef} className={`${styles.header} ${ready ? styles.ready : ""}`}>
        <span className={styles.logo}>White Inks</span>
        <HeaderNav />
        <a className={styles.phone} href={`tel:+${BRIEF_CONFIG.phone.replace(/\D/g, "")}`}>
          {BRIEF_CONFIG.phone}
        </a>
      </header>
      <HeaderMenu header={headerRef} />
    </>
  );
}
