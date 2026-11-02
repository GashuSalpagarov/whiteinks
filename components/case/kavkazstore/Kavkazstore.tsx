import type { ReactNode } from "react";
import type { CaseData } from "@/components/scenes/Scene3";
import caseStyles from "../Case.module.css";
import { type CaseActions, End } from "../CaseView";
import { Duo } from "../memoridian/Duo";
import base from "../memoridian/Showcase.module.css";
import styles from "./Kavkazstore.module.css";

// Страница магазина «Кавказские умельцы» (docs/12-case-page.md): тот же вид, что у Memoridian и проката.
// Идёт от шапки и витрины к каталогу, карточке товара и телефону. Снимки — настоящий сайт, ссылок на него
// нет. Телефоны, адрес и почта магазина в кадр не взяты. Карточки на главной нет, вход — из списка работ.

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const src = (file: string) => `${BASE}/works/kavkazstore/${file}.webp`;

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
  ["#BC0000", "#FFFFFF"],
  ["#D76666", "#FFFFFF"],
  ["#FF7A29", "#141414"],
  ["#222222", "#FFFFFF"],
  ["#EEEFF1", "#141414"],
  ["#FFFFFF", "#141414"],
];

export function Kavkazstore({ c, act, full }: { c: CaseData; act: CaseActions; full: boolean }) {
  return (
    <>
      <section className={`${base.shot} ${base.intro}`}>
        <h1 className={base.title} id="case-title" data-hi>
          Кавказские <br />
          умельцы
        </h1>
        <p className={`${base.text} ${base.lead}`} data-hi>
          Интернет-магазин кавказских сувениров и&nbsp;подарков: витрина, каталог и&nbsp;карточка
          товара.
        </p>
        <Duo
          slug="kavkazstore"
          className={base.duo}
          data-cover=""
          alts={[
            "Шапка магазина: знак, корзина и пять главных разделов каталога",
            "Карточка товара на витрине: картина с гранатами на ковре",
            "Карточка товара на витрине: картина с кувшином и гранатами",
            "Карточка товара на витрине: кизлярский нож с чехлом",
            "Плитка раздела «Традиционная одежда»: красная черкеска на белом",
          ]}
        />
        <div className={base.facts} data-hi>
          <div>
            <p className={base.text}>Что входило в работу</p>
            <ul className={`${base.note} ${base.list}`}>
              <li>Шапка и меню каталога</li>
              <li>Главная: витрина и плитки разделов</li>
              <li>Каталог: фильтры и три вида списка</li>
              <li>Карточка товара</li>
              <li>Версия для телефона</li>
            </ul>
          </div>
          <div>
            <p className={base.text}>Что есть на сайте</p>
            <ul className={`${base.note} ${base.list}`}>
              <li>15 разделов каталога</li>
              <li>Больше 20 фильтров</li>
              <li>Четыре вкладки витрины</li>
              <li>Покупка в один клик</li>
            </ul>
          </div>
        </div>
      </section>

      {full && (
        <>
          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="head"
              head="Шапка"
              pic={
                <div className={base.page}>
                  <Img
                    file="head-plus"
                    m={["head-m", 780, 660]}
                    w={1440}
                    h={393}
                    alt="Шапка: чёрная строка с разделами о магазине и поиском, ниже знак, корзина, пять главных разделов и ряд из пяти значков"
                  />
                </div>
              }
            >
              Чёрная строка ведёт к&nbsp;условиям магазина и&nbsp;поиску. Ниже знак, корзина
              и&nbsp;пять главных разделов, остальные за&nbsp;«Все категории». Под шапкой пять
              коротких обещаний со&nbsp;значками.
            </Block>
            <Block
              name="showcase"
              head="Витрина вкладками"
              pic={
                <div className={base.page}>
                  <Img
                    file="showcase"
                    m={["showcase-m", 1680, 1760]}
                    w={1240}
                    h={880}
                    alt="Витрина на главной: вкладки «Мы рекомендуем», «Новинки», «Хиты продаж», «Скидки» и карточки с картинами"
                  />
                </div>
              }
            >
              Главная начинается с&nbsp;товаров. Четыре вкладки: рекомендуем, новинки, хиты
              и&nbsp;скидки. Карточка везде одна: фото, название, цена, ярлык, значки избранного
              и&nbsp;сравнения. Яркие работы мастеров сами становятся оформлением страницы.
            </Block>
            <Block
              name="tiles"
              head="Разделы плитками"
              pic={
                <div className={base.page}>
                  <Img
                    file="tiles"
                    m={["tile", 758, 388]}
                    w={1240}
                    h={348}
                    alt="Каталог на главной: коралловые плитки разделов с предметом на белом поле и стрелки карусели"
                  />
                </div>
              }
            >
              Под витриной карусель из&nbsp;15&nbsp;разделов каталога: от&nbsp;серебра и&nbsp;ковров
              до&nbsp;книг. У&nbsp;плитки слева название и&nbsp;ссылка, справа предмет на&nbsp;белом
              поле.
            </Block>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <div className={base.line}>
              <Block
                name="filters"
                head="Фильтры по&nbsp;свойствам"
                pic={
                  <div className={`${base.page} ${styles.crop}`}>
                    <Img
                      file="filters"
                      w={472}
                      h={1560}
                      alt="Колонка фильтров: список подразделов, стоимость, вес, длина и ширина клинка, у каждого два поля и ползунок"
                    />
                  </div>
                }
              >
                В&nbsp;разделе оружия больше 20&nbsp;фильтров: цена, вес, размеры клинка, материал
                ножен, сталь, твёрдость. Числа задаются диапазоном: два поля и&nbsp;ползунок.
                Выше&nbsp;фильтров список подразделов.
              </Block>
              <Block
                name="views"
                head="Три вида списка"
                pic={
                  <div className={styles.stack}>
                    <div className={base.page}>
                      <Img
                        file="list-view"
                        w={980}
                        h={620}
                        alt="Каталог списком: у товара фото, название, описание, цена и кнопка"
                      />
                    </div>
                    <div className={base.page}>
                      <Img
                        file="mini-view"
                        w={980}
                        h={620}
                        alt="Каталог плотными строками: маленькое фото, название, цена и кнопка"
                      />
                    </div>
                  </div>
                }
              >
                Рядом с&nbsp;сортировкой переключатель вида: сетка, список с&nbsp;описанием
                и&nbsp;плотные строки. В&nbsp;плотном виде на&nbsp;экране помещается намного больше
                товаров.
              </Block>
            </div>
            <Block
              name="product"
              head="Карточка товара"
              pic={
                <div className={base.page}>
                  <Img
                    file="product"
                    w={1240}
                    h={860}
                    alt="Страница картины: превью слева, большое фото, справа наличие, цена, количество, две кнопки покупки и условия доставки"
                  />
                </div>
              }
            >
              Слева фото с&nbsp;превью, справа наличие, цена, количество и&nbsp;две кнопки: купить
              и&nbsp;купить в&nbsp;один клик. Сроки и&nbsp;цена доставки стоят рядом, поэтому
              уходить на&nbsp;отдельную страницу не&nbsp;нужно. Ниже вкладки описания, характеристик
              и&nbsp;отзывов.
            </Block>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="phones"
              head="На&nbsp;телефоне своя раскладка"
              pic={
                <div className={styles.pair}>
                  <figure className={styles.device}>
                    <Img
                      file="phone-home"
                      w={780}
                      h={1688}
                      alt="Витрина на телефоне: карточки в два столбца, у каждой количество и кнопка «Купить»"
                    />
                  </figure>
                  <figure className={styles.device}>
                    <Img
                      file="phone-product"
                      w={780}
                      h={1688}
                      alt="Карточка товара на телефоне: название, фото, цена и кнопки на всю ширину"
                    />
                  </figure>
                </div>
              }
            >
              Товары идут в&nbsp;два столбца, у&nbsp;каждого прямо в&nbsp;списке количество
              и&nbsp;кнопка «Купить». В&nbsp;карточке всё встаёт одной колонкой, кнопки
              растягиваются на&nbsp;всю ширину, а&nbsp;меню прячется за&nbsp;значок в&nbsp;шапке.
            </Block>
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
                Красный как на&nbsp;знаке: цены, кнопки и&nbsp;активная вкладка. Коралловый
                у&nbsp;плиток разделов, оранжевый у&nbsp;ярлыка «Новинка». Остальное нейтральное:
                цвет здесь дают сами товары.
              </Block>
              <Block
                name="kit"
                head="Шрифт и&nbsp;детали"
                pic={
                  <div className={base.page}>
                    <Img
                      file="kit"
                      w={1240}
                      h={620}
                      alt="Детали интерфейса: вкладки витрины, ряд значков, фильтр с ползунком, цена, количество и кнопки покупки"
                    />
                  </div>
                }
              >
                Шрифт Open Sans. Вкладки с&nbsp;красной чертой, значки в&nbsp;одну линию, ползунок
                с&nbsp;красными концами и&nbsp;красная кнопка повторяются от&nbsp;страницы
                к&nbsp;странице.
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
