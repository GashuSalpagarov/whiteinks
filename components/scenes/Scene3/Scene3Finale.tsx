"use client";

import Link from "next/link";
import { type RefObject, useEffect, useId, useRef } from "react";
import { CARDS_CONTENT } from "./cardsData";
import styles from "./Scene3Finale.module.css";

type Props = {
  progressRef: RefObject<number>;
  tailRef: RefObject<number>;
};

// Хвост сцены (tail 0→1): сетка вливается обратно в точку.
const HOLD_END = 0.15; // до сюда сетка собрана и кликабельна
const FADE_START = 0.1; // содержимое плиток гаснет → сплошные формы цвета точки
const FADE_END = 0.3;
const MERGE_START = 0.25; // все плитки разом летят в точку (дальние — быстрее)
const MERGE_END = 0.95;
const HIDE_START = 0.97; // кружки-плитки поверх точки гаснут, остаётся сама точка
const DOT_SIZE = 12; // диаметр точки (Hero .drop)
const DOT_OFFSET_Y = 20; // --drop-offset, который выставляет Scene 3
const GOO = true; // goo-фильтр слияния (позже — выключать на слабых GPU через detect-gpu)
const BLUR_PEAK = 12; // пик размытия goo, px. Больше ~13 — схлопнутся статичные gap-ы 20px
const BLUR_RAMP = 0.15; // разгон размытия после FADE_END
const GULP_START = 0.87; // «глоток»: дублёр точки раздувается до GULP_PEAK и к HIDE_START — 1
const GULP_PEAK = 1.5;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

