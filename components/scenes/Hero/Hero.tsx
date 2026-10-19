'use client';

import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { useLenis } from '@/app/providers';
import { LOOP_EVENT } from '@/components/scenes/Footer';
import { BRIEF_CONFIG } from '@/lib/brief';
import { onScroll, setVar, viewportH } from '@/lib/scroll/onScroll';
import { HeaderLogo } from './HeaderLogo';
import { HeaderMenu, HeaderNav } from './HeaderMenu';
import styles from './Hero.module.css';
import { HeroScrollLock } from './HeroScrollLock';
import { HeroSlides } from './HeroSlides';

const STUDIO_NAMES = ['Белые чернила', 'White Inks'];

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
    ].join(' ');
  }
  // Пики изгиба (касательная там вертикальна) — на высоте «цифровые» (58%, 0.6 размаха
  // вправо: ближе к старту, мягче) и «продукты» (78%, полный размах влево).
  const a = Math.min(w * 0.035, h * 0.04);
  return [
    `M${x} ${h * 0.5}`,
    `C${x} ${h * 0.535} ${x + a * 0.6} ${h * 0.545} ${x + a * 0.6} ${h * 0.58}`,
    `S${x - a} ${h * 0.72} ${x - a} ${h * 0.78}`,
    `S${x} ${h * 0.88} ${x} ${h * 0.93}`,
  ].join(' ');
}

export function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [fallPath, setFallPath] = useState('');
  const lenis = useLenis();

  // CTA ведёт к конструктору брифа (Сцена 5) — плавным пролётом по всему пути. Пока интро
  // держит скролл (HeroScrollLock остановил Lenis), scrollTo без force ничего не делает.
  const goToBrief = () => {
    const brief = document.querySelector<HTMLElement>('[data-scene="scene5"]');
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

  // Новый круг пути (Footer): интро заново с t = 0. Снимаем .ready, пересчитываем стили
  // и возвращаем — CSS-анимации стартуют с начала в этом же кадре. Скролл не блокируем.
  useEffect(() => {
    const restart = () => {
      const hero = heroRef.current;
      if (!hero) return;
      hero.classList.remove(styles.ready);
      headerRef.current?.classList.remove(styles.ready);
      hero.getBoundingClientRect();
      hero.classList.add(styles.ready);
      headerRef.current?.classList.add(styles.ready);
    };
    window.addEventListener(LOOP_EVENT, restart);
    return () => window.removeEventListener(LOOP_EVENT, restart);
  }, []);

  // Путь считается от текущего вьюпорта: высота — общая viewportH() (в CSS это --ih), на
  // телефоне она не меняется, когда прячется панель браузера. Линия и точка анимируются
  // в долях пути, поэтому и при resize посреди интро остаются синхронными.
  useEffect(() => {
    const updatePath = () => setFallPath(buildFallPath(window.innerWidth, viewportH()));

    window.addEventListener('resize', updatePath);
    updatePath();

    return () => window.removeEventListener('resize', updatePath);
  }, []);

  // Hero отвечает только за вертикальное движение точки к центру и её фиксацию.
  // Горизонтальная траектория и контент сцены 2 — в Scene2.
  useEffect(() => {
    if (!heroRef.current) return;
    const updateOffset = () => {
      if (!dropRef.current) return;
      const h = viewportH();
      // При h = 0 вышло бы NaN, а `NaNpx` делает transform у .drop невалидным —
      // точка проваливается в центр экрана. Такие кадры пропускаем.
      if (!h) return;
      const scrollVh = (window.scrollY / h) * 100;
      const offsetVh = Math.max(43 - scrollVh, 0);
      const offsetPx = (offsetVh * h) / 100;
      if (!Number.isFinite(offsetPx)) return;

      // В px от общей высоты экрана — в тех же единицах, что линия Hero и трасса Scene 2
      // (на мобильных CSS vh больше innerHeight, и точка отъезжала бы от конца линии).
      setVar('--drop-offset', `${offsetPx}px`);

      if (offsetVh <= 0) {
        dropRef.current.classList.add(styles.dropPinned);
      } else {
        dropRef.current.classList.remove(styles.dropPinned);
      }
    };

    return onScroll(heroRef.current, updateOffset);
  }, []);

  return (
    <>
      <section
        ref={heroRef}
        className={`scene ${styles.hero} ${ready ? styles.ready : ''}`}
        data-scene="hero"
        id="hero"
      >
        <HeroScrollLock />

        <div className={styles.pill} aria-hidden="true" />
        {/* «Белые чернила», затем по буквам — «White Inks» (как смена в логотипе). */}
        <span className={styles.studioLabel} role="img" aria-label="White Inks">
          {STUDIO_NAMES.map((name) => (
            <span key={name} className={styles.studioName} aria-hidden="true">
              {[...name].map((ch, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: буквы повторяются, порядок постоянный
                <span key={i} style={{ '--i': i } as CSSProperties}>
                  {ch}
                </span>
              ))}
            </span>
          ))}
        </span>

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

      {/* Шапка — вне слоя Hero (у него z-index 2): на телефоне она встаёт над сценами. */}
      <header ref={headerRef} className={`${styles.header} ${ready ? styles.ready : ''}`}>
        <HeaderLogo />
        <HeaderNav />
        <a className={styles.phone} href={`tel:+${BRIEF_CONFIG.phone.replace(/\D/g, '')}`}>
          {BRIEF_CONFIG.phone}
        </a>
      </header>
      <HeaderMenu header={headerRef} />
    </>
  );
}
