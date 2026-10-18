"use client";

import { invalidate } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { onScroll, setVar } from "@/lib/scroll/onScroll";
import { r3fTunnel } from "@/r3f/tunnel";
import styles from "./Scene4.module.css";
import { DROP_FADE, IMPACT_Q, IMPACT_Y, Scene4R3F } from "./Scene4R3F";

// Сцена 3 оставляет точку на 20px ниже центра — отсюда она падает в воду.
const DROP_START_OFFSET = 20;
// Подпись этапа проявляется, когда слово уже чёткое.
const CAPTION_START = 0.85;
const CAPTION_END = 0.95;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export function Scene4() {
  const sectionRef = useRef<HTMLElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);

  useEffect(() => {
    if (!sectionRef.current) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const update = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const h = window.innerHeight;
      // Как в Сцене 3: q = 0 — секция вошла снизу viewport (ровно когда отпускает sticky
      // Сцены 3), q = 1 — отпускает свой sticky. Высота секции задаёт только темп.
      // Reduced motion: без анимации — итоговое слово с подписью, как только sticky встал.
      // Пока у секции нет высоты (вёрстка не готова), сцены нет: q = 0, а не NaN или 1.
      let q = reduced ? Number(rect.top <= 0) : clamp01((h - rect.top) / rect.height);
      if (!(rect.height > 0) || Number.isNaN(q)) q = 0;
      // Канвас рисует по запросу (frameloop="demand"): сдвинулся q — нужен кадр.
      if (q !== progressRef.current) invalidate();
      progressRef.current = q;

      if (captionRef.current) {
        const c = clamp01((q - CAPTION_START) / (CAPTION_END - CAPTION_START));
        captionRef.current.style.opacity = `${c}`;
        captionRef.current.style.transform = `translateY(${(1 - c) * 8}px)`;
      }

      // До входа сцены точкой и канвасом управляет Сцена 3 — не трогаем.
      if (q <= 0) return;
      // Капля падает в воду с ускорением, от положения Сцены 3 до точки удара.
      const t = Math.min(1, q / IMPACT_Q);
      const impact = (IMPACT_Y - 0.5) * h;
      const offset = DROP_START_OFFSET + (impact - DROP_START_OFFSET) * t * t;
      setVar("--drop-offset", `${offset}px`);
      // В момент удара точка гаснет поверх ядра чернил той же формы — без скачка.
      setVar("--drop-opacity", `${1 - clamp01((q - IMPACT_Q) / DROP_FADE)}`);
      // Канвас без сдвига Сцены 3: шейдер считает координаты прямо от viewport.
      setVar("--canvas-y", "0px");
    };

    return onScroll(sectionRef.current, update);
  }, []);

  return (
    <section ref={sectionRef} className={styles.scene4} data-scene="scene4" aria-label="Подход">
      <div className={styles.sticky}>
        <div ref={captionRef} className={styles.caption}>
          <h2 className={styles.stage}>01 · Бриф</h2>
          <p className={styles.line}>Из хаоса чернил — к ясной задаче</p>
        </div>
      </div>
      <r3fTunnel.In>
        <Scene4R3F progressRef={progressRef} />
      </r3fTunnel.In>
    </section>
  );
}
