import type { CSSProperties, MouseEvent } from "react";
import { CARDS_CONTENT, type CaseData, type CaseImage } from "@/components/scenes/Scene3";
import { HOME_HREF } from "@/lib/caseRoute";
import styles from "./Case.module.css";

// Разметка страницы кейса (вариант A «Сквозь карточку»). Ход — CaseLayer.tsx: картинки
// [data-fly] вылетают из точки и встают на место, тексты [data-rise] всплывают, первый экран
// следующего кейса собирается в закреплённом блоке «Дальше».

const N = CARDS_CONTENT.length;
const num = (i: number) => String(i + 1).padStart(2, "0");
const cardOf = (slug: string) => CARDS_CONTENT.findIndex((c) => c.slug === slug);
// Сторона карточки в окне чтения — как в туннеле Сцены 3: 01, 03, 05 слева, 02, 04 справа.
export const sideOf = (i: number) => (i % 2 === 0 ? "l" : "r");

function weeks(n: number) {
  const d = n % 10;
  const dd = n % 100;
  if (d === 1 && dd !== 11) return `${n} неделя`;
  if (d >= 2 && d <= 4 && (dd < 12 || dd > 14)) return `${n} недели`;
  return `${n} недель`;
}

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

// Первый экран: карточка в окне чтения (без наклона), текст — на месте подписи туннеля.
// preview — его копия в блоке «Дальше» (без h1 и главы, для глаз): в неё уходим сквозь карточку.
function Hero({ c, act, preview }: { c: CaseData; act: CaseActions; preview?: boolean }) {
  const i = cardOf(c.slug);
  const card = CARDS_CONTENT[i];
  const Title = preview ? "p" : "h1";
  return (
    <section
      className={styles.hero}
      data-side={sideOf(i)}
      data-ch={preview ? undefined : "Работы"}
      data-hero
    >
      <figure className={`${styles.card} ${styles.cover}`} data-cover>
        <div className={styles.pv}>
          {/* biome-ignore lint/performance/noImgElement: статический экспорт, файлы из public как есть */}
          <img src={card.image} alt="" style={{ background: card.color, objectFit: "contain" }} />
        </div>
        <span className={styles.badge}>{num(i)}</span>
      </figure>
      <div className={styles.htext} data-hr>
        <a className={styles.back} href={HOME_HREF} onClick={back(act.close)}>
          ← все работы
        </a>
        <p className={styles.count}>
          {num(i)} <span>/ {num(N - 1)}</span>
          {c.example && <span className={styles.ex}>пример</span>}
        </p>
        <Title className={styles.title} id={preview ? undefined : "case-title"}>
          {card.title}
        </Title>
        <p className={styles.lead}>{c.summary}</p>
        <dl className={styles.meta}>
          <dt>Клиент</dt>
          <dd>{card.client}</dd>
          <dt>Тип</dt>
          <dd>{card.type}</dd>
          <dt>Год</dt>
          <dd>{card.year}</dd>
          <dt>Срок</dt>
          <dd>{weeks(c.weeks)}</dd>
          {c.url && (
            <>
              <dt>Сайт</dt>
              <dd>
                <a className={styles.ulink} href={c.url} target="_blank" rel="noopener noreferrer">
                  {c.url.replace(/^https?:\/\//, "").replace(/\/$/, "")} ↗
                </a>
              </dd>
            </>
          )}
        </dl>
        <div>
          <p className={styles.result}>{card.result}</p>
          <p className={styles.small}>{card.resultNote}</p>
        </div>
      </div>
    </section>
  );
}

// Картинка главы: вылетает из точки (side — с какой стороны оси, для наклона при полёте).
function Media({ img, side, note }: { img: CaseImage; side: "L" | "R"; note?: string }) {
  const port = img.ratio === "3/4";
  return (
    <figure
      className={`${styles.card} ${styles.media} ${styles[side]} ${port ? styles.port : ""}`}
      data-fly={side === "L" ? 1 : -1}
      style={port ? ({ "--ar": "3 / 4" } as CSSProperties) : undefined}
    >
      <div className={styles.pv}>
        {/* biome-ignore lint/performance/noImgElement: статический экспорт, файлы из public как есть */}
        <img src={img.src} alt={img.alt} loading="lazy" />
      </div>
      {note && <figcaption className={styles.cap}>{note}</figcaption>}
    </figure>
  );
}

export function CaseView({ c, next, act }: { c: CaseData; next: CaseData; act: CaseActions }) {
  const ni = cardOf(next.slug);
  const nextCard = CARDS_CONTENT[ni];
  return (
    <>
      <Hero c={c} act={act} />

      <section className={styles.row} data-ch="Задача">
        <Media img={c.beforeImage} side="L" />
        <div className={`${styles.txt} ${styles.R}`}>
          <p className={styles.chap} data-rise>
            <b>01</b>задача
          </p>
          <p className={styles.big} data-rise>
            {c.task}
          </p>
          <div className={styles.facts} data-rise>
            {c.before.map((b) => (
              <div key={b.value}>
                <b>{b.value}</b>
                <p className={styles.p}>{b.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {c.solution.map((s, k) => {
        const textLeft = k % 2 === 0;
        const text = (
          <div className={`${styles.txt} ${textLeft ? styles.L : styles.R}`}>
            {k === 0 && (
              <p className={styles.chap} data-rise>
                <b>02</b>решение
              </p>
            )}
            <p className={styles.step} data-rise>
              {num(k)}
            </p>
            <h2 className={styles.h3} data-rise>
              {s.title}
            </h2>
            <p className={styles.p} data-rise>
              {s.text}
            </p>
          </div>
        );
        const media = <Media img={s.image} side={textLeft ? "R" : "L"} />;
        return (
          <section key={s.title} className={styles.row} data-ch={k === 0 ? "Решение" : undefined}>
            {textLeft ? text : media}
            {textLeft ? media : text}
          </section>
        );
      })}

      <section className={`${styles.row} ${styles.two}`}>
        <Media img={c.gallery[0]} side="L" />
        <Media img={c.gallery[1]} side="R" note={c.galleryNote} />
      </section>

      <section className={styles.res} data-ch="Результат">
        <p className={styles.chap} data-rise>
          <b>03</b>результат
          {c.example && <span className={styles.ex}>пример</span>}
        </p>
        <div className={styles.figs}>
          {c.results.map((r, k) => (
            <div
              key={r.note}
              className={`${styles.f} ${k % 2 ? styles.R : styles.L}`}
              data-fly={k % 2 ? -1 : 1}
            >
              <p className={k === 0 ? styles.result : styles.fig}>{r.value}</p>
              <p className={styles.small}>{r.note}</p>
            </div>
          ))}
        </div>
        <p className={styles.src} data-rise>
          {c.resultsSource}
        </p>
      </section>

      <section className={`${styles.row} ${styles.rev}`} data-ch={c.quote ? "Отзыв" : "Заявка"}>
        <div className={`${styles.txt} ${styles.L}`}>
          <p className={styles.chap} data-rise>
            <b>04</b>
            {c.quote ? "отзыв" : "что делали"}
          </p>
          {c.quote && (
            <>
              <p className={styles.quote} data-rise>
                {c.quote.text}
              </p>
              <p className={styles.who} data-rise>
                {c.quote.who}
              </p>
            </>
          )}
          <div className={styles.tags} data-rise>
            {c.services.map((s) => (
              <span key={s} className={styles.tag}>
                {s}
              </span>
            ))}
          </div>
        </div>
        <div className={`${styles.txt} ${styles.R}`}>
          <p className={styles.h2} data-rise>
            Похожая задача?
          </p>
          <p className={styles.p} data-rise>
            Расскажите о ней — перезвоним в течение 2 часов и прикинем срок и цену.
          </p>
          <div className={styles.acts} data-rise>
            <button type="button" className={styles.pillDark} onClick={act.discuss}>
              Обсудить проект
            </button>
            <button type="button" className={styles.ulink} onClick={act.prices}>
              сколько стоит похожее
            </button>
          </div>
        </div>
      </section>

      {/* Дальше: из точки вылетает карточка следующего кейса и встаёт в окно чтения, как в туннеле;
          прокрутка дальше — сквозь неё, и собирается его первый экран. Собрался — CaseLayer
          подменяет кейс (тот же кадр, прокрутка с начала). */}
      <section className={styles.next} data-side={sideOf(ni)} data-ch="Дальше" data-next>
        <div className={styles.stick}>
          <figure className={`${styles.card} ${styles.ncard}`} data-ncard aria-hidden="true">
            <div className={styles.pv}>
              {/* biome-ignore lint/performance/noImgElement: статический экспорт, файлы из public как есть */}
              <img
                src={nextCard.image}
                alt=""
                style={{ background: nextCard.color, objectFit: "contain" }}
              />
            </div>
            <span className={styles.badge}>{num(ni)}</span>
          </figure>
          <div className={styles.ncap} data-ncap>
            <p className={styles.count}>
              дальше · {num(ni)} <span>/ {num(N - 1)}</span>
            </p>
            <p className={styles.ntitle}>{nextCard.title}</p>
            <dl className={styles.meta}>
              <dt>Клиент</dt>
              <dd>{nextCard.client}</dd>
              <dt>Тип</dt>
              <dd>{nextCard.type}</dd>
              <dt>Год</dt>
              <dd>{nextCard.year}</dd>
            </dl>
            <p className={styles.result}>{nextCard.result}</p>
            <p className={styles.small}>{nextCard.resultNote}</p>
            <div className={styles.acts}>
              <button type="button" className={styles.pill} onClick={act.next}>
                Следующий кейс →
              </button>
              <a className={styles.ulink} href={HOME_HREF} onClick={back(act.close)}>
                все работы
              </a>
            </div>
          </div>
          <div className={styles.n3} data-n3 aria-hidden="true" inert>
            <Hero c={next} act={act} preview />
          </div>
        </div>
      </section>
    </>
  );
}
