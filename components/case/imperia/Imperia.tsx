import type { ReactNode } from "react";
import type { CaseData } from "@/components/scenes/Scene3";
import caseStyles from "../Case.module.css";
import { type CaseActions, End } from "../CaseView";
import { Duo } from "../memoridian/Duo";
import base from "../memoridian/Showcase.module.css";
import styles from "./Imperia.module.css";

// Страница сайта «Империя» (docs/12-case-page.md): тот же вид, что у Memoridian и проката. Идёт от записи
// к услугам, ценам и акциям. Снимки — настоящий сайт, ссылок на него нет. Телефоны и адреса клиники,
// врачи, пациенты и обещания о лечении в кадр не взяты.

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const src = (file: string) => `${BASE}/works/imperia/${file}.webp`;

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
  ["#44AA2E", "#FFFFFF"],
  ["#1D9638", "#FFFFFF"],
  ["#38AA95", "#FFFFFF"],
  ["#4BA67A", "#FFFFFF"],
  ["#3E3E3E", "#FFFFFF"],
  ["#F4F4F4", "#141414"],
];

export function Imperia({ c, act, full }: { c: CaseData; act: CaseActions; full: boolean }) {
  return (
    <>
      <section className={`${base.shot} ${base.intro}`}>
        <h1 className={base.title} id="case-title" data-hi>
          Стоматология <br />
          «Империя»
        </h1>
        <p className={`${base.text} ${base.lead}`} data-hi>
          Сайт центра стоматологии под&nbsp;ключ: услуги, цены, врачи и&nbsp;запись.
        </p>
        <Duo
          slug="imperia"
          className={base.duo}
          data-cover=""
          alts={[
            "Список цен: группа «Имплантация зубов» раскрыта на три строки",
            "Колесо скидок: десять секторов",
            "Форма записи: поле «Номер телефона» и кнопка «Записаться на осмотр»",
          ]}
        />
        <div className={base.facts} data-hi>
          <div>
            <p className={base.text}>Что входило в работу</p>
            <ul className={`${base.note} ${base.list}`}>
              <li>Услуги и меню разделов</li>
              <li>Цены</li>
              <li>Страницы врачей</li>
              <li>Запись: форма в одно поле</li>
            </ul>
          </div>
          <div>
            <p className={base.text}>Что есть на сайте</p>
            <ul className={`${base.note} ${base.list}`}>
              <li>13 разделов услуг</li>
              <li>12 групп цен на одной странице</li>
              <li>28 брендов имплантов, у каждого своя страница</li>
              <li>19 акций на главной</li>
            </ul>
          </div>
        </div>
      </section>

      {full && (
        <>
          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="form"
              head="Запись в&nbsp;одно поле"
              pic={
                <div className={base.page}>
                  <Img
                    file="form"
                    w={1200}
                    h={1018}
                    alt="Форма записи на главной: поле «Номер телефона» и кнопка «Записаться на осмотр»"
                  />
                </div>
              }
            >
              На&nbsp;главной для записи хватает номера телефона: ни&nbsp;анкеты, ни&nbsp;выбора
              времени. Строка над полем говорит, что будет дальше: клиника перезвонит сама.
            </Block>
            <Block
              name="services"
              head="Цена прямо на&nbsp;карточке"
              pic={
                <div className={styles.tiles}>
                  <div className={base.page}>
                    <Img
                      file="svc-1"
                      w={812}
                      h={454}
                      alt="Карточка услуги «Протезирование зубов» с зелёным ярлыком цены"
                    />
                  </div>
                  <div className={base.page}>
                    <Img
                      file="svc-2"
                      w={812}
                      h={454}
                      alt="Карточка услуги «Лечение зубов» с зелёным ярлыком цены"
                    />
                  </div>
                </div>
              }
            >
              Шесть услуг стоят на&nbsp;главной карточками: название, пара строк и&nbsp;зелёный
              ярлык с&nbsp;ценой «от». Порядок суммы виден ещё до&nbsp;перехода на&nbsp;страницу
              услуги.
            </Block>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <div className={base.line}>
              <Block
                name="menu"
                head="Меню на&nbsp;весь раздел"
                pic={
                  <div className={base.page}>
                    <Img
                      file="menu"
                      w={552}
                      h={1100}
                      alt="Боковое меню: раздел имплантации раскрыт до списка брендов"
                    />
                  </div>
                }
              >
                На&nbsp;страницах услуг слева стоит постоянное меню: 13&nbsp;разделов, внутри виды
                лечения. У&nbsp;имплантации отдельным списком 28&nbsp;брендов имплантов,
                у&nbsp;каждого своя страница.
              </Block>
              <Block
                name="prices"
                head="Цены одним списком"
                pic={
                  <div className={base.page}>
                    <Img
                      file="prices"
                      w={1200}
                      h={1350}
                      alt="Страница цен: группы со значком зуба и ценой «от», одна группа раскрыта"
                    />
                  </div>
                }
              >
                12&nbsp;групп цен на&nbsp;одной странице. Группа раскрывается на&nbsp;месте, внутри
                строки с&nbsp;отдельными услугами, поэтому список остаётся коротким.
              </Block>
            </div>
            <Block
              name="table"
              head="Стоимость по&nbsp;брендам"
              pic={
                <div className={base.page}>
                  <Img
                    file="table"
                    m={["table-m", 1000, 846]}
                    w={1600}
                    h={1000}
                    alt="Таблица стоимости имплантации: бренд, имплант, анестезия, формирователь десны, протезирование, коронка и итог"
                  />
                </div>
              }
            >
              Имплант лишь часть суммы, поэтому таблица раскладывает её на&nbsp;составные части:
              имплант, анестезия, формирователь десны, элементы протезирования и&nbsp;коронка.
              В&nbsp;конце строки итог без&nbsp;акции и&nbsp;с&nbsp;акцией.
            </Block>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <div className={base.line}>
              <Block
                name="stock"
                head="Акции с&nbsp;расчётом"
                pic={
                  <div className={base.page}>
                    <Img
                      file="stock"
                      w={1100}
                      h={703}
                      alt="Карточка акции: услуга, итог и зачёркнутая старая цена"
                    />
                  </div>
                }
              >
                На&nbsp;главной 19&nbsp;акций каруселью. В&nbsp;карточке услуга, итог
                и&nbsp;зачёркнутая старая цена: разницу не&nbsp;нужно считать самому.
              </Block>
              <Block
                name="wheel"
                head="Колесо скидок"
                pic={
                  <Img
                    file="wheel"
                    w={900}
                    h={900}
                    alt="Колесо скидок: десять секторов, скидки в рублях и процентах, бесплатные пломба и снимок"
                  />
                }
              >
                Поверх главной всплывает колесо: десять секторов, скидки в&nbsp;рублях
                и&nbsp;процентах, бесплатные пломба и&nbsp;снимок.
              </Block>
            </div>
            <Block
              name="phones"
              head="На&nbsp;телефоне один столбец"
              pic={
                <div className={styles.pair}>
                  <figure className={styles.device}>
                    <Img
                      file="phone-svc"
                      w={780}
                      h={1688}
                      alt="Услуги на телефоне: карточки друг под другом, ярлык цены в углу"
                    />
                  </figure>
                  <figure className={styles.device}>
                    <Img
                      file="phone-prices"
                      w={780}
                      h={1688}
                      alt="Цены на телефоне: строки на всю ширину"
                    />
                  </figure>
                </div>
              }
            >
              Карточки услуг встают друг под другом, ярлык с&nbsp;ценой остаётся в&nbsp;углу,
              а&nbsp;строки цен растягиваются на&nbsp;всю ширину. Форма записи та&nbsp;же: номер
              и&nbsp;кнопка.
            </Block>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <div className={base.line}>
              <Block
                name="colors"
                head="Цвета"
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
                Зелёный ведёт кнопки и&nbsp;ярлыки цен. Бирюзовый отмечает открытую группу цен
                и&nbsp;кнопку записи, серый лежит под&nbsp;карточками.
              </Block>
              <Block
                name="kit"
                head="Шрифт и&nbsp;детали"
                pic={
                  <div className={base.page}>
                    <Img
                      file="kit"
                      w={1440}
                      h={980}
                      alt="Детали интерфейса: кнопка, ярлык цены, поле телефона, кнопка записи и строки цен"
                    />
                  </div>
                }
              >
                Основной шрифт PT&nbsp;Sans Caption. Пилюли, ярлык с&nbsp;ценой, строка
                со&nbsp;значком зуба и&nbsp;поле с&nbsp;кнопкой повторяются от&nbsp;раздела
                к&nbsp;разделу.
              </Block>
            </div>
          </section>

          <section className={`${base.shot} ${caseStyles.plain}`}>
            <End c={c} act={act} />
          </section>
        </>
      )}
    </>
  );
}
