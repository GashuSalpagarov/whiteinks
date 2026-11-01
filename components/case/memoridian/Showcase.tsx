import type { ReactNode } from "react";
import type { CaseData } from "@/components/scenes/Scene3";
import caseStyles from "../Case.module.css";
import { type CaseActions, End } from "../CaseView";
import { Duo } from "./Duo";
import styles from "./Showcase.module.css";

// Страница Memoridian (docs/12-case-page.md): первый экран, свободные блоки и письмо. Блок — картинка
// и свой текст рядом, в размер друг другу; положение и ширины в CSS по имени блока. Картинка в разметке
// всегда первой, поэтому в одну колонку она стоит над своим текстом.
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

// Карточки сняты с запасом под тень: край самой карточки стоит точно по ширине блока.
const Kit = (p: { file: string; h: number; alt: string }) => (
  <Img {...p} w={1488} className={styles.kit} />
);

const Tile = (p: { file: string; h: number; alt: string }) => (
  <Img {...p} w={1218} className={styles.tile} />
);

function Block(p: { name: string; pic: ReactNode; head: string; children: ReactNode }) {
  return (
    <div className={`${styles.block} ${styles[p.name]}`} data-rise>
      <div className={styles.pic}>{p.pic}</div>
      <div className={styles.copy}>
        <h2 className={styles.head}>{p.head}</h2>
        <p className={styles.text}>{p.children}</p>
      </div>
    </div>
  );
}

// Заголовок главы и абзац о ней: стоит в ряду рядом с первым блоком главы.
function Lead(p: { head: string; children: ReactNode }) {
  return (
    <div className={styles.copy} data-rise>
      <h2 className={styles.head}>{p.head}</h2>
      <p className={styles.text}>{p.children}</p>
    </div>
  );
}

