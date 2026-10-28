"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLenis } from "@/app/providers";
import {
  BRIEF_CONFIG,
  type BriefOpen,
  getBrief,
  setBrief,
  setBriefOpener,
  useBrief,
} from "@/lib/brief";
import { BriefForm, type BriefFormHandle } from "./BriefForm";
import styles from "./BriefModal.module.css";

// Окно заявки (макет brief-modal/b2). Нажатая чёрная пилюля растёт в белую карточку с рамкой
// 1,5px: заливка светлеет по ходу роста, подпись кнопки уезжает в угол и становится первой строкой.
// Из клетки прайса — так же, из места нажатия. Закрытие — обратно: карточка темнеет и садится в
// пилюлю; если кнопки на экране нет — гаснет.
//
// Рамка и белое внутри — две фигуры из шести частей (две полосы и четыре круга-угла), у каждой
// только translate и scale: края движутся вместе, скругление и толщина не плывут. Все движения —
// Web Animations (transform и opacity), своих циклов кадров нет.
//
// Слой — fixed в body, не <dialog>: верхний слой <dialog> не берёт общий invert второго круга и
// прячет курсор сайта. Под окном страница стоит (Lenis stop, html[data-brief]) и не нажимается
// (нажатия ловит слой окна, Tab ходит по кругу внутри окна); Esc, «Назад» (своя запись истории),
// крестик и щелчок мимо закрывают; фокус — обратно на кнопку. Поля — форма BriefForm, данные — общие
// с конвертом (Сцена 6 и конец кейса, lib/brief.ts).

type G = { x: number; y: number; w: number; h: number; r: number };

const EZ = "cubic-bezier(.76,0,.24,1)";
// Что получает фокус по Tab внутри окна.
const FOCUSABLE =
  "a[href], button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex]";
const IO = "cubic-bezier(.65,0,.35,1)";
const OUT = "cubic-bezier(.16,1,.3,1)";
const PHONE = "(max-width: 767px)";

const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), Math.max(a, b));
const inset = (g: G, k = 1.5): G => ({
  x: g.x + k,
  y: g.y + k,
  w: g.w - 2 * k,
  h: g.h - 2 * k,
  r: Math.max(0, g.r - k),
});
const asPill = (r: DOMRect): G => ({
  x: r.left,
  y: r.top,
  w: r.width,
  h: r.height,
  r: r.height / 2,
});
// Начало роста из клетки прайса — маленькая пилюля-круг в месте нажатия.
const spot = ([x, y]: [number, number]): G => ({ x: x - 12, y: y - 12, w: 24, h: 24, r: 12 });
const mid = (r: DOMRect): [number, number] => [r.left + r.width / 2, r.top + r.height / 2];
const stop = (el: Element) => {
  for (const a of el.getAnimations()) a.cancel();
};
// Анимация с конечным кадром в самом стиле: до задержки — первый кадр, после — стиль.
function move(el: HTMLElement, from: Keyframe, to: Keyframe, o: KeyframeAnimationOptions) {
  stop(el);
  Object.assign(el.style, to);
  return el.animate([from, to], { fill: "backwards", ...o });
}

// Скруглённый прямоугольник из шести частей: transform каждой — линейны по x, y, w, h, r.
function parts({ x, y, w, h, r }: G): string[] {
  const d = (2 * r) / 100;
  return [
    `translate(${x + r}px, ${y}px) scale(${Math.max(0, w - 2 * r) / 100}, ${h / 100})`,
    `translate(${x}px, ${y + r}px) scale(${w / 100}, ${Math.max(0, h - 2 * r) / 100})`,
    `translate(${x}px, ${y}px) scale(${d})`,
    `translate(${x + w - 2 * r}px, ${y}px) scale(${d})`,
    `translate(${x}px, ${y + h - 2 * r}px) scale(${d})`,
    `translate(${x + w - 2 * r}px, ${y + h - 2 * r}px) scale(${d})`,
  ];
}
function shapeTo(
  el: HTMLElement | null,
  from: G | null,
  to: G,
  delay = 0,
  duration = 0,
  easing = EZ,
) {
  if (!el) return;
  const B = parts(to);
  const A = from ? parts(from) : B;
  [...el.children].forEach((k, i) => {
    move(k as HTMLElement, { transform: A[i] }, { transform: B[i] }, { delay, duration, easing });
  });
}

// Чёрная пилюля (кнопка сайта) — растём из неё; иначе (клетка прайса) — из места нажатия.
function inkPill(el: HTMLElement) {
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  const m = cs.backgroundColor.match(/\d+(\.\d+)?/g)?.map(Number) ?? [255, 255, 255, 0];
  const dark = (m[3] ?? 1) > 0.5 && m[0] + m[1] + m[2] < 200;
  return dark && Number.parseFloat(cs.borderTopLeftRadius) >= r.height / 2 - 1;
}

