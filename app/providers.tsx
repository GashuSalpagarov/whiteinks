"use client";

import Lenis from "lenis";
import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { syncScroll } from "@/lib/scroll/onScroll";

const LenisContext = createContext<Lenis | null>(null);

export function useLenis() {
  return useContext(LenisContext);
}

export function Providers({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);

  // При перезагрузке всегда начинаем с верха страницы
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
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
    const offScroll = instance.on("scroll", () => {
      if (instance.isScrolling === "smooth") syncScroll();
    });

    // В raf Lenis только ведёт плавную прокрутку, а запускает её всегда scrollTo — и колёсико,
    // и кнопки. Поэтому кадры просим, пока она идёт, а в покое цикл спит (на телефоне он иначе
    // жёг бы батарею впустую). Будит его scrollTo. Касания и клавиши — нативная прокрутка.
    let rafId = 0;
    const raf = (time: number) => {
      instance.raf(time);
      rafId = instance.isScrolling === "smooth" ? requestAnimationFrame(raf) : 0;
    };
    const scrollTo = instance.scrollTo.bind(instance);
    instance.scrollTo = (...args) => {
      scrollTo(...args);
      if (rafId || instance.isScrolling !== "smooth") return;
      // Первый кадр после сна — шаг в один кадр, как в непрерывном цикле, а не всё время простоя
      rafId = requestAnimationFrame((time) => {
        instance.time = time - 1000 / 60;
        raf(time);
      });
    };

    return () => {
      cancelAnimationFrame(rafId);
      offScroll();
      instance.destroy();
      setLenis(null);
    };
  }, []);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
