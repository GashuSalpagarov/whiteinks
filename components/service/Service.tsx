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
// из Works.module.css. Слева закреплены название, цена и срок, справа рисунок и описание услуги, «что входит»,
// примеры работ, этапы, раскрывающиеся вопросы и в конце письмо. Весь текст — в разметке, вопросы — обычные
// details. Содержимое — запись в lib/services.ts, рисунки «что входит» и этапов и заявка — те же, что у клетки
// прайса; большой рисунок наверху — public/assets/services/<slug>.svg.

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

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

function Acc(p: { title: string; value?: string; children: ReactNode }) {
  return (
    <details className={styles.acc}>
      <summary className={styles.sum}>
        <h3>{p.title}</h3>
        {p.value && <span className={styles.v}>{p.value}</span>}
        <i />
      </summary>
      {p.children}
    </details>
  );
}

// Рисунок этапов: лента пути — пастель клетки прайса, по ней линия 1.5 px и точки 12 px, по точке на этап, как
// ось и точка страницы; последняя точка чёрная. Коробка та же, что у рисунка «Что входит» (.art: 9 px на 10 единиц).
const K = "#0a0a0a";
function Trail({ n, box, color }: { n: number; box: [number, number]; color: string }) {
  const w = box[0] * 0.9;
  const h = box[1] * 0.9;
  const x = (i: number) => 6 + (i * (w - 12)) / (n - 1);
  const y = (i: number) => 6 + (i * (h - 12)) / (n - 1);
  let d = `M${x(0)} ${y(0)}`;
  for (let i = 1; i < n; i++) {
    const m = (x(i - 1) + x(i)) / 2;
    d += `C${m} ${y(i - 1)} ${m} ${y(i)} ${x(i)} ${y(i)}`;
  }
  return (
    <svg className="no-invert" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path d={d} fill="none" stroke={color} strokeWidth={8} strokeLinecap="round" />
      <path d={d} fill="none" stroke={K} strokeWidth={1.5} />
      {Array.from({ length: n }, (_, i) => (
        <circle
          // biome-ignore lint/suspicious/noArrayIndexKey: точки — только по числу этапов
          key={i}
          cx={x(i)}
          cy={y(i)}
          r={5.25}
          fill={i === n - 1 ? K : color}
          stroke={K}
          strokeWidth={1.5}
        />
      ))}
    </svg>
  );
}

// Строка под ценой: подводка — тихая ссылка к письму, как «Обсудить проект»; после отправки — что с заявкой.
// Без сроков и обещаний.
function Said({ onAsk }: { onAsk: () => void }) {
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
  return (
    <button type="button" className={`${base.back} ${styles.call}`} onClick={onAsk}>
      Оставьте телефон, обсудим задачу.
    </button>
  );
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
  const other = s.other;

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
              <Said onAsk={discuss} />
            </div>
          </div>

          <div className={styles.right}>
            {/* Рисунок услуги: декоративный, смысл — в h1. Первый экран — без lazy. */}
            {/* biome-ignore lint/performance/noImgElement: статический экспорт, файлы из public как есть */}
            <img
              className={styles.pic}
              src={`${BASE}/assets/services/${s.slug}.svg`}
              width={720}
              height={480}
              alt=""
              decoding="async"
            />

            {/* Описание: продолжение рисунка, без заголовка — что это за услуга и когда она подходит. */}
            <div className={styles.intro}>
              <p className={styles.about}>{s.intro}</p>
              <p className={styles.fitsHead}>Подойдёт, если</p>
              <ul className={styles.fits}>
                {s.fits.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              {other && (
                <a
                  className={base.more}
                  href={pageHref(`services/${other.slug}`)}
                  rel="nofollow"
                  onClick={(e) => goPage(e, `services/${other.slug}`)}
                >
                  {other.text} <span>→</span>
                </a>
              )}
            </div>

            <section className={styles.sec} data-rise>
              <h2 className={styles.h2}>Что входит</h2>
              <div className={styles.incBody}>
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
            </section>

            {s.cases && (
              <section className={styles.sec} data-rise>
                <div className={styles.casesHead}>
                  <h2 className={styles.h2}>Примеры работ</h2>
                  <a
                    className={`${base.more} ${styles.all}`}
                    href={pageHref("works")}
                    rel="nofollow"
                    onClick={(e) => goPage(e, "works")}
                  >
                    Все работы <span>→</span>
                  </a>
                </div>
                <div className={styles.cases}>
                  {s.cases.map(({ slug: id, text, title, kind }) => {
                    const w = WORKS.find((c) => c.slug === id);
                    if (!w) return null;
                    return (
                      <article key={id} className={styles.case}>
                        {/* nofollow — роботам страницы кейсов не показываем (docs/12-case-page.md). */}
                        <a
                          className={base.card}
                          href={caseHref(id)}
                          rel="nofollow"
                          aria-label={`Кейс: ${title ?? w.title}`}
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
                        <h3>{title ?? w.title}</h3>
                        <p className={base.kind}>{kind ?? w.kind}</p>
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

            <section className={styles.sec} data-rise>
              <h2 className={styles.h2}>Как идёт работа</h2>
              <div className={styles.incBody}>
                <div
                  className={styles.art}
                  style={{ "--w": tile.box[0], "--h": tile.box[1] } as CSSProperties}
                  aria-hidden="true"
                >
                  <Trail n={s.steps.length} box={tile.box} color={tile.color} />
                </div>
                <ol className={`${styles.inc} ${styles.steps}`}>
                  {s.steps.map((n) => (
                    <li key={n.title}>
                      <h3 className={styles.h3}>{n.title}</h3>
                      <p className={styles.note}>{n.text}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </section>

            <section className={styles.sec} data-rise>
              <h2 className={`${styles.h2} ${styles.faq}`}>Частые вопросы</h2>
              <div className={styles.qs}>
                {s.questions.map(({ q, a }) => (
                  <Acc key={q} title={q}>
                    <div className={`${styles.body} ${styles.answer}`}>{a}</div>
                  </Acc>
                ))}
              </div>
            </section>

            {/* Тихий ряд: с любой услуги можно перейти на другую. */}
            <nav className={`${styles.sec} ${styles.others}`} aria-label="Другие услуги">
              <h2 className={styles.h2}>Другие услуги</h2>
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

            {/* Письмо — последний блок, как в кейсах. */}
            <div className={styles.ask}>
              <h2 className={styles.sr}>Обсудить проект</h2>
              <Envelope showDetail />
            </div>
          </div>
        </div>
        <Fine className={styles.fine} />
      </main>
    </div>
  );
}
