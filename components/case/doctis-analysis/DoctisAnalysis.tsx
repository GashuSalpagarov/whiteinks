import type { ReactNode } from "react";
import type { CaseData } from "@/components/scenes/Scene3";
import caseStyles from "../Case.module.css";
import { type CaseActions, End } from "../CaseView";
import { Duo } from "../memoridian/Duo";
import base from "../memoridian/Showcase.module.css";
import styles from "./DoctisAnalysis.module.css";

// Страница витрины анализов Doctis (docs/12-case-page.md): тот же вид, что у Memoridian и проката.
// Идёт по пути человека: выбрал, собрал заказ, сравнил лаборатории, увидел итог. Снимки — настоящий
// сайт, ссылок на него нет. Тексты описывают интерфейс: авторство деталей не подтверждено.

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const src = (file: string) => `${BASE}/works/doctis-analysis/${file}.webp`;

// m — снимок мобильной раскладки сайта [файл, ширина, высота]: снимок компьютера на 350 px не читается.
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

// Основа и восемь цветов плиток в их порядке на витрине.
const SWATCHES = [
  ["#F1F3F5", "#141414"],
  ["#0B1222", "#FFFFFF"],
  ["#5B3AEF", "#FFFFFF"],
  ["#FD0055", "#FFFFFF"],
  ["#C69CFF", "#141414"],
  ["#9D89F5", "#141414"],
  ["#5DDE86", "#141414"],
  ["#FD94C3", "#141414"],
  ["#7099FC", "#141414"],
  ["#FF79A5", "#141414"],
  ["#DE5A67", "#141414"],
  ["#FFB866", "#141414"],
];

