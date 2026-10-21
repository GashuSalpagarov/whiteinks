"use client";

import { type CSSProperties, type RefObject, useEffect, useId, useRef, useState } from "react";
import { onScroll, viewportH } from "@/lib/scroll/onScroll";
import styles from "./Hero.module.css";

// Пункты меню. Пока кнопки без перехода: куда их вести, решим позже.
const MENU = ["Услуги", "Наши работы", "О нас", "Контакты"];

// Пункты в шапке — вверху страницы на широком экране. --i — порядок для очереди ухода и возврата.
export function HeaderNav() {
  return (
    <nav className={styles.nav} aria-label="Меню">
      {MENU.map((item, i) => (
        <button
          key={item}
          type="button"
          className={styles.navItem}
          style={{ "--i": i } as CSSProperties}
        >
          {item}
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
  const panelId = useId();

  useEffect(() => {
    const root = rootRef.current;
    const burger = burgerRef.current;
    if (!root || !burger) return;
    const footer = document.querySelector('[data-scene="footer"]');
    let scrolled = false;
    let dark = false;

    return onScroll(root, () => {
      const h = viewportH();
      const y = window.scrollY;
      // Порог — 10% экрана: пункты успевают уйти до того, как к шапке подъедет заголовок Hero.
      if (y > h * 0.1 !== scrolled) {
        scrolled = !scrolled;
        header.current?.classList.toggle(styles.scrolled, scrolled);
      }
      // Над футером бургер — цвета фона (.onDark): к прыжку наверх его уже не видно, стык петли
      // не ломается.
      const b = burger.getBoundingClientRect();
      const overFooter = !!footer && footer.getBoundingClientRect().top < b.top + b.height / 2;
      if (overFooter !== dark) {
        dark = overFooter;
        root.classList.toggle(styles.onDark, dark);
      }
      // Открытая панель закрывается, когда страницу увели на четверть экрана от места открытия
      // (меньше — докатывает инерция Lenis) или бургер спрятался (pointer-events: none в CSS —
      // вверху страницы на широком экране).
      const at = openedAt.current;
      if (
        at !== null &&
        (Math.abs(y - at) > h / 4 || getComputedStyle(burger).pointerEvents === "none")
      ) {
        openedAt.current = null;
        setOpen(false);
      }
    });
  }, [header]);

  // Пока панель открыта: Esc (фокус — обратно на бургер) и клик вне меню закрывают её.
  useEffect(() => {
    if (!open) return;
    openedAt.current = window.scrollY;
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
      <nav id={panelId} className={styles.panel} aria-label="Меню">
        {MENU.map((item) => (
          <button
            key={item}
            type="button"
            className={styles.panelItem}
            onClick={() => setOpen(false)}
          >
            {item}
          </button>
        ))}
      </nav>
    </div>
  );
}
