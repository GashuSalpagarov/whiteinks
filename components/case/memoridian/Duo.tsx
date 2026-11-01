import type { HTMLAttributes } from "react";
import styles from "./Duo.module.css";

// Окно приложения и телефон одной жёсткой группой: и на карточке Сцены 3, и на первом экране кейса —
// те же файлы, кадр и пропорции, размер задаёт только ширина группы. В полёте летит сама группа
// первого экрана (carry в CaseLayer), поэтому подмены картинки нет.

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const shot = (file: string) => `${BASE}/works/memoridian/${file}.webp`;
export const DUO_SHOTS = [shot("web-chat"), shot("home-light")];

export function Duo({
  className = "",
  alts,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { alts?: [string, string] }) {
  return (
    <div className={`${styles.duo} ${className}`} data-duo="" {...rest}>
      <div className={styles.browser}>
        {/* biome-ignore lint/performance/noImgElement: статический экспорт, файлы из public как есть */}
        <img src={DUO_SHOTS[0]} width={2100} height={1360} alt={alts?.[0] ?? ""} decoding="sync" />
      </div>
      <figure className={styles.phone}>
        {/* biome-ignore lint/performance/noImgElement: статический экспорт, файлы из public как есть */}
        <img src={DUO_SHOTS[1]} width={1170} height={2532} alt={alts?.[1] ?? ""} decoding="sync" />
      </figure>
    </div>
  );
}
