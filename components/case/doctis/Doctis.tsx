import type { ReactNode } from "react";
import type { CaseData } from "@/components/scenes/Scene3";
import caseStyles from "../Case.module.css";
import { type CaseActions, End } from "../CaseView";
import { Duo } from "../memoridian/Duo";
import base from "../memoridian/Showcase.module.css";
import styles from "./Doctis.module.css";

// Страница портала Doctis (docs/12-case-page.md): тот же вид, что у Memoridian и проката. Идёт по пути
// человека от поиска до записи. Снимки — настоящий сайт, ссылок на него нет.

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const src = (file: string) => `${BASE}/works/doctis/${file}.webp`;

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
  ["#5B3AEF", "#FFFFFF"],
  ["#FF2069", "#FFFFFF"],
  ["#FC4D9B", "#141414"],
  ["#23DA9D", "#141414"],
  ["#161E2F", "#FFFFFF"],
  ["#F1F3F5", "#141414"],
];

export function Doctis({ c, act, full }: { c: CaseData; act: CaseActions; full: boolean }) {
  return (
    <>
      <section className={`${base.shot} ${base.intro}`}>
        <h1 className={base.title} id="case-title" data-hi>
          Клиника онлайн <br />
          Doctis
        </h1>
        <p className={`${base.text} ${base.lead}`} data-hi>
          Сайт сервиса телемедицины: от&nbsp;поиска врача до&nbsp;записи на&nbsp;консультацию,
          на&nbsp;компьютере и&nbsp;на&nbsp;телефоне.
        </p>
        <Duo
          slug="doctis"
          className={base.duo}
          data-cover=""
          alts={[
            "Первый экран сайта: заголовок «Поиск врача, анализа или специальности», строка поиска и подсказки",
            "Плитка услуги: быстрый вопрос врачу онлайн за 499 рублей",
            "Плитка услуги: сдать анализы удобно и рядом с домом, от 199 рублей",
          ]}
        />
        <div className={base.facts} data-hi>
          <div>
            <p className={base.text}>Что входило в работу</p>
            <ul className={`${base.note} ${base.list}`}>
              <li>Главная и поиск</li>
              <li>Каталог врачей, профиль и запись</li>
              <li>Срочная консультация</li>
              <li>Версия для телефона</li>
              <li>Страница «Цифровой портал»</li>
            </ul>
          </div>
          <div>
            <p className={base.text}>Что есть на сайте</p>
            <ul className={`${base.note} ${base.list}`}>
              <li>Больше 120 специальностей, у каждой своя страница</li>
              <li>Девять фильтров в каталоге</li>
              <li>Чат, звонок и видео</li>
              <li>Три дежурные специальности, круглосуточно</li>
            </ul>
          </div>
        </div>
      </section>

      {full && (
        <>
          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="search"
              head="Один поиск на&nbsp;врачей и&nbsp;анализы"
              pic={
                <div className={base.page}>
                  <Img
                    file="search"
                    m={["search-m", 960, 862]}
                    w={2048}
                    h={1158}
                    alt="Открытый поиск: поле и список популярных запросов под ним"
                  />
                </div>
              }
            >
              В&nbsp;одно поле можно вписать специальность, фамилию врача или название анализа.
              Стоит нажать на&nbsp;поле, и&nbsp;ещё до&nbsp;первой буквы под ним открываются
              популярные специальности и&nbsp;анализы.
            </Block>
            <Block
              name="catalog"
              head="Время видно прямо в&nbsp;каталоге"
              pic={
                <div className={base.page}>
                  <Img
                    file="catalog"
                    m={["catalog-m", 1016, 744]}
                    w={1696}
                    h={1188}
                    alt="Карточки врачей в каталоге: специальности, цена и свободное время"
                  />
                </div>
              }
            >
              Чтобы сравнить врачей, не&nbsp;нужно открывать каждый профиль. В&nbsp;карточке сразу
              специальности, цена и&nbsp;свободные часы на&nbsp;ближайшие дни, а&nbsp;список сужают
              девять фильтров: от&nbsp;клиники и&nbsp;стажа до&nbsp;вида связи.
            </Block>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <div className={base.line}>
              <Block
                name="slots"
                head="Запись в&nbsp;одной панели"
                pic={
                  <div className={base.page}>
                    <Img
                      file="slots"
                      w={896}
                      h={900}
                      alt="Панель записи: клиника, услуга, дни, часы и кнопка «Записаться»"
                    />
                  </div>
                }
              >
                В&nbsp;профиле врача запись собрана в&nbsp;одну панель: формат и&nbsp;клиника,
                услуга, день и&nbsp;час. Время показано по&nbsp;часовому поясу человека,
                а&nbsp;на&nbsp;кнопке сразу стоит цена.
              </Block>
              <Block
                name="duty"
                head="Срочный вопрос без каталога"
                pic={
                  <div className={base.page}>
                    <Img
                      file="duty"
                      m={["duty-m", 824, 812]}
                      w={1200}
                      h={836}
                      alt="Окно «Выберите услугу»: консультация круглосуточно и три дежурных специалиста"
                    />
                  </div>
                }
              >
                Срочной консультации не&nbsp;нужны каталог и&nbsp;расписание. Поверх раздела
                открывается окно: что входит в&nbsp;услугу и&nbsp;три дежурные специальности,
                у&nbsp;каждой цена.
              </Block>
            </div>
            <Block
              name="phones"
              head="На&nbsp;телефоне своя раскладка"
              pic={
                <div className={styles.pair}>
                  <figure className={styles.device}>
                    <Img
                      file="phone-catalog"
                      w={824}
                      h={1784}
                      alt="Каталог на телефоне: в карточке врача ближайшее время одной кнопкой"
                    />
                  </figure>
                  <figure className={styles.device}>
                    <Img
                      file="phone-filter"
                      w={824}
                      h={1784}
                      alt="Отдельный экран фильтров на телефоне"
                    />
                  </figure>
                </div>
              }
            >
              Карточка врача сжимается: вместо всего расписания одна кнопка с&nbsp;ближайшим
              временем. Фильтры уходят на&nbsp;отдельный экран, плитки главной встают в&nbsp;две
              колонки, а&nbsp;подсказки поиска листаются вбок.
            </Block>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="promo"
              head="Страница «Цифровой портал»"
              pic={
                <div className={base.page}>
                  <Img
                    file="promo"
                    m={["promo-m", 824, 1368]}
                    w={2400}
                    h={1804}
                    alt="Первый экран страницы «Цифровой портал» и блок документов"
                  />
                </div>
              }
            >
              Тот&nbsp;же сервис, показанный как программный продукт. Отдельная страница
              с&nbsp;объёмной картинкой на&nbsp;первом экране, документами по&nbsp;эксплуатации,
              сценариями работы и&nbsp;приложением.
            </Block>
            <Block
              name="urgent"
              head="Сценарии вместо описаний"
              pic={
                <div className={base.page}>
                  <Img
                    file="promo-urgent"
                    m={["promo-urgent-m", 948, 738]}
                    w={2048}
                    h={738}
                    alt="Блок «Срочные консультации»: экраны приложения и плитки"
                  />
                </div>
              }
            >
              Плановая и&nbsp;срочная консультации идут двумя зеркальными блоками. В&nbsp;каждом
              экраны приложения и&nbsp;короткие плитки: продукт понятен без длинного текста.
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
                В&nbsp;знаке тёмный синий, розовый и&nbsp;фиолетовый. В&nbsp;интерфейсе фиолетовый
                ведёт к&nbsp;действию, серый лежит под карточками, а&nbsp;зелёный и&nbsp;розовый
                различают плитки и&nbsp;метки.
              </Block>
              <Block
                name="kit"
                head="Шрифт и&nbsp;детали"
                pic={
                  <div className={base.page}>
                    <Img
                      file="kit"
                      m={["kit-m", 960, 1054]}
                      w={1440}
                      h={1032}
                      alt="Детали интерфейса: плитки, метки, пилюли, кнопки времени и записи"
                    />
                  </div>
                }
              >
                Montserrat и&nbsp;семь размеров, от&nbsp;подписи 11 до&nbsp;заголовка 47. Плитки,
                метки, пилюли и&nbsp;кнопки времени повторяются на&nbsp;всех страницах, поэтому
                запись и&nbsp;каталог выглядят одним сайтом.
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
