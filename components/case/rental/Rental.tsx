import type { ReactNode } from "react";
import type { CaseData } from "@/components/scenes/Scene3";
import caseStyles from "../Case.module.css";
import { type CaseActions, End } from "../CaseView";
import { Duo } from "../memoridian/Duo";
import base from "../memoridian/Showcase.module.css";
import styles from "./Rental.module.css";

// Страница системы для посуточной аренды Rental (docs/12-case-page.md): тот же вид, что у Memoridian, наш
// продукт. Идёт от кабинета управляющей компании к деньгам, собственнику и горничной. Снимки — настоящий
// интерфейс на локальном демо-стенде, данные демо-УК «Аркадия» выдуманные.

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const src = (file: string) => `${BASE}/works/rental/${file}.webp`;

// m — кусок снимка для телефона [файл, ширина, высота]: у кабинета УК нет мобильной вёрстки.
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

// Два экрана телефона рядом.
function Pair(p: { items: [string, string][] }) {
  return (
    <div className={styles.pair}>
      {p.items.map(([file, alt]) => (
        <figure key={file} className={styles.device}>
          <Img file={file} w={1170} h={2532} alt={alt} />
        </figure>
      ))}
    </div>
  );
}

const SWATCHES = [
  ["#1A1F2C", "#FFFFFF"],
  ["#4F46E5", "#FFFFFF"],
  ["#059669", "#FFFFFF"],
  ["#FAF8F4", "#1A1F2C"],
  ["#C6913B", "#1A1F2C"],
  ["#FF5A3C", "#FFFFFF"],
];

export function Rental({ c, act, full }: { c: CaseData; act: CaseActions; full: boolean }) {
  return (
    <>
      <section className={`${base.shot} ${base.intro}`}>
        <h1 className={base.title} id="case-title" data-hi>
          Посуточная аренда <br />
          Rental
        </h1>
        <p className={`${base.text} ${base.lead}`} data-hi>
          Квартиры, брони со&nbsp;всех площадок, уборки и&nbsp;отчёты собственникам. Три кабинета:
          для управляющей компании, собственников и&nbsp;горничных. Наш продукт.
        </p>
        <Duo
          slug="rental"
          className={base.duo}
          data-cover=""
          alts={[
            "Дашборд управляющей компании: выручка за ноябрь, заполняемость 41%, статус каждой квартиры на сегодня и уборки дня",
            "Кабинет собственника на телефоне: к выплате в этом месяце 129 580 ₽ и отчёт за октябрь на подпись",
          ]}
        />
        <div className={base.facts} data-hi>
          <div>
            <p className={base.text}>Что входило в работу</p>
            <ul className={`${base.note} ${base.list}`}>
              <li>Кабинет управляющей компании</li>
              <li>Приложение собственника</li>
              <li>Приложение горничной</li>
              <li>Брони из Суточно.ру, Авито, Яндекс Путешествий и Циана</li>
              <li>Отчёты агента в PDF с подписью собственника</li>
            </ul>
          </div>
          <div>
            <p className={base.text}>Для кого</p>
            <ul className={`${base.note} ${base.list}`}>
              <li>Управляющие компании посуточной аренды</li>
              <li>Собственники квартир</li>
              <li>Горничные и техники</li>
            </ul>
          </div>
        </div>
      </section>

      {full && (
        <>
          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="bookings"
              head="Брони со&nbsp;всех площадок"
              pic={
                <div className={base.page}>
                  <Img
                    file="bookings"
                    m={["bookings-m", 980, 1060]}
                    w={1560}
                    h={1290}
                    alt="Список броней: даты и число ночей, квартира, гость, канал — Суточно.ру, Авито или прямая бронь, сумма и статус"
                  />
                </div>
              }
            >
              Брони с&nbsp;Суточно.ру, Авито, Яндекс Путешествий и&nbsp;Циана подтягиваются сами,
              прямые менеджер добавляет руками. Если даты на&nbsp;одной квартире пересеклись, бронь
              попадёт в&nbsp;список конфликтов.
            </Block>
            <Block
              name="tasks"
              head="Уборки без звонков"
              pic={
                <div className={base.page}>
                  <Img
                    file="tasks"
                    m={["tasks-m", 1000, 960]}
                    w={1560}
                    h={1290}
                    alt="Задачи по дням: уборки после выезда и подготовка к заезду, у каждой время, горничная, пункты чек-листа и статус"
                  />
                </div>
              }
            >
              После выезда гостя уборка создаётся сама по&nbsp;шаблону и&nbsp;уходит горничной этой
              квартиры. Видно, что сделано сегодня, что завтра и&nbsp;сколько пунктов чек-листа уже
              закрыто.
            </Block>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="statements"
              head="Отчёт агента за&nbsp;месяц"
              pic={
                <div className={base.page}>
                  <Img
                    file="statements"
                    m={["statements-m", 1130, 340]}
                    w={1560}
                    h={720}
                    alt="Отчёты собственникам за октябрь: брутто, комиссия, расходы, к выплате и статус «Ждёт подписи» или «Подписан», у каждого PDF"
                  />
                </div>
              }
            >
              Выручка, комиссия управляющей компании, расходы и&nbsp;сумма к&nbsp;выплате
              по&nbsp;каждому собственнику. Отчёт собирается в&nbsp;PDF и&nbsp;уходит
              на&nbsp;подпись, а&nbsp;подписанный месяц закрыт: поправки идут отдельной
              корректировкой.
            </Block>
            <Block
              name="owner"
              head="Кабинет собственника"
              pic={
                <Pair
                  items={[
                    [
                      "owner-statements",
                      "Финансовые отчёты собственника: отчёт за октябрь требует подписи, к выплате 145 360 ₽, кнопки PDF и «Подписать»",
                    ],
                    [
                      "owner-incomes",
                      "Доходы собственника за ноябрь: его доля 134 080 ₽, ниже каждая бронь с валовой суммой и комиссией",
                    ],
                  ]}
                />
              }
            >
              Сколько придёт в&nbsp;этом месяце, загрузка каждой квартиры, ближайшие брони
              и&nbsp;доход с&nbsp;каждой из&nbsp;них. Отчёт собственник читает и&nbsp;подписывает
              с&nbsp;телефона, а&nbsp;самозанятому кабинет считает налог.
            </Block>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="cleaner"
              head="Приложение горничной"
              pic={
                <Pair
                  items={[
                    [
                      "cleaner-today",
                      "Экран горничной на сегодня: следующая задача — уборка после выезда в 14:00 по адресу, кнопка «Открыть», ниже уборки на неделе",
                    ],
                    [
                      "cleaner-task",
                      "Карточка уборки: фото квартиры, время выезда и код замка, кнопка «Начать работу» и чек-лист с обязательными пунктами",
                    ],
                  ]}
                />
              }
            >
              Уборки на&nbsp;сегодня и&nbsp;на&nbsp;неделю, адрес, время выезда и&nbsp;код замка.
              В&nbsp;карточке&nbsp;— чек-лист с&nbsp;обязательными пунктами и&nbsp;место для фото
              после уборки.
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
              У&nbsp;каждой роли свой вид: в&nbsp;кабинете тёмное меню и&nbsp;индиго,
              у&nbsp;собственника кремовый с&nbsp;золотом и&nbsp;заголовки Fraunces,
              у&nbsp;горничной оранжевый и&nbsp;крупные кнопки. Основной шрифт&nbsp;— Manrope.
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
