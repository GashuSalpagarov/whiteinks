"use client";

import Link from "next/link";
import {
  type ChangeEvent,
  type FormEvent,
  type Ref,
  type UIEvent,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useLenis } from "@/app/providers";
import {
  type BriefStatus,
  briefErrors,
  FAIL_TEXT,
  NEEDS,
  needText,
  OTHER,
  setBrief,
  submitBrief,
  useBrief,
} from "@/lib/brief";
import { caretAt, formatPhone, PHONE_MASK, PHONE_PREFIX, phoneEdit } from "@/lib/phone";
import { viewportH } from "@/lib/scroll/onScroll";
import styles from "./Envelope.module.css";

// Конверт заявки — один на сайт: его собирает по прокрутке Сцена 6 и ставит уже собранным конец
// страницы кейса (CaseView). На сиреневом поле — открытый конверт, из него торчит письмо с полями
// (телефон, имя, что нужно), на кармане — согласие и «Отправить заявку». Отправили — письмо уходит
// в конверт, клапан закрывается, на конверте — «от: …»; ушло на сервер (sent) — ложится марка.
// Открыли письмо в почте (mail) — марки нет: отправит сам посетитель. Данные — общие с окном
// заявки и другими конвертами (useBrief, lib/brief.ts).
//
// В покое (без стилей на элементах) конверт собран. Сборку по прокрутке ведёт хозяин: части
// конверта — в ref (EnvelopeParts), onShift — письмо выдвинулось или ушло обратно («Другое»), и
// сборку надо пересчитать. Место и ширину задаёт хозяин; Envelope.module.css — какие переменные
// он может задать.

type Errors = { phone?: string; consent?: string; form?: string };

export type EnvelopeParts = {
  root: HTMLDivElement | null;
  tint: HTMLSpanElement | null;
  env: HTMLFormElement | null;
  outline: SVGSVGElement | null;
  edge: SVGPathElement | null;
  edgeUse: SVGUseElement | null;
  flapOpen: SVGSVGElement | null;
  back: HTMLDivElement | null;
  sheet: HTMLDivElement | null;
  pocket: HTMLDivElement | null;
  cut: SVGSVGElement | null;
  act: HTMLDivElement | null;
  flapClosed: SVGSVGElement | null;
  fields: HTMLDivElement[]; // телефон, имя, «что нужно» — всплывают по одному
};

