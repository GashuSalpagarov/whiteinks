"use client";

import { Canvas } from "@react-three/fiber";
import { useEffect, useState } from "react";
import { tierReady } from "@/lib/perf";
import { r3fTunnel } from "./tunnel";

// TODO: переключение mobile/desktop, GPU detect — см. docs/02-architecture.md и docs/05-performance.md.
// Содержимое сцен подаётся через r3fTunnel из соответствующих DOM-компонентов.
// Канвас монтируется, когда известен уровень устройства (lib/perf): сцены внутри читают его
// при монтировании. На слабых — DPR 1.
// Кадры — только по запросу (frameloop="demand"): сцены зовут invalidate(), когда сдвинулся
// их прогресс, а Scene3R3F — пока доводит параллакс и пружину скорости. Пока 3D не видно
// (Hero, Сцена 2) или всё стоит, канвас не рисует.
export function GlobalCanvas() {
  const [dpr, setDpr] = useState<number | [number, number] | null>(null);
  useEffect(() => {
    tierReady.then((tier) => setDpr(tier === "low" ? 1 : [1, 2]));
  }, []);

  if (!dpr) return null;
  return (
    <Canvas
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1,
        pointerEvents: "none",
        // Сцены могут сдвигать центр канваса (а значит world origin) через --canvas-y.
        // Например в Scene 3 = 20px вниз — чтобы частицы и CSS-точка совпадали в gap-е сетки.
        transform: "translateY(var(--canvas-y, 0px))",
      }}
      gl={{ alpha: true, antialias: true }}
      dpr={dpr}
      frameloop="demand"
    >
      <r3fTunnel.Out />
    </Canvas>
  );
}
