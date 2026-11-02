import type { MouseEvent, ReactNode } from "react";
import { CARDS_CONTENT, type CaseData, type CaseImage } from "@/components/scenes/Scene3";
import { HOME_HREF } from "@/lib/caseRoute";
import styles from "./Case.module.css";
import { End } from "./End";

export { End };

// Разметка страницы кейса (вариант D2 «Рассказ», docs/12-case-page.md): ось у левого края, первый
// экран (слева от линии номер и название, справа обложка, рядом фраза, ссылка и главная цифра) и
// главы «о проекте → что сделали → результат (цифры или площадки, отзыв)», в конце — конверт заявки и «ещё
// проект →». Засечки глав и пунктов, номер главы и закреплённая подпись слева — в CSS. Правая часть — сетка 12 колонок (вариант B «сетка»):
// рамки статьи — по её колонкам (.g12 в CSS). Ход по прокрутке (чернила, всплытие [data-rise])
// и вход (карточка туннеля встаёт в рамку обложки [data-cover],
// строки [data-hi] всплывают) — CaseLayer.tsx.

const N = CARDS_CONTENT.length;
const num = (i: number) => String(i + 1).padStart(2, "0");
const cardOf = (slug: string) => CARDS_CONTENT.findIndex((c) => c.slug === slug);
// Первая буква строчной, кроме сокращений вроде «ИИ».
const lower = (s: string) => (/^\p{Lu}{2}/u.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1));

export type CaseActions = {
  close: () => void;
  next: () => void;
  discuss: (e: { currentTarget: HTMLElement }) => void; // окно заявки растёт из нажатой кнопки
};

// Ссылка «назад» — адрес главной (для новой вкладки), обычное нажатие — выход из кейса.
export const back = (close: () => void) => (e: MouseEvent) => {
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  close();
};

// Картинка всплывает сама по себе; место в сетке — className.
function Img({ img, className = "" }: { img: CaseImage; className?: string }) {
  return (
    <figure
      className={`${styles.card} ${img.ratio === "3/4" ? styles.port : ""} ${className}`}
      data-rise
    >
      <div className={styles.pv}>
        {/* biome-ignore lint/performance/noImgElement: статический экспорт, файлы из public как есть */}
        <img src={img.src} alt={img.alt} loading="lazy" />
      </div>
    </figure>
  );
}

// Обложка — маленькая карточка туннеля над названием: та же картинка на своём фоне, номер — строкой
// над ней. На первом экране в её рамку встаёт карточка туннеля (data-cover).
function Cover({ i, className }: { i: number; className: string }) {
  const card = CARDS_CONTENT[i];
  const style = { background: card.color, objectFit: "contain" } as const;
  return (
    <figure className={`${styles.card} ${className}`} data-cover="">
      <div className={styles.pv}>
        {/* biome-ignore lint/performance/noImgElement: статический экспорт, файлы из public как есть */}
        <img src={card.image} alt="" style={style} />
      </div>
    </figure>
  );
}

// Результат без цифр (launch в cases.ts) — где проект живёт сейчас: строка на площадку (имя,
// рядом где и статус), ниже строка, цена и «попробовать ↗». Строки со ссылкой ведут на площадку.
function Launch({ l }: { l: NonNullable<CaseData["launch"]> }) {
  return (
    <div className={styles.launch}>
      {l.where.map((w, k) => {
        const row = (
          <>
            <span className={styles.lName}>{w.name}</span>
            <span className={styles.lWhere}>
              <b>{w.place}</b> <span>{w.note}</span>
            </span>
            <span className={styles.lSt}>
              <i />
              {w.status}
            </span>
            {w.url && (
              <span className={styles.lGo} aria-hidden="true">
                ↗
              </span>
            )}
          </>
        );
        return w.url ? (
          <a
            key={w.name}
            className={styles.lRow}
            href={w.url}
            target="_blank"
            rel="noopener noreferrer"
            data-rise
            data-d={k * 90}
          >
            {row}
          </a>
        ) : (
          <div key={w.name} className={styles.lRow} data-rise data-d={k * 90}>
            {row}
          </div>
        );
      })}
      <div className={styles.lFoot} data-rise>
        <p className={styles.lNote}>{l.note}</p>
        <div className={styles.lEnd}>
          <p className={styles.lPrice}>{l.price}</p>
          <a className={styles.pill} href={l.try} target="_blank" rel="noopener noreferrer">
            попробовать ↗
          </a>
        </div>
      </div>
    </div>
  );
}