const SWATCHES = [
  ["#DC5C33", "#141414"],
  ["#1A1C25", "#FFFFFF"],
  ["#7A7F8C", "#141414"],
  ["#FFFFFF", "#141414"],
  ["#F6F7FB", "#141414"],
  ["#141414", "#FFFFFF"],
];

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
          <section className={`${styles.shot} ${styles.chapter}`}>
            <Block
              name="talk"
              head="Один разговор вместо отдельных&nbsp;приложений"
              pic={
                <Kit
                  file="f-memory"
                  h={1423}
                  alt="Разговор: человек говорит, что сестра хочет велосипед, Мемо сохраняет факт, а потом отвечает на вопрос о подарке"
                />
              }
            >
              Обычно списки лежат в&nbsp;одном приложении, траты в&nbsp;другом, напоминания
              в&nbsp;третьем. В&nbsp;Memoridian человек просто пишет Мемо: «такси&nbsp;400» или
              «напомни в&nbsp;пятницу забрать посылку». Мемо сам понимает, куда это записать,
              и&nbsp;показывает карточку.
            </Block>
            <Block
              name="memory"
              head="Помнит"
              pic={
                <Kit
                  file="f-facts"
                  h={1197}
                  alt="Две карточки памяти: что ест кот и что брат не любит сюрпризы"
                />
              }
            >
              Важное из разговора становится отдельным фактом: что ест кот, что брат не любит
              сюрпризы. Факты лежат в&nbsp;разделе «Память», любой можно стереть, а&nbsp;на всех
              устройствах память одна.
            </Block>
          </section>

          <section className={`${styles.shot} ${styles.chapter}`}>
            <div className={styles.line}>
              <Lead head="Остальное в&nbsp;том&nbsp;же&nbsp;разговоре">
                Задачи и&nbsp;заметки работают сразу. Цели, калории, траты, бег и&nbsp;радар человек
                добавляет сам на&nbsp;витрине приложений, поэтому в&nbsp;меню только то, чем
                он&nbsp;пользуется.
              </Lead>
              <Block
                name="small"
                head="Напоминает"
                pic={
                  <Tile
                    file="f-remind"
                    h={707}
                    alt="Карточка задачи: оплатить интернет, четверг, 9:00"
                  />
                }
              >
                Обычная фраза становится задачей со&nbsp;временем и, если нужно, с&nbsp;повтором.
                На&nbsp;карточке сразу видно, что и&nbsp;когда Мемо понял.
              </Block>
            </div>
            <div className={styles.line}>
              <Block
                name="small"
                head="Ведёт к цели"
                pic={
                  <Tile
                    file="f-goal"
                    h={1005}
                    alt="Карточка цели: читать 20 минут в день, 5 из 7 на этой неделе"
                  />
                }
              >
                Цель может быть привычкой или проектом. Мемо разбивает её на&nbsp;шаги: сделанное
                отмечается одним касанием или словами, а&nbsp;в&nbsp;конце недели он подводит итоги.
              </Block>
              <Block
                name="small"
                head="Считает еду и траты"
                pic={
                  <Tile
                    file="f-food"
                    h={767}
                    alt="Карточка еды: сырники со сметаной, 410 килокалорий"
                  />
                }
              >
                Еду можно описать или снять на&nbsp;фото: Мемо посчитает калории и&nbsp;белок, рядом
                ведёт воду и&nbsp;вес. Траты раскладывает по&nbsp;счетам и&nbsp;категориям.
              </Block>
            </div>
            <div className={styles.line}>
              <Block
                name="run"
                head="Считает километры"
                pic={
                  <Tile
                    file="f-run"
                    h={1236}
                    alt="Карточка пробежки: маршрут, 5,2 километра, время и темп"
                  />
                }
              >
                Бег и&nbsp;ходьба записываются с&nbsp;километрами, темпом и&nbsp;маршрутом. Телефон
                можно убрать в&nbsp;карман, а&nbsp;история и&nbsp;прогресс копятся на&nbsp;своём
                экране.
              </Block>
              <Block
                name="small"
                head="Находит и рисует"
                pic={
                  <Tile
                    file="f-radar"
                    h={735}
                    alt="Карточка радара: городская новость, пересказанная коротко, с кнопками «Опубликовать» и «Пропустить»"
                  />
                }
              >
                Телеграм-радар пересказывает новое из&nbsp;выбранных каналов. Списки и&nbsp;тексты
                из&nbsp;чата лежат в&nbsp;«Заметках». По&nbsp;описанию Мемо делает картинку или
                правит фото.
              </Block>
            </div>
          </section>

          <section className={`${styles.shot} ${styles.chapter}`}>
            <Block
              name="memo"
              head="Имя и Мемо"
              pic={
                <Img
                  file="memo"
                  w={1600}
                  h={1305}
                  alt="Мемо, персонаж приложения"
                  className={styles.memoPic}
                />
              }
            >
              Имя сложено из memory, память, и&nbsp;meridian, меридиан: помощник, который помнит
              важное и&nbsp;помогает держать курс. Мемо его лицо: имя меняется одной фразой
              в&nbsp;чате, образ и&nbsp;характер задаются в&nbsp;настройках.
            </Block>
            <Block
              name="site"
              head="Сайт"
              pic={
                <div className={styles.page}>
                  <Img file="site" w={2880} h={1620} alt="Первый экран сайта memoridian.com" />
                </div>
              }
            >
              Вместо обещаний сайт показывает сам продукт: вокруг названия плывут настоящие карточки
              приложения. Меняется строка под&nbsp;названием, и&nbsp;вместе с&nbsp;ней подходит
              карточка того&nbsp;же смысла.
            </Block>
            <Block
              name="how"
              head="Сценки на телефоне"
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
              Раздел «Посмотри, как это работает»: телефон проигрывает память, напоминания, калории
              и&nbsp;финансы. Реплики появляются одна за&nbsp;другой, а&nbsp;тему можно выбрать
              в&nbsp;списке рядом.
            </Block>
          </section>

          <section className={`${styles.shot} ${styles.chapter}`}>
            <div className={styles.line}>
              <Lead head="Дизайн-система">
                Общий набор цветов, шрифта и&nbsp;готовых блоков, из&nbsp;которых собраны все
                экраны. Поэтому приложение и&nbsp;версия в&nbsp;браузере выглядят одним продуктом.
              </Lead>
              <Block
                name="colors"
                head="Цвета"
                pic={
                  <div className={styles.swatches}>
                    {SWATCHES.map(([hex, ink]) => (
                      <i key={hex} className="no-invert" style={{ background: hex, color: ink }}>
                        <span>{hex}</span>
                      </i>
                    ))}
                  </div>
                }
              >
                Один оранжевый для действий, основа нейтральная. Блоки берут не&nbsp;сам цвет,
                а&nbsp;его роль: поверхность, текст, действие. Тема подменяет цвета ролей.
              </Block>
            </div>
            <Block
              name="type"
              head="Шрифт"
              pic={
                <div className={styles.ink}>
                  <Img
                    file="ds-type"
                    w={1470}
                    h={753}
                    alt="Семь размеров шрифта: от заголовка экрана 32 до метки 12"
                  />
                </div>
              }
            >
              Семь основных размеров, от&nbsp;метки 12 до&nbsp;заголовка экрана 32. Размеров
              немного, и&nbsp;шаг между ними заметный: на&nbsp;экране сразу видно, что главное,
              а&nbsp;что подпись.
            </Block>
            <div className={styles.line}>
              <Block
                name="icons"
                head="Иконки"
                pic={
                  <div className={styles.ink}>
                    <Img
                      file="ds-icons"
                      w={1470}
                      h={735}
                      alt="Двадцать иконок приложения"
                      className={styles.iconsPic}
                    />
                  </div>
                }
              >
                Один набор на&nbsp;всё приложение: разделы, действия, настройки. Одна сетка, одна
                толщина линии, рисунок контуром: значки не&nbsp;спорят с&nbsp;текстом.
              </Block>
              <Block
                name="parts"
                head="Блоки"
                pic={
                  <Img
                    file="ds-blocks"
                    w={1470}
                    h={858}
                    alt="Кнопки «Записать» и «Изменить», чипы счетов, метки, переключатели, плитки разделов, поле ввода"
                  />
                }
              >
                Кнопки, чипы счетов, метки, переключатели, плитки разделов и&nbsp;поле ввода. Каждая
                деталь сделана один раз и&nbsp;работает в&nbsp;обеих темах.
              </Block>
            </div>
            <Block
              name="fin"
              head="Карточка из блоков"
              pic={
                <Kit
                  file="ds-fin"
                  h={1249}
                  alt="Карточка «Финансы», собранная из тех же блоков: три траты, итог, сумма за день, кнопки"
                />
              }
            >
              «Финансы» собраны из&nbsp;тех&nbsp;же деталей: метка счёта, строки трат, итог
              и&nbsp;кнопки. Новому разделу не&nbsp;нужны новые правила&nbsp;оформления.
            </Block>
          </section>

          <section className={`${styles.shot} ${caseStyles.plain}`}>
            <End c={c} act={act} />
          </section>
        </>
      )}
    </>
  );
}
