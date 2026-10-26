import type { Ref } from "react";
import styles from "./StageList.module.css";
import { type Scene, STEPS, stageProgress } from "./stages";

// Чек-лист этапов — отдельная часть сцены: разметка, стили (StageList.module.css) и состояние.
// Место задаёт layout() в Scene4.tsx, состояние каждый проход пишет paintList. Впереди — бледные
// строки, текущая крупнее и чёрная, пройденные зачёркнуты тонкой линией: она прорисовывается,
// пока начинается следующий этап; «Запуск» — когда начинается выход из сцены.

const num = (i: number) => String(i + 1).padStart(2, "0");

export function StageList({ ref }: { ref: Ref<HTMLOListElement> }) {
  return (
    <ol ref={ref} className={styles.list}>
      {STEPS.map((step, i) => (
        <li key={step.word} className={styles.row} data-state="off">
          <span className={styles.n}>{num(i)}</span>
          <span className={styles.w}>
            {step.word}
            <i className={styles.strike} />
          </span>
        </li>
      ))}
    </ol>
  );
}

export function paintList(list: HTMLOListElement | null, sc: Scene, still: boolean) {
  if (!list) return;
  for (let i = 0; i < list.children.length; i++) {
    const li = list.children[i] as HTMLElement;
    const { state, grow, strike } = stageProgress(i, sc, still);
    if (li.dataset.state !== state) li.dataset.state = state;
    const css = `${grow.toFixed(3)}|${strike.toFixed(3)}`;
    if (li.dataset.v === css) continue;
    li.dataset.v = css;
    li.style.setProperty("--grow", grow.toFixed(3));
    li.style.setProperty("--strike", strike.toFixed(3));
  }
}
