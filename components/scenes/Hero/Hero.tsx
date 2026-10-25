"use client";

import { useEffect, useRef, useState } from "react";
import { LOOP_EVENT } from "@/components/scenes/Footer";
import skipStyles from "@/components/ui/Skip.module.css";
import { BRIEF_CONFIG, openBrief } from "@/lib/brief";
import { phoneLayout } from "@/lib/phoneLayout";
import { viewportH } from "@/lib/scroll/onScroll";
import { HeaderMenu, HeaderNav } from "./HeaderMenu";
import styles from "./Hero.module.css";
import { HeroScrollLock, SKIP_EVENT } from "./HeroScrollLock";
import { HeroSlides } from "./HeroSlides";

// Путь падения точки в px от левого верхнего угла Hero: из центра круга (центр экрана)
// в точку покоя (50vw, 93vh) мягкой S-кривой — сначала вправо, потом влево. В конец приходит
// вертикально, чтобы без излома продолжиться трассой Scene 2. Размах изгиба — min(3.5vw, 4vh),
// как --swing в Hero.module.css: по нему выставлены слова заголовка и CTA.
function buildFallPath(w: number, h: number): string {
  const x = w / 2;
  // Телефон и планшет в портрете (phoneLayout, как мобильный блок Hero.module.css): текст слева,
  // линия справа — от круга (74vw, y1) к пику 79vw на 60% и плавно к той же точке покоя (50vw, 93%).
  // y1 — как --y1 в CSS: около 30% высоты, на вытянутых экранах ниже, на коротких выше —
  // пустота над текстом и под ним до CTA примерно поровну. После пика линия ещё держится
  // справа (ручка 0.13 высоты), чтобы на коротких экранах не задеть подзаголовок.
  if (phoneLayout()) {
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

const INTRO_MS = 4500; // заставка целиком, как в HeroScrollLock
const SKIP_MS = 650; // «пропустить» доигрывает её за столько

export function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);
  const [ready, setReady] = useState(false);
  const [fallPath, setFallPath] = useState("");

  useEffect(() => {
    requestAnimationFrame(() => setReady(true));
  }, []);

  // Все слои заставки: Hero, шапка, меню (HeaderMenu — следующий за шапкой элемент) и «пропустить».
  const introRoots = () => [
    heroRef.current,
    headerRef.current,
    headerRef.current?.nextElementSibling,
    skipRef.current,
  ];

  // «Пропустить»: заставка не обрывается, а доигрывается быстро — её CSS-анимации ускоряются так,
  // чтобы дойти до конца за SKIP_MS; пульс точки (он бесконечный) сдвигается — начнётся тогда же.
  // Замок прокрутки и автопрокрутка слайдов узнают об этом из SKIP_EVENT. Так же и на новом круге.
  const skipIntro = () => {
    const anims = introRoots()
      .flatMap((root) => root?.getAnimations({ subtree: true }) ?? [])
      .filter((a) => a instanceof CSSAnimation);
    const now = Math.max(0, ...anims.map((a) => Number(a.currentTime) || 0));
    const left = INTRO_MS - now;
    if (left <= SKIP_MS) return;
    for (const a of anims) {
      if (a.effect?.getTiming().iterations === Number.POSITIVE_INFINITY) {
        a.currentTime = (Number(a.currentTime) || 0) + left - SKIP_MS;
      } else a.updatePlaybackRate(left / SKIP_MS);
    }
    window.dispatchEvent(new CustomEvent(SKIP_EVENT, { detail: { in: SKIP_MS } }));
  };

  // Новый круг пути (Footer): интро заново — с момента detail.from (мс; футер отдаёт кадр
  // «вдоха» круга, 2 с). Снимаем .ready, пересчитываем стили и возвращаем — CSS-анимации
  // стартуют в этом же кадре, и всем сразу ставим этот момент. Скролл держит HeroScrollLock.
  useEffect(() => {
    const restart = (e: Event) => {
      const hero = heroRef.current;
      if (!hero) return;
      const others = [headerRef.current, skipRef.current];
      hero.classList.remove(styles.ready);
      for (const el of others) el?.classList.remove(styles.ready);
      hero.getBoundingClientRect();
      hero.classList.add(styles.ready);
      for (const el of others) el?.classList.add(styles.ready);
      skipRef.current?.classList.add(skipStyles.blend);
      const from = (e as CustomEvent<{ from?: number }>).detail?.from ?? 0;
      if (!from) return;
      for (const root of [
        hero,
        headerRef.current,
        headerRef.current?.nextElementSibling,
        skipRef.current,
      ]) {
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
        <span className={styles.studioLabel}>white inks.</span>

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
          {/* «Связаться» и «Обсудить проект» открывают окно заявки (components/ui/BriefModal). */}
          <button type="button" className={styles.cta} onClick={(e) => openBrief(e.currentTarget)}>
            Связаться
          </button>
        </HeroSlides>

        {/* Точка пути: в покое — у конца линии, с прокруткой её ведут Сцены 2 и 3. */}
        <div className={styles.drop} aria-hidden="true" />
      </section>

      {/* Шапка — вне слоя Hero (у него z-index 2): так она встаёт над сценами. */}
      <header ref={headerRef} className={`${styles.header} ${ready ? styles.ready : ""}`}>
        <span className={styles.logo}>white inks.</span>
        <HeaderNav />
        <a className={styles.phone} href={`tel:+${BRIEF_CONFIG.phone.replace(/\D/g, "")}`}>
          {BRIEF_CONFIG.phone}
        </a>
        {/* На месте телефона, пока «Связаться» за экраном (.asking, HeaderMenu.tsx). */}
        <button
          type="button"
          className={styles.headerCta}
          onClick={(e) => openBrief(e.currentTarget)}
        >
          Обсудить проект
        </button>
      </header>
      <HeaderMenu header={headerRef} />
      {/* Видна в начале заставки (Hero.module.css, .introSkip), уходит до её конца. Смешивание
          (.blend) — только пока она идёт: даже скрытая пилюля с ним держит второй слой во всю
          высоту страницы. Новый круг возвращает его (restart). */}
      <button
        ref={skipRef}
        type="button"
        className={`${skipStyles.skip} ${skipStyles.blend} ${styles.introSkip} ${ready ? styles.ready : ""}`}
        aria-label="Пропустить заставку"
        onClick={skipIntro}
        onAnimationEnd={(e) => {
          if (e.animationName.includes("introSkip"))
            e.currentTarget.classList.remove(skipStyles.blend);
        }}
      >
        пропустить
      </button>
    </>
  );
}
