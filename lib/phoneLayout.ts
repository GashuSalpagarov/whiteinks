// Телефонная раскладка — телефон и планшет в портрете: одно правило на все сцены. В CSS модулей
// тот же запрос написан в @media (custom media сборка не разворачивает) — искать по
// «orientation: portrait».
export const PHONE_LAYOUT = "(max-width: 767px), (orientation: portrait) and (max-width: 1024px)";

// Список запроса — один на страницу: .matches живой, проверка в каждом проходе ничего не стоит.
let query: MediaQueryList | null = null;
export function phoneLayout(): boolean {
  query ??= matchMedia(PHONE_LAYOUT);
  return query.matches;
}
