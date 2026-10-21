// Отправка письма-заявки из Сцены 6. Задан NEXT_PUBLIC_BRIEF_ENDPOINT — POST JSON туда (потом
// это Yandex Cloud Function). Не задан — открываем письмо (mailto:) с тем же текстом: работает
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

// Тема письма — одна на все заявки.
export const BRIEF_SUBJECT = "Новый проект";

export type Intent = "estimate" | "call";

export type BriefPayload = {
  message: string; // своими словами, может быть пустым
  contact: string;
  intent: Intent;
  time: string; // ISO
};

const ENDPOINT = process.env.NEXT_PUBLIC_BRIEF_ENDPOINT;
// Быстрее — бот: живой человек за 3 секунды письмо не напишет.
const MIN_FILL_MS = 3000;

function briefText(p: BriefPayload): string {
  return [
    "Письмо с сайта White Inks",
    "",
    ...(p.message ? [p.message, ""] : []),
    `Контакт: ${p.contact}`,
    `Хочу: ${p.intent === "call" ? "15 минут созвона" : "детальную смету"}`,
  ].join("\n");
}

// "sent" — письмо ушло на endpoint; "mail" — открыли письмо, отправит сам посетитель.
// guard: trap — скрытое поле-ловушка, startedAt — когда показали форму (Date.now()).
export async function submitBrief(
  payload: BriefPayload,
  guard: { trap: string; startedAt: number },
): Promise<"sent" | "mail"> {
  if (!ENDPOINT) {
    window.location.href = `mailto:${BRIEF_CONFIG.email}?subject=${encodeURIComponent(
      BRIEF_SUBJECT,
    )}&body=${encodeURIComponent(briefText(payload))}`;
    return "mail";
  }
  // Бот — делаем вид, что всё ушло, и ничего не шлём.
  if (guard.trap || Date.now() - guard.startedAt < MIN_FILL_MS) return "sent";
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subject: BRIEF_SUBJECT, ...payload }),
  });
  if (!res.ok) throw new Error(`brief: ${res.status}`);
  return "sent";
}
