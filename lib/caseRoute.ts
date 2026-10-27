import type { MouseEvent } from "react";

// Страница кейса: адрес /works/<slug>/ и вход в слой кейса (components/case) из Сцены 3. Кейс
// открывается поверх главной без перезагрузки: Сцена 3 шлёт CASE_OPEN_EVENT, слой меняет адрес
// через history.pushState и ведёт переход. Прямой заход по адресу — статическая страница
// app/works/[slug], та же главная с уже открытым кейсом.

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const HOME_HREF = `${BASE}/`;
export const caseHref = (slug: string) => `${BASE}/works/${slug}/`;

// Кейс из адреса: «/whiteinks/works/studio-site/» → «studio-site»; не кейс — null.
export function caseSlugFrom(pathname: string): string | null {
  const path = BASE && pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname;
  return /^\/works\/([^/]+)\/?$/.exec(path)?.[1] ?? null;
}

export const CASE_OPEN_EVENT = "whiteinks:case-open";

// card — карточка или плитка Сцены 3, сквозь которую входим; caption — её подпись в туннеле.
export type CaseOpenDetail = {
  slug: string;
  card: HTMLElement | null;
  caption: HTMLElement | null;
};

// Нажатие на ссылку кейса: обычное — переход в слое, с Ctrl/Cmd/Shift или средней кнопкой —
// как у ссылки (новая вкладка — прямой заход по адресу).
export function openCase(e: MouseEvent, detail: CaseOpenDetail) {
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  window.dispatchEvent(new CustomEvent(CASE_OPEN_EVENT, { detail }));
}
