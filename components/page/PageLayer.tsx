"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLenis } from "@/app/providers";
import { finishIntro } from "@/components/scenes/Hero/HeroScrollLock";
import { Service } from "@/components/service";
import { Works } from "@/components/works";
import {
  caseSlugFrom,
  HOME_HREF,
  PAGE_EVENT,
  type Page,
  pageFrom,
  pageHref,
} from "@/lib/caseRoute";
import { SERVICE_PAGES, serviceTitle } from "@/lib/services";
import { SITE_NAME, SITE_TITLE } from "@/lib/site";
import { Consent } from "./Consent";
import { NotFound } from "./NotFound";
import styles from "./PageLayer.module.css";
import { Privacy } from "./Privacy";
import { enterList, worksTile, ZOOM, zoomTile } from "./tileZoom";

// Слой страницы над главной: список работ, услуги, документы, ненайденный адрес. Сайт — одно приложение:
// главная смонтирована и стоит (как под кейсом), адрес меняется через history.pushState, «назад» и
// «вперёд» браузера приходят в popstate. Кейс открывается поверх этого слоя (CaseLayer) и возвращается в
// него, на то же место: прокрутка у слоя своя. Вход и выход — затухание: только opacity, поэтому
// закреплённые шапка и точка списка остаются на месте; с плитки «Все проекты» и обратно — полёт
// (tileZoom). Прямой заход — этот же слой с первого кадра.

const FADE_IN = 420;
const FADE_OUT = 320;
const TITLES: Record<string, string> = {
  works: `Наши работы — ${SITE_NAME}`,
  privacy: `Политика обработки персональных данных — ${SITE_NAME}`,
  consent: `Согласие на обработку персональных данных — ${SITE_NAME}`,
  notfound: `Страница не найдена — ${SITE_NAME}`,
  ...Object.fromEntries(SERVICE_PAGES.map((s) => [`services/${s.slug}`, serviceTitle(s)])),
};

// Прямой заход: главная под слоем не рисуется с первой отрисовки (visibility в HomeMain) — браузер не
// тратит на неё загрузку и не считает по ней LCP. visibility, не display: вёрстка и прокрутка главной
// на месте (без вёрстки сработала бы петля футера). Показываем к выходу: слой гаснет над главной.
// Смена страницы внутри слоя главную не открывает — слой не гаснет, проявляется только содержимое.
const showHome = () => {
  const main = document.querySelector("main");
  if (main) main.style.visibility = "";
};

