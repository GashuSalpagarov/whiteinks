'use client';

import { useEffect, useRef, useState } from 'react';
import { LOOP_EVENT } from '@/components/scenes/Footer';
import { BRIEF_CONFIG } from '@/lib/brief';
import { onScroll, setVar } from '@/lib/scroll/onScroll';
import styles from './Hero.module.css';
import { HeroScrollLock } from './HeroScrollLock';

// Путь падения точки в px от левого верхнего угла Hero: из центра круга (центр экрана)
// в точку покоя (50vw, 93vh) мягкой S-кривой — сначала вправо, потом влево. В конец приходит
// вертикально, чтобы без излома продолжиться трассой Scene 2. Размах изгиба — min(3.5vw, 4vh),
// как --swing в Hero.module.css: по нему выставлены слова заголовка и CTA.
function buildFallPath(w: number, h: number): string {
  const x = w / 2;
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
  const dropRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [fallPath, setFallPath] = useState('');

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
      hero.getBoundingClientRect();
      hero.classList.add(styles.ready);
    };
    window.addEventListener(LOOP_EVENT, restart);
    return () => window.removeEventListener(LOOP_EVENT, restart);
  }, []);

  // Путь считается от текущего вьюпорта. Линия и точка анимируются в долях пути,
  // поэтому и при resize посреди интро остаются синхронными.
  useEffect(() => {
    const updatePath = () => setFallPath(buildFallPath(window.innerWidth, window.innerHeight));

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
      const h = window.innerHeight;
      // При h = 0 вышло бы NaN, а `NaNpx` делает transform у .drop невалидным —
      // точка проваливается в центр экрана. Такие кадры пропускаем.
      if (!h) return;
      const scrollVh = (window.scrollY / h) * 100;
      const offsetVh = Math.max(43 - scrollVh, 0);
      const offsetPx = (offsetVh * h) / 100;
      if (!Number.isFinite(offsetPx)) return;

      // В px от innerHeight — в тех же единицах, что линия Hero и трасса Scene 2
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
    <section
      ref={heroRef}
      className={`scene ${styles.hero} ${ready ? styles.ready : ''}`}
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

      <h1 className={styles.title}>
        <span className={`${styles.word} ${styles.word1}`}>Создаём</span>{' '}
        <span className={`${styles.word} ${styles.word2}`}>цифровые</span>{' '}
        <span className={`${styles.word} ${styles.word3}`}>продукты</span>
      </h1>
      <p className={styles.lead}>
        Сайты, приложения и бренды — от идеи до запуска. Проектируем, рисуем и разрабатываем
        под ключ.
      </p>
      <span className={styles.cta} aria-hidden="true">
        Связаться
      </span>

      <div ref={dropRef} className={styles.drop} aria-hidden="true" />

      <span className={styles.logo}>White Inks</span>
      <a className={styles.phone} href={`tel:+${BRIEF_CONFIG.phone.replace(/\D/g, '')}`}>
        {BRIEF_CONFIG.phone}
      </a>
    </section>
  );
}
