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

function run() {
  for (const sub of subs) sub.fn();
  const style = document.documentElement.style;
  for (const [name, value] of staged) {
    if (written.get(name) === value || /NaN|Infinity/.test(value)) continue;
    style.setProperty(name, value);
    written.set(name, value);
  }
  staged.clear();
}

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
