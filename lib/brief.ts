// Отправка заявки из Сцены 6. Задан NEXT_PUBLIC_BRIEF_ENDPOINT — POST JSON туда (потом это Yandex
// Cloud Function). Не задан — открываем письмо (mailto:) с тем же текстом: работает на статическом
// хостинге и ничего не хранит, но отправит его сам посетитель — сцена так и говорит.

import { formatPhone } from "@/lib/phone";

// ЗАГЛУШКИ — заполнит владелец: почта для писем и контакты сайта (Hero, футер, Сцена 6).
export const BRIEF_CONFIG = {
  email: "brief@example.com",
  telegram: "@whiteinks",
  phone: "+7 (999) 000-00-00",
  replyIn: "в течение 2 часов",
};

const SUBJECT = "Заявка с сайта";

export type BriefPayload = {
  phone: string; // +7XXXXXXXXXX
  name?: string;
  need?: string; // «Сайт», «Магазин», …
  time: string; // ISO
};

const ENDPOINT = process.env.NEXT_PUBLIC_BRIEF_ENDPOINT;
// Быстрее — бот: живой человек за 3 секунды телефон не наберёт.
const MIN_FILL_MS = 3000;

function briefText(p: BriefPayload): string {
  return [
    "Заявка с сайта White Inks",
    "",
    `Телефон: ${formatPhone(p.phone.slice(2))}`,
    ...(p.name ? [`Имя: ${p.name}`] : []),
    ...(p.need ? [`Что нужно: ${p.need}`] : []),
  ].join("\n");
}

// "sent" — заявка ушла на endpoint; "mail" — открыли письмо, отправит его сам посетитель.
// guard: trap — скрытое поле-ловушка, startedAt — когда показали форму (Date.now()).
export async function submitBrief(
  payload: BriefPayload,
  guard: { trap: string; startedAt: number },
): Promise<"sent" | "mail"> {
  if (!ENDPOINT) {
    window.location.href = `mailto:${BRIEF_CONFIG.email}?subject=${encodeURIComponent(
      SUBJECT,
    )}&body=${encodeURIComponent(briefText(payload))}`;
    return "mail";
  }
  // Бот — делаем вид, что всё ушло, и ничего не шлём.
  if (guard.trap || Date.now() - guard.startedAt < MIN_FILL_MS) return "sent";
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subject: SUBJECT, ...payload }),
  });
  if (!res.ok) throw new Error(`brief: ${res.status}`);
  return "sent";
}
