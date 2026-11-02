// Всплытие при прокрутке: блок ждёт ниже и прозрачным, дошёл до экрана — проявляется снизу и остаётся.
// Одно на список работ и страницы кейсов.
export const RISE_FROM = "translateY(40px)";

export function rise(el: HTMLElement, delay = 0) {
  el.animate(
    [
      { opacity: 0, transform: RISE_FROM },
      { opacity: 1, transform: "none" },
    ],
    { duration: 800, delay, easing: "cubic-bezier(0.33, 1, 0.68, 1)", fill: "backwards" },
  );
}
