import { ADDONS, type Estimate, SCALES, type Selection, TYPES } from "./pricing";

// Отправка брифа из Сцены 5. Задан NEXT_PUBLIC_BRIEF_ENDPOINT — POST JSON туда (потом это
// Yandex Cloud Function). Не задан — открываем письмо (mailto:) с брифом в тексте: работает
// на статическом хостинге и ничего не хранит.

// ЗАГЛУШКИ — заполнит владелец: почта для писем и что обещаем.
export const BRIEF_CONFIG = {
  email: "brief@example.com",
  // Контакты сайта (Hero, футер) — тоже отсюда.
  telegram: "@whiteinks",
  phone: "+7 (999) 000-00-00",
  replyIn: "в течение 2 часов",
  promise: "Смета в PDF за 24 часа · цена фиксируется на 14 дней",
};

export type Intent = "estimate" | "call";

export type BriefPayload = {
  selection: Selection;
  estimate: Estimate;
  contact: string;
  comment: string;
  intent: Intent;
  url: string;
  time: string; // ISO
};

const ENDPOINT = process.env.NEXT_PUBLIC_BRIEF_ENDPOINT;
// Быстрее — бот: живой человек за 3 секунды бриф не заполнит.
const MIN_FILL_MS = 3000;

function briefText(p: BriefPayload): string {
  const type = TYPES.find((t) => t.id === p.selection.type);
  const scale = SCALES.find((s) => s.id === p.selection.scale);
  const picked = ADDONS.filter((a) => p.selection.addons.includes(a.id));
  const extras = picked.filter((a) => !a.monthly).map((a) => a.title);
  return [
    "Бриф с сайта White Inks",
    "",
    `Что строим: ${type?.title ?? "не выбрано"}`,
    `Размер: ${scale?.title}${type ? `, ${type.hints[p.selection.scale]}` : ""}`,
    `Дополнения: ${extras.length ? extras.join(", ") : "без дополнений"}`,
    ...(picked.some((a) => a.monthly) ? ["Поддержка: нужна, помесячно"] : []),
    `Ориентир: ${p.estimate.price}, ${p.estimate.term}`,
    "",
    `Контакт: ${p.contact}`,
    ...(p.comment ? [`Комментарий: ${p.comment}`] : []),
    `Хочу: ${p.intent === "call" ? "15 минут созвона" : "детальную смету"}`,
    "",
    `Ссылка на бриф: ${p.url}`,
  ].join("\n");
}

// "sent" — бриф ушёл на endpoint; "mail" — открыли письмо, отправит сам посетитель.
// guard: trap — скрытое поле-ловушка, startedAt — когда показали форму (Date.now()).
export async function submitBrief(
  payload: BriefPayload,
  guard: { trap: string; startedAt: number },
): Promise<"sent" | "mail"> {
  if (!ENDPOINT) {
    const subject = `Бриф: ${TYPES.find((t) => t.id === payload.selection.type)?.title ?? "без типа"}`;
    window.location.href = `mailto:${BRIEF_CONFIG.email}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(briefText(payload))}`;
    return "mail";
  }
  // Бот — делаем вид, что всё ушло, и ничего не шлём.
  if (guard.trap || Date.now() - guard.startedAt < MIN_FILL_MS) return "sent";
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`brief: ${res.status}`);
  return "sent";
}
