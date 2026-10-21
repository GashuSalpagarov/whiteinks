"use client";

import Link from "next/link";
import { type CSSProperties, type FormEvent, useEffect, useId, useRef, useState } from "react";
import { BRIEF_CONFIG, type Intent, submitBrief } from "@/lib/brief";
import {
  ADDONS,
  type AddonId,
  DEFAULT_SELECTION,
  decodeSelection,
  encodeSelection,
  estimate,
  formatFrom,
  SCALES,
  type Selection,
  TYPES,
} from "@/lib/pricing";
import styles from "./Scene5.module.css";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TELEGRAM = /^(@|(https?:\/\/)?t\.me\/)[a-z0-9_]{5,32}\/?$/i;
// Как в Scene5.module.css: одна колонка, цена — полосой внизу.
const PHONE = "(max-width: 899px), (max-height: 500px)";

const cx = (...names: (string | false)[]) => names.filter(Boolean).join(" ");

type Route = { entry: string; fall: string; land?: [number, number] };
type Errors = { contact?: string; consent?: string; form?: string };

// Путь капли — в px от левого верхнего угла секции.
// Вход — продолжение линии Сцены 4: сверху по центру (x = 50%), как у прежней трассы. На
// десктопе он дугой уходит вправо и входит в верх чёрной карточки, на телефоне — влево
// к «Прайс» и встаёт там точкой.
// Падение — путь белой точки после отправки, от её места в карточке (rest). На десктопе —
// вниз, под всем содержимым дугой к центру и вниз в футер: его линия тоже по центру. Под
// карточкой путь скрыт, ниже — пунктиром, так что к футеру он цельный и без отправки. На
// телефоне карточка последняя — видна только сама точка. data-fallen на секции — по нему
// футер продолжает путь чернилами, а не пунктиром (Footer.module.css).
function buildRoute(
  section: HTMLElement,
  options: HTMLElement,
  card: HTMLElement,
  eyebrow: HTMLElement,
  rest: HTMLElement,
): Route {
  const s = section.getBoundingClientRect();
  const c = s.width / 2;
  const h = s.height;
  const r = rest.getBoundingClientRect();
  const [rx, ry] = [r.left - s.left + r.width / 2, r.top - s.top + r.height / 2];

  if (window.matchMedia(PHONE).matches) {
    const e = eyebrow.getBoundingClientRect();
    const [lx, ly] = [e.left - s.left + 6, e.top - s.top + e.height / 2];
    return {
      entry: `M${c} -4 V${ly - 40} C${c} ${ly - 8} ${lx + 22} ${ly - 24} ${lx} ${ly}`,
      fall: `M${rx} ${ry} C${rx} ${ry + 60} ${c} ${ry + 30} ${c} ${ry + 110} V${h + 8}`,
      land: [lx, ly],
    };
  }

  const k = card.getBoundingClientRect();
  const x = k.left - s.left + k.width / 2;
  const top = k.top - s.top;
  const y = Math.max(k.bottom, options.getBoundingClientRect().bottom) - s.top + 32;
  return {
    entry: `M${c} -4 V${top * 0.16} C${c} ${top * 0.6} ${x} ${top * 0.34} ${x} ${top - 22} V${top + 4}`,
    fall: `M${rx} ${ry} V${y} C${rx} ${y + 44} ${c} ${y + 12} ${c} ${y + 56} V${h + 8}`,
  };
}

// Строка, у которой каждый знак проявляется сам: сменился знак на своём месте — новый
// ключ, и только он заново проступает из размытия (CSS). Для чтения — целой строкой.
function Ink({ text }: { text: string }) {
  return (
    <>
      <span className={styles.srOnly}>{text}</span>
      <span aria-hidden="true">
        {[...text].map((ch, i) => (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: ключ — знак на своём месте
            key={`${i}${ch}`}
            className={styles.char}
            style={{ "--i": i } as CSSProperties}
          >
            {ch}
          </span>
        ))}
      </span>
    </>
  );
}

// Без типа — множитель размера: «−20 %», «база», «+40 %».
const scaleNote = (k: number) =>
  k === 1 ? "база" : `${k < 1 ? "−" : "+"}${Math.round(Math.abs(k - 1) * 100)} %`;

