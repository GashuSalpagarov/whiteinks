'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './Hero.module.css';
import { HeroScrollLock } from './HeroScrollLock';

// Путь падения точки в px от левого верхнего угла Hero: из центра круга (50vw, 26vh, см. .pill)
// в точку покоя (50vw, 93vh) мягкой S-кривой — сначала вправо, потом влево. В конец приходит
// вертикально, чтобы без излома продолжиться трассой Scene 2. Размах изгиба — min(3.5vw, 6vh),
// как --swing в Hero.module.css: по нему выставлены слова заголовка и CTA.
function buildFallPath(w: number, h: number): string {
  const x = w / 2;
  // Смещение ручки Безье: реальный размах изгиба = 4/9 от него.
  const s = Math.min(w * 0.035, h * 0.06) * 2.25;
  return [
    `M${x} ${h * 0.26}`,
    `C${x} ${h * 0.416} ${x + s} ${h * 0.377} ${x} ${h * 0.595}`,
    `S${x} ${h * 0.774} ${x} ${h * 0.93}`,
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
    const root = document.documentElement;
    const updateOffset = () => {
      if (!dropRef.current) return;
      const h = window.innerHeight;
      const scrollVh = (window.scrollY / h) * 100;
      const offsetVh = Math.max(43 - scrollVh, 0);

      // В px от innerHeight — в тех же единицах, что линия Hero и трасса Scene 2
      // (на мобильных CSS vh больше innerHeight, и точка отъезжала бы от конца линии).
      root.style.setProperty('--drop-offset', `${(offsetVh * h) / 100}px`);

      if (offsetVh <= 0) {
        dropRef.current.classList.add(styles.dropPinned);
      } else {
        dropRef.current.classList.remove(styles.dropPinned);
      }
    };

    window.addEventListener('scroll', updateOffset, { passive: true });
    window.addEventListener('resize', updateOffset);
    updateOffset();

    return () => {
      window.removeEventListener('scroll', updateOffset);
      window.removeEventListener('resize', updateOffset);
    };
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
      <a className={styles.phone} href="tel:+79990000000">
        +7 (999) 000-00-00
      </a>
    </section>
  );
}
