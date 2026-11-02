"use client";

import { type CSSProperties, type MouseEvent, type ReactNode, useEffect, useRef } from "react";
import { Duo } from "@/components/case/memoridian/Duo";
import { Fine } from "@/components/scenes/Footer/Fine";
import { ART } from "@/components/scenes/Scene2";
import { BRIEF, TILES } from "@/components/scenes/Scene5";
import { Envelope } from "@/components/ui/Envelope";
import base from "@/components/works/Works.module.css";
import { WORKS } from "@/components/works/works.data";
import { type BriefState, clearBrief, getBrief, setBrief, useBrief } from "@/lib/brief";
import { caseHref, goPage, HOME_HREF, openCase, pageHref } from "@/lib/caseRoute";
import { formatPhone } from "@/lib/phone";
import { formatFrom } from "@/lib/pricing";
import { riseIn } from "@/lib/scroll/rise";
import { priceRow, priceTerm, SERVICES, serviceBySlug } from "@/lib/services";
import styles from "./Service.module.css";

// Страница услуги (docs/14-service-page.md): слой над главной, как «Наши работы», шапка, ось и карточки —
// из Works.module.css. Слева закреплены название, цена и срок, справа письмо, примеры работ и раскрывающиеся
// блоки. Весь текст — в разметке, блоки — обычные details. Содержимое — запись в lib/services.ts, рисунок и
// заявка — те же, что у клетки прайса.

// Кейс открывается поверх страницы: группа летит из карточки на первый экран, как в списке работ (CaseLayer).
const toCase = (slug: string) => (e: MouseEvent<HTMLAnchorElement>) =>
  openCase(e, {
    slug,
    card: e.currentTarget.closest("article")?.querySelector<HTMLElement>("[data-case]") ?? null,
    caption: null,
  });

// Что подставила услуга: это посетитель не выбирал, следующая услуга может заменить.
const briefKey = (b: Pick<BriefState, "need" | "detail" | "other">) =>
  `${b.need}|${b.detail}|${b.other}`;
let preset = "";

function Acc(p: {
  as: "h2" | "h3";
  title: string;
  value?: string;
  open?: boolean;
  children: ReactNode;
}) {
  return (
    <details className={styles.acc} open={p.open}>
      <summary className={styles.sum}>
        <p.as>{p.title}</p.as>
        {p.value && <span className={styles.v}>{p.value}</span>}
        <i />
      </summary>
      {p.children}
    </details>
  );
}

// Строка под ценой: подводка, после отправки — что с заявкой. Без сроков и обещаний.
function Said() {
  const { status, phone } = useBrief();
  if (status === "sent")
    return (
      <>
        <p>
          <strong>Заявка отправлена.</strong> Перезвоним на{" "}
          <span className={styles.nw}>{formatPhone(phone)}</span>.
        </p>
        <button type="button" className={styles.again} onClick={() => clearBrief()}>
          отправить ещё одну
        </button>
      </>
    );
  if (status === "mail")
    return (
      <>
        <p>
          <strong>Осталось отправить.</strong> Письмо открыто в вашей почте.
        </p>
        <button type="button" className={styles.again} onClick={() => setBrief({ status: "idle" })}>
          вернуться к форме
        </button>
      </>
    );
  return <p>Оставьте телефон, обсудим задачу.</p>;
}