export function DoctisAnalysis({ c, act, full }: { c: CaseData; act: CaseActions; full: boolean }) {
  return (
    <>
      <section className={`${base.shot} ${base.intro}`}>
        <h1 className={base.title} id="case-title" data-hi>
          Витрина <br />
          анализов Doctis
        </h1>
        <p className={`${base.text} ${base.lead}`} data-hi>
          Раздел сайта Doctis: найти анализы, сравнить лаборатории на&nbsp;карте и&nbsp;увидеть итог
          заказа.
        </p>
        <Duo
          slug="doctis-analysis"
          className={base.duo}
          data-cover=""
          alts={[
            "Витрина анализов на телефоне: поиск и цветные плитки",
            "Лаборатории списком на телефоне: адреса и цены",
            "Карта лабораторий на телефоне: метки сетей с ценой заказа",
          ]}
        />
        <div className={base.facts} data-hi>
          <div>
            <p className={base.text}>Что входило в работу</p>
            <ul className={`${base.note} ${base.list}`}>
              <li>Витрина и комплексы анализов</li>
              <li>Поиск по каталогу</li>
              <li>Страницы анализов</li>
              <li>Карта лабораторий</li>
              <li>Заказ: состав, цены, итог</li>
              <li>Версия для телефона</li>
            </ul>
          </div>
          <div>
            <p className={base.text}>Как устроено</p>
            <ul className={`${base.note} ${base.list}`}>
              <li>Цены для выбранного города</li>
              <li>Три сети лабораторий на одной карте</li>
              <li>Итог заказа виден до входа</li>
            </ul>
          </div>
        </div>
      </section>

      {full && (
        <>
          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="tiles"
              head="Витрина начинается с&nbsp;плиток"
              pic={
                <div className={base.page}>
                  <Img
                    file="tiles"
                    m={["tiles-m", 860, 810]}
                    w={1520}
                    h={776}
                    alt="Восемь цветных плиток с комплексами анализов и смайликами"
                  />
                </div>
              }
            >
              Первым человек видит не&nbsp;длинный каталог, а&nbsp;восемь цветных плиток
              с&nbsp;готовыми комплексами. У&nbsp;каждой свой цвет и&nbsp;смайлик, при наведении
              плитка темнеет, а&nbsp;смайлик растёт. Под плитками идёт обычный список анализов.
            </Block>
            <Block
              name="search"
              head="Поиск, который начинается с&nbsp;разделов"
              pic={
                <div className={base.page}>
                  <Img
                    file="search"
                    m={["search-m", 860, 858]}
                    w={1520}
                    h={928}
                    alt="Поле поиска и открытый список категорий анализов"
                  />
                </div>
              }
            >
              Стоит нажать на&nbsp;поле, и&nbsp;ещё до&nbsp;ввода открываются категории: можно идти
              по&nbsp;разделам, если точного названия нет. С&nbsp;первыми буквами список
              перестраивается и&nbsp;считает найденное. Поиск понимает и&nbsp;другие названия
              анализа, в&nbsp;том числе латиницей.
            </Block>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="cards"
              head="Анализ в&nbsp;заказ одним нажатием"
              pic={
                <div className={base.page}>
                  <Img
                    file="cards"
                    m={["cards-m", 860, 540]}
                    w={1520}
                    h={640}
                    alt="Две карточки анализов: одна с кнопкой «В заказе», другая с кнопкой «Добавить»"
                  />
                </div>
              }
            >
              В&nbsp;карточке только название, метка и&nbsp;цена. Страницу анализа открывать
              не&nbsp;обязательно: «Добавить» сразу становится «В&nbsp;заказе» с&nbsp;галочкой,
              и&nbsp;по&nbsp;списку видно, что уже выбрано.
            </Block>
            <Block
              name="cart"
              head="Заказ всё время рядом"
              pic={
                <div className={base.page}>
                  <Img
                    file="cart"
                    w={752}
                    h={1098}
                    alt="Карточка заказа: город, три анализа, предупреждение о заборе, кнопка «К оформлению»"
                  />
                </div>
              }
            >
              Справа на&nbsp;экране лежит карточка заказа: город, анализы и&nbsp;сумма. Любой анализ
              убирается крестиком. Карточка заранее предупреждает, что стоимость забора
              и&nbsp;окончательная сумма появятся после выбора лаборатории, поэтому цена
              на&nbsp;следующем шаге не&nbsp;становится неожиданностью.
            </Block>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="map"
              head="Карта с&nbsp;ценой этого заказа"
              pic={
                <div className={base.page}>
                  <Img
                    file="map"
                    m={["map-m", 860, 1200]}
                    w={1600}
                    h={1148}
                    alt="Список лабораторий с ценами и карта Москвы с метками"
                  />
                </div>
              }
            >
              Лаборатории трёх сетей стоят на&nbsp;одной карте и&nbsp;в&nbsp;списке рядом, дешёвые
              сверху. Цена на&nbsp;метке считается для текущего заказа, поэтому адреса можно
              сравнивать прямо на&nbsp;карте. Если адресов рядом много, метки собираются
              в&nbsp;кружок с&nbsp;числом. Фильтр сужает выбор по&nbsp;сети и&nbsp;цене.
            </Block>
            <Block
              name="order"
              head="Итог виден до&nbsp;входа"
              pic={
                <div className={base.page}>
                  <Img
                    file="order"
                    m={["order-m", 860, 1020]}
                    w={1520}
                    h={1250}
                    alt="Оформление заказа: три анализа, забор биоматериала, лаборатория, итог"
                  />
                </div>
              }
            >
              Нажатие «Выбрать» сразу ведёт к&nbsp;оформлению. Цена каждого анализа в&nbsp;этой
              лаборатории, забор отдельной строкой, адрес и&nbsp;итоговая сумма видны ещё
              до&nbsp;входа в&nbsp;кабинет. Лабораторию можно поменять здесь&nbsp;же, карандаш
              возвращает на&nbsp;карту.
            </Block>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="item"
              head="Страница анализа без полотна текста"
              pic={
                <div className={base.page}>
                  <Img
                    file="item"
                    m={["item-m", 860, 1160]}
                    w={1520}
                    h={1600}
                    alt="Страница анализа: цена, срок, описание, подготовка и другие названия"
                  />
                </div>
              }
            >
              Наверху цена и&nbsp;срок, ниже короткое описание. Подготовка разложена
              на&nbsp;карточки со&nbsp;значками, поэтому её не&nbsp;приходится вычитывать
              из&nbsp;абзаца. Другие названия анализа стоят отдельными пометками: одно
              и&nbsp;то&nbsp;же исследование люди называют по-разному.
            </Block>
            <Block
              name="phones"
              head="На&nbsp;телефоне своя раскладка"
              pic={
                <div className={styles.pair}>
                  <figure className={styles.device}>
                    <Img
                      file="phone-tiles"
                      w={860}
                      h={1864}
                      alt="Витрина на телефоне: плитки в две колонки и полоса корзины"
                    />
                  </figure>
                  <figure className={styles.device}>
                    <Img
                      file="phone-list"
                      w={860}
                      h={1864}
                      alt="Список лабораторий на телефоне с ценой заказа"
                    />
                  </figure>
                </div>
              }
            >
              Плитки встают в&nbsp;две колонки, а&nbsp;карточка заказа становится полосой «Корзина»
              с&nbsp;суммой внизу экрана. Карта и&nbsp;список лабораторий разведены
              по&nbsp;вкладкам, фильтр убран под значок. Подготовка сворачивается в&nbsp;ряд
              значков.
            </Block>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <div className={base.line}>
              <Block
                name="colors"
                head="Цвета"
                pic={
                  <div className={`${base.swatches} ${styles.palette}`}>
                    {SWATCHES.map(([hex, ink]) => (
                      <i key={hex} className="no-invert" style={{ background: hex, color: ink }}>
                        <span>{hex}</span>
                      </i>
                    ))}
                  </div>
                }
              >
                Основа спокойная: серый фон, белые карточки, тёмный текст. Фиолетовый отдан кнопкам
                и&nbsp;ссылкам, малиновый метке «Советуем сдать». Яркие цвета живут только
                на&nbsp;плитках.
              </Block>
              <Block
                name="details"
                head="Шрифт и&nbsp;детали"
                pic={
                  <div className={base.page}>
                    <Img
                      file="details"
                      w={960}
                      h={480}
                      alt="Кнопки «Добавить», «В заказе», «К оформлению», «Выберите лабораторию» и метка «Советуем сдать»"
                    />
                  </div>
                }
              >
                Весь интерфейс набран Montserrat, основных размеров четыре: 11, 13, 15 и&nbsp;19.
                Кнопки и&nbsp;метки повторяются от&nbsp;экрана к&nbsp;экрану, поэтому витрина, карта
                и&nbsp;заказ выглядят одним продуктом.
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
