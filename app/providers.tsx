'use client';

import Lenis from 'lenis';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { syncScroll } from '@/lib/scroll/onScroll';

const LenisContext = createContext<Lenis | null>(null);

export function useLenis() {
  return useContext(LenisContext);
}

export function Providers({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);

  // При перезагрузке всегда начинаем с верха страницы
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const instance = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.4,
    });

    setLenis(instance);

    // Lenis сдвигает страницу в своём rAF, а событие scroll приходит только в следующем кадре —
    // fixed-слои (трасса Сцены 2, точка) отставали бы от страницы на шаг прокрутки, и стык
    // с линией Hero рвался. Поэтому общий проход сцен — в том же кадре. Нативную прокрутку
    // Lenis сообщает вместе с событием scroll — её не дублируем.
    const offScroll = instance.on('scroll', () => {
      if (instance.isScrolling === 'smooth') syncScroll();
    });

    let rafId = 0;
    const raf = (time: number) => {
      instance.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      offScroll();
      instance.destroy();
      setLenis(null);
    };
  }, []);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
