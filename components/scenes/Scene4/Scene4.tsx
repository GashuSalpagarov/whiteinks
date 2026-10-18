"use client";

import { invalidate } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { onScroll, setVar, viewportH } from "@/lib/scroll/onScroll";
import { r3fTunnel } from "@/r3f/tunnel";
import styles from "./Scene4.module.css";
import { Scene4R3F } from "./Scene4R3F";
import {
  captionOpacity,
  DROP_FADE,
  formedQ,
  IMPACT_Q,
  IMPACT_Y,
  STAGES,
  stageAt,
  TOTAL_VH,
  wordFit,
  wordLineY,
} from "./stages";

// Сцена 3 оставляет точку на 20px ниже центра — отсюда она падает в воду.
const DROP_START_OFFSET = 20;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export function Scene4() {
  const sectionRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const captionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const progressRef = useRef(0);
  const releaseRef = useRef(0);

  useEffect(() => {
    if (!sectionRef.current) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Последние записанные стили подписей: пишем только изменившиеся.
    const written: string[] = [];

    const update = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      // Высота экрана — общая для сцен (на телефоне не прыгает с панелью браузера):
      // в ней же меряются секция, sticky и канвас.
      const h = viewportH();
      const w = window.innerWidth;
      // Как в Сцене 3: q = 0 — секция вошла снизу viewport (ровно когда отпускает sticky
      // Сцены 3), q = 1 — отпускает свой sticky. Этапы делят q по stages.ts.
      // Пока у секции нет высоты (вёрстка не готова), сцены нет: q = 0, а не NaN или 1.
      let q = clamp01((h - rect.top) / rect.height);
      if (!(rect.height > 0) || Number.isNaN(q)) q = 0;
      // Reduced motion: без анимации — собранное слово этапа с подписью, как только
      // sticky встал; слова сменяются на границах этапов.
      if (reduced) q = rect.top <= 0 ? formedQ(stageAt(q).index) : 0;
      // Канвас рисует по запросу (frameloop="demand"): сдвинулся q — нужен кадр.
      // После отпускания sticky кадр канваса уезжает вверх вместе со страницей: на столько
      // px, на сколько sticky ушёл за верх экрана (шейдер, uScroll).
      const release = Math.max(0, -(stickyRef.current?.getBoundingClientRect().top ?? 0));
      if (q !== progressRef.current || release !== releaseRef.current) invalidate();
      progressRef.current = q;
      releaseRef.current = release;
      const { index, local } = stageAt(q);

      // Подписи: каждая под своим словом (строка и кегль слова — для отступа), видна,
      // пока оно собрано.
      const line = wordLineY(w) * h;
      for (let i = 0; i < STAGES.length; i++) {
        const el = captionRefs.current[i];
        if (!el) continue;
        const o = captionOpacity(i, index, local);
        const size = wordFit(STAGES[i].word, w, h).size;
        const css = `${o}|${(1 - o) * 8}|${size}|${line}`;
        if (written[i] === css) continue;
        written[i] = css;
        el.style.opacity = `${o}`;
        el.style.transform = `translateY(${(1 - o) * 8}px)`;
        el.style.setProperty("--word-size", `${size}px`);
        el.style.setProperty("--word-line", `${line}px`);
      }

      // До входа сцены точкой и канвасом управляет Сцена 3 — не трогаем.
      if (q <= 0) return;
      // Капля падает в воду с ускорением, от положения Сцены 3 до точки удара (этап 0).
      const q0 = index === 0 ? local : 1;
      const t = Math.min(1, q0 / IMPACT_Q);
      const impact = (IMPACT_Y - 0.5) * h;
      const offset = DROP_START_OFFSET + (impact - DROP_START_OFFSET) * t * t;
      setVar("--drop-offset", `${offset}px`);
      // В момент удара точка гаснет поверх ядра чернил той же формы — без скачка.
      setVar("--drop-opacity", `${1 - clamp01((q0 - IMPACT_Q) / DROP_FADE)}`);
      // Канвас без сдвига Сцены 3: шейдер считает координаты прямо от viewport.
      setVar("--canvas-y", "0px");
    };

    return onScroll(sectionRef.current, update);
  }, []);

  return (
    <section
      ref={sectionRef}
      className={styles.scene4}
      style={{ height: `calc(var(--ih, 100vh) * ${TOTAL_VH} / 100)` }}
      data-scene="scene4"
      aria-label="Подход"
    >
      <div ref={stickyRef} className={styles.sticky}>
        {STAGES.map((stage, i) => (
          <div
            key={stage.word}
            ref={(el) => {
              captionRefs.current[i] = el;
            }}
            className={styles.caption}
          >
            <h2 className={styles.stage}>
              {String(i + 1).padStart(2, "0")} · {stage.word}
            </h2>
            <p className={styles.line}>{stage.line}</p>
          </div>
        ))}
      </div>
      <r3fTunnel.In>
        <Scene4R3F progressRef={progressRef} releaseRef={releaseRef} />
      </r3fTunnel.In>
    </section>
  );
}
