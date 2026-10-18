"use client";

import { invalidate } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { onScroll, setVar, viewportH } from "@/lib/scroll/onScroll";
import { r3fTunnel } from "@/r3f/tunnel";
import styles from "./Scene3.module.css";
import { type FinaleUpdate, Scene3Finale, SWAP_END, SWAP_START } from "./Scene3Finale";
import { Scene3R3F } from "./Scene3R3F";

// Pinned-хвост после нарратива (в экранах ×100): сетка ещё держится sticky, рассыпается в пыль,
// а пыль стягивается в точку. Держать в синхроне с height в Scene3.module.css
// (5 экранов нарратива + TAIL_VH / 100; экран — общая высота --ih / viewportH()).
const TAIL_VH = 100;

export function Scene3() {
  const sectionRef = useRef<HTMLElement>(null);
  const progressRef = useRef(0);
  const finaleRef = useRef<FinaleUpdate | null>(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    const update = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const h = viewportH();
      // Прогресс мапится на нарратив сцены: 0 — секция только вошла снизу viewport,
      // 1 — нарратив закончен (сетка собрана). Дальше хвост: tail 0→1 за TAIL_VH,
      // на tail=1 sticky отпускает. Нарратив — те же 5 экранов из CSS, доля от rect.height.
      const tailPx = (rect.height * TAIL_VH) / (500 + TAIL_VH);
      const total = rect.height - tailPx;
      const scrolled = h - rect.top;
      const p = total > 0 ? Math.max(0, Math.min(1, scrolled / total)) : 0;
      const tail = total > 0 ? Math.max(0, Math.min(1, (scrolled - total) / tailPx)) : 0;
      // Канвас рисует по запросу (frameloop="demand"): сдвинулся p — нужен кадр.
      if (p !== progressRef.current) invalidate();
      progressRef.current = p;
      finaleRef.current?.(p, tail);

      // CSS-точка: фейд-аут к p=0.2 (даём частицам набрать плотность для маскировки).
      // Обратно она появляется только как итог распада сетки в пыль: в окне подмены
      // хвоста — ровно под нарисованным ядром той же формы (см. Scene3Finale).
      const dropFadeOut = Math.max(0, Math.min(1, (0.2 - p) / 0.2));
      const dropFadeIn = Math.max(0, Math.min(1, (tail - SWAP_START) / (SWAP_END - SWAP_START)));
      const dropOpacity = Math.max(dropFadeOut, dropFadeIn);
      setVar("--drop-opacity", `${dropOpacity}`);

      // Сдвигаем точку вниз, чтобы попала в gap между рядами finale-сетки.
      // И сдвигаем канвас на ту же величину, чтобы world origin (откуда вылетают
      // частицы) совпал с положением точки.
      if (p > 0) {
        setVar("--drop-offset", "20px");
        setVar("--canvas-y", "20px");
      } else {
        setVar("--canvas-y", "0px");
      }
    };

    return onScroll(sectionRef.current, update);
  }, []);

  return (
    <section ref={sectionRef} className={styles.scene3} data-scene="scene3">
      <div className={styles.sticky}>
        <Scene3Finale updateRef={finaleRef} />
      </div>
      <r3fTunnel.In>
        <Scene3R3F progressRef={progressRef} />
      </r3fTunnel.In>
    </section>
  );
}
