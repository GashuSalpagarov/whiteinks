"use client";

import { _roots, addEffect, advance } from "@react-three/fiber";
import Lenis from "lenis";
import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { syncScroll } from "@/lib/scroll/onScroll";

const LenisContext = createContext<Lenis | null>(null);

// Канвас ждёт отрисовки: invalidate поставил её в цикл R3F (frameloop="demand").
function canvasWaits() {
  for (const root of _roots.values()) if (root.store.getState().internal.frames > 0) return true;
  return false;
}

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

    // Касания тоже ведёт Lenis (syncTouch): страница, точка и линии сдвигаются в одном кадре, как на
    // колесе, — при родной прокрутке пальцем слои, которые двигает JS, отставали на кадр. Свайп
    // уводит в 1,5 раза меньше родного (TOUCH). Скорость для инерции — по пальцу за последние 100 мс:
    // своя у Lenis берётся из последнего кадра и под нагрузкой скачет в разы. Инерция —
    // (скорость·50·TOUCH)^1,5 px: на замере ближе всего к родной, умноженной на TOUCH.
    const TOUCH = 0.67;
    const trail: [number, number][] = [];
    // ВРЕМЕННО, отладка на iPhone: с ?native в адресе касания ведёт браузер (родная прокрутка),
    // колёсико — по-прежнему Lenis. Для сравнения плавности; убрать: native и его проверки ниже.
    const native = new URLSearchParams(location.search).has("native");
    const instance = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
      smoothWheel: true,
      syncTouch: !native,
      touchMultiplier: TOUCH,
      touchInertiaExponent: 1.5,
      // Поле «Другое» (textarea) крутится само, страница при этом стоит.
      prevent: (node: HTMLElement) => node instanceof HTMLTextAreaElement,
      virtualScroll: ({ event: e }) => {
        if (native || !("touches" in e)) return true;
        if (e.type === "touchstart") trail.length = 0;
        if (e.type !== "touchend") trail.push([e.timeStamp, e.touches[0]?.clientY ?? 0]);
        else {
          const [t1, y1] = trail[trail.length - 1] ?? [0, 0];
          const [t0, y0] = trail.find(([t]) => t1 - t < 100) ?? [0, 0];
          const v = t1 > t0 && e.timeStamp - t1 < 100 ? (y0 - y1) / (t1 - t0) : 0;
          instance.velocity = v * 50 * TOUCH;
        }
        return true;
      },
    });

    setLenis(instance);

    // Lenis сдвигает страницу в своём rAF, а событие scroll приходит только в следующем кадре —
    // fixed-слои (трасса Сцены 2, точка) отставали бы от страницы на шаг прокрутки, и стык
    // с линией Hero рвался. Поэтому общий проход сцен — в том же кадре, на каждом событии Lenis:
    // и на последнем шаге, где isScrolling уже false. Повтор с той же прокруткой (родной scroll
    // следом) проход пропускает сам.
    const offScroll = instance.on("scroll", syncScroll);

    // В raf Lenis только ведёт плавную прокрутку, а запускает её всегда scrollTo — и колёсико,
    // и касания, и кнопки. Поэтому кадры просим, пока она идёт, а в покое цикл спит (на телефоне
    // он иначе жёг бы батарею впустую). Будит его scrollTo. Клавиши — нативная прокрутка.
    // Канвас (R3F, frameloop="demand") рисует в своём цикле, а в кадре нужно по порядку: шаг,
    // проход сцен, отрисовка. Поэтому шаг — один на кадр (метка времени у всех rAF кадра одна),
    // его делает тот цикл, что в кадре первый; цикл канваса — в начале, до отрисовки (addEffect).
    // Канвас стоял, а проход его позвал — R3F нарисовал бы только в следующем кадре: рисуем сразу
    // (advance), его цикл там лишь доведёт пружину скорости или уснёт.
    let rafId = 0;
    let woke = false;
    let last = -1;
    const step = (time: number) => {
      if (time === last) return false;
      last = time;
      // Первый кадр после сна — шаг в один кадр, как в непрерывном цикле, а не всё время простоя
      if (woke) instance.time = time - 1000 / 60;
      woke = false;
      instance.raf(time);
      return true;
    };
    const raf = (time: number) => {
      const idle = !canvasWaits();
      if (step(time) && idle && canvasWaits()) advance(time);
      rafId = instance.isScrolling === "smooth" ? requestAnimationFrame(raf) : 0;
    };
    const offCanvas = addEffect((time) => {
      if (rafId) step(time);
    });
    const scrollTo = instance.scrollTo.bind(instance);
    instance.scrollTo = (...args) => {
      scrollTo(...args);
      if (rafId || instance.isScrolling !== "smooth") return;
      woke = true;
      rafId = requestAnimationFrame(raf);
    };

    return () => {
      cancelAnimationFrame(rafId);
      offCanvas();
      offScroll();
      instance.destroy();
      setLenis(null);
    };
  }, []);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