export function Envelope(p: { ref?: Ref<EnvelopeParts>; onShift?: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const tintRef = useRef<HTMLSpanElement>(null);
  const envRef = useRef<HTMLFormElement>(null);
  const outlineRef = useRef<SVGSVGElement>(null);
  const edgeRef = useRef<SVGPathElement>(null);
  const edgeUseRef = useRef<SVGUseElement>(null);
  const flapOpenRef = useRef<SVGSVGElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const phoneFieldRef = useRef<HTMLDivElement>(null);
  const nameFieldRef = useRef<HTMLDivElement>(null);
  const needsRef = useRef<HTMLDivElement>(null);
  const otherPillRef = useRef<HTMLLabelElement>(null);
  const otherRowRef = useRef<HTMLDivElement>(null);
  const otherRef = useRef<HTMLTextAreaElement>(null);
  const otherInkRef = useRef<HTMLDivElement>(null);
  const focusOther = useRef(false); // «Другое» выбрали мышью или касанием — курсор в строку
  const pocketRef = useRef<HTMLDivElement>(null);
  const cutRef = useRef<SVGSVGElement>(null);
  const actRef = useRef<HTMLDivElement>(null);
  const flapClosedRef = useRef<SVGSVGElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);
  const shownAt = useRef(0); // когда показали форму — для отсечки ботов
  const caretRef = useRef<number | null>(null); // цифр левее каретки после правки номера
  const shiftRef = useRef(p.onShift);
  shiftRef.current = p.onShift;
  const ids = useId();
  const edgeId = `${ids.replace(/[^\w-]/g, "")}-edge`; // контур — <use> по id, свой у каждого
  const lenis = useLenis();

  useImperativeHandle(p.ref, () => ({
    root: rootRef.current,
    tint: tintRef.current,
    env: envRef.current,
    outline: outlineRef.current,
    edge: edgeRef.current,
    edgeUse: edgeUseRef.current,
    flapOpen: flapOpenRef.current,
    back: backRef.current,
    sheet: sheetRef.current,
    pocket: pocketRef.current,
    cut: cutRef.current,
    act: actRef.current,
    flapClosed: flapClosedRef.current,
    fields: [phoneFieldRef.current, nameFieldRef.current, needsRef.current].filter(
      (el): el is HTMLDivElement => el !== null,
    ),
  }));

  // Данные формы — общие с окном заявки (lib/brief.ts): набрали там — здесь то же, и наоборот.
  const brief = useBrief();
  const { phone, name, need, other, consent, status } = brief;
  const setPhone = (v: string) => setBrief({ phone: v });
  const setName = (v: string) => setBrief({ name: v });
  const setNeed = (v: string) => setBrief({ need: v });
  const setOther = (v: string) => setBrief({ other: v });
  const setConsent = (v: boolean) => setBrief({ consent: v });
  const setStatus = (v: BriefStatus) => setBrief({ status: v });
  const [focused, setFocused] = useState(false); // поле телефона в фокусе — маска с «+7 (»
  const [rows, setRows] = useState(1); // строк в своём к «Другое»
  const [errors, setErrors] = useState<Errors>({});
  const closed = status === "sent" || status === "mail";
  const isOther = need === OTHER;
  const lines = isOther ? rows : 1;
  const shown = phone ? formatPhone(phone) : focused ? "+7 (" : "";
  const phoneText = formatPhone(phone);

  useEffect(() => {
    shownAt.current = Date.now();
  }, []);

  // Закрыли конверт — один замер: высота обёртки замирает (ничего под ней не прыгнет), а
  // конверт садится до обычной пропорции (переход высоты — в CSS). На телефоне он садится почти
  // вдвое: подложка остаётся во всю высоту, конверт сдвигается к её середине (translate, переход —
  // в CSS) — под ним нет белого места, а страница не короче. Вернулись к форме — снимаем,
  // ошибки прошлой попытки — тоже.
  useLayoutEffect(() => {
    const letter = rootRef.current;
    const env = envRef.current;
    const sheet = sheetRef.current;
    const plate = env?.parentElement;
    if (!letter || !env || !sheet || !plate) return;
    if (!closed) {
      letter.style.minHeight = "";
      plate.style.minHeight = "";
      env.style.height = "";
      env.style.translate = "";
      // Письмо на место сразу, как и всё остальное: переход translate — только для «Другое».
      sheet.style.transition = "none";
      void sheet.offsetHeight;
      sheet.style.transition = "";
      setErrors((e) => (Object.keys(e).length ? {} : e));
      return;
    }
    letter.style.minHeight = `${letter.offsetHeight}px`;
    const flap = Number.parseFloat(getComputedStyle(env).getPropertyValue("--flap"));
    const phone = env.offsetWidth < 500;
    const from = env.offsetHeight;
    const to = Math.min(from, Math.round(flap + env.offsetWidth * (phone ? 0.62 : 0.46)));
    if (phone) plate.style.minHeight = `${plate.offsetHeight}px`;
    env.style.height = `${from}px`;
    void env.offsetHeight;
    env.style.height = `${to}px`;
    if (phone) env.style.translate = `0 ${Math.round((from - to) / 2)}px`;
  }, [closed]);

  // «Другое» выбрали или сняли, строк стало больше или меньше: письмо выдвигается (CSS, --n — строк),
  // хозяин пересчитывает сборку (onShift). Пунктир расходится из-под пилюли (--o); выбрали мышью
  // или касанием — курсор в строку.
  useLayoutEffect(() => {
    sheetRef.current?.style.setProperty("--n", String(lines));
    shiftRef.current?.();
    const row = otherRowRef.current;
    const pill = otherPillRef.current;
    if (!isOther || !row || !pill) return;
    const r = pill.getBoundingClientRect();
    const box = row.getBoundingClientRect();
    const o = r.left + r.width / 2 - box.left;
    row.style.setProperty("--o", `${Math.round(o)}px`);
    if (focusOther.current) {
      // Строка у нижнего края (телефон боком) — сначала подвозим её выше: печатать под краем
      // экрана вслепую нельзя.
      const h = viewportH();
      if (box.bottom > 0.7 * h) {
        const y = window.scrollY + box.bottom - 0.55 * h;
        if (lenis) lenis.scrollTo(y, { duration: 0.6 });
        else window.scrollTo(0, y);
      }
      otherRef.current?.focus({ preventScroll: true });
    }
    focusOther.current = false;
  }, [isOther, lines, lenis]);

  // Строк — сколько занял текст (замер при нулевой высоте); больше --max — прокрутка в поле.
  // Текст мог прийти и из окна заявки — меряем по самому полю, когда текст сменился.
  // biome-ignore lint/correctness/useExhaustiveDependencies: строк — по тексту, когда он сменился
  useLayoutEffect(() => {
    const ta = otherRef.current;
    if (!ta) return;
    ta.style.height = "0";
    const lh = Number.parseFloat(getComputedStyle(ta).lineHeight);
    setRows(Math.max(1, Math.round(ta.scrollHeight / lh)));
    ta.style.height = "";
  }, [other]);
  const onOther = (e: ChangeEvent<HTMLTextAreaElement>) => setOther(e.currentTarget.value);

  // Прокрутка поля — целыми строками (линии не режутся краем), зеркало с линиями — за ней.
  const onOtherScroll = (e: UIEvent<HTMLTextAreaElement>) => {
    const ta = e.currentTarget;
    const lh = Number.parseFloat(getComputedStyle(ta).lineHeight);
    const top = Math.round(ta.scrollTop / lh) * lh;
    if (Math.abs(top - ta.scrollTop) > 0.5) ta.scrollTop = top;
    if (otherInkRef.current) otherInkRef.current.scrollTop = ta.scrollTop;
  };

  const clearError = (key: keyof Errors) =>
    setErrors((e) => (e[key] || e.form ? { ...e, [key]: undefined, form: undefined } : e));

  // Номер — из того, что в поле, с учётом каретки; каретка потом — за той же цифрой.
  const onPhone = (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const type = (e.nativeEvent as InputEvent).inputType ?? "";
    const caret = input.selectionStart ?? input.value.length;
    const { digits, left } = phoneEdit(input.value, caret, phone, type);
    caretRef.current = left;
    setPhone(digits);
    clearError("phone");
  };

  // Каретка — никогда внутри «+7 (»: ни щелчком, ни выделением, ни Home и стрелками.
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
    if (left === null && phone) return; // щёлкнули в номер — каретка там, где щёлкнули
    const at = caretAt(input.value, left ?? 0);
    input.setSelectionRange(at, at);
  }, [phone, focused]);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trap = String(new FormData(e.currentTarget).get("website") ?? "");
    const next: Errors = briefErrors(brief);
    setErrors(next);
    if (next.phone) return phoneRef.current?.focus();
    if (next.consent) return consentRef.current?.focus();

    setStatus("sending");
    try {
      const result = await submitBrief(
        {
          phone: `+7${phone}`,
          name: name.trim() || undefined,
          need: needText(brief),
          time: new Date().toISOString(),
        },
        { trap, startedAt: shownAt.current },
      );
      setStatus(result);
    } catch {
      setStatus("idle");
      setErrors({ form: FAIL_TEXT });
    }
  };

  const cls = [styles.letter, closed && styles.closed, status === "sent" && styles.sent];

  return (
    <div ref={rootRef} className={cls.filter(Boolean).join(" ")}>
      <div className={styles.plate}>
        {/* Сиреневый слой — отдельно: на втором круге он в своём цвете, а конверт — в общем. */}
        <span ref={tintRef} className={`${styles.tint} no-invert`} aria-hidden="true" />
        <form ref={envRef} className={styles.env} noValidate onSubmit={submit} inert={closed}>
          <svg
            ref={flapOpenRef}
            className={styles.flapOpen}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <polygon points="0,100 50,0 100,100" vectorEffect="non-scaling-stroke" />
          </svg>
          <div ref={backRef} className={styles.back} aria-hidden="true" />

          <div ref={sheetRef} className={styles.sheet} data-other={isOther || undefined}>
            <div className={styles.row}>
              <div ref={phoneFieldRef} className={styles.field}>
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
                  {/* Остаток маски — бледным за набранным. */}
                  <span className={styles.ghostMask} aria-hidden="true">
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
              <div ref={nameFieldRef} className={styles.field}>
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
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div ref={needsRef} role="radiogroup" aria-labelledby={`${ids}-need`}>
              <span id={`${ids}-need`} className={styles.label}>
                что нужно — по желанию
              </span>
              <div className={styles.pills}>
                {NEEDS.map((v) => (
                  <label
                    key={v}
                    ref={v === OTHER ? otherPillRef : undefined}
                    className={styles.pill}
                  >
                    {/* Повторный щелчок по выбранной — снять выбор: поле необязательное. */}
                    <input
                      type="radio"
                      name="need"
                      value={v}
                      checked={need === v}
                      onChange={() => setNeed(v)}
                      onClick={(e) => {
                        if (need === v) setNeed("");
                        // У выбора стрелками клавиатуры detail = 0 — фокус остаётся в пилюлях.
                        else if (v === OTHER && e.detail > 0) focusOther.current = true;
                      }}
                    />
                    <span>{v}</span>
                  </label>
                ))}
              </div>
              {/* Своё к «Другое» — строки пути: пунктир, под набранным — чернила (их рисует
                  зеркало текста под полем). Место под первую — в кармане; выбрали «Другое» —
                  письмо выдвигается, и строки видны. */}
              <div ref={otherRowRef} className={styles.other} inert={!isOther}>
                <div ref={otherInkRef} className={styles.otherInk} aria-hidden="true">
                  <span>{other}</span>
                  {"​"}
                </div>
                <textarea
                  ref={otherRef}
                  className={styles.otherInput}
                  name="other"
                  rows={lines}
                  value={other}
                  onChange={onOther}
                  onScroll={onOtherScroll}
                  maxLength={300}
                  placeholder="что именно?"
                  aria-label="Другое — что именно"
                />
              </div>
            </div>
          </div>

          {/* Карман: верхний край галочкой; на нём — согласие и кнопка. */}
          <div ref={pocketRef} className={styles.pocket}>
            <svg
              ref={cutRef}
              className={styles.cut}
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <polyline points="0,0 50,100 100,0" vectorEffect="non-scaling-stroke" />
            </svg>
            <div ref={actRef} className={styles.act}>
              <div>
                <label className={styles.consent}>
                  <input
                    ref={consentRef}
                    type="checkbox"
                    className={styles.check}
                    checked={consent}
                    onChange={(e) => {
                      setConsent(e.target.checked);
                      clearError("consent");
                    }}
                    required
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
              <button type="submit" className={styles.send} disabled={status === "sending"}>
                {status === "sending" ? "Отправляем…" : "Отправить заявку"}
              </button>
            </div>
          </div>

          {/* Клапан: ложится при сборке и при отправке. */}
          <svg
            ref={flapClosedRef}
            className={styles.flapClosed}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <polygon points="0,0 50,100 100,0" vectorEffect="non-scaling-stroke" />
          </svg>
          <span className={`${styles.stamp} no-invert`} aria-hidden="true" />
          <p className={styles.from} aria-hidden="true">
            <b>White Inks</b>
            <br />
            от: {name.trim() ? `${name.trim()}, ` : ""}
            <span className={styles.nw}>{phoneText}</span>
          </p>
          {/* Контур сборки: две линии из точки обегают конверт; в покое его нет. */}
          <svg ref={outlineRef} className={styles.outline} aria-hidden="true">
            <path ref={edgeRef} id={edgeId} fill="none" stroke="currentColor" strokeWidth="1.5" />
            <use ref={edgeUseRef} href={`#${edgeId}`} />
          </svg>
          {/* Ловушка для ботов: людям не видна и недоступна с клавиатуры. */}
          <input
            className={styles.trap}
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />
        </form>
        {errors.form && (
          <p className={`${styles.error} ${styles.formError}`} role="alert">
            {errors.form}
          </p>
        )}
      </div>
    </div>
  );
}
