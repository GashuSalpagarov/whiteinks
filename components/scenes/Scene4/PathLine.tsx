import type { Ref } from "react";
import styles from "./PathLine.module.css";

// Линия пути — отдельная часть сцены: разметка, стили (PathLine.module.css) и запись.
// Место (от оси веера до низа кадра) задаёт layout() в Scene4.tsx через placeLine, долю
// до падающей капли каждый проход — paintLine.

export function PathLine({ ref }: { ref: Ref<HTMLDivElement> }) {
  return <div ref={ref} className={styles.line} aria-hidden="true" />;
}

// x — середина линии, top и span — начало и длина в координатах кадра, px.
export function placeLine(el: HTMLDivElement | null, x: number, top: number, span: number) {
  if (!el) return;
  el.style.left = `${x - 2}px`;
  el.style.top = `${top}px`;
  el.style.height = `${span}px`;
  delete el.dataset.f; // после смены места — записать долю заново
}

// f — видимая доля линии от начала, 0..1.
export function paintLine(el: HTMLDivElement | null, f: number) {
  if (!el) return;
  const v = f.toFixed(4);
  if (el.dataset.f === v) return;
  el.dataset.f = v;
  el.style.opacity = f > 0 ? "1" : "0";
  el.style.transform = `scaleY(${v})`;
}
