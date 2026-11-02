import type { ReactNode } from "react";
import type { CaseData } from "@/components/scenes/Scene3";
import caseStyles from "../Case.module.css";
import { type CaseActions, End } from "../CaseView";
import { Duo } from "../memoridian/Duo";
import base from "../memoridian/Showcase.module.css";
import styles from "./Globaldrive.module.css";

// Страница магазина Globaldrive (docs/12-case-page.md): тот же вид, что у Memoridian и проката.
// Снимки — настоящий сайт;
// ссылок на него нет. Карточки на главной нет: только прямой адрес, полёта нет.

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const src = (file: string) => `${BASE}/works/globaldrive/${file}.webp`;

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

const SWATCHES = [
  ["#2F69FF", "#FFFFFF"],
  ["#343C4B", "#FFFFFF"],
  ["#9A9EA5", "#141414"],
  ["#F3F3F6", "#141414"],
  ["#EFF4FF", "#141414"],
  ["#FFD600", "#141414"],
];

export function Globaldrive({ c, act, full }: { c: CaseData; act: CaseActions; full: boolean }) {
  return (
    <>
      <section className={`${base.shot} ${base.intro}`}>
        <h1 className={base.title} id="case-title" data-hi>
          Магазин техники <br />
          Globaldrive
        </h1>
        <p className={`${base.text} ${base.lead}`} data-hi>
          Интернет-магазин лодочных моторов, снегоходов, квадроциклов и&nbsp;запчастей к&nbsp;ним.
        </p>
        <Duo
          slug="globaldrive"
          className={base.duo}
          data-cover=""
          alts={[
            "Фильтр каталога: цена, переключатели и список брендов",
            "Рисунки разделов запчастей: лодочный мотор, снегоуборщик, мотоцикл, снегоход",
            "Значки разделов каталога",
          ]}
        />
        <div className={base.facts} data-hi>
          <div>
            <p className={base.text}>Что входило в работу</p>
            <ul className={`${base.note} ${base.list}`}>
              <li>Каталог и поиск</li>
              <li>Фильтры и карточки товаров</li>
              <li>Страница товара и заказ</li>
              <li>Запчасти по схемам</li>
              <li>Версия для телефона</li>
              <li>Цвета, значки, рисунки</li>
            </ul>
          </div>
        </div>
      </section>

      {full && (
        <>
          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="menu"
              head="Весь каталог на одной панели"
              pic={
                <div className={base.page}>
                  <Img
                    file="menu"
                    m={["menu-m", 780, 1280]}
                    w={1660}
                    h={1192}
                    alt="Меню каталога: группы техники слева, подразделы квадроциклов справа"
                  />
                </div>
              }
            >
              Кнопка в&nbsp;шапке открывает панель: слева группы техники со&nbsp;своими значками,
              рядом подразделы выбранной группы, дальше бренды. Вид квадроцикла находится без
              переходов между страницами. На&nbsp;телефоне те&nbsp;же группы раскрываются
              на&nbsp;месте.
            </Block>
            <div className={base.line}>
              <Block
                name="search"
                head="Поиск отвечает во&nbsp;время набора"
                pic={
                  <div className={base.page}>
                    <Img
                      file="search"
                      m={["search-m", 716, 1408]}
                      w={940}
                      h={1234}
                      alt="Подсказки поиска по запросу о снегоходах Sharmax"
                    />
                  </div>
                }
              >
                Подсказка открывается прямо под строкой: сверху подходящие модели, ниже разделы
                каталога и&nbsp;запчасти. Совпавшие слова выделены жирным, сразу видно, чем модели
                отличаются.
              </Block>
              <Block
                name="filter"
                head="Свой фильтр у&nbsp;каждого вида техники"
                pic={
                  <div className={base.page}>
                    <Img
                      file="filter"
                      w={602}
                      h={1300}
                      alt="Колонка фильтров: цена ползунком, переключатели, бренд с поиском по списку"
                    />
                  </div>
                }
              >
                У&nbsp;снегоходов это ширина гусеницы и&nbsp;грунтозацеп, у&nbsp;лодочных моторов
                дейдвуд и&nbsp;система подъёма. Цена задаётся ползунком, бренд ищется
                по&nbsp;списку.
              </Block>
            </div>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="cards"
              head="Главное видно уже в&nbsp;списке"
              pic={
                <div className={base.page}>
                  <Img
                    file="cards"
                    m={["cards-m", 780, 848]}
                    w={1440}
                    h={1273}
                    alt="Две карточки снегоходов: фото, рейтинг, цена, кнопки заказа и параметры"
                  />
                </div>
              }
            >
              Рейтинг, наличие, цена со&nbsp;скидкой и&nbsp;платёж при оплате частями стоят прямо
              на&nbsp;карточке, на&nbsp;компьютере ещё и&nbsp;шесть параметров. Наведение листает
              фото, а&nbsp;кнопки заказа и&nbsp;корзины стоят тут&nbsp;же.
            </Block>
            <div className={base.line}>
              <Block
                name="buy"
                head="Покупка собрана в&nbsp;одном блоке"
                pic={
                  <div className={base.page}>
                    <Img
                      file="buy"
                      m={["buy-m", 780, 524]}
                      w={1004}
                      h={1392}
                      alt="Блок покупки снегохода: цена, кнопки, оплата, тест-драйв, доставка"
                    />
                  </div>
                }
              >
                Цена и&nbsp;скидка стоят над двумя кнопками: быстрый заказ и&nbsp;корзина. Ниже
                оплата частями и&nbsp;кредит, на&nbsp;компьютере там&nbsp;же тест-драйв
                и&nbsp;способы получения: доставка и&nbsp;самовывоз.
              </Block>
              <Block
                name="quick"
                head="Заказ в&nbsp;одном окне"
                pic={
                  <div className={base.page}>
                    <Img
                      file="quick"
                      m={["quick-m", 720, 1030]}
                      w={1256}
                      h={1380}
                      alt="Пустое окно «Купить в 1 клик» с полями заказа"
                    />
                  </div>
                }
              >
                «Быстрый заказ» открывается поверх страницы: сверху товар и&nbsp;цена, ниже имя,
                телефон и&nbsp;удобный способ связи. Почта необязательна, дополнительные данные
                спрятаны за&nbsp;отдельной ссылкой.
              </Block>
            </div>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="specs"
              head="Длинная страница с&nbsp;меню"
              pic={
                <div className={base.page}>
                  <Img
                    file="specs"
                    m={["specs-m", 780, 560]}
                    w={2080}
                    h={1280}
                    alt="Боковое меню страницы товара и таблица характеристик двигателя"
                  />
                </div>
              }
            >
              Описание, характеристики, комплектация, гарантия и&nbsp;отзывы разложены
              по&nbsp;пунктам. На&nbsp;компьютере это меню сбоку, оно остаётся на&nbsp;экране при
              прокрутке, а&nbsp;на&nbsp;телефоне список. Характеристики разбиты по&nbsp;группам.
            </Block>
            <Block
              name="parts"
              head="Запчасти по&nbsp;схеме"
              pic={
                <div className={base.page}>
                  <Img
                    file="parts"
                    m={["parts-m", 780, 1220]}
                    w={1720}
                    h={940}
                    alt="Схема двигателя снегохода и таблица деталей с ценами"
                  />
                </div>
              }
            >
              Сначала модель, затем узел, например двигатель. Рядом его схема с&nbsp;кнопками
              увеличения и&nbsp;детали: номер на&nbsp;схеме, код, цена и&nbsp;своя кнопка корзины.
            </Block>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="phones"
              head="На&nbsp;телефоне главное внизу"
              pic={
                <div className={styles.pair}>
                  <figure className={styles.device}>
                    <Img
                      file="phone-list"
                      w={780}
                      h={1688}
                      alt="Список снегоходов на телефоне с нижней панелью"
                    />
                  </figure>
                  <figure className={styles.device}>
                    <Img file="phone-menu" w={780} h={1688} alt="Разделы каталога на телефоне" />
                  </figure>
                </div>
              }
            >
              Снизу постоянная панель: главная, избранное, сравнение, профиль и&nbsp;круглая кнопка
              каталога посередине. Каталог открывается на&nbsp;весь экран, с&nbsp;поиском
              по&nbsp;разделам и&nbsp;раскрывающимися группами.
            </Block>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <div className={base.line}>
              <Block
                name="colors"
                head="Один синий на&nbsp;всё, что нажимается"
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
                Кнопки, ссылки и&nbsp;активные пункты синие, текст тёмно-серый, панели светло-серые,
                жёлтый оставлен для скидок. Названия и&nbsp;кнопки набраны шрифтом Acrom, цены
                шрифтом Gilroy.
              </Block>
              <Block
                name="icons"
                head="Значки разделов"
                pic={
                  <div className={base.page}>
                    <Img
                      file="icons"
                      m={["icons-m", 656, 256]}
                      w={1426}
                      h={492}
                      alt="Плитки разделов: лодочные моторы, лодки, квадроциклы, мотоциклы, снегоходы, мотобуксировщики, снегоуборщики, другое"
                    />
                  </div>
                }
              >
                Восемь знаков на&nbsp;главной: силуэт техники, часто вместе с&nbsp;человеком,
                и&nbsp;один синий цвет.
              </Block>
            </div>
            <Block
              name="drawings"
              head="Запчасти начинаются с&nbsp;рисунка"
              pic={
                <div className={base.page}>
                  <Img
                    file="drawings"
                    m={["drawings-m", 1432, 872]}
                    w={1542}
                    h={1122}
                    alt="Рисованные плитки запчастей: лодочный мотор, снегоуборщик, мотоцикл, мотобуксировщик"
                  />
                </div>
              }
            >
              Разделы запчастей показаны не&nbsp;фотографиями, а&nbsp;рисунками в&nbsp;одном стиле:
              плотные формы, плоский цвет, голубой круг за&nbsp;техникой. Разная техника выглядит
              одним набором.
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
