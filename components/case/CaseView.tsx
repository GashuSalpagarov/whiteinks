import type { MouseEvent, ReactNode } from "react";
import { CARDS_CONTENT, type CaseData, type CaseImage } from "@/components/scenes/Scene3";
import { BRIEF_CONFIG } from "@/lib/brief";
import { HOME_HREF } from "@/lib/caseRoute";
import styles from "./Case.module.css";

// Разметка страницы кейса (вариант D2 «Рассказ», docs/12-case-page.md): ось у левого края, первый
// экран и главы «о проекте → что сделали → результат → отзыв», в конце — заявка и следующий кейс.
// Засечки глав и пунктов, номер главы и закреплённая подпись слева — в CSS. Ход по прокрутке
// (чернила, всплытие [data-rise], подпись главы в шапке по [data-ch]) — CaseLayer.tsx.

export const LAST_LINE = "Следующая остановка на этой линии — ваш проект.";

const N = CARDS_CONTENT.length;
const num = (i: number) => String(i + 1).padStart(2, "0");
const cardOf = (slug: string) => CARDS_CONTENT.findIndex((c) => c.slug === slug);
const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

export type CaseActions = {
  close: () => void;
  next: () => void;
  discuss: (e: { currentTarget: HTMLElement }) => void; // окно заявки растёт из нажатой кнопки
  prices: () => void;
};

// Ссылка «назад» — адрес главной (для новой вкладки), обычное нажатие — выход из кейса.
export const back = (close: () => void) => (e: MouseEvent) => {
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  close();
};

function Img({ img, wide }: { img: CaseImage; wide?: boolean }) {
  return (
    <figure
      className={`${styles.card} ${img.ratio === "3/4" ? styles.port : ""} ${wide ? styles.wide : ""}`}
    >
      <div className={styles.pv}>
        {/* biome-ignore lint/performance/noImgElement: статический экспорт, файлы из public как есть */}
        <img src={img.src} alt={img.alt} loading="lazy" />
      </div>
    </figure>
  );
}

// Обложка — карточка туннеля: та же картинка на своём фоне и номер. next — маленькая карточка
// следующего кейса в конце (её CaseLayer уводит в точку).
function Cover({ i, className, next }: { i: number; className: string; next?: boolean }) {
  const card = CARDS_CONTENT[i];
  return (
    <figure
      className={`${styles.card} ${className}`}
      data-ncard={next ? "" : undefined}
      aria-hidden={next ? true : undefined}
    >
      <div className={styles.pv}>
        {/* biome-ignore lint/performance/noImgElement: статический экспорт, файлы из public как есть */}
        <img src={card.image} alt="" style={{ background: card.color, objectFit: "contain" }} />
      </div>
      <span className={styles.badge}>{num(i)}</span>
    </figure>
  );
}

// Глава: засечка на оси и номер (CSS по data-n), слева — закреплённая подпись, справа — текст.
function Chapter(p: { n: number; word: string; sub?: string; children: ReactNode }) {
  return (
    <section className={`${styles.sec} ${styles.ch}`} data-ch={p.word} data-n={num(p.n)}>
      <div className={styles.l}>
        <div className={styles.stick}>
          <p className={styles.word}>{p.word}</p>
          {p.sub && <p className={styles.sub}>{p.sub}</p>}
        </div>
      </div>
      <div className={styles.r}>{p.children}</div>
    </section>
  );
}

