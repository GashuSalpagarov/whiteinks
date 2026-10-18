'use client';

import { useEffect } from 'react';
import { useLenis } from '@/app/providers';
import { LOOP_EVENT } from '@/components/scenes/Footer';

const INTRO_DURATION_MS = 7200;

const SCROLL_KEYS = new Set([
  'ArrowUp',
  'ArrowDown',
  'PageUp',
  'PageDown',
  'Home',
  'End',
  ' ',
  'Spacebar',
]);

export function HeroScrollLock() {
  const lenis = useLenis();

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    // Дополнительная блокировка нативных событий — клавиатура, плюс fallback если Lenis не подключился (reduced-motion и т.п.)
    const preventScroll = (e: Event) => e.preventDefault();
    const preventScrollKeys = (e: KeyboardEvent) => {
      if (SCROLL_KEYS.has(e.key)) e.preventDefault();
    };

    let locked = false;
    let timer = 0;

    const release = () => {
      window.clearTimeout(timer);
      if (!locked) return;
      locked = false;
      document.documentElement.style.removeProperty('overflow');
      window.removeEventListener('wheel', preventScroll);
      window.removeEventListener('touchmove', preventScroll);
      window.removeEventListener('keydown', preventScrollKeys);
      if (lenis) {
        lenis.start();
      }
    };

    // Блокировка на всё интро — при загрузке и на каждом новом круге пути (LOOP_EVENT из Footer):
    // анимацию не сломать скроллом. Повторный вызов просто перезапускает таймер. Lenis
    // останавливает и запускает только этот компонент; инерцию колёсика после прыжка наверх
    // глотают те же блокировки — за 7 с она гарантированно стихает.
    const lock = () => {
      // На случай если Lenis ещё не успел скроллить страницу к верху
      window.scrollTo(0, 0);

      // Lenis перехватывает wheel/touch — стопаем его на время интро
      if (lenis) {
        lenis.stop();
      }

      if (!locked) {
        locked = true;
        // Палец и инерция жеста, начатого до прыжка (докрутили футер на телефоне), preventDefault
        // уже не отменить — без прокрутки у корня они не уведут страницу с Hero.
        document.documentElement.style.overflow = 'hidden';
        window.addEventListener('wheel', preventScroll, { passive: false });
        window.addEventListener('touchmove', preventScroll, { passive: false });
        window.addEventListener('keydown', preventScrollKeys);
      }

      window.clearTimeout(timer);
      timer = window.setTimeout(release, INTRO_DURATION_MS);
    };

    lock();
    window.addEventListener(LOOP_EVENT, lock);

    return () => {
      window.removeEventListener(LOOP_EVENT, lock);
      release();
    };
  }, [lenis]);

  return null;
}
