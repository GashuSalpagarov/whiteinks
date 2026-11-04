import type { ReactNode } from "react";
import type { CaseData } from "@/components/scenes/Scene3";
import caseStyles from "../Case.module.css";
import { type CaseActions, End } from "../CaseView";
import { Duo } from "../memoridian/Duo";
import base from "../memoridian/Showcase.module.css";
import styles from "./ContentFactory.module.css";

// Страница контент-завода The Viewer (docs/12-case-page.md): тот же вид, что у Memoridian, наш продукт.
// Идёт от образа канала к тому, что выходит, как это устроено и чем управляется. Карусель, кадры роликов
// и оформление — настоящие файлы завода; в панели — настоящие посты канала, площадки Meta из кадра убраны.

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const src = (file: string) => `${BASE}/works/content-factory/${file}.webp`;

// m — снимок для телефона [файл, ширина, высота]: снимок компьютера на 350 px не читается.
function Img(p: { file: string; w: number; h: number; alt: string; m?: [string, number, number] }) {
  const img = (
    // biome-ignore lint/performance/noImgElement: статический экспорт, файлы из public как есть
    <img src={src(p.file)} width={p.w} height={p.h} alt={p.alt} decoding="async" />
  );
  if (!p.m) return img;
  return (
    <picture>
      <source media="(max-width: 767px)" srcSet={src(p.m[0])} width={p.m[1]} height={p.m[2]} />
      {img}
    </picture>
  );
}

function Block(p: { name: string; pic: ReactNode; head: string; children: ReactNode }) {
  return (
    <div className={`${base.block} ${styles[p.name]}`} data-rise>
      <div className={base.pic}>{p.pic}</div>
      <div className={base.copy}>
        <h2 className={base.head}>{p.head}</h2>
        <p className={base.text}>{p.children}</p>
      </div>
    </div>
  );
}

// Текст без картинки: шаги конвейера и правила для России стоят рядом.
function Lead(p: { head: string; children: ReactNode }) {
  return (
    <div className={`${base.copy} ${styles.lead}`} data-rise>
      <h2 className={base.head}>{p.head}</h2>
      {p.children}
    </div>
  );
}

const SWATCHES = [
  ["#EFE3CF", "#1B1F24"],
  ["#1B1F24", "#FFFFFF"],
  ["#D9A441", "#1B1F24"],
  ["#2F6F73", "#FFFFFF"],
  ["#B5523B", "#FFFFFF"],
  ["#FFB020", "#1B1F24"],
];

const CARDS: [string, string][] = [
  ["card-01", "Обложка карусели: «Digit 5: робот не той мечты», рубрика «Родня» и герой канала"],
  ["card-02", "Карточка «В цифрах»: 23 кг на верхние полки склада и 90 минут работы от батареи"],
  [
    "card-04",
    "Карточка-мысль на тёмном экране: «Университеты закончились на десятом роботе. Ящики — нет»",
  ],
];

const FRAMES: [string, string][] = [
  ["frame-1", "Начало ролика: заголовок новости и иллюстрация с перфолентой"],
  ["frame-2", "Середина ролика: иллюстрация, герой канала и субтитры «причину зацикливания»"],
  ["frame-3", "Карточка с цифрой 48,1% — результат на MATH-500, внизу субтитры «с 7,9% до 48,1%»"],
];

const link = (href: string, label: string) => (
  <a href={href} target="_blank" rel="noopener noreferrer">
    {label}
  </a>
);

