import { rise } from "@/lib/scroll/rise";

// Вход в список работ с плитки «Все проекты»: копия плитки растёт, пока её белое поле не закроет экран,
// стопка внутри разлетается и гаснет. На белом проявляется список: блоки первого экрана всплывают, линия
// с точкой опускаются сверху. Выход — тот же ход назад. Копия лежит над сценами, но под шапкой главной:
// логотип и кнопка стоят на месте всё время перехода. Только transform и opacity.

export const ZOOM = 700;
const IO3 = "cubic-bezier(0.65, 0, 0.35, 1)";
const OUT3 = "cubic-bezier(0.33, 1, 0.68, 1)";
const FAN = ["translate(38%, -38%)", "translate(16%, -16%)", "translate(-6%, 6%)"];

// Плитка, с которой можно лететь: показана на экране и движение не отключено.
export function worksTile() {
  const tile = document.querySelector<HTMLElement>("[data-works-tile]");
  if (!tile || tile.style.visibility !== "visible") return null;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return null;
  const r = tile.getBoundingClientRect();
  return r.bottom > 0 && r.top < window.innerHeight ? tile : null;
}

export function zoomTile(tile: HTMLElement, back = false) {
  const r = tile.getBoundingClientRect();
  const f = (tile.firstElementChild as HTMLElement).getBoundingClientRect();
  const cx = f.left + f.width / 2;
  const cy = f.top + f.height / 2;
  const W = window.innerWidth;
  const H = window.innerHeight;
  const s = Math.max(W / f.width, H / f.height) * 1.03; // рамка поля уходит за край экрана

  const el = tile.cloneNode(true) as HTMLElement;
  el.removeAttribute("href");
  el.removeAttribute("data-works-tile");
  el.setAttribute("aria-hidden", "true");
  Object.assign(el.style, {
    position: "fixed",
    left: `${r.left}px`,
    top: `${r.top}px`,
    width: `${r.width}px`,
    height: `${r.height}px`,
    zIndex: "5",
    opacity: "1",
    visibility: "visible",
    pointerEvents: "none",
    willChange: "auto", // с will-change копия увеличивалась бы размытой
    transform: "none",
    transformOrigin: `${cx - r.left}px ${cy - r.top}px`,
  });
  const [stack, arrow] = [...(el.firstElementChild as HTMLElement).children] as HTMLElement[];
  const count = stack.querySelector("i") as HTMLElement;
  const original = tile.querySelectorAll("span");
  document.body.append(el);

  const t = {
    duration: ZOOM,
    delay: back ? 160 : 0, // список успевает погаснуть над полем
    easing: IO3,
    fill: "both",
    direction: back ? "reverse" : "normal",
  } as const;
  const zoom = el.animate(
    [
      { transform: "none" },
      { transform: `translate(${W / 2 - cx}px, ${H / 2 - cy}px) scale(${s})` },
    ],
    t,
  );
  [...stack.children].forEach((card, i) => {
    const from = getComputedStyle(original[i]).transform; // под курсором стопка уже раздвинута
    card.animate([{ transform: from }, { transform: FAN[i] }], t);
  });
  stack.animate(
    [{ opacity: 1 }, { opacity: 1, offset: 0.2 }, { opacity: 0, offset: 0.6 }, { opacity: 0 }],
    t,
  );
  for (const part of [arrow, count]) {
    part.animate([{ opacity: 1 }, { opacity: 0, offset: 0.25 }, { opacity: 0 }], t);
  }
  return { el, finished: zoom.finished };
}

// Первый экран списка, когда поле плитки закрыло экран (delay).
export function enterList(root: HTMLElement, delay: number) {
  let i = 0;
  for (const el of root.querySelectorAll<HTMLElement>("[data-rise]")) {
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) rise(el, delay + i++ * 70);
  }
  const [ink, dot] = root.querySelectorAll<HTMLElement>("[data-line]");
  const t = { duration: 800, delay, easing: OUT3, fill: "backwards" } as const;
  ink.animate([{ transform: "scaleY(0)" }, { transform: "none" }], t);
  dot.animate([{ transform: `translateY(${-ink.offsetHeight}px)` }, { transform: "none" }], t);
}