// full — вся статья; без него — только первый экран (вход: остальное дорисует CaseLayer, когда
// карточка уйдёт в точку).
export function CaseView(p: { c: CaseData; next: CaseData; act: CaseActions; full: boolean }) {
  const { c, act } = p;
  const i = cardOf(c.slug);
  const card = CARDS_CONTENT[i];
  const ni = cardOf(p.next.slug);
  const nc = CARDS_CONTENT[ni];
  let n = 0;
  return (
    <>
      <section className={`${styles.sec} ${styles.hero}`} data-ch="Работы">
        <div className={styles.l} />
        <div className={styles.r} data-hero>
          <a className={styles.back} href={HOME_HREF} onClick={back(act.close)}>
            ← все работы
          </a>
          <p className={styles.count}>
            {num(i)} <span>/ {num(N - 1)}</span>
            {c.example && <span className={styles.ex}>пример</span>}
          </p>
          <h1 className={styles.title} id="case-title">
            {card.title}
          </h1>
          <p className={styles.lead}>{c.summary}</p>
          <p className={styles.meta}>
            {card.client} · {card.type} · {card.year}
            {c.url && (
              <>
                {" · "}
                <a className={styles.ulink} href={c.url} target="_blank" rel="noopener noreferrer">
                  {c.url.replace(/^https?:\/\//, "").replace(/\/$/, "")} ↗
                </a>
              </>
            )}
          </p>
          <div className={styles.hr}>
            <p className={styles.result}>{card.result}</p>
            <p className={styles.small}>{card.resultNote}</p>
          </div>
        </div>
      </section>

      {p.full && (
        <>
          <Chapter n={n++} word="о проекте" sub={card.client}>
            <p className={styles.big} data-rise>
              {c.task}
            </p>
            <div className={styles.facts} data-rise>
              {c.before.map((b) => (
                <div key={b.value}>
                  <b>{b.value}</b>
                  <span>{b.note}</span>
                </div>
              ))}
            </div>
            <div data-rise>
              <Img img={c.beforeImage} wide />
            </div>
          </Chapter>

          <Chapter n={n++} word="что сделали" sub={c.services.map(lower).join(", ")}>
            {c.solution.map((s, k) => (
              <div key={s.title} className={styles.it} data-rise>
                <p className={styles.k}>
                  <b>{num(k)}</b>решение
                </p>
                <h2 className={styles.h3}>{s.title}</h2>
                <p className={styles.p}>{s.text}</p>
                <Img img={s.image} wide />
              </div>
            ))}
            <div className={styles.it} data-rise>
              <div className={styles.pair}>
                <Img img={c.gallery[0]} />
                <Img img={c.gallery[1]} />
              </div>
              <p className={styles.note}>{c.galleryNote}</p>
            </div>
          </Chapter>

          <Chapter n={n++} word="результат" sub={c.resultsSource}>
            <div data-rise>
              <Cover i={i} className={styles.wide} />
            </div>
            <div className={styles.figs} data-rise>
              {c.results.map((r) => (
                <div key={r.note}>
                  <p className={styles.fig}>{r.value}</p>
                  <p className={styles.small}>{r.note}</p>
                </div>
              ))}
            </div>
          </Chapter>

          {c.quote && (
            <Chapter n={n++} word="отзыв">
              <p className={styles.quote} data-rise>
                {c.quote.text}
              </p>
              <p className={styles.who} data-rise>
                {c.quote.who}
              </p>
            </Chapter>
          )}

          {/* Конец пути: засечка «заявка» встаёт на точку в самом конце прокрутки (высота блока —
              Case.module.css). Карточка следующего кейса по «Следующий кейс →» уходит в точку. */}
          <section className={`${styles.sec} ${styles.end}`} data-ch="заявка">
            <div className={styles.l}>
              <p className={styles.word}>дальше</p>
            </div>
            <div className={styles.r}>
              <p className={styles.h2} data-rise>
                {LAST_LINE}
              </p>
              <p className={styles.p} data-rise>
                Расскажите о задаче — перезвоним {BRIEF_CONFIG.replyIn} и прикинем цену.
              </p>
              <div className={styles.acts} data-rise>
                <button type="button" className={styles.pillDark} onClick={act.discuss}>
                  Обсудить проект
                </button>
                <button type="button" className={styles.ulink} onClick={act.prices}>
                  сколько стоит похожее
                </button>
              </div>
              <div className={styles.nx} data-rise>
                <Cover i={ni} className={styles.mini} next />
                <div>
                  <p className={styles.k}>ещё проект · {num(ni)}</p>
                  <p className={styles.h3}>{nc.title}</p>
                  <p className={styles.sub}>
                    {nc.result} · {nc.resultNote}
                  </p>
                  <button type="button" className={styles.pill} onClick={act.next}>
                    Следующий кейс →
                  </button>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </>
  );
}