export function ContentFactory({ c, act, full }: { c: CaseData; act: CaseActions; full: boolean }) {
  return (
    <>
      <section className={`${base.shot} ${base.intro}`}>
        <h1 className={base.title} id="case-title" data-hi>
          Контент-завод <br />
          The&nbsp;Viewer
        </h1>
        <p className={`${base.text} ${base.lead}`} data-hi>
          Сам находит новости про ИИ и&nbsp;роботов, пишет посты, верстает карточки и&nbsp;ролики
          и&nbsp;выпускает их на&nbsp;площадках. Наш продукт.
        </p>
        <Duo
          slug="content-factory"
          className={base.duo}
          data-cover=""
          alts={[
            "Веб-панель завода: пост на просмотре, проверка фактов 1.00 и текст так, как он выйдет в Telegram",
            "Кадр ролика на телефоне: «Большая нейросеть починила маленькую, поправив 0,016% чисел внутри» и иллюстрация",
          ]}
        />
        <div className={base.facts} data-hi>
          <div>
            <p className={base.text}>Что входило в работу</p>
            <ul className={`${base.note} ${base.list}`}>
              <li>Образ канала и оформление площадок</li>
              <li>Конвейер: новости, сюжеты, отбор, текст, проверка фактов</li>
              <li>Карусели и ролики с голосом и субтитрами</li>
              <li>Выпуск по расписанию на русском и английском</li>
              <li>Пульт в Telegram и веб-панель</li>
            </ul>
          </div>
          <div>
            <p className={base.text}>Где найти</p>
            <ul className={`${base.note} ${base.list}`}>
              <li>Telegram: {link("https://t.me/viewer_tv_ru", "t.me/viewer_tv_ru")}</li>
              <li>ВКонтакте: {link("https://vk.ru/viewer_tv", "vk.ru/viewer_tv")}</li>
              <li>Дзен: {link("https://dzen.ru/theviewer", "dzen.ru/theviewer")}</li>
              <li>YouTube: {link("https://www.youtube.com/@viewer_tv_ru", "@viewer_tv_ru")}</li>
            </ul>
          </div>
        </div>
      </section>

      {full && (
        <>
          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="banner"
              head="Канал, который ведёт ИИ"
              pic={
                <div className={styles.art}>
                  <Img
                    file="banner"
                    m={["banner-m", 1100, 711]}
                    w={2000}
                    h={855}
                    alt="Шапка канала: гостиная с креслом и тумбой, у окна робот с головой-телевизором, надпись «The Viewer. AI & robots • ИИ и роботы»"
                  />
                </div>
              }
            >
              Новости про ИИ и&nbsp;роботов каждый день, на&nbsp;русском и&nbsp;английском. Что
              канал ведёт ИИ, сказано в&nbsp;его описании, а&nbsp;лицо канала&nbsp;— робот
              с&nbsp;головой лампового телевизора. Шапки и&nbsp;аватары собраны под каждую площадку.
            </Block>
            <Block
              name="sheet"
              head="Герой без лица"
              pic={
                <div className={styles.art}>
                  <Img
                    file="sheet"
                    w={1800}
                    h={1004}
                    alt="Герой канала спереди, вполоборота и со спины: голова — деревянный телевизор с антеннами и салфеткой, тело — металлический робот"
                  />
                </div>
              }
            >
              Настроение показывает экран: волна голоса, помехи, знак вопроса. Героя нарисовали
              в&nbsp;нескольких позах&nbsp;— говорит, машет, идёт, растерян, записывает
              обещание,&nbsp;— и&nbsp;ролик сам берёт нужную под реплику.
            </Block>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="cards"
              head="Карусели"
              pic={
                <div className={styles.trio}>
                  {CARDS.map(([file, alt]) => (
                    <figure key={file} className={styles.card}>
                      <Img file={file} w={810} h={1013} alt={alt} />
                    </figure>
                  ))}
                </div>
              }
            >
              Новость раскладывается на&nbsp;карточки: заголовок, цифры, главная мысль
              и&nbsp;источник. Вёрстку делает сам завод, без дизайнера, в&nbsp;цветах канала.
            </Block>
            <Block
              name="frames"
              head="Ролики на&nbsp;полминуты"
              pic={
                <div className={styles.trio}>
                  {FRAMES.map(([file, alt]) => (
                    <figure key={file} className={styles.device}>
                      <Img file={file} w={720} h={1280} alt={alt} />
                    </figure>
                  ))}
                </div>
              }
            >
              Сценарий, иллюстрации к&nbsp;новости, голос, субтитры с&nbsp;подсветкой слова
              и&nbsp;карточки с&nbsp;цифрами. Ролик завод собирает целиком, русская
              и&nbsp;английская версии выходят отдельно.
            </Block>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <div className={base.line}>
              <Lead head="От новости до поста">
                <ol className={`${base.text} ${styles.steps}`}>
                  <li>Собирает новости из&nbsp;лент и&nbsp;сайтов про ИИ и&nbsp;роботов.</li>
                  <li>
                    Склеивает заметки об&nbsp;одном событии в&nbsp;сюжет, отбирает главное
                    и&nbsp;даёт рубрику: «Наблюдение», «Родня» про роботов, «Телетекст» про
                    программирование, «Дальний приём» про науку, «Обещали&nbsp;— сделали?».
                  </li>
                  <li>Пишет под каждую площадку и&nbsp;язык: пост, карусель, сценарий ролика.</li>
                  <li>
                    Сверяет каждое утверждение с&nbsp;источником: что не&nbsp;подтвердилось,
                    не&nbsp;выходит.
                  </li>
                  <li>Ставит в&nbsp;расписание с&nbsp;лимитами площадок и&nbsp;публикует сам.</li>
                </ol>
              </Lead>
              <Lead head="Правила для России">
                <p className={base.text}>
                  Завод знает, о&nbsp;чём писать нельзя: такие темы пропускает, издания
                  из&nbsp;чёрного списка не&nbsp;цитирует, обязательные пометки ставит сам. Политики
                  и&nbsp;советов про здоровье и&nbsp;деньги нет ни&nbsp;на&nbsp;одном языке, спорное
                  уходит человеку на&nbsp;просмотр.
                </p>
              </Lead>
            </div>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="jokes"
              head="Последнее слово за&nbsp;человеком"
              pic={
                <div className={base.page}>
                  <Img
                    file="jokes"
                    m={["jokes-m", 1098, 1500]}
                    w={1152}
                    h={996}
                    alt="Пост на просмотре в панели: пять запасных шуток с кнопкой «Поставить», ниже «Опубликовать», «Переписать», «Править текст» и «Выкинуть»"
                  />
                </div>
              }
            >
              Пост на&nbsp;просмотре виден так, как выйдет, с&nbsp;оценкой проверки фактов.
              К&nbsp;каждому тексту завод пишет запасные шутки: любую можно поставить вместо прежней
              одной кнопкой. То&nbsp;же самое умеет пульт в&nbsp;Telegram.
            </Block>
            <Block
              name="published"
              head="Всё, что вышло"
              pic={
                <div className={base.page}>
                  <Img
                    file="published"
                    m={["published-m", 1170, 1800]}
                    w={1350}
                    h={1050}
                    alt="Список вышедших постов: ролики, посты VK и Telegram на русском и английском, у каждого площадки и ссылки"
                  />
                </div>
              }
            >
              У&nbsp;каждого поста&nbsp;— площадки, где он вышел, и&nbsp;ссылки. Исправить или
              удалить вышедший текст можно сразу везде, а&nbsp;где площадка этого не&nbsp;позволяет,
              панель скажет, что сделать вручную.
            </Block>
            <Block
              name="colors"
              head="Цвета и&nbsp;шрифты"
              pic={
                <div className={base.swatches}>
                  {SWATCHES.map(([hex, ink]) => (
                    <i key={hex} className="no-invert" style={{ background: hex, color: ink }}>
                      <span>{hex}</span>
                    </i>
                  ))}
                </div>
              }
            >
              Беж старых обоев, чернила, горчица, бирюза и&nbsp;кирпич&nbsp;— одни цвета
              у&nbsp;иллюстраций, карточек и&nbsp;роликов, у&nbsp;логотипа&nbsp;— янтарь. Логотип
              набран Righteous, карточки и&nbsp;субтитры&nbsp;— Montserrat.
            </Block>
          </section>

          <section className={`${base.shot} ${caseStyles.plain}`}>
            <End c={c} act={act} />
          </section>
        </>
      )}
    </>
  );
}