export function PageLayer({ initial }: { initial?: Page }) {
  const lenis = useLenis();
  const [page, setPage] = useState<Page | null>(initial ?? null);
  const rootRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef(lenis);
  lenisRef.current = lenis;
  const S = useRef({
    // Открыт с главной: выход — назад по истории; иначе (прямой заход) — новая запись главной.
    fromHome: false,
    enter: false,
    swap: false, // страница сменилась внутри открытого слоя
    focus: null as HTMLElement | null,
    tile: null as HTMLElement | null, // плитка, с которой влетели: на неё и вернёмся
    flyer: null as HTMLElement | null, // копия плитки, пока список не проявился
  }).current;

  const show = (p: Page) => {
    for (const a of rootRef.current?.getAnimations() ?? []) a.cancel();
    document.title = TITLES[p];
    S.enter = true;
    S.swap = page !== null;
    setPage(p);
  };

  const hide = () => {
    const root = rootRef.current;
    if (!root) return;
    showHome();
    document.title = SITE_TITLE;
    if (!S.fromHome) finishIntro();
    const tile = S.tile && worksTile();
    S.tile = null;
    if (tile) {
      const f = zoomTile(tile, true);
      const end = () => f.el.remove();
      f.finished.then(end, end);
    }
    root
      .animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: FADE_OUT,
        easing: "ease-out",
        fill: "forwards",
      })
      .finished.then(
        () => setPage(null),
        () => {},
      );
  };

  const go = (p: Page | null) => {
    if (p === page || S.flyer) return;
    if (p) {
      if (!page) {
        S.fromHome = true;
        S.focus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      }
      const depth = page ? (window.history.state?.depth ?? 1) + 1 : 1;
      window.history.pushState({ whiteinksPage: p, fromHome: S.fromHome, depth }, "", pageHref(p));
      S.tile = !page && p === "works" ? worksTile() : null;
      if (S.tile) {
        // Сначала запускается полёт, потом тяжёлая отрисовка списка: она ему уже не мешает.
        S.flyer = zoomTile(S.tile).el;
        requestAnimationFrame(() => requestAnimationFrame(() => show(p)));
      } else {
        show(p);
      }
    } else if (S.fromHome) {
      // На запись главной, сколько бы страниц ни прошли: popstate → hide().
      window.history.go(-(window.history.state?.depth ?? 1));
    } else {
      window.history.pushState(null, "", HOME_HREF);
      hide();
    }
  };

  const onPop = () => {
    // Кейс — сверху: слой под ним остаётся, чтобы кейс вернулся в него.
    if (caseSlugFrom(window.location.pathname)) return;
    const p = pageFrom(window.location.pathname);
    if (p === page) return;
    if (!p) return hide();
    if (!page) {
      S.fromHome = !!window.history.state?.fromHome;
      S.focus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    }
    show(p);
  };

  const fn = useRef({ go, onPop });
  fn.current = { go, onPop };

  useEffect(() => {
    const onGo = (e: Event) => fn.current.go((e as CustomEvent<Page | null>).detail);
    const pop = () => fn.current.onPop();
    window.addEventListener(PAGE_EVENT, onGo);
    window.addEventListener("popstate", pop);
    return () => {
      window.removeEventListener(PAGE_EVENT, onGo);
      window.removeEventListener("popstate", pop);
    };
  }, []);

  // Прямой заход: заставка шла бы под слоем и держала замок прокрутки. Кадра два — на запуск её анимаций.
  useEffect(() => {
    if (!initial) return;
    let id = requestAnimationFrame(() => {
      id = requestAnimationFrame(finishIntro);
    });
    return () => cancelAnimationFrame(id);
  }, [initial]);

  // Новая страница: с начала, проявляется. Фокус — в слой: клавиши листают его. Смена внутри слоя —
  // проявляется только содержимое (main страницы): фон слоя, шапка и ось стоят, главную не видно.
  // biome-ignore lint/correctness/useExhaustiveDependencies: вход — по смене страницы
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || !S.enter) return;
    S.enter = false;
    root.scrollTop = 0;
    root.focus({ preventScroll: true });
    const flyer = S.flyer;
    const delay = flyer ? ZOOM * 0.7 : 0; // поле плитки уже закрыло экран
    const target = (S.swap && root.querySelector("main")) || root;
    S.swap = false;
    const fade = target.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: FADE_IN,
      delay,
      easing: "ease-out",
      fill: "backwards",
    });
    if (!flyer) return;
    enterList(root, delay);
    root.style.pointerEvents = "none"; // второе нажатие двойного клика не должно открыть кейс
    const end = () => {
      flyer.remove();
      S.flyer = null;
      root.style.pointerEvents = "";
    };
    fade.finished.then(end, end);
  }, [page]);

  const open = !!page;
  // Lenis под слоем стоит, даже если его запустит замок заставки (HeroScrollLock).
  useEffect(() => {
    if (!open || !lenis) return;
    const keep = () => {
      if (!lenis.isStopped) lenis.stop();
    };
    keep();
    return lenis.on("scroll", keep);
  }, [open, lenis]);

  // Пока слой открыт, главная стоит: не прокручивается, анимации на паузе (html[data-case-open]) и не
  // нажимается. inert — после входа: он пересчитывает стили всей главной. Жесты и клавиши слоя до
  // главной и замка заставки не доходят.
  useEffect(() => {
    const root = rootRef.current;
    if (!open || !root) return;
    const html = document.documentElement;
    html.dataset.caseOpen = "";
    const main = document.querySelector("main");
    const inert = window.setTimeout(() => {
      if (main) main.inert = true;
    }, FADE_IN + ZOOM);
    const stop = (e: Event) => e.stopPropagation();
    const onEsc = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || "brief" in html.dataset) return;
      if (!document.querySelector('[aria-labelledby="case-title"]')) fn.current.go(null);
    };
    // Фокус в слое: до window клавиша не дойдёт, Esc — здесь.
    const onKey = (e: KeyboardEvent) => {
      e.stopPropagation();
      onEsc(e);
    };
    root.addEventListener("wheel", stop, { passive: true });
    root.addEventListener("touchmove", stop, { passive: true });
    root.addEventListener("keydown", onKey);
    window.addEventListener("keydown", onEsc);
    return () => {
      window.clearTimeout(inert);
      root.removeEventListener("wheel", stop);
      root.removeEventListener("touchmove", stop);
      root.removeEventListener("keydown", onKey);
      window.removeEventListener("keydown", onEsc);
      // Кейс ещё открыт (прыжок по истории): главную вернёт он.
      if (document.querySelector('[aria-labelledby="case-title"]')) return;
      if (main) main.inert = false;
      delete html.dataset.caseOpen;
      lenisRef.current?.start();
      S.focus?.focus({ preventScroll: true });
      S.focus = null;
    };
  }, [open, S]);

  if (!page) return null;
  return (
    <div
      ref={rootRef}
      className={styles.layer}
      tabIndex={-1}
      data-page-layer
      data-title={TITLES[page]}
      data-lenis-prevent
    >
      {page === "works" ? (
        <Works />
      ) : page.startsWith("services/") ? (
        <Service key={page} slug={page.slice("services/".length)} />
      ) : page === "privacy" ? (
        <Privacy />
      ) : page === "consent" ? (
        <Consent />
      ) : (
        <NotFound />
      )}
    </div>
  );
}
