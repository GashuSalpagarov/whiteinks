import { type MouseEvent, type ReactNode, useEffect } from "react";
import { CARDS_CONTENT, CASES, type CaseData, type CaseImage } from "@/components/scenes/Scene3";
import { Envelope } from "@/components/ui/Envelope";
import { BRIEF_CONFIG, clearBrief, getBrief, setBrief, useBrief } from "@/lib/brief";
import { HOME_HREF } from "@/lib/caseRoute";
import { formatPhone } from "@/lib/phone";
import styles from "./Case.module.css";

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

// Обложка — карточка туннеля: та же картинка на своём фоне и номер. На первом экране в её рамку
// встаёт карточка туннеля (data-cover). Видео-петля карточки играет и здесь — с первого кадра (он
// же постер), когда вход доигран (CaseLayer, settle).
function Cover({ i, className }: { i: number; className: string }) {
  const card = CARDS_CONTENT[i];
  const style = { background: card.color, objectFit: "contain" } as const;
  return (
    <figure className={`${styles.card} ${className}`} data-cover="">
      <div className={styles.pv}>
        {card.video ? (
          <video
            className="no-invert"
            src={card.video}
            poster={card.image}
            muted
            loop
            playsInline
            preload="auto"
            style={style}
          />
        ) : (
          <>
            {/* biome-ignore lint/performance/noImgElement: статический экспорт, файлы из public как есть */}
            <img src={card.image} alt="" style={style} />
          </>
        )}
      </div>
      <span className={styles.badge}>{num(i)}</span>
    </figure>
  );
}

// Конец пути — заявка прямо на странице: глава «дальше» с вопросом и строкой (после отправки — что
// с заявкой, как над конвертом Сцены 6), ниже — тот же конверт, что на главной (components/ui/
// Envelope), уже собранный; отправили — он доигрывает сам: письмо в конверт, клапан, «от: …»,
// марка. Данные общие — lib/brief.ts. Засечка конца пути тянется от линии до подложки, в конце
// прокрутки точка ждёт у поля «телефон» (Case.module.css, .end). «Что нужно» — по кейсу (need в
// cases.ts), пока посетитель не выбрал сам. Под конвертом — неброско «ещё проект →» (переход через
// точку — CaseLayer).
const ASK: Record<string, string> = {
  Сайт: "ваш сайт",
  Магазин: "ваш магазин",
  Приложение: "ваше приложение",
  "ИИ и автоматизация": "вашу автоматизацию",
};
let autoNeed = ""; // «что нужно», подставленное кейсом, а не выбранное посетителем

function End({ c, act }: { c: CaseData; act: CaseActions }) {
  const { status, phone } = useBrief();
  const sent = status === "sent";
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
          <p className={`${styles.h2} ${styles.bt}`} data-rise>
            Обсудим {ASK[c.need ?? ""] ?? "ваш проект"}?
          </p>
          <div className={`${styles.p} ${styles.bt} ${styles.said}`} role="status" data-rise>
            {sent ? (
              <>
                <p>
                  <strong>Заявка отправлена.</strong> Перезвоним на{" "}
                  <span className={styles.nw}>{formatPhone(phone)}</span> {BRIEF_CONFIG.replyIn} в
                  рабочее время.
                </p>
                <button type="button" className={styles.again} onClick={() => clearBrief()}>
                  отправить ещё одну
                </button>
              </>
            ) : status === "mail" ? (
              <>
                <p>
                  <strong>Осталось отправить.</strong> Письмо открыто в вашей почте — отправьте его.
                  Или позвоните{" "}
                  <a href={`tel:+${BRIEF_CONFIG.phone.replace(/\D/g, "")}`} className={styles.nw}>
                    {BRIEF_CONFIG.phone}
                  </a>
                  , Telegram{" "}
                  <a
                    href={`https://t.me/${BRIEF_CONFIG.telegram.replace(/^@/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {BRIEF_CONFIG.telegram}
                  </a>
                  .
                </p>
                <button
                  type="button"
                  className={styles.again}
                  onClick={() => setBrief({ status: "idle" })}
                >
                  вернуться к форме
                </button>
              </>
            ) : (
              <p>
                Оставьте телефон — перезвоним {BRIEF_CONFIG.replyIn} в рабочее время, уточним задачу
                и в тот же день назовём срок и цену.
              </p>
            )}
          </div>
        </div>
      </section>
      <section className={`${styles.sec} ${styles.end}`}>
        <div className={styles.l} />
        <div className={styles.r}>
          <div className={styles.letter} data-rise data-letter>
            <Envelope />
          </div>
          {/* Кейс один — «ещё проект» вёл бы в него же */}
          {CASES.length > 1 && (
            <p className={`${styles.more} ${styles.bt}`} data-rise>
              <button type="button" className={styles.moreLink} onClick={act.next}>
                {sent ? "пока ждёте звонка — ещё проект →" : "ещё проект →"}
              </button>
            </p>
          )}
        </div>
      </section>
    </>
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
          {/* Обложка — на 7 колонок; справа, по её нижнему краю — фраза, ссылка, где ещё есть
              проект, и главная цифра (на телефоне — всё под текстом). */}
          <div className={`${styles.heroMedia} ${styles.g12}`}>
            <Cover i={i} className={styles.cover} />
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

          <End c={c} act={act} />
        </>
      )}
    </>
  );
}
