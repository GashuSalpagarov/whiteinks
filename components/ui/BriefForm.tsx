"use client";

import Link from "next/link";
import {
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
  type Ref,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  BRIEF_CONFIG,
  briefErrors,
  clearBrief,
  FAIL_TEXT,
  getBrief,
  NEEDS,
  needText,
  OTHER,
  setBrief,
  submitBrief,
  useBrief,
} from "@/lib/brief";
import { caretAt, formatPhone, PHONE_MASK, PHONE_PREFIX, phoneEdit } from "@/lib/phone";
import styles from "./BriefForm.module.css";

// Форма заявки — одна на сайт: телефон, имя, «что нужно» пилюлями, согласие, отправка и статус
// после неё. Её показывают окно заявки (BriefModal) и конец страницы кейса (CaseView). Данные —
// общие с конвертом Сцены 6 (useBrief, lib/brief.ts): набрали в одном месте — видно в других,
// отправили — статус везде. Что показать, поля или статус, — по статусу заявки.

type Errors = { phone?: string; consent?: string; form?: string };
export type BriefFormHandle = { clearErrors: () => void; focusPhone: () => void };

export function BriefForm(p: {
  ref?: Ref<BriefFormHandle>;
  className?: string;
  inline?: boolean; // на странице (конец кейса): телефон и имя строкой, без своей прокрутки
  lead?: ReactNode; // строка над полями (окно)
  next?: ReactNode; // под «Заявка отправлена» — что дальше (конец кейса)
  since?: () => number; // когда форму показали — для защиты от ботов; без него — когда она появилась
  // Ушло: show() показывает статус. Окно сначала гасит поля (body), без него — сразу.
  onSent?: (show: () => void, body: HTMLElement | null) => void;
  onReopen?: () => void; // перед «отправить ещё одну» и «вернуться к форме»
}) {
  const ids = useId();
  const { phone, name, need, detail, other, consent, status } = useBrief();
  const done = status === "sent" || status === "mail";
  const [focused, setFocused] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const formRef = useRef<HTMLFormElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const otherRef = useRef<HTMLTextAreaElement>(null);
  const caretRef = useRef<number | null>(null);
  const born = useRef(0);
  useEffect(() => {
    born.current = Date.now();
  }, []);
  useImperativeHandle(p.ref, () => ({
    clearErrors: () => setErrors({}),
    focusPhone: () => phoneRef.current?.focus({ preventScroll: true }),
  }));

  const shown = phone ? formatPhone(phone) : focused ? PHONE_PREFIX : "";

  // ---------- Поля ----------
  const onPhone = (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const type = (e.nativeEvent as InputEvent).inputType ?? "";
    const caret = input.selectionStart ?? input.value.length;
    const { digits, left } = phoneEdit(input.value, caret, phone, type);
    caretRef.current = left;
    setBrief({ phone: digits });
    setErrors((x) => ({ ...x, phone: undefined, form: undefined }));
  };
  const keepPrefix = (input: HTMLInputElement) => {
    const n = PHONE_PREFIX.length;
    if (!input.value.startsWith(PHONE_PREFIX)) return;
    const a = input.selectionStart ?? n;
    const b = input.selectionEnd ?? n;
    if (a < n || b < n) input.setSelectionRange(Math.max(n, a), Math.max(n, b));
  };
  useLayoutEffect(() => {
    const input = phoneRef.current;
    if (!input || !focused || document.activeElement !== input) return;
    const left = caretRef.current;
    caretRef.current = null;
    if (left === null && phone) return;
    const p = caretAt(input.value, left ?? 0);
    input.setSelectionRange(p, p);
  }, [phone, focused]);
  const [lines, setLines] = useState(1);
  // biome-ignore lint/correctness/useExhaustiveDependencies: строк — по тексту, когда он сменился
  useLayoutEffect(() => {
    const ta = otherRef.current;
    if (!ta) return;
    ta.style.height = "0";
    const lh = Number.parseFloat(getComputedStyle(ta).lineHeight);
    setLines(Math.min(3, Math.max(1, Math.round(ta.scrollHeight / lh))));
    ta.style.height = "";
  }, [other, need]);

  // ---------- Отправка ----------
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === "sending") return;
    const trap = String(new FormData(e.currentTarget).get("website") ?? "");
    const s = getBrief();
    const next: Errors = briefErrors(s);
    setErrors(next);
    if (next.phone) return phoneRef.current?.focus();
    if (next.consent)
      return formRef.current?.querySelector<HTMLInputElement>('[name="consent"]')?.focus();
    setBrief({ status: "sending" });
    try {
      const result = await submitBrief(
        {
          phone: `+7${s.phone}`,
          name: s.name.trim() || undefined,
          need: needText(s),
          time: new Date().toISOString(),
        },
        { trap, startedAt: p.since?.() ?? born.current },
      );
      const show = () => setBrief({ status: result });
      if (p.onSent) p.onSent(show, bodyRef.current);
      else show();
    } catch {
      setBrief({ status: "idle" });
      setErrors({ form: FAIL_TEXT });
    }
  };

  // «Отправить ещё одну» — чистая форма; «вернуться к форме» (письмо в почте) — те же данные.
  const reopen = (clear: boolean) => {
    p.onReopen?.();
    if (clear) clearBrief();
    else setBrief({ status: "idle" });
    setErrors({});
  };

  const needLabel = (v: string) => (need === v && detail && v !== OTHER ? `${v} · ${detail}` : v);

  return (
    <form
      ref={formRef}
      className={`${styles.form} ${p.inline ? styles.inline : ""} ${p.className ?? ""}`}
      noValidate
      onSubmit={submit}
    >
      {!done ? (
        <div key="form" ref={bodyRef} className={styles.body}>
          <div className={styles.scroll}>
            {p.lead}
            <div className={styles.field} data-st>
              <label className={styles.label} htmlFor={`${ids}-phone`}>
                телефон
              </label>
              <span className={styles.mask}>
                <input
                  ref={phoneRef}
                  id={`${ids}-phone`}
                  className={styles.input}
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={shown}
                  onChange={onPhone}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  onSelect={(e) => keepPrefix(e.currentTarget)}
                  onKeyDown={(e) => {
                    const input = e.currentTarget;
                    const n = PHONE_PREFIX.length;
                    if (!input.value.startsWith(PHONE_PREFIX)) return;
                    const a = input.selectionStart ?? n;
                    const home = e.key === "Home" || e.key === "ArrowUp";
                    if (home || (e.key === "ArrowLeft" && a <= n && !e.shiftKey)) {
                      e.preventDefault();
                      input.setSelectionRange(n, e.shiftKey ? (input.selectionEnd ?? n) : n);
                    }
                  }}
                  required
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={errors.phone ? `${ids}-phone-error` : undefined}
                />
                <span className={styles.ghost} aria-hidden="true">
                  <i>{shown}</i>
                  {PHONE_MASK.slice(shown.length)}
                </span>
              </span>
              {errors.phone && (
                <p id={`${ids}-phone-error`} className={styles.error}>
                  {errors.phone}
                </p>
              )}
            </div>
            <div className={styles.field} data-st>
              <label className={styles.label} htmlFor={`${ids}-name`}>
                имя — по желанию
              </label>
              <input
                id={`${ids}-name`}
                className={styles.input}
                name="name"
                autoComplete="given-name"
                autoCapitalize="words"
                value={name}
                onChange={(e) => setBrief({ name: e.target.value })}
              />
            </div>
            <div role="radiogroup" aria-labelledby={`${ids}-need`} data-st>
              <span id={`${ids}-need`} className={styles.label}>
                что нужно — по желанию
              </span>
              <div className={styles.pills}>
                {NEEDS.map((v) => (
                  <label key={v} className={styles.pill}>
                    <input
                      type="radio"
                      name="need"
                      value={v}
                      checked={need === v}
                      onChange={() => setBrief({ need: v })}
                      onClick={() => {
                        if (need === v) setBrief({ need: "" });
                      }}
                    />
                    <span>{needLabel(v)}</span>
                  </label>
                ))}
              </div>
              {need === OTHER && (
                <textarea
                  ref={otherRef}
                  className={styles.other}
                  name="other"
                  rows={lines}
                  value={other}
                  onChange={(e) => setBrief({ other: e.target.value })}
                  maxLength={300}
                  placeholder="что именно?"
                  aria-label="Другое — что именно"
                />
              )}
            </div>
            <div data-st>
              <label className={styles.consent}>
                <input
                  type="checkbox"
                  name="consent"
                  className={styles.check}
                  checked={consent}
                  onChange={(e) => {
                    setBrief({ consent: e.target.checked });
                    setErrors((x) => ({ ...x, consent: undefined, form: undefined }));
                  }}
                  aria-invalid={Boolean(errors.consent)}
                  aria-describedby={errors.consent ? `${ids}-consent-error` : undefined}
                />
                <span>
                  согласен на{" "}
                  <Link href="/consent" target="_blank" prefetch={false}>
                    обработку персональных данных
                  </Link>{" "}
                  ·{" "}
                  <Link href="/privacy" target="_blank" prefetch={false}>
                    политика
                  </Link>
                </span>
              </label>
              {errors.consent && (
                <p id={`${ids}-consent-error`} className={styles.error}>
                  {errors.consent}
                </p>
              )}
            </div>
            {errors.form && (
              <p className={styles.error} role="alert">
                {errors.form}
              </p>
            )}
          </div>
          <div className={styles.foot}>
            <button type="submit" className={styles.send} disabled={status === "sending"} data-st>
              {status === "sending" ? "Отправляем…" : "Отправить заявку"}
            </button>
          </div>
        </div>
      ) : (
        <div key="done" className={styles.done} role="status">
          {status === "mail" ? (
            <>
              <p data-done>
                <strong>Осталось отправить.</strong> Письмо открыто в вашей почте — отправьте его.
                Или позвоните{" "}
                <a href={`tel:+${BRIEF_CONFIG.phone.replace(/\D/g, "")}`} className={styles.nw}>
                  {BRIEF_CONFIG.phone}
                </a>
                , Telegram{" "}
                <a
                  href={`https://t.me/${BRIEF_CONFIG.telegram.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {BRIEF_CONFIG.telegram}
                </a>
                .
              </p>
              <button type="button" className={styles.link} onClick={() => reopen(false)} data-done>
                вернуться к форме
              </button>
            </>
          ) : (
            <>
              <p data-done>
                <strong>Заявка отправлена.</strong> Перезвоним на{" "}
                <span className={styles.nw}>{formatPhone(phone)}</span> {BRIEF_CONFIG.replyIn} в
                рабочее время.
              </p>
              {p.next}
              <button type="button" className={styles.link} onClick={() => reopen(true)} data-done>
                отправить ещё одну
              </button>
            </>
          )}
        </div>
      )}
      {/* Ловушка для ботов: людям не видна и недоступна с клавиатуры. */}
      <input
        className={styles.trap}
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />
    </form>
  );
}
