// Общий проход по сценам: на scroll, resize и смену размеров их секций (CSS догрузился,
// шрифты, HMR) — без прокрутки значения не залипают. Сцены вызываются в порядке своих секций
// на странице: общие CSS-переменные точки и канваса (--drop-*, --canvas-y) пишут несколько
// сцен по правилу «позже — главнее», и после перемонтирования (HMR) порядок тот же.
// Переменные копятся за проход и пишутся в конце, только изменившиеся: замеры
// (getBoundingClientRect) не упираются в пересчёт стилей, а промежуточные значения не
// пересчитывают стили всей страницы. NaN/Infinity не пишем: `NaNpx` ломает transform у .drop.

type Sub = { el: Element; fn: () => void };

const subs: Sub[] = [];
const staged = new Map<string, string>();
const written = new Map<string, string>();
let observer: ResizeObserver | null = null;

// CSS-переменная на documentElement — запишется в конце прохода.
export function setVar(name: string, value: string) {
  staged.set(name, value);
}

// Высота экрана для сцен — innerHeight, но на сенсорных экранах она обновляется только вместе
// с шириной (поворот): панель браузера и клавиатура не дёргают сцены, точку и канвас.
// В CSS это --ih (px): закреплённые сцены считают высоты от неё, а не от vh — на телефонах
// vh больше innerHeight, и вёрстка разъезжалась бы с JS.
let ih = 0;
let iw = 0;
export function viewportH(): number {
  const w = window.innerWidth;
  if (!ih || w !== iw || !matchMedia("(pointer: coarse)").matches) {
    ih = window.innerHeight;
    iw = w;
  }
  return ih;
}

// Прокрутка в экранах на конец прошлого прохода — до поворота, пока вёрстка была согласована.
let screens = 0;

function run() {
  const h = viewportH();
  const prevH = Number.parseFloat(written.get("--ih") ?? "");
  setVar("--ih", `${h}px`);
  for (const sub of subs) sub.fn();
  const style = document.documentElement.style;
  for (const [name, value] of staged) {
    if (written.get(name) === value || /NaN|Infinity/.test(value)) continue;
    style.setProperty(name, value);
    written.set(name, value);
  }
  staged.clear();
  // Поворот телефона: сцены перестроились в экранах уже после браузера (он сам удержал бы
  // место только для vh), и прокрутка в px указала бы в другую сцену — или в конец страницы,
  // то есть в прыжок петли футера. Возвращаем тот же прогресс в экранах.
  if (!h) return;
  if (prevH && prevH !== h && matchMedia("(pointer: coarse)").matches) {
    window.scrollTo(0, screens * h);
  }
  screens = window.scrollY / h;
}

// Тот же проход вне событий — его вызывает провайдер Lenis сразу после сдвига страницы.
export const syncScroll = run;

// Подписка обработчика сцены; el — её секция (по ней порядок и ResizeObserver).
export function onScroll(el: Element, fn: () => void): () => void {
  const sub = { el, fn };
  subs.push(sub);
  const after = Node.DOCUMENT_POSITION_FOLLOWING;
  subs.sort((a, b) => (a.el.compareDocumentPosition(b.el) & after ? -1 : 1));
  if (!observer) {
    observer = new ResizeObserver(run);
    window.addEventListener("scroll", run, { passive: true });
    window.addEventListener("resize", run);
  }
  observer.observe(el);
  run();

  return () => {
    subs.splice(subs.indexOf(sub), 1);
    observer?.unobserve(el);
    if (subs.length) return;
    observer?.disconnect();
    observer = null;
    window.removeEventListener("scroll", run);
    window.removeEventListener("resize", run);
  };
}
