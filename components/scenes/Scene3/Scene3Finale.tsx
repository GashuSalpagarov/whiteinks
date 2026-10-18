"use client";

import Link from "next/link";
import { type RefObject, useEffect, useRef } from "react";
import { getTier } from "@/lib/perf";
import { viewportH } from "@/lib/scroll/onScroll";
import { CARDS_CONTENT } from "./cardsData";
import styles from "./Scene3Finale.module.css";

// Сюда Scene3Finale кладёт свой update(p, tail): его зовёт обработчик скролла Scene3.
export type FinaleUpdate = (p: number, tail: number) => void;

type Props = {
  updateRef: RefObject<FinaleUpdate | null>;
};

// Хвост сцены (tail 0→1): плитки разом рассыпаются в песок, песок стягивается в точку.
const HOLD_END = 0.1; // до сюда сетка собрана и кликабельна, точки в центре нет
const SHATTER_START = 0.1; // поверх плиток проявляется тёмный слой — текст гаснет под ним
const MOSAIC_FULL = 0.15; // слой непрозрачен: DOM-плитки прячем, дальше — растр из кружков
const RELEASE = 0.18; // песчинки срываются все разом, ± RELEASE_JITTER
const RELEASE_JITTER = 0.015; // много меньше SHRINK — кружки сжимаются почти вровень, без «QR»
const SHRINK = 0.15; // за столько tail кружок растра плавно сжимается до песчинки
const ARRIVE = 0.8; // к этому tail пыль долетает до центра, ± FLIGHT_JITTER доли полёта
const FLIGHT_JITTER = 0.15;
const CONDENSE_START = 0.8; // облако-ядро сжимается до размера точки
const CONDENSE_END = 0.87; // затем один мягкий пульс до SWAP_START
export const SWAP_START = 0.9; // под ядром проявляется настоящая точка (Scene3.tsx)
export const SWAP_END = 0.94; // дальше ядро не рисуем — осталась только точка

// Пыль.
const MAX_GRAINS = 4500; // песчинок на всю сетку
const MAX_GRAINS_NARROW = 2000; // при innerWidth < 768
// На слабых устройствах (lib/perf) песчинок вдвое меньше.
const DUST_DPR_MAX = 1.5; // песчинки мелкие — полный DPR канвасу пыли не нужен
const HALFTONE = 1.3; // диаметр кружка растра в момент распада, в долях ячейки (с нахлёстом)
const BIG_SHARE = 0.12; // доля крупных песчинок 4–6px («ближе к камере»), остальные 2–3px
const NEAR_SHRINK = 0.5; // у самого ядра песчинка вдвое мельче — центр не слипается в пятно
const SPRITES = [4, 8, 16, 32, 64]; // диаметры кружков в атласе, px канваса
const KICK_T = 0.15; // доля полёта на первый толчок
const KICK_PX = 6; // сила толчка, px
const SWIRL = 1.6; // рад, закрутка спирали к центру (одно направление на всю пыль)
const DIFF = 1.2; // ближние к центру крутятся до (1 + DIFF) раз быстрее — мягкая спираль
const ROUND_T = 0.22; // за эту долю полёта облако из формы сетки становится кругом
const DISC_FIT = 1.1; // радиус круга — доля половины меньшей стороны габарита сетки
const ANGLE_JITTER = 0.06; // рад, разброс угла при скруглении — затягивает «швы» от зазоров
const STREAK_SHARE = 0.22; // доля песчинок, которые на скорости рисуются штрихом
const STREAK_DS = 0.03; // штрих — от позиции на s − STREAK_DS, так что длина ∝ скорости
const STREAK_MIN = 4; // px: путь за STREAK_DS длиннее — рисуем штрихом, а не точкой
const STREAK_MAX = 14; // px, штрихи короткие
const CORE_MAX = 16; // px, радиус облака-ядра, когда прилетела вся пыль
const CORE_WOBBLE = 0.12; // «живой» контур облака, к размеру точки сходит на нет
const DOT_R = 6; // радиус точки (Hero .drop, 12px)
const PULSE_R = 8;
const DOT_OFFSET_Y = 20; // --drop-offset, который выставляет Scene 3

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

