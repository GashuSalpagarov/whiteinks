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
    parts: [{ file: "duo-hero", fileM: "duo-hero-m" }, { file: "duo-quick" }, { file: "duo-labs" }],
  },
  "doctis-analysis": {
    parts: [
      { file: "phone-tiles", phone: true },
      { file: "phone-list", phone: true },
      { file: "duo-phone", phone: true },
    ],
  },
  imperia: {
    parts: [
      { file: "duo-head", fileM: "duo-head-m" },
      { file: "duo-photo" },
      { file: "duo-form", fileM: "duo-form-m" },
    ],
  },
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
  "doctis-crm": {
    parts: [
      { file: "stats", fileM: "stats-m" },
      { file: "schedule" },
      { file: "tasks", fileM: "labels-m" },
    ],
    unlisted: true,
  },
  "stroy-m": {
    parts: [{ file: "slide3" }, { file: "slide1" }, { file: "slide2" }, { file: "filter" }],
    unlisted: true,
  },
  arm: {
    parts: [{ file: "duo-main", fileM: "duo-main-m" }, { file: "duo-modal" }],
    unlisted: true,
  },
  "arm-listener": {
    parts: [{ file: "main" }, { file: "table-tall" }, { file: "timer" }],
    unlisted: true,
  },
  "check-please": {
    parts: [{ file: "photo" }, { file: "menu", phone: true }, { file: "status-strip" }],
    unlisted: true,
  },
  gbz: {
    parts: [{ file: "page", fileM: "page-m" }, { file: "publish" }, { file: "filter" }],
    unlisted: true,
  },
  kanban: {
    parts: [{ file: "timeline", fileM: "m-timeline" }, { file: "dots" }, { file: "drag" }],
    unlisted: true,
  },
  "sc-system": {
    parts: [
      { file: "site", fileM: "site-m" },
      { file: "modal" },
      { file: "calendar" },
      { file: "booking" },
      { file: "steps-strip" },
    ],
    unlisted: true,
  },
  dmcloud: {
    parts: [{ file: "main", fileM: "main-m" }, { file: "models" }, { file: "props" }],
    unlisted: true,
  },
  // Раскладка как у Memoridian: операторская в окне, экран сеанса гостя на телефоне.
  gameclub: {
    parts: [{ file: "duo-window", fileM: "duo-window-m" }, { file: "duo-phone", phone: true }],
    unlisted: true,
  },
  // Та же раскладка: веб-панель завода в окне, кадр ролика на телефоне.
  "content-factory": {
    parts: [{ file: "duo-window", fileM: "duo-window-m" }, { file: "duo-phone", phone: true }],
    unlisted: true,
  },
  // Та же раскладка: дашборд управляющей компании в окне, кабинет собственника на телефоне.
  rental: {
    parts: [{ file: "duo-window", fileM: "duo-window-m" }, { file: "duo-phone", phone: true }],
    unlisted: true,
  },
  // Та же раскладка: первый экран сайта в окне, карточка отеля на телефоне.
  flats: {
    parts: [{ file: "duo-window", fileM: "duo-window-m" }, { file: "duo-phone", phone: true }],
    unlisted: true,
  },
  "globaldrive-portal": {
    parts: [
      { file: "duo-main", fileM: "duo-main-m" },
      { file: "duo-schedule", fileM: "duo-schedule-m" },
      { file: "menu" },
    ],
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
  lazy,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { slug?: string; alts?: string[]; lazy?: boolean }) {
  // Длинный список работ: снимки ниже экрана не грузятся и не декодируются при его открытии.
  const load = lazy
    ? ({ loading: "lazy", decoding: "async" } as const)
    : { decoding: "sync" as const };
  return (
    <div className={`${styles.duo} ${className}`} data-duo={slug} {...rest}>
      {GROUPS[slug].parts.map((p, i) =>
        p.phone ? (
          <figure key={p.file} className={styles.phone} data-p={i}>
            {/* biome-ignore lint/performance/noImgElement: статический экспорт, файлы из public как есть */}
            <img src={shot(slug, p.file)} alt={alts?.[i] ?? ""} {...load} />
          </figure>
        ) : (
          <div key={p.file} className={styles.browser} data-p={i}>
            <picture>
              {p.fileM && <source media="(max-width: 767px)" srcSet={shot(slug, p.fileM)} />}
              <img src={shot(slug, p.file)} alt={alts?.[i] ?? ""} {...load} />
            </picture>
          </div>
        ),
      )}
    </div>
  );
}
