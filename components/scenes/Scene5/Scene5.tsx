"use client";

import Link from "next/link";
import {
  type CSSProperties,
  type FormEvent,
  type ReactNode,
  type TransitionEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { useLenis } from "@/app/providers";
import { CARDS_CONTENT } from "@/components/scenes/Scene3/cardsData";
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
  type TypeId,
} from "@/lib/pricing";
import styles from "./Scene5.module.css";

const STEPS = [
  { label: "Тип", title: "Что строим?", lead: "Выберите основу — цена посчитается сразу." },
  { label: "Размер", title: "Какого размера?", lead: "Объём работы: страницы, товары, экраны." },
  {
    label: "Дополнения",
    title: "Что добавить?",
    lead: "Проценты — к стоимости работ, рубли — сверху.",
  },
  {
    label: "Бриф",
    title: "Ваш бриф",
    lead: "Проверьте и оставьте контакт — пришлём детальную смету.",
  },
];
const LAST = STEPS.length - 1;

// Похожие кейсы для брифа — из кейсов Сцены 3, по тегам в порядке близости к типу.
const SIMILAR: Record<TypeId, string[]> = {
  landing: ["Web", "Branding"],
  builder: ["Web", "Branding"],
  corp: ["Web", "Branding"],
  shop: ["Platform", "Web"],
  unique: ["Platform", "Mobile"],
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TELEGRAM = /^(@|(https?:\/\/)?t\.me\/)[a-z0-9_]{5,32}\/?$/i;

const cx = (...names: (string | false)[]) => names.filter(Boolean).join(" ");

// Трасса — в px от левого верхнего угла секции. Входит сверху по центру вертикально (это
// продолжение линии взлёта Сцены 4, x = 50vw), дугой уходит влево, заворачивает в узел 1
// и мягкой волной идёт через узлы 2–4 по ширине контента.
// Телефон и телефон боком (short — экран до 500px): сверху полоса шапки 72px, поэтому ввод
// идёт под ней, а дуга, узлы и метки — сразу ниже; так выглядит и кадр после CTA Hero,
// который приводит ровно к верху секции. На телефоне трасса короче (Scene5.module.css).
// Части: вход до узла 1 и три отрезка волны — по ним меряем доли длины до узлов.
function buildTrack(w: number, short: boolean) {
  const mobile = w < 768;
  const pad = mobile ? 26 : 38;
  const ys = mobile ? [108, 114, 104, 110] : [136, 156, 128, 148];
  const nodes = ys.map((y, i): [number, number] => [pad + (i * (w - 2 * pad)) / 3, y]);
  const c = w / 2;
  const [x1, y1] = nodes[0];
  const r = mobile ? 12 : 22; // радиус заворота в узел 1
  // Вертикальный ввод от верхнего края и изгиб дуги: насколько она идёт вниз от ввода
  // и насколько поднимается над заворотом.
  const [lead, bend, rise] = mobile ? [60, 24, 16] : short ? [64, 50, 30] : [20, 100, 70];
  const parts = [
    `M${c} -4 L${c} ${lead} C${c} ${lead + bend} ${x1 - r} ${y1 - r - rise} ${x1 - r} ${y1 - r} C${x1 - r} ${y1 - r * 0.45} ${x1 - r * 0.45} ${y1} ${x1} ${y1}`,
    ...nodes.slice(1).map(([x, y], i) => {
      const [px, py] = nodes[i];
      const dx = (x - px) / 2;
      return `C${px + dx} ${py} ${x - dx} ${y} ${x} ${y}`;
    }),
  ];
  return { parts, nodes };
}

type Track = { d: string; nodes: [number, number][]; stops: number[] };
type Errors = { contact?: string; consent?: string; form?: string };

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

export function Scene5() {
  const lenis = useLenis();
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const headings = useRef<(HTMLHeadingElement | null)[]>([]);
  const contactRef = useRef<HTMLInputElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);
  const shownAt = useRef(0); // когда показали форму — для отсечки ботов
  const navigated = useRef(false);
  const ids = useId();

  const [sel, setSel] = useState<Selection>(DEFAULT_SELECTION);
  const [step, setStep] = useState(0);
  const [track, setTrack] = useState<Track | null>(null);
  const [contact, setContact] = useState("");
  const [comment, setComment] = useState("");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "mail">("idle");
  const [copied, setCopied] = useState<"" | "ok" | "fail">("");
  const [today, setToday] = useState("");

  const est = estimate(sel);
  const type = TYPES.find((t) => t.id === sel.type) ?? TYPES[0];
  const scale = SCALES.find((s) => s.id === sel.scale) ?? SCALES[1];
  const extras = ADDONS.filter((a) => !a.monthly && sel.addons.includes(a.id));
  const support = sel.addons.includes("support");
  const similar = SIMILAR[sel.type].flatMap(
    (tag) => CARDS_CONTENT.find((c) => c.tag === tag) ?? [],
  );
  const signed = status === "sent" || status === "mail";

  // Бриф из адреса (#brief=corp.m.anim,3d) — сразу на его лист. Мессенджеры кодируют
  // запятые (%2C) — возвращаем их.
  useEffect(() => {
    const match = /^#brief=(.+)$/.exec(window.location.hash);
    const restored = match && decodeSelection(match[1].replace(/%2C/gi, ","));
    if (restored) {
      setSel(restored);
      setStep(LAST);
      shownAt.current = Date.now();
    }
    setToday(
      new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" }),
    );
  }, []);

  // Трасса от ширины секции; доли длины до узлов меряет сам браузер — по ним же он рисует
  // штрих (pathLength) и ведёт точку (offset-distance), так что оба встают ровно в узел.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const update = () => {
      const { parts, nodes } = buildTrack(svg.clientWidth, window.innerHeight <= 500);
      const probe = document.createElementNS("http://www.w3.org/2000/svg", "path");
      svg.appendChild(probe);
      const lengths = parts.map((_, i) => {
        probe.setAttribute("d", parts.slice(0, i + 1).join(" "));
        return probe.getTotalLength();
      });
      probe.remove();
      const total = lengths[lengths.length - 1];
      setTrack({ d: parts.join(" "), nodes, stops: lengths.map((l) => l / total) });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // После перехода — фокус на заголовок шага (клавиатура и скринридер не теряются).
  useEffect(() => {
    if (navigated.current) headings.current[step]?.focus({ preventScroll: true });
  }, [step]);

  const writeHash = (next: Selection) =>
    window.history.replaceState(null, "", `#brief=${encodeSelection(next)}`);

  // Подписанный бриф поменяли — это уже другой бриф: снова форма, контакт на месте.
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

  const goTo = (next: number) => {
    navigated.current = true;
    if (next === LAST && !shownAt.current) shownAt.current = Date.now();
    setStep(next);
    // Шаг начинается выше экрана или под шапкой телефона (её высота — scroll-margin-top
    // у .stage) — возвращаем к трассе: заголовок и первый ряд сразу на виду.
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;
    const header = Number.parseFloat(getComputedStyle(stage).scrollMarginTop) || 0;
    if (stage.getBoundingClientRect().top >= header) return;
    if (lenis) lenis.scrollTo(section);
    else section.scrollIntoView({ block: "start" });
  };

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

  const restart = () => {
    setSel(DEFAULT_SELECTION);
    setContact("");
    setComment("");
    setConsent(false);
    setErrors({});
    setStatus("idle");
    setCopied("");
    shownAt.current = 0;
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    goTo(0);
  };

  // Точка приехала в узел — мягко сплющивается, как капля (направление — вдоль волны).
  const squash = (e: TransitionEvent<HTMLSpanElement>) => {
    if (e.propertyName !== "offset-distance") return;
    e.currentTarget.animate(
      [{ scale: "1" }, { scale: "0.72 1.28" }, { scale: "1.1 0.92" }, { scale: "1" }],
      { duration: 520, easing: "cubic-bezier(0.3, 0.7, 0.4, 1)" },
    );
  };

  // Шаг — функция разметки, а не компонент: DOM шагов живёт между рендерами (переходы, фокус).
  const stepPanel = (index: number, children: ReactNode) => (
    <div
      className={cx(styles.step, index === step && styles.stepOn, index < step && styles.stepPast)}
      inert={index !== step}
    >
      <p className={styles.eyebrow}>
        Шаг {index + 1} из {STEPS.length}
      </p>
      <h2
        ref={(el) => {
          headings.current[index] = el;
        }}
        className={styles.title}
        tabIndex={-1}
      >
        {STEPS[index].title}
      </h2>
      <p className={styles.lead}>{STEPS[index].lead}</p>
      {children}
      <div className={styles.nav}>
        {index < LAST && (
          <button type="button" className={styles.primary} onClick={() => goTo(index + 1)}>
            {index === LAST - 1 ? "К брифу" : "Дальше"}
            <span className={styles.arrow} aria-hidden="true">
              →
            </span>
          </button>
        )}
        {index > 0 && (
          <button type="button" className={styles.back} onClick={() => goTo(index - 1)}>
            <span className={styles.arrow} aria-hidden="true">
              ←
            </span>
            Назад
          </button>
        )}
      </div>
    </div>
  );

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

  return (
    <section
      ref={sectionRef}
      className={styles.scene5}
      data-scene="scene5"
      aria-label="Тропа проекта"
    >
      <div className={styles.track}>
        <svg ref={svgRef} className={styles.trackSvg} aria-hidden="true">
          {track && (
            <>
              <path className={styles.ghost} d={track.d} />
              <path
                className={styles.ink}
                d={track.d}
                pathLength={1}
                style={{ strokeDashoffset: 1 - track.stops[step] }}
              />
              {track.nodes.map(([x, y], i) => (
                <circle
                  key={STEPS[i].label}
                  className={cx(styles.node, i <= step && styles.nodeOn)}
                  cx={x}
                  cy={y}
                  r={5}
                />
              ))}
            </>
          )}
        </svg>
        {track && (
          <>
            <span
              className={styles.dot}
              style={{
                offsetPath: `path('${track.d}')`,
                offsetDistance: `${track.stops[step] * 100}%`,
              }}
              onTransitionEnd={squash}
              aria-hidden="true"
            />
            <ol className={styles.labels}>
              {STEPS.map((s, i) => (
                <li key={s.label} style={{ left: track.nodes[i][0], top: track.nodes[i][1] + 16 }}>
                  <button
                    type="button"
                    className={styles.label}
                    aria-current={i === step ? "step" : undefined}
                    onClick={() => goTo(i)}
                  >
                    <span className={styles.labelNum}>0{i + 1}</span> {s.label}
                  </button>
                </li>
              ))}
            </ol>
          </>
        )}
      </div>

      <div className={styles.body}>
        <div ref={stageRef} className={styles.stage}>
          {stepPanel(
            0,
            <fieldset className={styles.cards} aria-label="Тип проекта">
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
            </fieldset>,
          )}

          {stepPanel(
            1,
            <>
              <fieldset className={styles.chips} aria-label="Размер">
                {SCALES.map((s) =>
                  chip(
                    sel.scale === s.id,
                    () => choose({ ...sel, scale: s.id }),
                    s.title,
                    type.hints[s.id],
                  ),
                )}
              </fieldset>
              <p className={styles.hint}>Не уверены — берите средний, уточним на созвоне.</p>
            </>,
          )}

          {stepPanel(
            2,
            <>
              <fieldset className={styles.chips} aria-label="Дополнения">
                {ADDONS.filter((a) => !a.monthly).map((a) =>
                  chip(
                    sel.addons.includes(a.id),
                    () => toggleAddon(a.id),
                    a.title,
                    a.pct ? `+${a.pct}%` : `+${a.fixed} тыс.`,
                  ),
                )}
              </fieldset>
              <p className={styles.group}>После запуска — отдельно от ориентира</p>
              <fieldset className={styles.chips} aria-label="После запуска">
                {ADDONS.filter((a) => a.monthly).map((a) =>
                  chip(sel.addons.includes(a.id), () => toggleAddon(a.id), a.title, "в месяц"),
                )}
              </fieldset>
            </>,
          )}

          {stepPanel(
            3,
            <div className={styles.brief}>
              <article
                className={cx(styles.sheet, signed && styles.signed)}
                aria-label="Лист брифа"
              >
                <header className={styles.sheetHead}>
                  <span>Бриф · White Inks</span>
                  <span>{today}</span>
                </header>
                <dl className={styles.rows}>
                  <div>
                    <dt>Что строим</dt>
                    <dd>{type.title}</dd>
                  </div>
                  <div>
                    <dt>Размер</dt>
                    <dd>
                      {scale.title}, {type.hints[sel.scale]}
                    </dd>
                  </div>
                  <div>
                    <dt>Дополнения</dt>
                    <dd>
                      {extras.length ? extras.map((a) => a.title).join(", ") : "без дополнений"}
                    </dd>
                  </div>
                  {support && (
                    <div>
                      <dt>Поддержка</dt>
                      <dd>нужна, помесячно</dd>
                    </div>
                  )}
                  <div>
                    <dt>Похожие кейсы</dt>
                    <dd>{similar.map((c) => c.title).join(", ")}</dd>
                  </div>
                </dl>
                <p className={styles.sheetTotal}>
                  <span>{est.price}</span>
                  <span>{est.term}</span>
                </p>
                <p className={styles.sheetNote}>
                  Это ориентир, точную смету пришлём после разговора.
                </p>
                <footer className={styles.sign}>
                  <span>Подпись</span>
                  <svg
                    className={styles.flourish}
                    viewBox="0 0 240 64"
                    preserveAspectRatio="xMinYMid meet"
                    aria-hidden="true"
                  >
                    <path
                      pathLength={1}
                      d="M6 46C24 42 36 14 50 16C64 18 44 52 58 50C72 48 82 22 96 26C108 30 98 50 112 46C128 42 138 30 156 32C174 34 168 50 186 44C202 38 214 30 234 26"
                    />
                  </svg>
                  <span className={styles.stamp}>Подписан</span>
                </footer>
              </article>

              {signed ? (
                <div className={styles.done} role="status">
                  <p className={styles.doneTitle}>
                    {status === "sent" ? "Бриф отправлен." : "Письмо с брифом готово."}
                  </p>
                  <p className={styles.doneText}>
                    {status === "sent"
                      ? `Ответим ${BRIEF_CONFIG.replyIn}.`
                      : `Отправьте его из почты — ответим ${BRIEF_CONFIG.replyIn}.`}
                  </p>
                  <div className={styles.actions}>
                    <button type="button" className={styles.primary} onClick={copyLink}>
                      {copied === "ok" ? "Ссылка скопирована" : "Скопировать ссылку на бриф"}
                    </button>
                    <button type="button" className={styles.secondary} onClick={restart}>
                      Начать заново
                    </button>
                  </div>
                  {copied === "fail" && (
                    <p className={styles.hint}>Не вышло — ссылка уже в адресной строке.</p>
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
                  <div className={styles.field}>
                    <label htmlFor={`${ids}-comment`}>
                      Комментарий <span className={styles.note}>— по желанию</span>
                    </label>
                    <input
                      id={`${ids}-comment`}
                      className={styles.input}
                      name="comment"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Пара слов о задаче или сроках"
                      autoComplete="off"
                    />
                  </div>
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
                      className={styles.secondary}
                      disabled={status === "sending"}
                    >
                      15 минут созвона
                    </button>
                  </div>
                  {errors.form && (
                    <p className={styles.error} role="alert">
                      {errors.form}
                    </p>
                  )}
                  <div className={styles.reply}>
                    <span className={styles.avatar} aria-hidden="true" />
                    <p>
                      Ответит {BRIEF_CONFIG.person} · обычно {BRIEF_CONFIG.replyIn} ·{" "}
                      {BRIEF_CONFIG.nda}
                    </p>
                  </div>
                  <p className={styles.promise}>{BRIEF_CONFIG.promise}</p>
                </form>
              )}
            </div>,
          )}
        </div>

        <aside className={styles.price} aria-label="Ориентир по цене">
          <p className={styles.priceLabel}>Ориентир</p>
          <p className={styles.priceValue} aria-live="polite">
            <Ink text={est.price} />
          </p>
          <p className={styles.priceTerm} aria-live="polite">
            <Ink text={est.term} />
          </p>
          <p className={styles.priceSummary}>
            {[type.title, scale.title, ...extras.map((a) => a.title)].join(" · ")}
            {support && " · Поддержка"}
          </p>
          <p className={styles.priceNote}>Это ориентир, точную смету пришлём после разговора.</p>
        </aside>
      </div>
    </section>
  );
}