export function Service({ slug }: { slug: string }) {
  const pageRef = useRef<HTMLDivElement>(null);
  const s = serviceBySlug(slug);

  useEffect(() => (pageRef.current ? riseIn(pageRef.current) : undefined), []);

  // В заявке уже выбрана эта услуга, как после клетки прайса; выбор посетителя не трогаем.
  useEffect(() => {
    const b = getBrief();
    if (!s || b.status !== "idle" || (b.need && briefKey(b) !== preset)) return;
    setBrief({ detail: "", other: "", ...BRIEF[s.type] });
    preset = briefKey(getBrief());
  }, [s]);

  if (!s) return null;
  const row = priceRow(s.type);
  const price = formatFrom(row.from);
  const tile = TILES[s.type];

  // «Обсудить проект»: к письму, курсор в поле «телефон». Окна заявки тут нет: в нём свои обещания.
  const discuss = () => {
    const input = pageRef.current?.querySelector<HTMLInputElement>('input[name="phone"]');
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    input?.scrollIntoView({ block: "center", behavior: calm ? "auto" : "smooth" });
    input?.focus({ preventScroll: true });
  };

  return (
    <div ref={pageRef} className={`${base.page} ${styles.page}`}>
      <a className={base.logo} href={HOME_HREF} onClick={(e) => goPage(e, null)}>
        White Inks.
      </a>
      <button type="button" className={base.cta} onClick={discuss}>
        Обсудить проект
      </button>
      {/* biome-ignore lint/a11y/useAnchorContent: крестик нарисован в CSS, подпись в aria-label */}
      <a
        className={base.close}
        href={HOME_HREF}
        onClick={(e) => goPage(e, null)}
        aria-label="На главную"
      />
      <div className={base.ink} />
      <div className={base.dot} />

      <main className={base.content}>
        <div className={base.ghost} />

        <div className={styles.grid}>
          <div className={styles.left}>
            <a className={base.back} href={HOME_HREF} onClick={(e) => goPage(e, null)}>
              ← на главную
            </a>
            <h1 className={`${base.title} ${styles.title}`}>{s.h1}</h1>
            <p className={styles.lead}>{s.lead}</p>
            <div className={styles.pr}>
              <p className={styles.price}>{price}</p>
              <p className={styles.term}>{priceTerm(s.type)}</p>
            </div>
            <div className={styles.said} role="status">
              <Said />
            </div>
          </div>

          <div className={styles.right}>
            <div className={styles.ask}>
              <h2 className={styles.sr}>Обсудить проект</h2>
              <Envelope showDetail />
            </div>

            {s.cases && (
              <section className={styles.sec} data-rise>
                <h2 className={styles.h2}>Примеры работ</h2>
                <p className={`${base.kind} ${styles.casesNote}`}>
                  {s.casesNote} ·{" "}
                  <a
                    className={base.more}
                    href={pageHref("works")}
                    rel="nofollow"
                    onClick={(e) => goPage(e, "works")}
                  >
                    Все работы <span>→</span>
                  </a>
                </p>
                <div className={styles.cases}>
                  {s.cases.map(({ slug: id, text }) => {
                    const w = WORKS.find((c) => c.slug === id);
                    if (!w) return null;
                    return (
                      <article key={id} className={styles.case}>
                        {/* nofollow — роботам страницы кейсов не показываем (docs/12-case-page.md). */}
                        <a
                          className={base.card}
                          href={caseHref(id)}
                          rel="nofollow"
                          aria-label={`Кейс: ${w.title}`}
                          data-case={id}
                          onClick={toCase(id)}
                        >
                          <div className={base.pv}>
                            <i
                              className={`${base.field} no-invert`}
                              style={{ background: w.color }}
                            />
                            <Duo slug={id} className={base.duo} lazy />
                          </div>
                        </a>
                        <h3>{w.title}</h3>
                        <p className={base.kind}>{w.kind}</p>
                        <p className={base.text}>{text}</p>
                        <a
                          className={base.more}
                          href={caseHref(id)}
                          rel="nofollow"
                          onClick={toCase(id)}
                        >
                          Смотреть кейс <span>→</span>
                        </a>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

            <section className={`${styles.sec} ${styles.list}`} data-rise>
              <Acc as="h2" title="Что входит" open>
                <div className={`${styles.body} ${styles.incBody}`}>
                  <div
                    className={styles.art}
                    style={
                      { "--w": tile.box[0], "--h": tile.box[1], color: tile.color } as CSSProperties
                    }
                    aria-hidden="true"
                  >
                    {tile.art.map(({ from: [i, j], at: [x, y], turn }) => (
                      <span
                        key={`${i}-${j}-${x}`}
                        style={{
                          left: `${x / 10}em`,
                          top: `${y / 10}em`,
                          rotate: turn ? `${turn}deg` : undefined,
                        }}
                      >
                        {ART[i][j].el}
                      </span>
                    ))}
                  </div>
                  <div>
                    <ul className={styles.inc}>
                      {s.includes.map((n) => (
                        <li key={n.title}>
                          <h3 className={styles.h3}>{n.title}</h3>
                          <p className={styles.note}>{n.text}</p>
                        </li>
                      ))}
                    </ul>
                    {s.extra && <p className={`${styles.note} ${styles.extra}`}>{s.extra}</p>}
                    <p className={styles.legal}>
                      Цена и{" "}срок{" "}— ориентир. Объём и{" "}условия обсудим и{" "}закрепим в
                      {" "}договоре.
                    </p>
                  </div>
                </div>
              </Acc>
              <Acc as="h2" title="Как идёт работа">
                <div className={styles.body}>
                  <ol className={styles.rows}>
                    {s.steps.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ol>
                </div>
              </Acc>
            </section>

            <section className={styles.sec} data-rise>
              <h2 className={`${styles.h2} ${styles.faq}`}>Частые вопросы</h2>
              <div className={styles.list}>
                {s.questions.map(({ q, a }) => (
                  <Acc key={q} as="h3" title={q}>
                    <div className={`${styles.body} ${styles.answer}`}>{a}</div>
                  </Acc>
                ))}
              </div>
            </section>

            {/* Тихий ряд: с любой услуги можно перейти на другую. */}
            <nav className={styles.others} aria-label="Другие услуги">
              <p>Другие услуги</p>
              <ul>
                {SERVICES.filter((o) => o !== s).map((o) => (
                  <li key={o.slug}>
                    <a
                      href={pageHref(`services/${o.slug}`)}
                      rel="nofollow"
                      onClick={(e) => goPage(e, `services/${o.slug}`)}
                    >
                      {o.name}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
        <Fine className={styles.fine} />
      </main>
    </div>
  );
}