// Финальная сетка Сцены 3: 4 кейса (3 сверху + 1 широкий снизу) + блок-приглашение.
// Видимость привязана к прогрессу сцены: карточки прилетают на 0.93..0.99, когда
// частицы уже почти собрались. До этого момента — за пределами экрана, без кликов.
export function Scene3Finale({ progressRef, tailRef }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const proxyRef = useRef<HTMLDivElement>(null);
  const blurRef = useRef<SVGFEGaussianBlurElement>(null);
  const gooId = useId();

  useEffect(() => {
    // Замер плиток: offset* — layout-бокс без transform (slide-in и merge не влияют).
    // .grid — position: relative (offsetParent плиток и дублёра); контейнер в хвосте
    // прибит sticky к (0,0) viewport, так что grid.offset + offset плитки = координаты экрана.
    const measure = () => {
      const grid = gridRef.current;
      const proxy = proxyRef.current;
      if (!grid || !proxy) return [];
      // Центр точки в координатах .grid; туда же ставим дублёр точки.
      const cx = document.documentElement.clientWidth / 2 - grid.offsetLeft;
      const cy = window.innerHeight / 2 + DOT_OFFSET_Y - grid.offsetTop;
      proxy.style.setProperty("--proxy-x", `${cx}px`);
      proxy.style.setProperty("--proxy-y", `${cy}px`);
      const els = Array.from(grid.children as HTMLCollectionOf<HTMLElement>);
      return els
        .filter((el) => el !== proxy)
        .map((el) => {
          const dx = cx - (el.offsetLeft + el.offsetWidth / 2);
          const dy = cy - (el.offsetTop + el.offsetHeight / 2);
          const sx = DOT_SIZE / el.offsetWidth;
          const sy = DOT_SIZE / el.offsetHeight;
          return { el, dx, dy, sx, sy };
        });
    };
    let tiles = measure();
    const onResize = () => {
      tiles = measure();
    };

    let raf = 0;
    let lastBlur = "";
    const tick = () => {
      const p = progressRef.current ?? 0;
      const tail = tailRef.current ?? 0;
      const t = Math.max(0, Math.min(1, (p - 0.93) / 0.06));
      const eased = t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
      const interactive = eased > 0.5 && tail < HOLD_END;
      const fade = clamp01((tail - FADE_START) / (FADE_END - FADE_START));
      const hide = clamp01((tail - HIDE_START) / (1 - HIDE_START));
      // Прогресс слияния — общий для всех плиток.
      const k = clamp01((tail - MERGE_START) / (MERGE_END - MERGE_START));
      // Goo: размытие + порог альфы сливают плитки как жидкость. Размытие разгоняется
      // после погашения содержимого и спадает вместе с размером плиток (масштаб k³,
      // как в цикле ниже) — иначе порог съел бы кружки диаметра точки.
      // Фильтр включён, только пока blur > 0.
      const blurIn = clamp01((tail - FADE_END) / BLUR_RAMP);
      const blur = GOO ? BLUR_PEAK * blurIn * (1 - k ** 3) : 0;
      const blurAttr = blur.toFixed(2);
      if (blurAttr !== lastBlur) {
        lastBlur = blurAttr;
        blurRef.current?.setAttribute("stdDeviation", blurAttr);
      }
      const node = containerRef.current;
      if (node) {
        node.style.setProperty("--finale-opacity", `${eased}`);
        node.style.setProperty("--finale-pointer-events", interactive ? "auto" : "none");
        node.style.setProperty("--merge-fade", `${fade}`);
        node.style.setProperty("--merge-hide", `${hide}`);
        node.style.setProperty("--merge-filter", blur > 0 ? `url("#${gooId}")` : "none");
      }
      // Глоток: дублёр лежит ровно на настоящей точке и виден только в хвосте — жёстко 0/1,
      // полупрозрачность под порогом goo меняла бы его размер. Пока вливаются последние
      // плитки, он раздувается до GULP_PEAK и к HIDE_START возвращается ровно к 1
      // (косинусный колокол, как колени в Scene 2).
      const u = clamp01((tail - GULP_START) / (HIDE_START - GULP_START));
      const gulp = 1 + ((GULP_PEAK - 1) * (1 - Math.cos(2 * Math.PI * u))) / 2;
      const proxy = proxyRef.current;
      if (proxy) {
        proxy.style.setProperty("--proxy-on", tail > 0 ? "1" : "0");
        proxy.style.setProperty("--gulp", `${gulp}`);
      }
      // Слияние: позиция ease-in (затягивает с ускорением), масштаб отстаёт от позиции —
      // плитка летит формой и сжимается в кружок у самой точки; углы скругляются по пути.
      const move = k * k;
      const shrink = k * k * k;
      for (const tile of tiles) {
        tile.el.style.setProperty("--merge-x", `${tile.dx * move}px`);
        tile.el.style.setProperty("--merge-y", `${tile.dy * move}px`);
        tile.el.style.setProperty("--merge-sx", `${1 + (tile.sx - 1) * shrink}`);
        tile.el.style.setProperty("--merge-sy", `${1 + (tile.sy - 1) * shrink}`);
        tile.el.style.setProperty("--merge-r", `${k}`);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [progressRef, tailRef, gooId]);

  const cards = CARDS_CONTENT;
  const positions = [styles.card1, styles.card2, styles.card3, styles.card4];
  return (
    <div ref={containerRef} className={styles.container}>
      {/* Goo-фильтр слияния: размытие + порог альфы. stdDeviation крутит rAF. */}
      <svg className={styles.gooDefs} aria-hidden="true">
        <filter id={gooId} colorInterpolationFilters="sRGB">
          <feGaussianBlur ref={blurRef} in="SourceGraphic" stdDeviation="0" />
          <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -8" />
        </filter>
      </svg>
      <div ref={gridRef} className={styles.grid}>
        {cards.map((card, i) => (
          <article key={card.title} className={`${styles.card} ${positions[i]}`}>
            <div className={styles.cardImage} />
            <div className={styles.cardContent}>
              <span className={styles.cardTag}>{card.tag}</span>
              <h3 className={styles.cardTitle}>{card.title}</h3>
              <p className={styles.cardDescription}>{card.description}</p>
              <Link href="/cases" className={styles.cardLink}>
                Посмотреть кейс →
              </Link>
            </div>
          </article>
        ))}
        <Link href="/cases" className={styles.invitation} aria-label="Смотреть все работы">
          <div className={styles.invitationCta}>
            <h3 className={styles.invitationTitle}>Все работы</h3>
            <span className={styles.invitationArrow} aria-hidden="true">
              →
            </span>
          </div>
        </Link>
        <div ref={proxyRef} className={styles.dotProxy} aria-hidden="true" />
      </div>
    </div>
  );
}
