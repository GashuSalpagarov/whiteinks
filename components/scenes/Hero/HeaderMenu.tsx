"use client";

import { type CSSProperties, type RefObject, useEffect, useId, useRef, useState } from "react";
import { useLenis } from "@/app/providers";
import { BRIEF_CONFIG } from "@/lib/brief";
import { onScroll, viewportH } from "@/lib/scroll/onScroll";
import { goToStation, pathProgress, STATIONS } from "@/lib/stations";
import styles from "./Hero.module.css";

// Пункты — станции пути (lib/stations.ts), переход — пролётом к станции. В строке шапки — четыре
// главные: все шесть в неё не помещаются на 1024px; все — в панели бургера и на карте пути слева.
const NAV = STATIONS.flatMap((s, i) => (s.scene === "scene4" || s.scene === "scene6" ? [] : [i]));

// Пункты в шапке — вверху страницы на широком экране. --i — порядок для очереди ухода и возврата.
export function HeaderNav() {
  const lenis = useLenis();
  return (
    <nav className={styles.nav} aria-label="Меню">
      {NAV.map((station, i) => (
        <button
          key={station}
          type="button"
          className={styles.navItem}
          style={{ "--i": i } as CSSProperties}
          onClick={() => goToStation(station, lenis)}
        >
          {STATIONS[station].word}
        </button>
      ))}
    </nav>
  );
}

// Бургер и его панель — своим слоем над всеми сценами и футером (.menu): шапка с логотипом
// и телефоном — над сценами, но под футером. Страница ушла от верха — класс .scrolled на шапке:
// пункты в ней уходят, телефон сдвигается, бургер появляется (всё в Hero.module.css).
export function HeaderMenu({ header }: { header: RefObject<HTMLElement | null> }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const openedAt = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  // Текущая станция — для нити в панели; считается, только пока панель открыта.
  const [station, setStation] = useState(-1);
  const panelId = useId();
  const lenis = useLenis();

  useEffect(() => {
    const root = rootRef.current;
    const burger = burgerRef.current;
    if (!root || !burger) return;
    const footer = document.querySelector('[data-scene="footer"]');
    const cta = document.querySelector(`.${styles.cta}`);
    const brief = document.querySelector('[data-scene="scene6"]');
    let scrolled = false;
    let asking = false;
    let dark = false;

    return onScroll(root, () => {
      const h = viewportH();
      const y = window.scrollY;
      // «Связаться» Hero ушла за верх экрана, а письмо (Сцена 6) ещё ниже 35% экрана — вместо
      // телефона кнопка к письму (.asking). В письме — снова телефон: форма просит номер, наш рядом.
      const ask =
        !!cta &&
        !!brief &&
        cta.getBoundingClientRect().bottom < 0 &&
        brief.getBoundingClientRect().top > h * 0.35;
      // Порог — 10% экрана: пункты успевают уйти до того, как к шапке подъедет заголовок Hero.
      if (y > h * 0.1 !== scrolled) {
        scrolled = !scrolled;
        header.current?.classList.toggle(styles.scrolled, scrolled);
      }
      if (ask !== asking) {
        asking = ask;
        header.current?.classList.toggle(styles.asking, asking);
      }
      // Над футером бургер — цвета фона и не нажимается (.onDark): к прыжку наверх его уже не
      // видно, стык петли не ломается.
      const b = burger.getBoundingClientRect();
      const overFooter = !!footer && footer.getBoundingClientRect().top < b.top + b.height / 2;
      if (overFooter !== dark) {
        dark = overFooter;
        root.classList.toggle(styles.onDark, dark);
      }
      // Открытая панель закрывается, когда страницу увели на четверть экрана от места открытия
      // (меньше — докатывает инерция Lenis) или бургер спрятался (pointer-events: none в CSS —
      // вверху страницы на широком экране и над футером).
      const at = openedAt.current;
      if (
        at !== null &&
        (Math.abs(y - at) > h / 4 || getComputedStyle(burger).pointerEvents === "none")
      ) {
        openedAt.current = null;
        setOpen(false);
      }
      if (openedAt.current !== null) setStation(Math.floor(pathProgress(h) + 1e-6));
    });
  }, [header]);

  // Пока панель открыта: Esc (фокус — обратно на бургер) и клик вне меню закрывают её.
  useEffect(() => {
    if (!open) return;
    openedAt.current = window.scrollY;
    setStation(Math.floor(pathProgress(viewportH()) + 1e-6));
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      burgerRef.current?.focus();
    };
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      openedAt.current = null;
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={styles.menu}>
      <button
        ref={burgerRef}
        type="button"
        className={styles.burger}
        aria-label="Меню"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
      />
      {/* Панель — те же станции, что на карте пути: слева нить, пройденные — чернилами, текущая —
          точкой 12px. Выбор — закрыть панель и лететь; фокус — обратно на бургер. Последней
          строкой — телефон: в шапке его место на время пути занимает кнопка к письму. */}
      <nav id={panelId} className={styles.panel} aria-label="Меню">
        <ol className={styles.thread} style={{ "--k": Math.max(0, station) } as CSSProperties}>
          {STATIONS.map((s, i) => (
            <li key={s.scene}>
              <button
                type="button"
                className={styles.panelItem}
                aria-current={i === station ? "step" : undefined}
                data-done={i < station ? "" : undefined}
                onClick={() => {
                  setOpen(false);
                  burgerRef.current?.focus({ preventScroll: true });
                  goToStation(i, lenis);
                }}
              >
                {s.word}
              </button>
            </li>
          ))}
        </ol>
        <a
          className={`${styles.panelItem} ${styles.panelPhone}`}
          href={`tel:+${BRIEF_CONFIG.phone.replace(/\D/g, "")}`}
        >
          {BRIEF_CONFIG.phone}
        </a>
      </nav>
    </div>
  );
}
