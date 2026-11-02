import type { HTMLAttributes } from "react";
import styles from "./Duo.module.css";

// Группа снимков первого экрана: и на карточке Сцены 3 и списка работ, и на первом экране кейса — те же
// файлы, кадр и пропорции, размер задаёт только ширина группы. В полёте летит сама группа (carry в
// CaseLayer), поэтому подмены картинки нет. Рамка у всех общая, у каждого кейса своя раскладка — в
// Duo.module.css по data-duo: у Memoridian окно и телефон, у остальных другое.

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const shot = (slug: string, file: string) => `${BASE}/works/${slug}/${file}.webp`;
type Part = { file: string; fileM?: string; phone?: boolean };
const GROUPS: Record<string, { parts: Part[]; unlisted?: boolean }> = {
  memoridian: { parts: [{ file: "web-chat" }, { file: "home-light", phone: true }] },
  picvario: { parts: [{ file: "grid" }, { file: "pill" }, { file: "modes" }] },
  prokat: { parts: [{ file: "duo-window" }] },
  doctis: {
    parts: [{ file: "slots" }, { file: "duty-m" }, { file: "duo-phone", phone: true }],
  },
  "doctis-analysis": {
    parts: [
      { file: "phone-tiles", phone: true },
      { file: "phone-list", phone: true },
      { file: "duo-phone", phone: true },
    ],
  },
  imperia: { parts: [{ file: "duo-prices" }, { file: "wheel" }, { file: "duo-form" }] },
  // Карточки на главной нет, поэтому главная эти снимки заранее не грузит.
  globaldrive: {
    parts: [{ file: "filter" }, { file: "drawings-m" }, { file: "icons-m" }],
    unlisted: true,
  },
  "animals-travel": {
    parts: [
      { file: "duo-window", fileM: "duo-window-m" },
      { file: "tile-docs" },
      { file: "tile-sitter" },
      { file: "tile-carriers" },
    ],
    unlisted: true,
  },
  goroddorog: {
    parts: [
      { file: "tile-mkpp", fileM: "tile-mkpp-m" },
      { file: "tile-learn" },
      { file: "tile-price" },
      { file: "tile-online", fileM: "tile-online-m" },
    ],
    unlisted: true,
  },
  edgecenter: {
    parts: [{ file: "codes" }, { file: "cdn" }, { file: "dashboard", fileM: "dashboard-m" }],
  },
  edgeconf: {
    parts: [
      { file: "duo-start", fileM: "duo-start-m" },
      { file: "duo-cabinet", fileM: "duo-cabinet-m" },
    ],
    unlisted: true,
  },
  kavkazstore: {
    parts: [
      { file: "head", fileM: "m-header" },
      { file: "card-1", fileM: "m-card-3" },
      { file: "card-3", fileM: "m-card-2" },
      { file: "card-knife" },
      { file: "tile" },
    ],
    unlisted: true,
  },
  "stroy-m": {
    parts: [{ file: "slide3" }, { file: "slide1" }, { file: "slide2" }, { file: "filter" }],
    unlisted: true,
  },
};
export const DUO_SHOTS = Object.entries(GROUPS)
  .filter(([, g]) => !g.unlisted)
  .flatMap(([slug, g]) => g.parts.map((p) => shot(slug, p.file)));

export function Duo({
  slug = "memoridian",
  className = "",
  alts,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { slug?: string; alts?: string[] }) {
  // Группа в списке работ и на первом экране кейса: браузер переносит её между страницами сам
  // (docs/13-works-page.md). На карточке Сцены 3 имени нет: она на той же странице, что и кейс.
  const name = "data-cover" in rest ? `duo-${slug}` : undefined;
  return (
    <div
      className={`${styles.duo} ${className}`}
      data-duo={slug}
      style={{ viewTransitionName: name }}
      {...rest}
    >
      {GROUPS[slug].parts.map((p, i) =>
        p.phone ? (
          <figure key={p.file} className={styles.phone} data-p={i}>
            {/* biome-ignore lint/performance/noImgElement: статический экспорт, файлы из public как есть */}
            <img src={shot(slug, p.file)} alt={alts?.[i] ?? ""} decoding="sync" />
          </figure>
        ) : (
          <div key={p.file} className={styles.browser} data-p={i}>
            <picture>
              {p.fileM && <source media="(max-width: 767px)" srcSet={shot(slug, p.fileM)} />}
              <img src={shot(slug, p.file)} alt={alts?.[i] ?? ""} decoding="sync" />
            </picture>
          </div>
        ),
      )}
    </div>
  );
}
