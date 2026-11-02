import type { ReactNode } from "react";
import type { CaseData } from "@/components/scenes/Scene3";
import caseStyles from "../Case.module.css";
import { type CaseActions, End } from "../CaseView";
import { Duo } from "../memoridian/Duo";
import base from "../memoridian/Showcase.module.css";
import styles from "./Goroddorog.module.css";

// Страница автошколы «Город Дорог» (docs/12-case-page.md): тот же вид, что у Memoridian. Стили текста и
// общие правила — из Showcase.module.css, здесь только свои блоки, их ширины и места. Снимки — копия
// сайта из веб-архива: фото людей, телефоны и реквизиты в кадр не взяты, экран планшета в шаге 5 размыт.
// Ссылок на сайт на странице нет.

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const src = (file: string) => `${BASE}/works/goroddorog/${file}.webp`;

// m — снимок для телефона [файл, ширина, высота]: на 350 px снимок компьютера не читается.
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
  ["#FF1E48", "#FFFFFF"],
  ["#EF002A", "#FFFFFF"],
  ["#161A25", "#FFFFFF"],
  ["#FFFFFF", "#161A25"],
  ["#F5F8FD", "#161A25"],
  ["#F0F3F6", "#161A25"],
];

export function Goroddorog({ c, act, full }: { c: CaseData; act: CaseActions; full: boolean }) {
  return (
    <>
      <section className={`${base.shot} ${base.intro}`}>
        <h1 className={base.title} id="case-title" data-hi>
          Автошкола <br />
          «Город&nbsp;Дорог»
        </h1>
        <p className={`${base.text} ${base.lead}`} data-hi>
          Сайт автошколы в&nbsp;Москве: тарифы, шаги до&nbsp;прав и&nbsp;классы у&nbsp;метро.
        </p>
        <Duo
          slug="goroddorog"
          className={base.duo}
          data-cover=""
          alts={[
            "Карточка тарифа «Оптима»: белая машина школы среди красных кубиков со скидками, часы и цены",
            "Карточка тарифа «Ультра»: машина со светофором и пламенем, часы и цены",
            "Карточка тарифа «Бриллиант»: машина среди кристаллов, взнос и цена",
          ]}
        />
        <div className={base.facts} data-hi>
          <div>
            <p className={base.text}>Что входило в работу</p>
            <ul className={`${base.note} ${base.list}`}>
              <li>Тарифы и таблица скрытых платежей</li>
              <li>Десять шагов до удостоверения</li>
              <li>Учебные классы у метро</li>
              <li>Подарочные сертификаты</li>
              <li>Версия для телефона</li>
            </ul>
          </div>
        </div>
      </section>

      {full && (
        <>
          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="steps"
              head="Десять шагов до прав"
              pic={
                <Img
                  file="steps"
                  m={["steps-m", 1072, 1368]}
                  w={2200}
                  h={1380}
                  alt="Десять карточек с номерами: заявка, договор, оплата, доступ к платформе, видео-уроки, зачёт, практика, экзамен, документы и удостоверение"
                />
              }
            >
              Весь путь ученика разложен на&nbsp;десять карточек: от&nbsp;заявки и&nbsp;договора
              онлайн до&nbsp;зачёта, вождения и&nbsp;экзамена в&nbsp;ГИБДД. У&nbsp;каждого шага
              крупный номер и&nbsp;своя картинка, поэтому длинный процесс читается с&nbsp;одного
              взгляда.
            </Block>
            <Block
              name="table"
              head="Скрытые платежи таблицей"
              pic={
                <div className={base.page}>
                  <Img
                    file="table"
                    m={["table-m", 740, 1100]}
                    w={2200}
                    h={634}
                    alt="Таблица: пять видов доплат и их цена в других автошколах, справа цветной столбец «входит в стоимость»"
                  />
                </div>
              }
            >
              Таблица перечисляет, за&nbsp;что в&nbsp;других автошколах просят доплату: вождение
              вечером и&nbsp;в&nbsp;выходные, вебинары, литература, пересдача, документы для ГИБДД.
              Столбец самой школы залит цветным переходом, и&nbsp;в&nbsp;каждой его строке одно:
              входит в&nbsp;стоимость.
            </Block>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <div className={base.line}>
              <Block
                name="tariff"
                head="Карточка тарифа"
                pic={
                  <div className={base.page}>
                    <Img
                      file="t-autumn"
                      w={780}
                      h={1264}
                      alt="Карточка сезонного тарифа: машина школы среди кубиков со скидками, часы вождения, первый взнос, полная цена и цена со скидкой"
                    />
                  </div>
                }
              >
                У&nbsp;каждого тарифа своя картинка с&nbsp;машиной школы: кубики со&nbsp;скидками,
                светофор и&nbsp;пламя, россыпь кристаллов у&nbsp;«Бриллианта». Ниже всё в&nbsp;одном
                порядке: часы вождения, первый взнос, полная цена и&nbsp;цена со&nbsp;скидкой.
                Поэтому тарифы легко сравнить.
              </Block>
              <Block
                name="colors"
                head="Цвета и шрифт"
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
                Красный для кнопок и&nbsp;акцентов, тёмно-синий для тёмных блоков, между ними
                холодные светлые фоны. Заголовки и&nbsp;текст главной набраны Montserrat.
              </Block>
            </div>
            <Block
              name="classes"
              head="Классы у метро"
              pic={
                <div className={base.page}>
                  <Img
                    file="classes"
                    m={["classes-m", 780, 1060]}
                    w={2200}
                    h={1238}
                    alt="Тёмный блок с вечерним городом: пятнадцать кнопок с названиями станций метро, у каждой цветная метка, внизу «Все филиалы»"
                  />
                </div>
              }
            >
              Главный вопрос ученика: далеко&nbsp;ли ездить. На&nbsp;вечернем городе лежат кнопки
              со&nbsp;станциями метро, у&nbsp;каждой своя цветная метка. Кнопка ведёт
              на&nbsp;страницу класса, а&nbsp;«Все филиалы» на&nbsp;полный список.
            </Block>
            <Block
              name="args"
              head="Доводы плитками"
              pic={
                <div className={base.page}>
                  <Img
                    file="args"
                    m={["args-m", 780, 1184]}
                    w={2200}
                    h={1053}
                    alt="Шесть тёмных плиток с красными значками: расписание, занятия рядом, инструктор, срок, варианты обучения и экзамен"
                  />
                </div>
              }
            >
              Шесть плиток на&nbsp;тёмном фоне: расписание, занятия рядом с&nbsp;домом, выбор
              инструктора, срок, варианты обучения, экзамен. У&nbsp;каждой красный значок, а&nbsp;за
              текстом стоит её крупный полупрозрачный номер.
            </Block>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="gift"
              head="Что подарить"
              pic={
                <div className={base.page}>
                  <Img
                    file="gift"
                    m={["gift-m", 780, 1372]}
                    w={2200}
                    h={701}
                    alt="Тёмный блок «Не знаете, что подарить?»: красные круги по краям и открытый красный конверт с сертификатом"
                  />
                </div>
              }
            >
              Обучение можно подарить, и&nbsp;главная говорит об&nbsp;этом отдельным тёмным блоком:
              вопрос, короткий абзац и&nbsp;красный конверт с&nbsp;сертификатом. Цвет конверта
              повторяет кнопку рядом.
            </Block>
            <Block
              name="cert"
              head="Страница сертификатов"
              pic={
                <div className={base.page}>
                  <Img
                    file="cert"
                    w={1500}
                    h={1067}
                    alt="Постановочная сцена: красная учебная машина, рамка «Подарок для тебя» с бантом и ключ с лентой"
                  />
                </div>
              }
            >
              Своя страница начинается с&nbsp;постановочной сцены: красная учебная машина, рамка
              «Подарок для тебя» и&nbsp;ключ с&nbsp;лентой. Ниже варианты сертификатов и&nbsp;список
              того, что входит в&nbsp;цену.
            </Block>
            <Block
              name="phones"
              head="Версия для телефона"
              pic={
                <div className={styles.pair}>
                  <figure className={styles.device}>
                    <Img
                      file="phone-tariff"
                      w={780}
                      h={1688}
                      alt="Тарифы на телефоне: карточки идут одна под другой"
                    />
                  </figure>
                  <figure className={styles.device}>
                    <Img
                      file="phone-table"
                      w={780}
                      h={1688}
                      alt="Таблица платежей на телефоне, пролистанная вбок до цветного столбца школы"
                    />
                  </figure>
                </div>
              }
            >
              Тарифы идут столбиком, одна карточка под другой. Таблица платежей не&nbsp;сжимается:
              она листается вбок, и&nbsp;цветной столбец школы приходит последним.
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
