"use client";

import { Canvas } from "@react-three/fiber";
import { r3fTunnel } from "./tunnel";

// Содержимое сцен подаётся через r3fTunnel из соответствующих DOM-компонентов.
// Одна версия для всех устройств. DPR не выше 2 — общий потолок ради частоты кадров на экранах 3x.
// Кадры — только по запросу (frameloop="demand"): сцены зовут invalidate(), когда сдвинулся
// их прогресс, а Scene3R3F — пока доводит пружину скорости. Пока 3D не видно
// (Hero, Сцена 2) или всё стоит, канвас не рисует.
export function GlobalCanvas() {
  return (
    <Canvas
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        // Высота — общая высота экрана сцен (lib/scroll/onScroll, viewportH): на телефоне
        // канвас не меняет размер, когда прячется панель браузера.
        height: "var(--ih, 100%)",
        zIndex: 1,
        pointerEvents: "none",
        // Сцены могут сдвигать центр канваса (а значит world origin) через --canvas-y.
        // Например в Scene 3 = 20px вниз — чтобы частицы и CSS-точка совпадали в gap-е сетки.
        transform: "translateY(var(--canvas-y, 0px))",
      }}
      gl={{ alpha: true, antialias: true }}
      dpr={[1, 2]}
      // Канвас fixed — прокрутка его не двигает: размер следим только по resize, без замера
      // прямоугольника на каждом scroll.
      resize={{ scroll: false }}
      frameloop="demand"
    >
      <r3fTunnel.Out />
    </Canvas>
  );
}