// Хеш целых → [0, 1): детерминированный «рандом» без состояния.
const hash = (a: number, b: number, seed: number) => {
  let h = Math.imul(a, 374761393) + Math.imul(b, 668265263) + Math.imul(seed, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

// Финальная сетка Сцены 3: 4 кейса (3 сверху + 1 широкий снизу) + блок-приглашение.
// Видимость привязана к прогрессу сцены: карточки прилетают на 0.93..0.99, когда
// частицы уже почти собрались. До этого момента — за пределами экрана, без кликов.
export function Scene3Finale({ updateRef }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fg = getComputedStyle(document.documentElement).getPropertyValue("--color-fg").trim();

    // Атлас кружков: песчинку рисуем drawImage из ближайшего большего кружка (сжатие ≤ 2×,
    // без зубцов). Одна текстура на всю пыль — GPU-канвас склеивает такие drawImage в один
    // проход, это дешевле тысяч arc/fill.
    const atlas = document.createElement("canvas");
    atlas.width = SPRITES.reduce((sum, b) => sum + b + 2, 0);
    atlas.height = SPRITES[SPRITES.length - 1] + 2;
    const atlasCtx = atlas.getContext("2d");
    const slotX: number[] = [];
    let ax = 1;
    for (const b of SPRITES) {
      slotX.push(ax);
      if (atlasCtx) {
        atlasCtx.fillStyle = fg;
        atlasCtx.beginPath();
        atlasCtx.arc(ax + b / 2, 1 + b / 2, b / 2, 0, 2 * Math.PI);
        atlasCtx.fill();
      }
      ax += b + 2;
    }

    // Замер — при первом вызове и смене вьюпорта; всё остальное — чистая функция tail, так что
    // прокрутка назад проигрывает распад в обратную сторону. offset* — layout-бокс плиток
    // без transform относительно .container; в хвосте контейнер прибит sticky к (0,0)
    // viewport, так что это сразу координаты экрана и канваса.
    const measure = () => {
      const container = containerRef.current;
      const grid = gridRef.current;
      const ctx = canvasRef.current?.getContext("2d");
      if (!container || !grid || !ctx || !atlasCtx) return null;
      const w = container.clientWidth;
      const h = container.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, DUST_DPR_MAX);
      ctx.canvas.width = Math.round(w * dpr);
      ctx.canvas.height = Math.round(h * dpr);
      // Центр точки (Hero .drop: fixed, 50%/50% + --drop-offset).
      const cx = document.documentElement.clientWidth / 2;
      const cy = viewportH() / 2 + DOT_OFFSET_Y;
      const tiles = Array.from(grid.children as HTMLCollectionOf<HTMLElement>);
      const rects = tiles.map((el) => [
        el.offsetLeft,
        el.offsetTop,
        el.offsetWidth,
        el.offsetHeight,
      ]);

      // Песчинки — ячейки сетки по каждой плитке; размер ячейки — из общей площади под
      // MAX_GRAINS. В момент распада песчинка — кружок чуть больше ячейки: соседи
      // перекрываются, и растр читается почти сплошной плиткой без текста; дальше кружки
      // сжимаются до песчинок — как печатный растр, рассыпающийся в пыль.
      const maxGrains =
        (window.innerWidth < 768 ? MAX_GRAINS_NARROW : MAX_GRAINS) / (getTier() === "low" ? 2 : 1);
      const area = rects.reduce((sum, r) => sum + r[2] * r[3], 0);
      const cell = Math.sqrt(area / maxGrains) || 1;
      let n = 0;
      for (const r of rects) n += Math.floor(r[2] / cell) * Math.floor(r[3] / cell);
      // Облако сразу после распада скругляется: каждая песчинка сохраняет свою долю ρ пути
      // от точки до края габарита сетки вдоль своего луча, но край — уже круг rDisc.
      // Круг не выше габарита (DISC_FIT ≈ 1) — пыль не уходит за экран и к шапке.
      let bx0 = Number.POSITIVE_INFINITY;
      let by0 = Number.POSITIVE_INFINITY;
      let bx1 = Number.NEGATIVE_INFINITY;
      let by1 = Number.NEGATIVE_INFINITY;
      for (const [x, y, rw, rh] of rects) {
        bx0 = Math.min(bx0, x);
        by0 = Math.min(by0, y);
        bx1 = Math.max(bx1, x + rw);
        by1 = Math.max(by1, y + rh);
      }
      const rDisc = (DISC_FIT * Math.min(bx1 - bx0, by1 - by0)) / 2;
      // Зазоры сетки, проходящие через точку (ряд на десктопе; ряд и колонки на телефоне),
      // при скруглении «схлопываем»: иначе по ним в диске остаётся пустая полоса-шов.
      // gapX/gapY — полуширина такого зазора (0, если через точку проходит плитка). Колонки
      // смотрим только у рядов вплотную над и под точкой: строка «Все работы» ниже не в счёт.
      let gapY = Number.POSITIVE_INFINITY;
      for (const [, y, , rh] of rects) gapY = Math.min(gapY, Math.max(y - cy, cy - y - rh, 0));
      let gapX = Number.POSITIVE_INFINITY;
      for (const [x, y, rw, rh] of rects) {
        if (y > cy + gapY + 1 || y + rh < cy - gapY - 1) continue;
        gapX = Math.min(gapX, Math.max(x - cx, cx - x - rw, 0));
      }
      if (!Number.isFinite(gapX)) gapX = 0;
      const r0 = new Float32Array(n); // полярные координаты старта вокруг точки
      const th0 = new Float32Array(n);
      const rr = new Float32Array(n); // радиус старта в скруглённом облаке
      const aj = new Float32Array(n); // разброс угла при скруглении, рад
      const rel = new Float32Array(n); // tail отрыва
      const fl = new Float32Array(n); // длительность полёта в tail
      const kx = new Float32Array(n); // вектор толчка
      const ky = new Float32Array(n);
      const sw = new Float32Array(n); // закрутка, рад
      const c0 = new Float32Array(n); // диаметр кружка растра, px
      const sz = new Float32Array(n); // диаметр песчинки, px
      const streaky = new Uint8Array(n); // 1 — на скорости рисуется штрихом
      let j = 0;
      for (const [x, y, rw, rh] of rects) {
        const nx = Math.floor(rw / cell);
        const ny = Math.floor(rh / cell);
        for (let gy = 0; gy < ny; gy++) {
          for (let gx = 0; gx < nx; gx++) {
            const ox = x + ((gx + 0.5) * rw) / nx - cx;
            const oy = y + ((gy + 0.5) * rh) / ny - cy;
            r0[j] = Math.hypot(ox, oy);
            th0[j] = Math.atan2(oy, ox);
            // Смещение без зазоров через точку — по нему скруглённое место песчинки.
            const fx = ox - Math.sign(ox) * Math.min(Math.abs(ox), gapX);
            const fy = oy - Math.sign(oy) * Math.min(Math.abs(oy), gapY);
            // ρ: 0 — в точке, 1 — на краю габарита сетки вдоль луча из точки.
            const ex = (ox >= 0 ? bx1 - cx : cx - bx0) - gapX;
            const ey = (oy >= 0 ? by1 - cy : cy - by0) - gapY;
            const rho = Math.min(1, Math.max(Math.abs(fx) / ex, Math.abs(fy) / ey));
            rr[j] = rho * rDisc;
            // Поворот к углу без зазоров (в −π..π) плюс небольшой разброс.
            const turn = Math.atan2(fy, fx) - th0[j];
            aj[j] =
              Math.atan2(Math.sin(turn), Math.cos(turn)) +
              (hash(j, 0, 10) - 0.5) * 2 * ANGLE_JITTER;
            // Срыв — разом по всей плитке, без фронта: лёгкий разброс, чтобы не механически.
            rel[j] = RELEASE + (hash(j, 0, 1) - 0.5) * 2 * RELEASE_JITTER;
            fl[j] = (ARRIVE - rel[j]) * (1 + (hash(j, 0, 2) - 0.5) * 2 * FLIGHT_JITTER);
            // Толчок: несколько px с уклоном от центра (±70°) — плитка будто лопается,
            // потом песок затягивает к точке.
            const ka = th0[j] + (hash(j, 0, 4) - 0.5) * 2.4;
            const km = KICK_PX * (0.5 + hash(j, 0, 5));
            kx[j] = Math.cos(ka) * km;
            ky[j] = Math.sin(ka) * km;
            sw[j] = SWIRL * (0.6 + 0.8 * hash(j, 0, 6)) * (1 + DIFF * (1 - rho));
            c0[j] = Math.max(rw / nx, rh / ny) * HALFTONE;
            // Как пыль туннеля в перспективе: в основном мелкие, редкие крупные — «ближе».
            sz[j] = hash(j, 0, 7) < BIG_SHARE ? 4 + 2 * hash(j, 0, 9) : 2 + hash(j, 0, 9);
            streaky[j] = hash(j, 0, 8) < STREAK_SHARE ? 1 : 0;
            j++;
          }
        }
      }
      return {
        ctx,
        w,
        h,
        dpr,
        cx,
        cy,
        tiles,
        rects,
        n,
        r0,
        th0,
        rr,
        aj,
        rel,
        fl,
        kx,
        ky,
        sw,
        c0,
        sz,
        streaky,
      };
    };
    let dust: ReturnType<typeof measure> = null;

    // Позиция песчинки j на доле полёта s: толчок от плитки, затем спираль с ускорением.
    // Радиус — ease-in s^1.5 (почти сразу уходит, потом всё быстрее), закрутка — u²:
    // почти вся у самого ядра, как в воронке, и дальние песчинки не улетают за экран.
    // За первые ROUND_T полёта старт плавно переезжает из формы сетки в круг (при s = 0 —
    // ровно центр ячейки, растр не трогаем).
    // Пишем в px/py (и pu — пройденная доля пути к ядру), чтобы не создавать объектов в кадре.
    let px = 0;
    let py = 0;
    let pu = 0;
    const place = (d: NonNullable<typeof dust>, j: number, s: number) => {
      const u = s * Math.sqrt(s);
      const k = Math.min(1, s / KICK_T);
      const kick = (1 - (1 - k) * (1 - k)) * (1 - u);
      const t = Math.min(1, s / ROUND_T);
      const round = t * t * (3 - 2 * t);
      const r = (d.r0[j] + (d.rr[j] - d.r0[j]) * round) * (1 - u);
      const a = d.th0[j] + d.sw[j] * u * u + d.aj[j] * round;
      px = d.cx + r * Math.cos(a) + d.kx[j] * kick;
      py = d.cy + r * Math.sin(a) + d.ky[j] * kick;
      pu = u;
    };

    const draw = (tail: number) => {
      const d = dust;
      if (!d) return;
      const { ctx } = d;
      // Тёмный слой непрозрачен — DOM-плитки под ним больше не нужны.
      const covered = tail >= MOSAIC_FULL;
      for (const el of d.tiles) el.style.opacity = covered ? "0" : "";
      // До распада и после подмены канвасу рисовать нечего — прячем его и не тратим кадр.
      const active = tail > SHATTER_START && tail < SWAP_END;
      ctx.canvas.style.visibility = active ? "visible" : "";
      if (!active) return;
      ctx.setTransform(d.dpr, 0, 0, d.dpr, 0, 0);
      ctx.clearRect(0, 0, d.w, d.h);
      ctx.fillStyle = fg;
      ctx.strokeStyle = fg;
      ctx.lineWidth = 1 / d.dpr;

      // Проявление: пока ни одна песчинка не сорвалась, растр — это просто сплошные
      // прямоугольники плиток цвета точки (= фона плитки). Рисуем их с растущей
      // непрозрачностью поверх DOM — текст и картинки гаснут, плитка не мигает.
      if (!covered) {
        ctx.globalAlpha = (tail - SHATTER_START) / (MOSAIC_FULL - SHATTER_START);
        for (const [x, y, rw, rh] of d.rects) ctx.fillRect(x - 0.5, y - 0.5, rw + 1, rh + 1);
        ctx.globalAlpha = 1;
        return;
      }

      // Песок: кружок растра сжимается до песчинки и летит по спирали в центр; лишь доля
      // STREAK_SHARE на скорости — короткими штрихами вдоль движения, все одним stroke
      // в 1 пиксель канваса (как штрихи туннеля).
      ctx.beginPath();
      let arrived = 0;
      for (let j = 0; j < d.n; j++) {
        const s = Math.max(0, (tail - d.rel[j]) / d.fl[j]);
        if (s >= 1) {
          arrived++; // впиталась в ядро
          continue;
        }
        place(d, j, s);
        const q = clamp01((tail - d.rel[j]) / SHRINK);
        const grain = d.c0[j] + (d.sz[j] - d.c0[j]) * q * q * (3 - 2 * q);
        const size = grain * (1 - NEAR_SHRINK * pu);
        if (d.streaky[j] && q >= 1) {
          const x1 = px;
          const y1 = py;
          place(d, j, Math.max(0, s - STREAK_DS));
          const dx = px - x1;
          const dy = py - y1;
          const len2 = dx * dx + dy * dy;
          if (len2 > STREAK_MIN * STREAK_MIN) {
            const k = len2 > STREAK_MAX * STREAK_MAX ? STREAK_MAX / Math.sqrt(len2) : 1;
            ctx.moveTo(x1 + dx * k, y1 + dy * k);
            ctx.lineTo(x1, y1);
            continue;
          }
          px = x1;
          py = y1;
        }
        let b = 0;
        while (b < SPRITES.length - 1 && SPRITES[b] < size * d.dpr) b++;
        const half = size / 2;
        ctx.drawImage(atlas, slotX[b], 1, SPRITES[b], SPRITES[b], px - half, py - half, size, size);
      }
      ctx.stroke();

      // Ядро: растёт с долей прилетевшей пыли, сжимается ровно до точки, один мягкий пульс.
      // В окне подмены под ним проявляется настоящая точка, после SWAP_END ядро не рисуем.
      const c = clamp01((tail - CONDENSE_START) / (CONDENSE_END - CONDENSE_START));
      const condense = c * c * (3 - 2 * c);
      const v = clamp01((tail - CONDENSE_END) / (SWAP_START - CONDENSE_END));
      const pulse = ((PULSE_R - DOT_R) * (1 - Math.cos(2 * Math.PI * v))) / 2;
      const cloud = CORE_MAX * Math.sqrt(arrived / (d.n || 1));
      const radius = cloud * (1 - condense) + DOT_R * condense + pulse;
      if (radius < 0.1) return;
      const wobble = CORE_WOBBLE * (1 - condense);
      ctx.beginPath();
      if (wobble > 0.001) {
        for (let i = 0; i <= 48; i++) {
          const phi = (i / 48) * 2 * Math.PI;
          const wave = 0.6 * Math.sin(3 * phi + 9 * tail) + 0.4 * Math.sin(5 * phi - 13 * tail);
          const rr = radius * (1 + wobble * wave);
          ctx.lineTo(d.cx + rr * Math.cos(phi), d.cy + rr * Math.sin(phi));
        }
      } else {
        ctx.arc(d.cx, d.cy, radius, 0, 2 * Math.PI);
      }
      ctx.fill();
    };

    // Работа — только когда сменились p, tail или вьюпорт: отдельного цикла кадров нет.
    let lastP = -1;
    let lastTail = -1;
    let viewport = "";
    updateRef.current = (p, tail) => {
      // Уровень устройства (lib/perf) может определиться уже после первого замера.
      const vp = `${window.innerWidth}x${viewportH()} ${getTier()}`;
      if (vp !== viewport) {
        viewport = vp;
        dust = reduced ? null : measure();
        lastP = -1;
        lastTail = -1;
      }
      if (p === lastP && tail === lastTail) return;
      lastP = p;
      const t = Math.max(0, Math.min(1, (p - 0.93) / 0.06));
      const eased = t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
      const interactive = eased > 0.5 && tail < HOLD_END;
      const node = containerRef.current;
      if (node) {
        node.style.setProperty("--finale-opacity", `${eased}`);
        node.style.setProperty("--finale-pointer-events", interactive ? "auto" : "none");
        // Без пыли (reduced motion): сетка просто гаснет к SWAP_START, точка — в окне подмены.
        if (reduced) {
          const fadeOut = clamp01((tail - HOLD_END) / (SWAP_START - HOLD_END));
          node.style.opacity = `${1 - fadeOut}`;
        }
      }
      // Перерисовываем только при смене tail (или после замера).
      if (tail !== lastTail) {
        lastTail = tail;
        draw(tail);
      }
    };
    return () => {
      updateRef.current = null;
    };
  }, [updateRef]);

  const cards = CARDS_CONTENT;
  const positions = [styles.card1, styles.card2, styles.card3, styles.card4];
  return (
    <div ref={containerRef} className={styles.container}>
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
      </div>
      <canvas ref={canvasRef} className={styles.dust} />
    </div>
  );
}
