import type { ReactNode } from "react";
import type { CaseData } from "@/components/scenes/Scene3";
import caseStyles from "../Case.module.css";
import { type CaseActions, End } from "../CaseView";
import { Duo } from "../memoridian/Duo";
import base from "../memoridian/Showcase.module.css";
import styles from "./AnimalsTravel.module.css";

// Страница сайта Animals Travel (docs/12-case-page.md): тот же вид, что у Memoridian и Globaldrive.
// Снимки — настоящий сайт, ссылок на него нет. Карточки на главной нет: только прямой адрес.

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const src = (file: string) => `${BASE}/works/animals-travel/${file}.webp`;

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

const SWATCHES = [
  ["#009CEE", "#141414"],
  ["#2B7DE0", "#FFFFFF"],
  ["#007EE4", "#FFFFFF"],
  ["#333333", "#FFFFFF"],
  ["#2F3338", "#FFFFFF"],
  ["#F0F2F7", "#141414"],
];

export function AnimalsTravel({ c, act, full }: { c: CaseData; act: CaseActions; full: boolean }) {
  return (
    <>
      <section className={`${base.shot} ${base.intro}`}>
        <h1 className={base.title} id="case-title" data-hi>
          Сайт перевозок <br />
          Animals&nbsp;Travel
        </h1>
        <p className={`${base.text} ${base.lead}`} data-hi>
          Сайт компании, которая перевозит домашних животных в&nbsp;другой город и&nbsp;другую
          страну.
        </p>
        <Duo
          slug="animals-travel"
          className={base.duo}
          data-cover=""
          alts={[
            "Главная страница в окне браузера: собака смотрит из окна машины, заголовок «Перевозка домашних животных автомобилем»",
            "Плитка услуги «Оформление документов»: кот в шляпе с паспортом",
            "Плитка услуги «Передержка домашних животных»: кот спит в кресле",
            "Плитка «Переноски, поилки и др.»: котёнок с тележкой и переноски",
          ]}
        />
        <div className={base.facts} data-hi>
          <div>
            <p className={base.text}>Что входило в работу</p>
            <ul className={`${base.note} ${base.list}`}>
              <li>Перевозка: самолёт, поезд, автомобиль</li>
              <li>Документы, ветеринар, передержка</li>
              <li>Переноски и другие товары</li>
              <li>Цены, статьи, вопросы и ответы</li>
              <li>Заявка внизу страницы</li>
              <li>Версия для телефона</li>
            </ul>
          </div>
        </div>
      </section>

      {full && (
        <>
          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="train"
              head="Три способа доехать на&nbsp;первом экране"
              pic={
                <div className={base.page}>
                  <Img
                    file="slide-train"
                    m={["slide-train-m", 780, 904]}
                    w={2000}
                    h={1038}
                    alt="Кадр первого экрана: поезд и собака с красным рюкзаком, заголовок «Перевозка домашних животных поездом»"
                  />
                </div>
              }
            >
              Первый экран показывает самолёт, поезд и&nbsp;автомобиль. Устройство у&nbsp;кадров
              одно: подпись, заголовок, короткий текст и&nbsp;две кнопки. Герой каждого кадра&nbsp;—
              собака рядом со&nbsp;своим транспортом.
            </Block>
            <Block
              name="tiles"
              head="Кот с&nbsp;паспортом вместо значка"
              pic={
                <div className={styles.row}>
                  <div className={base.page}>
                    <Img
                      file="tile-docs"
                      w={720}
                      h={628}
                      alt="Плитка «Оформление документов»: кот в шляпе с паспортом и билетом"
                    />
                  </div>
                  <div className={base.page}>
                    <Img
                      file="tile-sitter"
                      w={720}
                      h={628}
                      alt="Плитка «Передержка домашних животных»: кот спит в синем кресле"
                    />
                  </div>
                  <div className={base.page}>
                    <Img
                      file="tile-carriers"
                      w={720}
                      h={628}
                      alt="Плитка «Переноски, поилки и др.»: котёнок с тележкой рядом с переносками"
                    />
                  </div>
                </div>
              }
            >
              Услуги под первым экраном идут плитками с&nbsp;большими картинками. Кот в&nbsp;шляпе
              держит паспорт и&nbsp;билет, другой спит в&nbsp;синем кресле, котёнок катит тележку
              мимо переносок. Услугу видно раньше подписи.
            </Block>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="list"
              head="Способы перевозки одним списком"
              pic={
                <div className={base.page}>
                  <Img
                    file="list-transport"
                    w={1384}
                    h={1448}
                    alt="Список услуг: перевозка поездом, автомобилем и на самолёте, у каждой картинка с транспортом, животным и багажом"
                  />
                </div>
              }
            >
              В&nbsp;разделе услуг у&nbsp;каждого способа своя строка: картинка, заголовок, начало
              текста и&nbsp;стрелка. Картинки собраны по&nbsp;одному рецепту: транспорт, животное
              и&nbsp;багаж, поэтому поезд, машина и&nbsp;самолёт читаются одним набором.
            </Block>
            <Block
              name="carriers"
              head="Размер переноски прямо в&nbsp;названии"
              pic={
                <div className={base.page}>
                  <Img
                    file="carriers"
                    m={["carriers-m", 1060, 840]}
                    w={1590}
                    h={840}
                    alt="Переноски в каталоге: у каждой название с размером, метка «в наличии» и цена"
                  />
                </div>
              }
            >
              В&nbsp;каталоге размер стоит в&nbsp;самом названии товара, ниже метка наличия
              и&nbsp;цена. Если переноски нет, метка меняется на&nbsp;«под заказ», а&nbsp;вместо
              суммы стоит «цена под запрос».
            </Block>
            <Block
              name="price"
              head="Как считается цена"
              pic={
                <div className={base.page}>
                  <Img
                    file="price-call"
                    m={["price-call-m", 780, 1600]}
                    w={1636}
                    h={982}
                    alt="Блок страницы цен: чёрный бульдог с синей телефонной трубкой, вопрос о перевозке животного и две кнопки"
                  />
                </div>
              }
            >
              Общего списка цен на&nbsp;маршруты нет, поэтому страница объясняет, от&nbsp;чего
              зависит сумма, а&nbsp;сопутствующие услуги показывает таблицей. Между ними чёрный
              бульдог с&nbsp;телефонной трубкой ведёт к&nbsp;вопросу или звонку.
            </Block>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <div className={base.line}>
              <Block
                name="card"
                head="Щенок, готовый к&nbsp;перевозке"
                pic={
                  <div className={base.page}>
                    <Img
                      file="form-card"
                      w={1348}
                      h={1070}
                      alt="Синяя карточка заявки: щенок в жёлтой куртке с рюкзаком и фраза «К перевозке готов!»"
                    />
                  </div>
                }
              >
                Форма заявки начинается с&nbsp;иллюстрации: щенок в&nbsp;шляпе и&nbsp;очках,
                с&nbsp;рюкзаком и&nbsp;фразой «К&nbsp;перевозке готов!». Синяя карточка
                с&nbsp;картой мира и&nbsp;следами лап стоит внизу большинства страниц.
              </Block>
              <Block
                name="fields"
                head="Заявка начинается с&nbsp;маршрута"
                pic={
                  <div className={base.page}>
                    <Img
                      file="form-fields"
                      w={1332}
                      h={1070}
                      alt="Пустые поля заявки: откуда, куда, кого везти, нужна ли передержка, имя, телефон, комментарий и кнопка «Узнать цену»"
                    />
                  </div>
                }
              >
                Первые поля спрашивают, откуда и&nbsp;куда, затем кого везти и&nbsp;нужна ли
                передержка. Между городами видна круглая кнопка со&nbsp;стрелками: по&nbsp;коду
                сайта она меняет поля местами. В&nbsp;конце&nbsp;— «Узнать цену».
              </Block>
            </div>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="phones"
              head="На&nbsp;телефоне всё в&nbsp;один столбик"
              pic={
                <div className={styles.pair}>
                  <figure className={styles.device}>
                    <Img
                      file="phone-tiles"
                      w={780}
                      h={1688}
                      alt="Главная на телефоне: плитки услуг во всю ширину, кот с паспортом и кот в кресле"
                    />
                  </figure>
                  <figure className={styles.device}>
                    <Img
                      file="phone-form"
                      w={780}
                      h={1688}
                      alt="Заявка на телефоне: карточка со щенком и поля столбиком"
                    />
                  </figure>
                </div>
              }
            >
              Плитки встают во&nbsp;всю ширину экрана, и&nbsp;картинка остаётся главной. Поля заявки
              идут друг под другом, первый экран листается стрелками, а&nbsp;меню прячется
              за&nbsp;кнопкой в&nbsp;шапке.
            </Block>
            <Block
              name="brand"
              head="Синий, Montserrat и&nbsp;лапа в&nbsp;круге"
              pic={
                <div className={styles.brandPic}>
                  <Img
                    file="logo"
                    w={1200}
                    h={223}
                    alt="Логотип Animals Travel: след лапы в круге и подпись «международная перевозка животных»"
                  />
                  <div className={base.swatches}>
                    {SWATCHES.map(([hex, ink]) => (
                      <i key={hex} className="no-invert" style={{ background: hex, color: ink }}>
                        <span>{hex}</span>
                      </i>
                    ))}
                  </div>
                </div>
              }
            >
              Логотип со&nbsp;следом лапы задаёт голубой, кнопки и&nbsp;ссылки синие,
              у&nbsp;карточки заявки свой оттенок. Остальное спокойное: серый текст, светлые
              подложки, тёмный подвал. Шрифт один, Montserrat.
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