export function Scene5() {
  const sectionRef = useRef<HTMLElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  const eyebrowRef = useRef<HTMLParagraphElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const footRef = useRef<HTMLDivElement>(null);
  const restRef = useRef<HTMLSpanElement>(null);
  const contactRef = useRef<HTMLInputElement>(null);
  const commentRef = useRef<HTMLInputElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);
  const shownAt = useRef(0); // когда показали форму — для отсечки ботов
  const ids = useId();

  const [sel, setSel] = useState<Selection>(DEFAULT_SELECTION);
  const [route, setRoute] = useState<Route | null>(null);
  const [contact, setContact] = useState("");
  const [comment, setComment] = useState("");
  const [commentOpen, setCommentOpen] = useState(false);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "mail">("idle");
  const [copied, setCopied] = useState<"" | "ok" | "fail">("");

  const est = estimate(sel);
  const type = TYPES.find((t) => t.id === sel.type);
  const scale = SCALES.find((s) => s.id === sel.scale) ?? SCALES[1];
  const extras = ADDONS.filter((a) => !a.monthly && sel.addons.includes(a.id));
  const support = sel.addons.includes("support");
  const signed = status === "sent" || status === "mail";
  const summary = type
    ? [
        type.title,
        scale.title,
        ...extras.map((a) => a.title),
        ...(support ? ["Поддержка"] : []),
      ].join(" · ")
    : "Выберите, что строим, — цена станет точнее.";

  // Бриф из адреса (#brief=corp.m.anim,3d) — выбор восстанавливается. Мессенджеры кодируют
  // запятые (%2C) — возвращаем их. Форма видна сразу — отсчёт для отсечки ботов отсюда.
  useEffect(() => {
    shownAt.current = Date.now();
    const match = /^#brief=(.+)$/.exec(window.location.hash);
    const restored = match && decodeSelection(match[1].replace(/%2C/gi, ","));
    if (restored) setSel(restored);
  }, []);

  // Путь — от раскладки: пересчёт, когда меняются размеры секции, выбора или карточки
  // (экран, форма ↔ «отправлено», комментарий, ошибки).
  useEffect(() => {
    const [section, options, card, eyebrow, rest, foot] = [
      sectionRef.current,
      optionsRef.current,
      cardRef.current,
      eyebrowRef.current,
      restRef.current,
      footRef.current,
    ];
    if (!section || !options || !card || !eyebrow || !rest || !foot) return;
    const observer = new ResizeObserver(() => {
      const next = buildRoute(section, options, card, eyebrow, rest);
      setRoute((r) => (r && r.entry === next.entry && r.fall === next.fall ? r : next));
    });
    for (const el of [section, options, foot]) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Открыли комментарий — фокус в поле (кнопка «+ комментарий» на его месте исчезла).
  useEffect(() => {
    if (commentOpen) commentRef.current?.focus();
  }, [commentOpen]);

  const writeHash = (next: Selection) => {
    if (next.type) window.history.replaceState(null, "", `#brief=${encodeSelection(next)}`);
  };

  // Отправленный бриф поменяли — это уже другой бриф: снова форма, контакт на месте.
  const choose = (next: Selection) => {
    setSel(next);
    writeHash(next);
    if (signed) setStatus("idle");
  };

  const toggleAddon = (id: AddonId) =>
    choose({
      ...sel,
      addons: ADDONS.filter((a) => (a.id === id) !== sel.addons.includes(a.id)).map((a) => a.id),
    });

  const clearError = (key: keyof Errors) =>
    setErrors((e) => (e[key] || e.form ? { ...e, [key]: undefined, form: undefined } : e));

  const briefUrl = () =>
    `${window.location.origin}${window.location.pathname}#brief=${encodeSelection(sel)}`;

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const intent: Intent = submitter?.value === "call" ? "call" : "estimate";
    const trap = String(new FormData(e.currentTarget).get("website") ?? "");
    const value = contact.trim();
    const next: Errors = {};
    if (!value) next.contact = "Оставьте Telegram или почту — туда и ответим";
    else if (!EMAIL.test(value) && !TELEGRAM.test(value))
      next.contact = "Нужна почта (name@mail.ru) или ник в Telegram (@name)";
    if (!consent) next.consent = "Без согласия мы не сможем ответить";
    setErrors(next);
    if (next.contact) return contactRef.current?.focus();
    if (next.consent) return consentRef.current?.focus();

    setStatus("sending");
    writeHash(sel);
    try {
      const result = await submitBrief(
        {
          selection: sel,
          estimate: est,
          contact: value,
          comment: comment.trim(),
          intent,
          url: briefUrl(),
          time: new Date().toISOString(),
        },
        { trap, startedAt: shownAt.current },
      );
      setStatus(result);
    } catch {
      setStatus("idle");
      setErrors({
        form: `Не получилось отправить. Попробуйте ещё раз или напишите на ${BRIEF_CONFIG.email}`,
      });
    }
  };

  const copyLink = async () => {
    writeHash(sel);
    try {
      await navigator.clipboard.writeText(briefUrl());
      setCopied("ok");
    } catch {
      setCopied("fail");
    }
  };

  const chip = (pressed: boolean, onClick: () => void, title: string, note: string) => (
    <button
      key={title}
      type="button"
      className={styles.chip}
      aria-pressed={pressed}
      onClick={onClick}
    >
      {title}
      <span className={styles.note}>{note}</span>
    </button>
  );

  const addonChip = (a: (typeof ADDONS)[number]) =>
    chip(
      sel.addons.includes(a.id),
      () => toggleAddon(a.id),
      a.title,
      a.monthly ? "в месяц" : a.pct ? `+${a.pct} %` : `+${a.fixed} тыс.`,
    );

  return (
    <section
      ref={sectionRef}
      className={cx(styles.scene5, signed && styles.fallen)}
      data-scene="scene5"
      data-fallen={signed || undefined}
      aria-label="Прайс"
    >
      {route && (
        <svg className={styles.route} aria-hidden="true">
          <path className={styles.ghost} d={route.fall} />
          <path className={cx(styles.ink, styles.fallInk)} d={route.fall} pathLength={1} />
          <path className={styles.ink} d={route.entry} />
          {route.land && (
            <circle className={styles.land} cx={route.land[0]} cy={route.land[1]} r={6} />
          )}
        </svg>
      )}

      <div ref={optionsRef} className={styles.options}>
        <p ref={eyebrowRef} className={styles.eyebrow}>
          Прайс
        </p>
        <h2 className={styles.title}>Сколько стоит ваш проект</h2>
        <p className={styles.lead}>Отметьте всё, что нужно, — цена пересчитается на глазах.</p>

        <fieldset className={styles.group} aria-labelledby={`${ids}-type`}>
          <p id={`${ids}-type`} className={styles.legend}>
            Что строим
          </p>
          <div className={styles.cards}>
            {TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                className={styles.card}
                aria-pressed={sel.type === t.id}
                onClick={() => choose({ ...sel, type: t.id })}
              >
                <span className={styles.mark} aria-hidden="true" />
                <span className={styles.cardTitle}>{t.title}</span>
                <span className={styles.note}>{t.note}</span>
                <span className={styles.cardPrice}>
                  {formatFrom(estimate({ type: t.id, scale: "s", addons: [] }).lo)}
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className={styles.group} aria-labelledby={`${ids}-scale`}>
          <p className={styles.legend}>
            <span id={`${ids}-scale`}>Размер</span>
            <span className={styles.legendNote}>не уверены — берите средний</span>
          </p>
          <div className={styles.sizes}>
            {SCALES.map((s) =>
              chip(
                sel.scale === s.id,
                () => choose({ ...sel, scale: s.id }),
                s.title,
                type ? type.hints[s.id] : scaleNote(s.k),
              ),
            )}
          </div>
        </fieldset>

        <fieldset className={styles.group} aria-labelledby={`${ids}-addons`}>
          <p className={styles.legend}>
            <span id={`${ids}-addons`}>Дополнения</span>
            <span className={styles.legendNote}>проценты — к работам, рубли — сверху</span>
          </p>
          <div className={styles.addons}>
            {ADDONS.filter((a) => !a.monthly).map(addonChip)}
            <span className={styles.sep} aria-hidden="true" />
            {ADDONS.filter((a) => a.monthly).map(addonChip)}
          </div>
        </fieldset>
      </div>

      {/* Карточка: на десктопе — колонка справа; на телефоне её части встают в общий столбец
          (display: contents) — цена полосой внизу экрана, форма — в конце сцены. */}
      <div ref={cardRef} className={styles.panel}>
        <div className={styles.head}>
          <p className={styles.label}>Ориентир</p>
          <p className={styles.priceValue} aria-live="polite">
            <Ink text={est.price} />
          </p>
          <p className={styles.priceTerm} aria-live="polite">
            <Ink text={est.term} />
          </p>
        </div>

        <div ref={footRef} className={styles.foot}>
          <p className={styles.summary}>
            <span ref={restRef} className={styles.rest} aria-hidden="true" />
            {summary}
          </p>

          {signed ? (
            <div className={styles.done} role="status">
              <p className={styles.doneTitle}>
                {status === "sent" ? "Бриф отправлен." : "Письмо с брифом готово."}
              </p>
              <p className={styles.doneText}>
                {status === "sent"
                  ? `Ответим ${BRIEF_CONFIG.replyIn}.`
                  : `Отправьте его из почты — ответим ${BRIEF_CONFIG.replyIn}.`}{" "}
                {BRIEF_CONFIG.promise}.
              </p>
              <button type="button" className={styles.more} onClick={copyLink}>
                {copied === "ok" ? "Ссылка скопирована" : "Скопировать ссылку на бриф"}
              </button>
              {copied === "fail" && (
                <p className={styles.fine}>Не вышло — ссылка уже в адресной строке.</p>
              )}
            </div>
          ) : (
            <form className={styles.form} noValidate onSubmit={submit}>
              <div className={styles.field}>
                <label htmlFor={`${ids}-contact`}>Telegram или почта</label>
                <input
                  ref={contactRef}
                  id={`${ids}-contact`}
                  className={styles.input}
                  name="contact"
                  value={contact}
                  onChange={(e) => {
                    setContact(e.target.value);
                    clearError("contact");
                  }}
                  placeholder="@name или name@mail.ru"
                  autoComplete="email"
                  required
                  aria-invalid={Boolean(errors.contact)}
                  aria-describedby={errors.contact ? `${ids}-contact-error` : undefined}
                />
                {errors.contact && (
                  <p id={`${ids}-contact-error`} className={styles.error}>
                    {errors.contact}
                  </p>
                )}
              </div>
              {commentOpen ? (
                <div className={styles.field}>
                  <label htmlFor={`${ids}-comment`}>
                    Комментарий <span className={styles.note}>— по желанию</span>
                  </label>
                  <input
                    ref={commentRef}
                    id={`${ids}-comment`}
                    className={styles.input}
                    name="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Пара слов о задаче или сроках"
                    autoComplete="off"
                  />
                </div>
              ) : (
                <button type="button" className={styles.more} onClick={() => setCommentOpen(true)}>
                  + комментарий
                </button>
              )}
              {/* Ловушка для ботов: людям не видна и недоступна с клавиатуры. */}
              <input
                className={styles.trap}
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />
              <div>
                <div className={styles.consent}>
                  <input
                    ref={consentRef}
                    id={`${ids}-consent`}
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
                  <label htmlFor={`${ids}-consent`}>
                    Согласен на{" "}
                    <Link href="/consent" target="_blank">
                      обработку персональных данных
                    </Link>
                  </label>
                </div>
                {errors.consent && (
                  <p id={`${ids}-consent-error`} className={styles.error}>
                    {errors.consent}
                  </p>
                )}
                <p className={styles.policy}>
                  <Link href="/privacy" target="_blank">
                    Политика конфиденциальности
                  </Link>
                </p>
              </div>
              <div className={styles.actions}>
                <button
                  type="submit"
                  name="intent"
                  value="estimate"
                  className={styles.primary}
                  disabled={status === "sending"}
                >
                  Получить детальную смету
                </button>
                <button
                  type="submit"
                  name="intent"
                  value="call"
                  className={styles.more}
                  disabled={status === "sending"}
                >
                  или 15 минут созвона
                </button>
              </div>
              {errors.form && (
                <p className={styles.error} role="alert">
                  {errors.form}
                </p>
              )}
            </form>
          )}
        </div>
      </div>

      {/* Точка-герой: белая в карточке, чёрная на белом (difference). Едет по пути падения. */}
      {route && (
        <span
          className={styles.dot}
          style={{ offsetPath: `path('${route.fall}')` }}
          aria-hidden="true"
        />
      )}
    </section>
  );
}
