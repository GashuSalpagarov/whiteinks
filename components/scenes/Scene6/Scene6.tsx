"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { BRIEF_CONFIG, BRIEF_SUBJECT, type Intent, submitBrief } from "@/lib/brief";
import styles from "./Scene6.module.css";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TELEGRAM = /^(@|(https?:\/\/)?t\.me\/)[a-z0-9_]{5,32}\/?$/i;

type Errors = { contact?: string; consent?: string; form?: string };

// Сцена 6 — письмо-заявка: окно письма на сиреневой подложке. Посетитель пишет своими
// словами, что нужно (необязательно), и оставляет Telegram или почту. Отправили — окно
// складывается в конверт с маркой, точка из шапки окна падает сквозь острие клапана вниз, в
// футер: data-fallen — по нему футер дорисовывает свою линию чернилами (Footer.module.css).
export function Scene6() {
  const sectionRef = useRef<HTMLElement>(null);
  const dropRef = useRef<HTMLSpanElement>(null);
  const contactRef = useRef<HTMLInputElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);
  const shownAt = useRef(0); // когда показали форму — для отсечки ботов
  const ids = useId();

  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "mail">("idle");
  const signed = status === "sent" || status === "mail";

  useEffect(() => {
    shownAt.current = Date.now();
  }, []);

  // Конверт на месте окна — один замер: сколько точке падать до низа сцены (--fall, px).
  // Ставим до отрисовки кадра — переход падения стартует вместе с классом .fallen.
  useLayoutEffect(() => {
    const section = sectionRef.current;
    const drop = dropRef.current;
    if (!signed || !section || !drop) return;
    const fall = section.getBoundingClientRect().bottom - drop.getBoundingClientRect().top;
    section.style.setProperty("--fall", `${Math.round(fall)}px`);
  }, [signed]);

  const clearError = (key: keyof Errors) =>
    setErrors((e) => (e[key] || e.form ? { ...e, [key]: undefined, form: undefined } : e));

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
    try {
      const result = await submitBrief(
        { message: message.trim(), contact: value, intent, time: new Date().toISOString() },
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

  return (
    <section
      ref={sectionRef}
      className={`${styles.scene6} ${signed ? styles.fallen : ""}`}
      data-scene="scene6"
      data-fallen={signed || undefined}
      aria-label="Заявка"
    >
      <div className={styles.head}>
        {signed ? (
          <>
            <div>
              <p className={styles.eyebrow}>Заявка</p>
              <h2 className={styles.title}>
                {status === "sent" ? "Письмо ушло" : "Письмо готово"}
                <span className={styles.stampx}>отправлено</span>
              </h2>
            </div>
            <div className={styles.lead} role="status">
              <p>
                {status === "sent"
                  ? `Ответим ${BRIEF_CONFIG.replyIn}.`
                  : `Отправьте его из почты — ответим ${BRIEF_CONFIG.replyIn}.`}{" "}
                {BRIEF_CONFIG.promise}.
              </p>
              <button type="button" className={styles.link} onClick={() => setStatus("idle")}>
                Написать ещё
              </button>
            </div>
          </>
        ) : (
          <>
            <div>
              <p className={styles.eyebrow}>Заявка</p>
              <h2 className={styles.title}>Напишите, что нужно</h2>
            </div>
            <p className={styles.lead}>
              Своими словами — сайт, магазин, бот, сроки. Ответим {BRIEF_CONFIG.replyIn}.
            </p>
          </>
        )}
      </div>

      <div className={styles.letter}>
        <div className={styles.plate}>
          {/* Сиреневый слой — отдельно: на втором круге он в своём цвете, а окно — в общем. */}
          <span className={`${styles.tint} no-invert`} aria-hidden="true" />
          <form className={styles.win} noValidate onSubmit={submit} inert={signed}>
            <div className={styles.bar}>
              <span className={styles.dots} aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <span>новое письмо</span>
            </div>
            <p className={styles.row}>
              <span className={styles.key}>кому</span>White Inks
            </p>
            <p className={styles.row}>
              <span className={styles.key}>тема</span>
              <b>{BRIEF_SUBJECT}</b>
            </p>
            <div className={styles.body}>
              <p>Здравствуйте!</p>
              <textarea
                id={`${ids}-message`}
                className={styles.message}
                name="message"
                rows={2}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Расскажите своими словами, что нужно: сайт, магазин, бот — и к какому сроку."
                aria-label="Что нужно — по желанию"
              />
              <p className={styles.sign}>
                <label htmlFor={`${ids}-contact`}>Мой контакт:</label>{" "}
                <input
                  ref={contactRef}
                  id={`${ids}-contact`}
                  className={styles.contact}
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
              </p>
              {errors.contact && (
                <p id={`${ids}-contact-error`} className={styles.error}>
                  {errors.contact}
                </p>
              )}
            </div>
            {/* Ловушка для ботов: людям не видна и недоступна с клавиатуры. */}
            <input
              className={styles.trap}
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />
            <div className={styles.foot}>
              <div className={styles.consentBox}>
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
              </div>
              <button
                type="submit"
                name="intent"
                value="call"
                className={styles.link}
                disabled={status === "sending"}
              >
                или 15 минут созвона
              </button>
              <button
                type="submit"
                name="intent"
                value="estimate"
                className={styles.send}
                disabled={status === "sending"}
              >
                Отправить письмо
              </button>
            </div>
            {errors.form && (
              <p className={`${styles.error} ${styles.formError}`} role="alert">
                {errors.form}
              </p>
            )}
          </form>

          {/* Конверт: клапан, марка с кругом пути и гашение, адрес. */}
          <div className={styles.env} aria-hidden="true">
            <svg
              className={styles.flap}
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <polyline points="0,0 50,56 100,0" vectorEffect="non-scaling-stroke" />
            </svg>
            <span className={styles.postmark}>white inks</span>
            <span className={styles.stamp} />
            <p className={styles.address}>
              <b>White Inks</b>
              <br />
              {BRIEF_SUBJECT}
              <br />
              <span>от {contact.trim()}</span>
            </p>
          </div>
        </div>

        {/* Путь вниз, к футеру: пунктир, после отправки — чернила вслед за точкой. */}
        <span className={styles.ghost} aria-hidden="true" />
        <span className={styles.tail} aria-hidden="true" />
        <span ref={dropRef} className={styles.drop} aria-hidden="true" />
      </div>
    </section>
  );
}