export function BriefModal() {
  const ids = useId();
  const lenis = useLenis();
  const { status } = useBrief();
  // Поля или статус «отправлено» — по статусу заявки (так же решает и сама форма).
  const view = status === "sent" || status === "mail" ? "done" : "form";
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("Обсудить проект");

  const layerRef = useRef<HTMLDivElement>(null);
  const inkRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLSpanElement>(null);
  const tPaperRef = useRef<HTMLSpanElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const formRef = useRef<BriefFormHandle>(null);

  // Состояние показа — вне React: его читают обработчики и шаги анимаций.
  const S = useRef({
    phase: "closed" as "closed" | "opening" | "open" | "closing",
    opener: null as HTMLElement | null,
    pill: false, // растём из чёрной пилюли (иначе — из места нажатия)
    point: [0, 0] as [number, number],
    side: "top" as "top" | "bottom",
    g: null as G | null,
    reduced: false,
    phone: false,
    stopped: false, // Lenis остановили мы
    pushed: false,
    ignorePop: false,
    shownAt: 0,
    after: null as null | (() => void),
  }).current;
  const lenisRef = useRef(lenis);
  lenisRef.current = lenis;

  // ---------- Раскладка ----------
  // Карточка у кнопки: из верхней половины экрана — вниз от неё (правый край вровень), из нижней —
  // вверх (низ вровень); из клетки — над местом нажатия или под ним. На телефоне — почти весь экран.
  // keep — карточка уже стоит: меняется только высота, край у кнопки остаётся на месте.
  const place = (keep?: G | null): G => {
    const card = cardRef.current as HTMLDivElement;
    const vw = window.innerWidth;
    const vh = window.visualViewport?.height ?? window.innerHeight;
    if (S.phone) {
      Object.assign(card.style, { left: "8px", width: `${vw - 16}px`, top: "8px" });
      const h = card.offsetHeight;
      const y = view === "done" && S.side === "bottom" ? vh - 8 - h : 8;
      card.style.top = `${y}px`;
      return { x: 8, y, w: vw - 16, h, r: 20 };
    }
    if (keep) {
      const h = card.offsetHeight;
      const y = clamp(S.side === "top" ? keep.y : keep.y + keep.h - h, 16, vh - h - 16);
      card.style.top = `${y}px`;
      return { x: keep.x, y, w: keep.w, h, r: keep.r };
    }
    const w = 480;
    const r = S.opener?.isConnected && S.pill ? S.opener.getBoundingClientRect() : null;
    const [px, py] = S.point;
    const x = clamp(r ? (S.side === "top" ? r.right - w : r.left) : px - w / 2, 24, vw - w - 24);
    card.style.width = `${w}px`;
    card.style.left = `${x}px`;
    const h = card.offsetHeight;
    const yy = r
      ? S.side === "top"
        ? r.top
        : r.bottom - h
      : S.side === "top"
        ? py - 28
        : py + 28 - h;
    const y = clamp(yy, 16, vh - h - 16);
    card.style.top = `${y}px`;
    return { x, y, w, h, r: 22 };
  };

  const reveal = (delay: number) => {
    const items = [
      closeRef.current,
      ...(cardRef.current?.querySelectorAll<HTMLElement>("[data-st], [data-done]") ?? []),
    ];
    items.forEach((el, i) => {
      if (!el) return;
      move(
        el,
        { opacity: 0, transform: "translateY(8px)" },
        { opacity: "", transform: "" },
        {
          delay: S.reduced ? 0 : delay + i * 24,
          duration: S.reduced ? 0 : 260,
          easing: "ease-out",
        },
      );
    });
  };
  const fadeAll = () => {
    for (const el of [
      closeRef.current,
      ...(cardRef.current?.querySelectorAll<HTMLElement>("[data-st], [data-done]") ?? []),
    ])
      if (el) move(el, { opacity: 1 }, { opacity: "0" }, { duration: 120 });
  };
  // Белое внутри рамки: проявляется — карточка светлеет, гаснет — темнеет до чёрной пилюли.
  const paperFade = (on: boolean, delay: number, duration: number) => {
    const el = paperRef.current;
    if (el)
      move(
        el,
        { opacity: on ? 0 : 1 },
        { opacity: on ? "" : "0" },
        { delay, duration, easing: "linear" },
      );
  };

  // ---------- Открыть ----------
  const show = (el: HTMLElement, o?: BriefOpen) => {
    if (S.phase !== "closed") return;
    const s = getBrief();
    if (o?.preset && s.status === "idle") {
      const p = o.preset;
      // Своё к «Другое» не перетираем, кроме подсказки из другой клетки.
      const keep = s.other.trim() && s.other !== s.detail;
      setBrief({
        need: p.need,
        detail: p.detail ?? (p.other && !keep ? p.other : ""),
        ...(p.other && !keep ? { other: p.other } : {}),
      });
    }
    S.opener = el;
    S.pill = inkPill(el);
    const r = el.getBoundingClientRect();
    S.point = o?.point ?? mid(r);
    const vh = window.visualViewport?.height ?? window.innerHeight;
    S.side = (S.pill ? r.top + r.height / 2 : S.point[1]) < vh / 2 ? "top" : "bottom";
    S.reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    S.phone = matchMedia(PHONE).matches;
    S.shownAt = Date.now();
    S.phase = "opening";
    setLabel(S.pill ? (el.textContent ?? "").trim() || "Обсудить проект" : "Обсудить проект");
    if (titleRef.current)
      titleRef.current.style.fontSize = S.pill ? getComputedStyle(el).fontSize : "";
    formRef.current?.clearErrors();
    // Страница стоит: Lenis, html[data-brief]; своя запись истории — для «Назад».
    const l = lenisRef.current;
    S.stopped = !!l && !l.isStopped;
    if (S.stopped) l?.stop();
    document.documentElement.dataset.brief = "";
    window.history.pushState({ ...window.history.state, whiteinksBrief: true }, "");
    S.pushed = true;
    setOpen(true);
  };

  // Окно показано — замеры и ход открытия.
  // biome-ignore lint/correctness/useExhaustiveDependencies: только на открытие
  useLayoutEffect(() => {
    if (!open || S.phase !== "opening") return;
    const el = S.opener as HTMLElement;
    const g = place();
    S.g = g;
    for (const t of [titleRef.current, tPaperRef.current])
      if (t) Object.assign(t.style, { transform: "", opacity: "" });
    // Белая подпись — только пока под ней чернила пилюли.
    if (tPaperRef.current) tPaperRef.current.style.opacity = "0";
    if (S.reduced) {
      shapeTo(inkRef.current, null, g);
      shapeTo(paperRef.current, null, inset(g));
      paperFade(true, 0, 0);
      move(
        layerRef.current as HTMLElement,
        { opacity: 0 },
        { opacity: "" },
        { duration: 220, easing: "ease-out" },
      );
    } else {
      // Чёрная пилюля растёт в карточку и по ходу светлеет; из клетки — из места нажатия.
      const r = el.getBoundingClientRect();
      const p0 = S.pill ? asPill(r) : spot(S.point);
      if (S.pill) el.style.visibility = "hidden";
      shapeTo(inkRef.current, p0, g, 0, 560);
      shapeTo(paperRef.current, inset(p0), inset(g), 0, 560);
      paperFade(true, 60, 360);
      const t = titleRef.current as HTMLSpanElement;
      if (S.pill) {
        // Подпись кнопки — первая строка карточки: прилетает из пилюли, из белой становится чёрной.
        const c = mid(r);
        const tr = t.getBoundingClientRect();
        move(
          t,
          {
            transform: `translate(${c[0] - tr.left - tr.width / 2}px, ${c[1] - tr.top - tr.height / 2}px)`,
          },
          { transform: "" },
          { duration: 560, easing: EZ },
        );
        if (tPaperRef.current)
          move(tPaperRef.current, { opacity: 1 }, { opacity: "0" }, { delay: 160, duration: 140 });
      } else move(t, { opacity: 0 }, { opacity: "" }, { delay: 260, duration: 260 });
    }
    reveal(280);
    window.setTimeout(
      () => {
        if (S.phase !== "opening") return;
        S.phase = "open";
        if (!S.phone && view === "form") formRef.current?.focusPhone();
        else cardRef.current?.focus({ preventScroll: true });
      },
      S.reduced ? 230 : 600,
    );
  }, [open]);

  // ---------- Закрыть ----------
  const close = (byPop = false) => {
    if (S.phase !== "open" && S.phase !== "opening") return;
    S.phase = "closing";
    if (S.pushed && !byPop) {
      S.ignorePop = true;
      window.history.back();
    }
    S.pushed = false;
    const el = S.opener;
    const layer = layerRef.current as HTMLElement;
    const finish = () => {
      if (el) el.style.visibility = "";
      for (const k of [inkRef, paperRef]) for (const c of k.current?.children ?? []) stop(c);
      for (const c of [layer, paperRef.current, titleRef.current]) if (c) stop(c);
      layer.style.opacity = "";
      if (titleRef.current) Object.assign(titleRef.current.style, { transform: "", opacity: "" });
      setOpen(false);
      S.phase = "closed";
      delete document.documentElement.dataset.brief;
      if (S.stopped) lenisRef.current?.start();
      S.stopped = false;
      el?.focus({ preventScroll: true });
    };
    const g = S.g as G;
    const r = el?.isConnected ? el.getBoundingClientRect() : null;
    const onScreen = !!r && r.bottom > 0 && r.top < window.innerHeight && r.width > 0;
    if (S.reduced || !onScreen || !r) {
      // Без движения или кнопки на экране нет — окно гаснет.
      move(layer, { opacity: 1 }, { opacity: "0" }, { duration: 220, easing: "ease-out" });
      window.setTimeout(finish, 230);
      return;
    }
    fadeAll();
    if (S.pill) {
      // Карточка темнеет и садится в пилюлю; подпись возвращается на кнопку.
      const p = asPill(r);
      shapeTo(inkRef.current, g, p, 100, 480);
      shapeTo(paperRef.current, inset(g), inset(p), 100, 480);
      paperFade(false, 300, 280);
      const t = titleRef.current as HTMLSpanElement;
      const tr = t.getBoundingClientRect();
      const c = mid(r);
      move(
        t,
        { transform: "" },
        {
          transform: `translate(${c[0] - tr.left - tr.width / 2}px, ${c[1] - tr.top - tr.height / 2}px)`,
        },
        { delay: 100, duration: 480, easing: EZ },
      );
      if (tPaperRef.current)
        move(tPaperRef.current, { opacity: 0 }, { opacity: "1" }, { delay: 440, duration: 120 });
      window.setTimeout(finish, 600);
    } else {
      // Из клетки — садится туда, где нажали, и гаснет.
      const p = spot(S.point);
      shapeTo(inkRef.current, g, p, 60, 440);
      shapeTo(paperRef.current, inset(g), inset(p), 60, 440);
      if (titleRef.current)
        move(titleRef.current, { opacity: 1 }, { opacity: "0" }, { duration: 120 });
      move(
        layer,
        { opacity: 1 },
        { opacity: "0" },
        { delay: 300, duration: 220, easing: "ease-out" },
      );
      window.setTimeout(finish, 540);
    }
  };

  // Кнопки сайта зовут окно через lib/brief.ts.
  const fn = useRef({ show, close });
  fn.current = { show, close };
  useEffect(() => {
    setHost(document.body);
    setBriefOpener((el, o) => fn.current.show(el, o));
    const onPop = () => {
      if (S.ignorePop) {
        S.ignorePop = false;
        return;
      }
      if (S.pushed) {
        S.pushed = false;
        fn.current.close(true);
      }
    };
    window.addEventListener("popstate", onPop);
    return () => {
      setBriefOpener(null);
      window.removeEventListener("popstate", onPop);
    };
  }, [S]);

  // Esc (дальше не идёт: кейс под окном не закрывается), щелчок мимо карточки, клавиатура телефона.
  // biome-ignore lint/correctness/useExhaustiveDependencies: слушатели — на время показа
  useEffect(() => {
    const layer = layerRef.current;
    if (!open || !layer) return;
    // Tab и Shift+Tab — по кругу внутри окна, на страницу под ним фокус не уходит. Не inert на
    // остальном body: он пересчитывал стили всей страницы — рывок на входе и выходе окна.
    const trap = (e: KeyboardEvent) => {
      const card = cardRef.current;
      if (!card) return;
      const list = [...card.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (el) =>
          el.tabIndex >= 0 &&
          el.getClientRects().length > 0 &&
          getComputedStyle(el).visibility !== "hidden",
      );
      const first = list[0];
      const end = list[list.length - 1];
      const at = document.activeElement;
      const inside = at instanceof HTMLElement && at !== card && card.contains(at);
      if (!first || !end) {
        e.preventDefault();
        card.focus({ preventScroll: true });
      } else if (!inside || at === (e.shiftKey ? first : end)) {
        e.preventDefault();
        (e.shiftKey ? end : first).focus({ preventScroll: true });
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Tab") return trap(e);
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      fn.current.close();
    };
    const onDown = (e: PointerEvent) => {
      if (e.target === layer) fn.current.close();
    };
    // Клавиатура телефона сжимает видимую часть экрана: высота окна — по ней (переменная на
    // самом слое, по событию, не каждый кадр), «Отправить» остаётся над клавиатурой.
    const vv = window.visualViewport;
    const onVV = () => {
      if (!vv) return;
      layer.style.setProperty("--vvh", `${vv.height}px`);
      layer.style.transform = vv.offsetTop ? `translateY(${vv.offsetTop}px)` : "";
    };
    onVV();
    const relayout = (keep: boolean) => {
      if (S.phase !== "open" || !S.g) return;
      const g = place(keep ? S.g : null);
      if (Math.abs(g.h - S.g.h) < 1 && Math.abs(g.y - S.g.y) < 1 && Math.abs(g.x - S.g.x) < 1)
        return;
      shapeTo(inkRef.current, S.g, g, 0, S.reduced ? 0 : 200, OUT);
      shapeTo(paperRef.current, inset(S.g), inset(g), 0, S.reduced ? 0 : 200, OUT);
      S.g = g;
    };
    const onResize = () => relayout(false);
    const ro = new ResizeObserver(() => relayout(true));
    if (cardRef.current) ro.observe(cardRef.current);
    // Esc — на окне раньше всех (захват на window): кейс и другие слои его не получают, где бы ни был фокус.
    window.addEventListener("keydown", onKey, true);
    layer.addEventListener("pointerdown", onDown);
    vv?.addEventListener("resize", onVV);
    vv?.addEventListener("scroll", onVV);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      layer.removeEventListener("pointerdown", onDown);
      vv?.removeEventListener("resize", onVV);
      vv?.removeEventListener("scroll", onVV);
      window.removeEventListener("resize", onResize);
      ro.disconnect();
    };
  }, [open, view]);

  // Сменился вид (форма ↔ статус) — карточка садится или вырастает от того же края.
  // biome-ignore lint/correctness/useExhaustiveDependencies: только на смену вида
  useLayoutEffect(() => {
    if (!open || S.phase !== "open") return;
    const after = S.after;
    S.after = null;
    const g = place(S.g);
    shapeTo(inkRef.current, S.g, g, 0, S.reduced ? 0 : 460, IO);
    shapeTo(paperRef.current, S.g && inset(S.g), inset(g), 0, S.reduced ? 0 : 460, IO);
    S.g = g;
    // Кнопка, на которой был фокус, ушла вместе с полями — фокус остаётся в окне.
    if (!cardRef.current?.contains(document.activeElement))
      cardRef.current?.focus({ preventScroll: true });
    after?.();
  }, [view]);

  // ---------- Отправка (сама форма — BriefForm) ----------
  // Ушло: поля гаснут, карточка садится до строки статуса (тот же текст, что в конверте).
  const onSent = (show: () => void, body: HTMLElement | null) => {
    if (S.phase !== "open") return show();
    if (body && !S.reduced) move(body, { opacity: 1 }, { opacity: "0" }, { duration: 180 });
    window.setTimeout(
      () => {
        S.after = () => {
          for (const [i, el] of [
            ...(cardRef.current?.querySelectorAll<HTMLElement>("[data-done]") ?? []),
          ].entries())
            move(
              el,
              { opacity: 0, transform: "translateY(8px)" },
              { opacity: "", transform: "" },
              {
                delay: S.reduced ? 0 : 200 + i * 120,
                duration: S.reduced ? 0 : 320,
                easing: "ease-out",
              },
            );
        };
        show();
      },
      S.reduced ? 0 : 200,
    );
  };

  if (!host) return null;
  return createPortal(
    <div ref={layerRef} className={styles.layer} hidden={!open} data-lenis-prevent data-brief-modal>
      <div ref={inkRef} className={styles.shape} aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
      <div ref={paperRef} className={`${styles.shape} ${styles.paper}`} aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
      <div
        ref={cardRef}
        className={styles.card}
        data-done={view === "done" || undefined}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${ids}-t`}
      >
        <div className={styles.top}>
          <span ref={titleRef} id={`${ids}-t`} className={styles.title}>
            {label}
            <span ref={tPaperRef} className={styles.tPaper} aria-hidden="true">
              {label}
            </span>
          </span>
          <button
            ref={closeRef}
            type="button"
            className={styles.close}
            aria-label="Закрыть"
            onClick={() => close()}
          />
        </div>

        <BriefForm
          ref={formRef}
          className={styles.form}
          lead={
            <p className={styles.lead} data-st>
              Перезвоним {BRIEF_CONFIG.replyIn} в рабочее время{" "}
              <span className={styles.nw}>({BRIEF_CONFIG.hours})</span>, уточним задачу и в тот же
              день назовём срок и цену.
            </p>
          }
          since={() => S.shownAt}
          onSent={onSent}
          onReopen={() => {
            S.after = () => reveal(120);
          }}
        />
      </div>
    </div>,
    host,
  );
}
