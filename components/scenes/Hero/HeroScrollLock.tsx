"use client";

import { useEffect } from "react";
import { useLenis } from "@/app/providers";
import { HOLD_EVENT, LOOP_EVENT } from "@/components/scenes/Footer";

const INTRO_DURATION_MS = 4500;
// Новый круг: интро продолжается с detail.from (LOOP_EVENT), и прокрутка открывается, как только
// точка Hero приземлилась (dropAppear, 4 с в Hero.module.css): с «вдоха» круга это 2 с.
const DROP_LANDS_MS = 4000;
// Страховка на время, пока футер доигрывает переход (HOLD_EVENT) до прыжка (LOOP_EVENT).
const HOLD_MAX_MS = 4000;

const SCROLL_KEYS = new Set([
  "ArrowUp",
  "ArrowDown",
  "PageUp",
  "PageDown",
  "Home",
  "End",
  " ",
  "Spacebar",
]);

export function HeroScrollLock() {
  const lenis = useLenis();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
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
      document.documentElement.style.removeProperty("overflow");
      window.removeEventListener("wheel", preventScroll);
      window.removeEventListener("touchmove", preventScroll);
      window.removeEventListener("keydown", preventScrollKeys);
      if (lenis) {
        lenis.start();
      }
    };

    // Блокировка — на интро при загрузке, на каждом новом круге пути (LOOP_EVENT из Footer) —
    // пока точка не приземлится, и на доигрывание перехода в футере (HOLD_EVENT, без прыжка
    // наверх): анимацию не сломать скроллом. Повторный вызов просто перезапускает таймер.
    // Lenis останавливает и запускает только этот компонент; инерцию колёсика после прыжка
    // наверх глотают те же блокировки.
    const lock = (ms: number, toTop = true) => {
      // На случай если Lenis ещё не успел скроллить страницу к верху
      if (toTop) window.scrollTo(0, 0);

      // Lenis перехватывает wheel/touch — стопаем его на время интро
      if (lenis) {
        lenis.stop();
      }

      if (!locked) {
        locked = true;
        // Палец и инерция жеста, начатого до прыжка (докрутили футер на телефоне), preventDefault
        // уже не отменить — без прокрутки у корня они не уведут страницу с Hero.
        document.documentElement.style.overflow = "hidden";
        window.addEventListener("wheel", preventScroll, { passive: false });
        window.addEventListener("touchmove", preventScroll, { passive: false });
        window.addEventListener("keydown", preventScrollKeys);
      }

      window.clearTimeout(timer);
      timer = window.setTimeout(release, ms);
    };

    const onLoop = (e: Event) => {
      const from = (e as CustomEvent<{ from?: number }>).detail?.from ?? 0;
      lock(from ? Math.max(0, DROP_LANDS_MS - from) : INTRO_DURATION_MS);
    };
    const onHold = () => lock(HOLD_MAX_MS, false);

    lock(INTRO_DURATION_MS);
    window.addEventListener(LOOP_EVENT, onLoop);
    window.addEventListener(HOLD_EVENT, onHold);

    return () => {
      window.removeEventListener(LOOP_EVENT, onLoop);
      window.removeEventListener(HOLD_EVENT, onHold);
      release();
    };
  }, [lenis]);

  return null;
}
