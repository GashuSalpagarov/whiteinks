import type { ReactNode } from "react";
import type { CaseData } from "@/components/scenes/Scene3";
import caseStyles from "../Case.module.css";
import { type CaseActions, End } from "../CaseView";
import { Duo } from "../memoridian/Duo";
import base from "../memoridian/Showcase.module.css";
import styles from "./StroyM.module.css";

// Страница магазина освещения «Строй-М» (docs/12-case-page.md): тот же вид, что у Memoridian и проката.
// Идёт от первого экрана к баннерам, каталогу и фильтру. Снимки — макеты сайта: шапка с адресом
// и телефоном обрезана, ссылок на сайт нет. Карточки на главной нет, вход — из списка работ.

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const src = (file: string) => `${BASE}/works/stroy-m/${file}.webp`;

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
  ["#FDB403", "#141414"],
  ["#373366", "#FFFFFF"],
  ["#0E0E0E", "#FFFFFF"],
  ["#A1A1A1", "#141414"],
  ["#CDCDCD", "#141414"],
  ["#FFFFFF", "#141414"],
];

export function StroyM({ c, act, full }: { c: CaseData; act: CaseActions; full: boolean }) {
  return (
    <>
      <section className={`${base.shot} ${base.intro}`}>
        <h1 className={base.title} id="case-title" data-hi>
          Магазин освещения <br />
          Строй-М
        </h1>
        <p className={`${base.text} ${base.lead}`} data-hi>
          Интернет-магазин ламп и&nbsp;светильников: спокойный дизайн, яркие баннеры и&nbsp;склады
          пяти поставщиков в&nbsp;одном каталоге.
        </p>
        <Duo
          slug="stroy-m"
          className={base.duo}
          data-cover=""
          alts={[
            "Широкий баннер: светодиодные лампы, скидка 15 процентов",
            "Баннер: галогенная лампа под тремя софитами, скидка 15 процентов",
            "Баннер: лампы накаливания, спецпредложение на опт, скидка 20 процентов",
            "Умный фильтр: цоколь, вид лампы, мощность и другие условия",
          ]}
        />
        <div className={base.facts} data-hi>
          <div>
            <p className={base.text}>Что входило в работу</p>
            <ul className={`${base.note} ${base.list}`}>
              <li>Прототипы и дизайн</li>
              <li>Каталог и карточка товара</li>
              <li>Умный фильтр</li>
              <li>Комплекты и рекомендации</li>
              <li>Адаптивные страницы</li>
              <li>Склады поставщиков: синхронизация и сверка</li>
            </ul>
          </div>
          <div>
            <p className={base.text}>Что есть на сайте</p>
            <ul className={`${base.note} ${base.list}`}>
              <li>Лампы, светильники, прожекторы и лента</li>
              <li>Избранное и сравнение</li>
              <li>Доставка и оплата</li>
              <li>Сертификаты</li>
            </ul>
          </div>
        </div>
      </section>

      {full && (
        <>
          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="before"
              head="Та же раскладка без цвета"
              pic={
                <div className={base.page}>
                  <Img
                    file="before"
                    w={944}
                    h={533}
                    alt="Первый экран почти без цвета: серые поля, синяя кнопка каталога и бледная скидка 25 процентов"
                  />
                </div>
              }
            >
              Меню, слайдер и&nbsp;вкладки уже на&nbsp;своих местах, но&nbsp;всё серое: синяя кнопка
              и&nbsp;бледная скидка почти не&nbsp;заметны. На&nbsp;таком экране взгляду не&nbsp;за
              что зацепиться.
            </Block>
            <Block
              name="after"
              head="Свет и&nbsp;цвет на&nbsp;первом экране"
              pic={
                <div className={base.page}>
                  <Img
                    file="after"
                    w={944}
                    h={534}
                    alt="Тот же экран в цвете: тёмное фото горящих ламп, жёлтое поле со скидкой, ниже вкладки и баннер"
                  />
                </div>
              }
            >
              Горящие лампы на&nbsp;чёрном рядом с&nbsp;жёлтым полем и&nbsp;крупной скидкой. Меню
              тёмно-синее, кнопка каталога жёлтая. Ниже вкладки «Главная», «Каталог» и&nbsp;«Акции»
              на&nbsp;фоне светлой стены с&nbsp;лампочками.
            </Block>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <div className={base.line}>
              <Block
                name="tall"
                head="Лампа в&nbsp;свете софитов"
                pic={
                  <div className={base.page}>
                    <Img
                      file="slide1"
                      w={369}
                      h={445}
                      alt="Баннер: галогенная лампа под тремя софитами и скидка в пунктирной плашке"
                    />
                  </div>
                }
              >
                Сверху светят софиты, в&nbsp;центре сама лампа. Скидка стоит рядом в&nbsp;пунктирной
                плашке, название группы внизу: читается за&nbsp;секунду. Такой пунктир идёт через
                все баннеры.
              </Block>
              <Block
                name="mid"
                head="Свой цвет у&nbsp;каждой группы"
                pic={
                  <div className={base.page}>
                    <Img
                      file="slide2"
                      w={576}
                      h={445}
                      alt="Баннер на бирюзовом фоне: лампы накаливания, скидка 20 процентов и спецпредложение на опт"
                    />
                  </div>
                }
              >
                Лампы накаливания на&nbsp;бирюзовом, галогенные на&nbsp;синем, светодиодные
                на&nbsp;жёлтом. Цвет выделяет важное и&nbsp;не&nbsp;даёт витрине слиться
                в&nbsp;белый список.
              </Block>
            </div>
            <Block
              name="wide"
              head="Широкий баннер"
              pic={
                <div className={base.page}>
                  <Img
                    file="slide3"
                    w={1220}
                    h={445}
                    alt="Широкий баннер: светодиодные лампы на синем фоне, снизу жёлтая полоса с названием и скидкой"
                  />
                </div>
              }
            >
              Фото сверху, жёлтая полоса снизу, а&nbsp;на&nbsp;ней название и&nbsp;скидка. Лампы
              стоят на&nbsp;стыке и&nbsp;связывают обе части.
            </Block>
            <Block
              name="icons"
              head="Значки разделов"
              pic={
                <div className={base.ink}>
                  <Img
                    file="icons"
                    m={["icons-m", 636, 250]}
                    w={888}
                    h={100}
                    alt="Пять значков: лампы, светильники светодиодные и люминисцентные, прожекторы и фонари, светодиодная лента"
                  />
                </div>
              }
            >
              Пять разделов каталога одним тонким рисунком: лампы, два вида светильников, прожекторы
              и&nbsp;лента.
            </Block>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="catalog"
              head="Каталог"
              pic={
                <div className={base.page}>
                  <Img
                    file="catalog"
                    m={["catalog-m", 505, 650]}
                    w={700}
                    h={510}
                    alt="Раздел «Светодиодные лампы»: сортировка, сетка карточек и панель фильтра справа"
                  />
                </div>
              }
            >
              Карточки идут плитками на&nbsp;белом: фото лампы, название и&nbsp;модель, рядом
              избранное, сравнение и&nbsp;корзина. Сверху сортировка и&nbsp;переключатель вида,
              справа фильтр. На&nbsp;лампе метка цоколя, если он&nbsp;важен для выбора.
            </Block>
            <Block
              name="filter"
              head="Умный фильтр"
              pic={
                <div className={base.page}>
                  <Img
                    file="filter"
                    m={["filter-m", 165, 290]}
                    w={165}
                    h={535}
                    alt="Фильтр: цоколь, вид лампы, мощность с ползунком, напряжение, торговые марки, форма, минимальная партия"
                  />
                </div>
              }
            >
              Подбор идёт по&nbsp;типу товара: цоколь, вид лампы, мощность, напряжение, торговая
              марка, форма и&nbsp;минимальная партия. Рядом со&nbsp;значением число товаров,
              мощность задаётся числами или ползунком. Полные характеристики потом видны
              в&nbsp;карточке товара.
            </Block>
            <Block
              name="cards"
              head="Лампа загорается при наведении"
              pic={
                <div className={base.page}>
                  <Img
                    file="cards"
                    w={505}
                    h={215}
                    alt="Ряд карточек: на средней лампа горит, снизу поднялась жёлтая полоса с кнопкой «Узнать стоимость»"
                  />
                </div>
              }
            >
              Навёл курсор, и&nbsp;лампа на&nbsp;карточке загорается, а&nbsp;снизу поднимается
              жёлтая полоса с&nbsp;кнопкой. Это приглашение перейти к&nbsp;подробностям.
            </Block>
            <Block
              name="popular"
              head="Комплекты и&nbsp;рекомендации"
              pic={
                <div className={base.page}>
                  <Img
                    file="popular"
                    m={["popular-m", 530, 220]}
                    w={1009}
                    h={303}
                    alt="Лента «Популярные товары в категории» на тёмно-синем поле: четыре карточки и стрелки"
                  />
                </div>
              }
            >
              К&nbsp;товару можно собрать комплект и&nbsp;подобрать подходящее. В&nbsp;разделе это
              лента популярных товаров на&nbsp;тёмно-синем поле, которая закрывает страницу.
            </Block>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="pages"
              head="Остальные страницы в&nbsp;том&nbsp;же стиле"
              pic={
                <Img
                  file="pages"
                  w={1705}
                  h={1158}
                  alt="Страницы сайта в наклонной раскладке: карточка товара, акции, сертификаты, доставка, оплата и подвал"
                />
              }
            >
              Карточка товара с&nbsp;сопутствующими, акции, сертификаты, доставка, оплата.
              Те&nbsp;же тёмно-синие полосы и&nbsp;жёлтые кнопки, поэтому сайт читается как одно
              целое. Все страницы адаптивные.
            </Block>
            <div className={base.line}>
              <div className={base.copy} data-rise>
                <h2 className={base.head}>Пять складов, один каталог</h2>
                <p className={base.text}>
                  Сайт связан со&nbsp;складами пяти поставщиков. Для каталогов сделано отдельное
                  управление: синхронизация и&nbsp;сверка товаров по&nbsp;наличию и&nbsp;ценам.
                </p>
              </div>
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
                Основа белая, чтобы лампы были на&nbsp;виду. Жёлтый ведёт к&nbsp;действию
                и&nbsp;скидкам, тёмно-синий держит меню и&nbsp;большие полосы.
              </Block>
            </div>
            <Block
              name="logo"
              head="Знак"
              pic={
                <div className={`${styles.mark} no-invert`}>
                  <Img
                    file="logo"
                    w={244}
                    h={77}
                    alt="Знак «Строй-М»: дом с лампой внутри и вилка"
                  />
                </div>
              }
            >
              Домик с&nbsp;лампой внутри, а&nbsp;линия от&nbsp;него проходит под названием
              и&nbsp;заканчивается вилкой. Знак стоит и&nbsp;в&nbsp;шапке, и&nbsp;на&nbsp;баннерах.
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
