import { type MouseEvent, type ReactNode, useEffect } from "react";
import { CARDS_CONTENT, type CaseData, type CaseImage } from "@/components/scenes/Scene3";
import { BriefForm } from "@/components/ui/BriefForm";
import { BRIEF_CONFIG, getBrief, setBrief, useBrief } from "@/lib/brief";
import { HOME_HREF } from "@/lib/caseRoute";
import styles from "./Case.module.css";

// Разметка страницы кейса (вариант D2 «Рассказ», docs/12-case-page.md): ось у левого края, первый
// экран (слева от линии номер и название, справа обложка с главной цифрой, под ней фраза) и главы
// «о проекте → что сделали → результат (цифры и отзыв)», в конце — форма заявки и «ещё проект →». Засечки глав и пунктов, номер
// главы и закреплённая подпись слева — в CSS. Ход по прокрутке (чернила, всплытие [data-rise]) и
// вход (карточка туннеля встаёт в рамку обложки [data-cover], строки [data-hi] всплывают) —
// CaseLayer.tsx.

const N = CARDS_CONTENT.length;
const num = (i: number) => String(i + 1).padStart(2, "0");
const cardOf = (slug: string) => CARDS_CONTENT.findIndex((c) => c.slug === slug);
const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

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

// Обложка — карточка туннеля: та же картинка на своём фоне и номер. На первом экране в её рамку
// встаёт карточка туннеля (data-cover).
function Cover({ i, className }: { i: number; className: string }) {
  const card = CARDS_CONTENT[i];
  return (
    <figure className={`${styles.card} ${className}`} data-cover="">
      <div className={styles.pv}>
        {/* biome-ignore lint/performance/noImgElement: статический экспорт, файлы из public как есть */}
        <img src={card.image} alt="" style={{ background: card.color, objectFit: "contain" }} />
      </div>
      <span className={styles.badge}>{num(i)}</span>
    </figure>
  );
}

// Конец пути — заявка прямо на странице (макет case-page-3/end-form, вариант A): глава «дальше» с
// вопросом и строкой из окна заявки, ниже — та же форма, что в окне (components/ui/BriefForm, данные
// общие — lib/brief.ts), в карточке с рамкой 1,5px. Засечка конца пути тянется от линии до рамки,
// в конце прокрутки точка ждёт у формы (Case.module.css, .end). «Что нужно» — по кейсу (need в
// cases.ts), пока посетитель не выбрал сам. Под формой — неброско «ещё проект →» (переход через
// точку — CaseLayer).
const ASK: Record<string, string> = {
  Сайт: "ваш сайт",
  Магазин: "ваш магазин",
  Приложение: "ваше приложение",
  "ИИ и автоматизация": "вашу автоматизацию",
};
let autoNeed = ""; // «что нужно», подставленное кейсом, а не выбранное посетителем

function End({ c, act }: { c: CaseData; act: CaseActions }) {
  const sent = useBrief().status === "sent";
  useEffect(() => {
    const s = getBrief();
    if (!c.need || s.status !== "idle" || (s.need && s.need !== autoNeed)) return;
    autoNeed = c.need;
    setBrief({ need: c.need });
  }, [c.need]);
  return (
    <>
      <section className={`${styles.sec} ${styles.ch}`}>
        <div className={styles.l}>
          <p className={styles.word}>дальше</p>
        </div>
        <div className={styles.r}>
          <p className={styles.h2} data-rise>
            Обсудим {ASK[c.need ?? ""] ?? "ваш проект"}?
          </p>
          <p className={styles.p} data-rise>
            Оставьте телефон — перезвоним {BRIEF_CONFIG.replyIn} в рабочее время, уточним задачу и в
            тот же день назовём срок и цену.
          </p>
        </div>
      </section>
      <section className={`${styles.sec} ${styles.end}`}>
        <div className={styles.l} />
        <div className={styles.r}>
          <div className={styles.brief} data-rise>
            <BriefForm
              inline
              next={
                <ol className={styles.steps} data-done>
                  <li>
                    <b>звонок</b> — {BRIEF_CONFIG.replyIn} ({BRIEF_CONFIG.hours})
                  </li>
                  <li>
                    <b>уточним задачу</b> по телефону
                  </li>
                  <li>
                    <b>в тот же день</b> — срок и цена
                  </li>
                </ol>
              }
            />
          </div>
          <p className={styles.more} data-rise>
            <button type="button" className={styles.moreLink} onClick={act.next}>
              {sent ? "пока ждёте звонка — ещё проект →" : "ещё проект →"}
            </button>
          </p>
        </div>
      </section>
    </>
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
  let n = 0;
  return (
    <>
      <section className={`${styles.sec} ${styles.hero}`}>
        <div className={styles.l} />
        <div className={styles.r} data-hero>
          <a className={styles.back} href={HOME_HREF} onClick={back(act.close)} data-hi>
            ← все работы
          </a>
          {/* Главная цифра — справа от обложки, по её нижнему краю (на телефоне — под текстом). */}
          <div className={styles.heroMedia}>
            <Cover i={i} className={styles.cover} />
            <div className={styles.hr} data-hi>
              <p className={styles.result}>{card.result}</p>
              <p className={styles.small}>{card.resultNote}</p>
            </div>
          </div>
          {/* Номер, название и «клиент · тип · год» — одним блоком (на десктопе — слева от линии). */}
          <div className={styles.head}>
            <p className={styles.count} data-hi>
              {num(i)} <span>/ {num(N - 1)}</span>
              {c.example && <span className={styles.ex}>пример</span>}
            </p>
            <h1 className={styles.title} id="case-title" data-hi>
              {card.title}
            </h1>
            <p className={styles.meta} data-hi>
              {card.client} · {card.type} · {card.year}
              {c.url && (
                <>
                  {" · "}
                  <a
                    className={styles.ulink}
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {c.url.replace(/^https?:\/\//, "").replace(/\/$/, "")} ↗
                  </a>
                </>
              )}
            </p>
          </div>
          <p className={styles.lead} data-hi>
            {c.summary}
          </p>
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

          {/* Обложка — на первом экране; здесь цифры 2×2 размером цифры туннеля, над каждой линия,
              под ними источник и отзыв (своей главы у отзыва нет). */}
          <Chapter n={n++} word="результат">
            <div className={styles.figs} data-rise>
              {c.results.map((r) => (
                <div key={r.note}>
                  <p className={styles.fig}>{r.value}</p>
                  <p className={styles.small}>{r.note}</p>
                </div>
              ))}
            </div>
            <p className={styles.src} data-rise>
              {c.resultsSource}
            </p>
            {c.quote && (
              <figure className={styles.q} data-rise>
                <p className={styles.quote}>{c.quote.text}</p>
                <p className={styles.who}>{c.quote.who}</p>
              </figure>
            )}
          </Chapter>

          <End c={c} act={act} />
        </>
      )}
    </>
  );
}
