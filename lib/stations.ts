import type Lenis from "lenis";
import { viewportH } from "@/lib/scroll/onScroll";

// Станции пути — сцены главной по порядку. Один список на всех: подпись в шапке (SceneLabel),
// карта пути слева (PathMap) и пункты меню (HeaderMenu).
// f — стык: станция начинается, когда верх секции поднялся до f экрана от верха экрана (на стыках
// SceneLabel перекатывает слово; Сцена 3 начинается на экран раньше своего места — её стык при
// f = 0, когда встаёт туннель). land — куда ведёт переход: кадр, где сцена уже стоит, а не пустой
// разгон или середина перехода; считается от разметки в момент клика.
export type Station = {
  scene: string;
  word: string;
  f: number;
  land: (el: HTMLElement, h: number) => number;
};

const top = (el: HTMLElement) => el.getBoundingClientRect().top + window.scrollY;
// Куда приводит переход к самой секции — с её scroll-margin-top, как якорь и lenis.scrollTo(el):
// Сцена 6 так сама задаёт кадр с собранным конвертом (туда же ведёт «Связаться» в Hero).
const anchor = (el: HTMLElement) =>
  top(el) - (Number.parseFloat(getComputedStyle(el).scrollMarginTop) || 0);

// Закреплённый (sticky) кусок секции — первый в потоке: прокрутка, на которой он встаёт и отпускает.
function pin(el: HTMLElement) {
  const t = top(el);
  const cs = getComputedStyle(el);
  const padTop = Number.parseFloat(cs.paddingTop);
  const padBottom = Number.parseFloat(cs.paddingBottom);
  const child = [...el.children].find(
    (c): c is HTMLElement => getComputedStyle(c).position === "sticky",
  );
  if (!child) return { start: t, end: t };
  const at = Number.parseFloat(getComputedStyle(child).top) || 0;
  return {
    start: t + padTop - at,
    end: t + el.offsetHeight - padBottom - child.offsetHeight - at,
  };
}

export const STATIONS: Station[] = [
  { scene: "scene2", word: "Услуги", f: 0.15, land: (el) => anchor(el) },
  // Первая карточка туннеля — в окне чтения, с подписью.
  { scene: "scene3", word: "Работы", f: 0, land: (el, h) => top(el) + 0.42 * h },
  // Первая карточка веера выросла, подводка и чек-лист всплыли.
  { scene: "scene4", word: "Как мы работаем", f: 0.05, land: (el, h) => top(el) + 0.25 * h },
  // Конец стоянки каталога: вся мозаика проявлена, каталог ещё стоит.
  { scene: "scene5", word: "Сколько стоит", f: 0.2, land: (el) => pin(el).end - 2 },
  { scene: "scene6", word: "Заявка", f: 0.1, land: (el) => anchor(el) },
  // Футер встал внизу — начало зоны петли: петля не начинается.
  { scene: "footer", word: "Контакты", f: 0.45, land: (el) => pin(el).start },
];

const found: (HTMLElement | null)[] = STATIONS.map(() => null);
function section(i: number): HTMLElement | null {
  const el = found[i];
  if (el?.isConnected) return el;
  found[i] = document.querySelector<HTMLElement>(`[data-scene="${STATIONS[i].scene}"]`);
  return found[i];
}

// Место на пути, непрерывно: −1 — верх страницы, i — стык станции i, между стыками — доля
// прокрутки от одного до другого. Последняя станция — потолок.
export function pathProgress(h: number): number {
  let prev = 0;
  for (let i = 0; i < STATIONS.length; i++) {
    const el = section(i);
    if (!el) continue;
    const d = STATIONS[i].f * h - el.getBoundingClientRect().top; // прокрутка от стыка
    if (d < 0) {
      if (i === 0) {
        const y = window.scrollY;
        return y - d > 0 ? -1 + y / (y - d) : -1;
      }
      return i - 1 + prev / (prev - d);
    }
    prev = d;
  }
  return STATIONS.length - 1;
}

// Как у «Связаться» в Hero: плавный разгон и торможение.
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

// Переход к станции i (−1 — верх страницы) пролётом по пути: 1 с и ещё 0,12 с на каждый экран,
// не дольше 2,8 с — столько летит «Связаться» через весь путь. Без Lenis (reduced motion) — сразу.
export function goToStation(i: number, lenis: Lenis | null) {
  const h = viewportH();
  const el = i < 0 ? null : section(i);
  if (i >= 0 && !el) return;
  const y = Math.max(0, Math.round(el ? STATIONS[i].land(el, h) : 0));
  if (!lenis) {
    window.scrollTo(0, y);
    return;
  }
  const duration = Math.min(2.8, 1 + (0.12 * Math.abs(y - window.scrollY)) / h);
  lenis.scrollTo(y, { duration, easing: ease });
}