// Глава: засечка на оси и номер (CSS по data-n), слева — закреплённая подпись, справа — текст.
function Chapter(p: { n: number; word: string; sub?: string; children: ReactNode }) {
  return (
    <section className={`${styles.sec} ${styles.ch}`} data-n={num(p.n)}>
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
export function CaseView(p: { c: CaseData; act: CaseActions; full: boolean }) {
  const { c, act } = p;
  const i = cardOf(c.slug);
  const card = CARDS_CONTENT[i];
  const host = c.url?.replace(/^https?:\/\//, "").replace(/\/$/, "");
  let n = 0;
  return (
    <>
      <section className={`${styles.sec} ${styles.hero}`}>
        <div className={styles.l} />
        <div className={styles.r} data-hero>
          <a className={styles.back} href={HOME_HREF} onClick={back(act.close)} data-hi>
            ← все работы
          </a>
          {/* Справа от линии — фраза, ссылка, где ещё есть проект, и главная цифра (на телефоне —
              всё под названием). */}
          <div className={`${styles.heroMedia} ${styles.g12}`}>
            <div className={styles.side} data-hi>
              <p className={styles.lead}>{c.summary}</p>
              {c.url && (
                <a className={styles.pill} href={c.url} target="_blank" rel="noopener noreferrer">
                  {host} ↗
                </a>
              )}
              {c.platforms && (
                <p className={styles.plat}>
                  {c.platforms.map((s) => (
                    <span key={s}>{s}</span>
                  ))}
                </p>
              )}
              {card.result && (
                <div className={styles.hr}>
                  <p className={styles.result}>{card.result}</p>
                  <p className={styles.small}>{card.resultNote}</p>
                </div>
              )}
            </div>
          </div>
          {/* Номер, обложка, название и «клиент · тип · год» — одним блоком (на десктопе — слева от линии). */}
          <div className={styles.head}>
            <p className={styles.count} data-hi>
              {num(i)} <span>/ {num(N - 1)}</span>
              {c.example && <span className={styles.ex}>пример</span>}
            </p>
            <Cover i={i} className={styles.cover} />
            <h1 className={styles.title} id="case-title" data-hi>
              {card.title}
            </h1>
            <p className={styles.meta} data-hi>
              {card.client && `${card.client} · `}
              {card.type}
              {c.url && (
                <>
                  {" · "}
                  <a
                    className={styles.ulink}
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {host} ↗
                  </a>
                </>
              )}
            </p>
          </div>
        </div>
      </section>

      {p.full && (
        <>
          {/* Задача — на 9 колонок; картинка «было» — на 7, факты — столбиком справа по её низу. */}
          <Chapter n={n++} word="о проекте" sub={card.client}>
            <p className={`${styles.big} ${styles.task} ${styles.bt}`} data-rise>
              {c.task}
            </p>
            <div className={`${styles.g12} ${styles.row}`}>
              <Img img={c.beforeImage} className={styles.pic} />
              <div className={styles.facts}>
                {c.before.map((b, k) => (
                  <div key={b.value} data-rise data-d={k * 80}>
                    <b>{b.value}</b>
                    <span>{b.note}</span>
                  </div>
                ))}
              </div>
            </div>
          </Chapter>

          {/* «Ёлочка»: картинка и текст решения меняются местами; пара «телефон + широкая» —
              одной высоты. */}
          <Chapter n={n++} word="что сделали" sub={c.services.map(lower).join(", ")}>
            {c.solution.map((s, k) => (
              <div
                key={s.title}
                className={`${styles.g12} ${styles.it} ${k % 2 ? styles.flip : ""}`}
              >
                <Img img={s.image} className={styles.pic} />
                <div className={`${styles.tx} ${styles.bt}`} data-rise data-d={90}>
                  <p className={styles.k}>{num(k)}</p>
                  <h2 className={styles.h3}>{s.title}</h2>
                  <p className={styles.p}>{s.text}</p>
                </div>
              </div>
            ))}
            <div className={`${styles.g12} ${styles.it} ${styles.gal}`}>
              <Img img={c.gallery[0]} className={styles.mob} />
              <Img img={c.gallery[1]} className={styles.desk} />
              <p className={`${styles.note} ${styles.bt}`} data-rise>
                {c.galleryNote}
              </p>
            </div>
          </Chapter>

          {/* Обложка — на первом экране; здесь цифры таблицей 2×2 размером цифры туннеля (или,
              если цифр нет, площадки — Launch), под ними источник и отзыв (своей главы у отзыва
              нет). */}
          <Chapter n={n++} word="результат">
            {c.launch ? (
              <Launch l={c.launch} />
            ) : (
              <>
                <div className={`${styles.g12} ${styles.figs}`}>
                  {c.results?.map((r, k) => (
                    <div key={r.note} data-rise data-d={(k % 2) * 80}>
                      <p className={styles.fig}>{r.value}</p>
                      <p className={styles.small}>{r.note}</p>
                    </div>
                  ))}
                </div>
                <p className={`${styles.src} ${styles.bt}`} data-rise>
                  {c.resultsSource}
                </p>
              </>
            )}
            {c.quote && (
              <figure className={`${styles.q} ${styles.bt}`} data-rise>
                <p className={styles.quote}>{c.quote.text}</p>
                <p className={styles.who}>{c.quote.who}</p>
              </figure>
            )}
          </Chapter>

          <div className={`${styles.plain} ${styles.plainEnd}`}>
            <End c={c} act={act} />
          </div>
        </>
      )}
    </>
  );
}
