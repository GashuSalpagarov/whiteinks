import type { ReactNode } from "react";
import type { CaseData } from "@/components/scenes/Scene3";
import caseStyles from "../Case.module.css";
import { type CaseActions, End } from "../CaseView";
import { Duo } from "./Duo";
import styles from "./Showcase.module.css";

// Страница Memoridian (docs/12-case-page.md): первый экран, ряды по образцу главной шахматным порядком
// и письмо. Крупные ряды как Сцена 3: картинка с одной стороны, текст с другой, следующий зеркально.
// Функции как Сцена 2: небольшие блоки то слева, то справа. Картинка в разметке всегда первой, поэтому
// в одну колонку она стоит над своим текстом, как карточка в портрете Сцены 3.
// Из движения — только полёт карточки (сама группа Duo) и всплытие (data-hi, data-rise в CaseLayer).
// Снимки — настоящие компоненты приложения и настоящий сайт, данные приложения выдуманные.

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function Img(p: { file: string; w: number; h: number; alt: string; className?: string }) {
  return (
    // biome-ignore lint/performance/noImgElement: статический экспорт, файлы из public как есть
    <img
      className={p.className}
      src={`${BASE}/works/memoridian/${p.file}.webp`}
      width={p.w}
      height={p.h}
      alt={p.alt}
      decoding="async"
    />
  );
}

// Карточки сняты с запасом 24 px под тень: сама карточка стоит точно по колонке.
const Kit = (p: { file: string; h: number; alt: string }) => (
  <Img {...p} w={1488} className={styles.kit} />
);

// То же для карточек функций: сняты шириной 300, файл 1218.
const Tile = (p: { file: string; h: number; alt: string }) => (
  <div>
    <Img {...p} w={1218} className={styles.tile} />
  </div>
);

function Row(p: { flip?: boolean; wide?: boolean; pic: ReactNode; children: ReactNode }) {
  return (
    <section
      className={`${styles.shot} ${styles.row} ${p.flip ? styles.flip : ""} ${p.wide ? styles.wide : ""}`}
    >
      <div className={styles.pic} data-rise>
        {p.pic}
      </div>
      <div className={styles.copy} data-rise>
        {p.children}
      </div>
    </section>
  );
}

function Fn(p: { head: string; children: ReactNode; cards?: ReactNode }) {
  return (
    <div className={styles.fn} data-rise>
      {p.cards && <div className={styles.cards}>{p.cards}</div>}
      <h3 className={styles.head}>{p.head}</h3>
      <p className={styles.text}>{p.children}</p>
    </div>
  );
}

const SWATCHES = ["#DC5C33", "#1A1C25", "#7A7F8C", "#FFFFFF", "#F6F7FB", "#141414"];

