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

// Блоки [data-rise] страницы над главной, ниже первого экрана: ждут и всплывают, когда верх дошёл до 90%
// экрана. Без движения — видно всё сразу. Возвращает отписку. data-d — задержка, мс.
export function riseIn(root: HTMLElement) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const io = new IntersectionObserver(
    (entries) => {
      for (const { isIntersecting, target } of entries) {
        if (!isIntersecting) continue;
        io.unobserve(target);
        const el = target as HTMLElement;
        el.style.opacity = "";
        el.style.transform = "";
        rise(el, Number(el.dataset.d) || 0);
      }
    },
    { rootMargin: "0px 0px -10% 0px" },
  );
  for (const el of root.querySelectorAll<HTMLElement>("[data-rise]")) {
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) continue;
    el.style.opacity = "0";
    el.style.transform = RISE_FROM;
    io.observe(el);
  }
  return () => io.disconnect();
}
