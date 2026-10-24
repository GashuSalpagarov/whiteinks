// Отправка заявки из Сцены 6 и окна заявки. Задан NEXT_PUBLIC_BRIEF_ENDPOINT — POST JSON туда (потом это Yandex
// Cloud Function). Не задан — открываем письмо (mailto:) с тем же текстом: работает на статическом
// хостинге и ничего не хранит, но отправит его сам посетитель — сцена так и говорит.

import { useSyncExternalStore } from "react";
import { formatPhone } from "@/lib/phone";

// ЗАГЛУШКИ — заполнит владелец: почта для писем и контакты сайта (Hero, футер, Сцена 6).
export const BRIEF_CONFIG = {
  email: "brief@example.com",
  telegram: "@whiteinks",
  phone: "+7 (999) 000-00-00",
  replyIn: "в течение 2 часов",
  hours: "пн–пт, 10–19", // ЗАГЛУШКА: рабочее время — в нём и действует replyIn (Сцена 6)
};

const SUBJECT = "Заявка с сайта";

// Редакция согласия (/consent) — та же дата, что «Редакция от …» на странице; ЗАГЛУШКА.
// Без галочки Сцена 6 заявку не шлёт, поэтому в каждой заявке согласие дано — и это записано
// (доказывать согласие обязан оператор, ч. 3 ст. 9 152-ФЗ).
const CONSENT_EDITION = "[дата]";

const consentLine = (time: string) =>
  `Согласие на обработку персональных данных: дано ${new Date(time).toLocaleString("ru-RU", {
    timeZone: "Europe/Moscow",
  })} (МСК), редакция от ${CONSENT_EDITION}`;

export type BriefPayload = {
  phone: string; // +7XXXXXXXXXX
  name?: string;
  need?: string; // «Сайт», «Магазин», … или «Другое: своими словами»
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
    "",
    consentLine(p.time),
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
    body: JSON.stringify({
      subject: SUBJECT,
      ...payload,
      consent: { given: true, at: payload.time, edition: CONSENT_EDITION },
    }),
  });
  if (!res.ok) throw new Error(`brief: ${res.status}`);
  return "sent";
}

// ---------- Общие данные заявки ----------
// Конверт Сцены 6 и окно заявки (components/ui/BriefModal) — два вида одних данных: набрали в
// одном — видно в другом, отправили в одном — статус и там.

export const OTHER = "Другое";
export const NEEDS = ["Сайт", "Магазин", "Приложение", "ИИ и автоматизация", OTHER];

export type BriefStatus = "idle" | "sending" | "sent" | "mail";
export type BriefState = {
  phone: string; // 10 цифр после +7
  name: string;
  need: string; // пилюля из NEEDS или ""
  detail: string; // уточнение к пилюле из клетки прайса: «лендинг»; сменили пилюлю — снимается
  other: string; // своё к «Другое» — остаётся, и когда выбор снят
  consent: boolean;
  status: BriefStatus;
};

const EMPTY: BriefState = {
  phone: "",
  name: "",
  need: "",
  detail: "",
  other: "",
  consent: false,
  status: "idle",
};
let state = EMPTY;
const subs = new Set<() => void>();
const subscribe = (fn: () => void) => {
  subs.add(fn);
  return () => {
    subs.delete(fn);
  };
};
export const getBrief = () => state;

export function setBrief(patch: Partial<BriefState>) {
  const next = { ...state, ...patch };
  if (patch.need !== undefined && patch.detail === undefined && patch.need !== state.need)
    next.detail = "";
  state = next;
  for (const fn of subs) fn();
}

// «Отправить ещё одну» — чистая форма.
export const clearBrief = () => setBrief(EMPTY);

export function useBrief(): BriefState {
  return useSyncExternalStore(subscribe, getBrief, () => EMPTY);
}

export function briefErrors(s: BriefState): { phone?: string; consent?: string } {
  return {
    phone:
      s.phone.length < 10
        ? s.phone
          ? "Номер неполный — нужно 10 цифр после +7"
          : "Оставьте телефон — по нему и перезвоним"
        : undefined,
    consent: s.consent ? undefined : "Отметьте согласие — без него не сможем перезвонить",
  };
}

// «Что нужно» в заявке: «Сайт — лендинг», «Другое: своими словами».
export function needText(s: BriefState): string | undefined {
  if (s.need === OTHER) return s.other.trim() ? `${OTHER}: ${s.other.trim()}` : OTHER;
  if (!s.need) return undefined;
  return s.detail ? `${s.need} — ${s.detail}` : s.need;
}

export const FAIL_TEXT = `Не получилось отправить. Позвоните ${BRIEF_CONFIG.phone} или напишите в Telegram ${BRIEF_CONFIG.telegram}`;

// ---------- Окно заявки ----------
// Кнопки сайта открывают окно через openBrief; окно (components/ui/BriefModal) регистрирует себя
// одно. preset — выбор из клетки прайса; point — где нажали (окно растёт из места нажатия).
export type BriefPreset = { need: string; detail?: string; other?: string };
export type BriefOpen = { preset?: BriefPreset; point?: [number, number] };
let opener: ((el: HTMLElement, o?: BriefOpen) => void) | null = null;

export function setBriefOpener(fn: typeof opener) {
  opener = fn;
}

export function openBrief(el: HTMLElement, o?: BriefOpen) {
  if (opener) opener(el, o);
  else document.querySelector('[data-scene="scene6"]')?.scrollIntoView();
}