export function Showcase({ c, act, full }: { c: CaseData; act: CaseActions; full: boolean }) {
  const link = (name: string, label: string) => (
    <a
      href={c.launch?.where.find((w) => w.name === name)?.url}
      target="_blank"
      rel="noopener noreferrer"
    >
      {label}
    </a>
  );

  return (
    <>
      <section className={`${styles.shot} ${styles.intro}`}>
        <h1 className={styles.title} id="case-title" data-hi>
          ИИ-ассистент <br />
          Memoridian
        </h1>
        <p className={`${styles.text} ${styles.lead}`} data-hi>
          Помощник, который помнит человека и его дела. Наш продукт.
        </p>
        <Duo
          className={styles.duo}
          data-cover=""
          alts={[
            "Разговор с Мемо в окне браузера, тёмная тема: карточки памяти, задачи, траты и заметки",
            "Главная приложения на телефоне, светлая тема: Мемо и шесть плиток разделов",
          ]}
        />
        <div className={styles.facts} data-hi>
          <div>
            <p className={styles.text}>Что входило в работу</p>
            <ul className={`${styles.note} ${styles.list}`}>
              <li>Имя и персонаж: название, знак, Мемо</li>
              <li>Сайт продукта</li>
              <li>Приложение: Android, iPhone, браузер</li>
              <li>Дизайн-система: цвета, шрифт, блоки, иконки</li>
              <li>Помощник: память и разные нейросети для текста, фото и картинок</li>
            </ul>
          </div>
          <div>
            <p className={styles.text}>Где найти</p>
            <ul className={`${styles.note} ${styles.list}`}>
              <li>Android: {link("Android", "Google Play")}</li>
              <li>iPhone: App Store</li>
              <li>
                Сайт:{" "}
                <a href={c.url} target="_blank" rel="noopener noreferrer">
                  memoridian.com
                </a>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {full && (
        <>
          <Row
            pic={
              <Kit
                file="f-memory"
                h={1423}
                alt="Разговор: человек говорит, что сестра хочет велосипед, Мемо сохраняет факт, а потом отвечает на вопрос о подарке"
              />
            }
          >
            <h2 className={styles.head}>Один разговор вместо отдельных&nbsp;приложений</h2>
            <p className={styles.text}>
              Обычно дела разбросаны: списки в&nbsp;одном приложении, траты в&nbsp;другом,
              напоминания в&nbsp;третьем. В&nbsp;Memoridian человек просто пишет Мемо:
              «такси&nbsp;400» или «напомни в&nbsp;пятницу забрать посылку». Мемо сам понимает, куда
              это записать, и&nbsp;показывает карточку с&nbsp;результатом.
            </p>
          </Row>

          <Row
            flip
            pic={
              <Kit
                file="f-facts"
                h={1197}
                alt="Две карточки памяти: что ест кот и что брат не любит сюрпризы"
              />
            }
          >
            <h2 className={styles.head}>Помнит</h2>
            <p className={styles.text}>
              Важное из разговора становится отдельным фактом. Факты лежат в&nbsp;разделе «Память»:
              любой можно стереть, а&nbsp;на всех устройствах память одна.
            </p>
          </Row>

          <section className={`${styles.shot} ${styles.fns}`}>
            <h2 className={styles.head} data-rise>
              Остальное в&nbsp;том же разговоре
            </h2>
            <Fn
              head="Напоминает"
              cards={
                <Tile
                  file="f-remind"
                  h={707}
                  alt="Карточка задачи: оплатить интернет, четверг, 9:00"
                />
              }
            >
              Задача со временем и, если нужно, с&nbsp;повтором.
            </Fn>
            <Fn
              head="Ведёт к цели"
              cards={
                <Tile
                  file="f-goal"
                  h={1005}
                  alt="Карточка цели: читать 20 минут в день, 5 из 7 на этой неделе"
                />
              }
            >
              Разбивает цель на шаги и&nbsp;подводит итоги недели.
            </Fn>
            <Fn
              head="Считает"
              cards={
                <>
                  <Tile
                    file="f-food"
                    h={767}
                    alt="Карточка еды: сырники со сметаной, 410 килокалорий"
                  />
                  <Tile
                    file="f-run"
                    h={1236}
                    alt="Карточка пробежки: маршрут, 5,2 километра, время и темп"
                  />
                </>
              }
            >
              Траты по счетам и&nbsp;категориям. Еда по&nbsp;описанию или фото: калории
              и&nbsp;белок. Вода, вес, бег и&nbsp;ходьба.
            </Fn>
            <Fn head="Записывает">Списки и&nbsp;тексты из чата лежат в&nbsp;«Заметках».</Fn>
            <Fn head="Рисует">По описанию делает картинку или правит фото.</Fn>
            <Fn
              head="Находит"
              cards={
                <Tile
                  file="f-radar"
                  h={735}
                  alt="Карточка радара: городская новость, пересказанная коротко, с кнопками «Опубликовать» и «Пропустить»"
                />
              }
            >
              Телеграм-радар пересказывает новое из&nbsp;выбранных каналов.
            </Fn>
          </section>

          <Row pic={<Img file="memo" w={1600} h={1305} alt="Мемо, персонаж приложения" />}>
            <h2 className={styles.head}>Имя и Мемо</h2>
            <p className={styles.text}>
              Имя сложено из memory, память, и&nbsp;meridian, меридиан: помощник, который помнит
              важное и&nbsp;помогает держать курс. Мемо его лицо: имя меняется одной фразой
              в&nbsp;чате, образ и&nbsp;характер задаются в&nbsp;настройках.
            </p>
          </Row>

          <Row
            flip
            wide
            pic={
              <div className={styles.page}>
                <Img file="site" w={2880} h={1620} alt="Первый экран сайта memoridian.com" />
              </div>
            }
          >
            <h2 className={styles.head}>Сайт</h2>
            <p className={styles.text}>
              Вместо обещаний показывает сам продукт: на&nbsp;первом экране поток настоящих
              карточек.
            </p>
          </Row>

          <Row
            pic={
              <div className={styles.page}>
                <Img
                  file="site-how"
                  w={1440}
                  h={810}
                  alt="Раздел сайта «Посмотри, как это работает»: список тем и телефон со сценкой"
                />
              </div>
            }
          >
            <p className={styles.text}>
              В&nbsp;разделе «Посмотри, как это работает» телефон проигрывает короткие сценки.
            </p>
          </Row>

          <Row
            flip
            pic={
              <div className={styles.stack}>
                <div className={styles.swatches}>
                  {SWATCHES.map((hex) => (
                    <i key={hex} className="no-invert" style={{ background: hex }} />
                  ))}
                </div>
                <div className={styles.ink}>
                  <Img
                    file="ds-type"
                    w={1470}
                    h={753}
                    alt="Семь размеров шрифта: от заголовка экрана 32 до метки 12"
                  />
                </div>
              </div>
            }
          >
            <h2 className={styles.head}>Дизайн-система</h2>
            <p className={styles.text}>
              Общий набор цветов, шрифта и&nbsp;готовых блоков, из&nbsp;которых собраны экраны.
              Поэтому приложение и&nbsp;версия в&nbsp;браузере выглядят одним продуктом. Тема меняет
              только цвета.
            </p>
          </Row>

          <section className={`${styles.shot} ${styles.row} ${styles.pair}`}>
            <div className={`${styles.pic} ${styles.stack}`} data-rise>
              <div className={styles.ink}>
                <Img
                  file="ds-icons"
                  w={1470}
                  h={735}
                  alt="Двадцать иконок приложения"
                  className={styles.icons}
                />
              </div>
              <Img
                file="ds-blocks"
                w={1470}
                h={858}
                alt="Кнопки «Записать» и «Изменить», чипы счетов, метки, переключатели, плитки разделов, поле ввода"
              />
            </div>
            <div className={styles.pic} data-rise data-d="80">
              <Kit
                file="ds-fin"
                h={1249}
                alt="Карточка «Финансы», собранная из тех же блоков: три траты, итог, сумма за день, кнопки"
              />
            </div>
          </section>

          <section className={`${styles.shot} ${caseStyles.plain}`}>
            <End c={c} act={act} />
          </section>
        </>
      )}
    </>
  );
}
