import type { ReactNode } from "react";
import type { CaseData } from "@/components/scenes/Scene3";
import caseStyles from "../Case.module.css";
import { type CaseActions, End } from "../CaseView";
import { Duo } from "../memoridian/Duo";
import base from "../memoridian/Showcase.module.css";
import styles from "./Picvario.module.css";

// Страница медиатеки Picvario (docs/12-case-page.md): тот же вид, что у Memoridian и проката. Идёт от
// сетки к файлу, поиску и фильтрам. Снимки — открытая площадка сервиса без входа: файлы на ней тестовые,
// подписи коллекций и теги заменены нейтральными. Ссылок на сервис нет. Что за входом (права, порталы),
// гостю не видно, поэтому оно только в списке первого экрана, со слов карточки.

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const src = (file: string) => `${BASE}/works/picvario/${file}.webp`;

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
  ["#FF00D0", "#141414"],
  ["#1C1D1F", "#FFFFFF"],
  ["#61646B", "#FFFFFF"],
  ["#8F969F", "#141414"],
  ["#E4E8ED", "#141414"],
  ["#F1F2F4", "#141414"],
];

export function Picvario({ c, act, full }: { c: CaseData; act: CaseActions; full: boolean }) {
  return (
    <>
      <section className={`${base.shot} ${base.intro}`}>
        <h1 className={base.title} id="case-title" data-hi>
          Медиатека <br />
          Picvario
        </h1>
        <p className={`${base.text} ${base.lead}`} data-hi>
          Интерфейс, в&nbsp;котором компании хранят, ищут и&nbsp;отдают фото и&nbsp;видео. Весь
          с&nbsp;нуля.
        </p>
        <Duo
          slug="picvario"
          className={base.duo}
          data-cover=""
          alts={[
            "Сетка файлов разного цвета: на каждой плитке формат, несколько плиток выбраны",
            "Строка поиска: умный режим и выбранная коллекция",
            "Меню строки поиска: классический и умный поиск",
          ]}
        />
        <div className={base.facts} data-hi>
          <div>
            <p className={base.text}>Что входило в работу</p>
            <ul className={`${base.note} ${base.list}`}>
              <li>Медиатека и карточка файла</li>
              <li>Поиск и фильтры</li>
              <li>Права</li>
              <li>Порталы</li>
              <li>Версия для телефона</li>
            </ul>
          </div>
          <div>
            <p className={base.text}>Что есть в сервисе</p>
            <ul className={`${base.note} ${base.list}`}>
              <li>Больше 100 крупных компаний в работе</li>
              <li>Поиск по лицу и похожему снимку</li>
              <li>Ссылки с паролем и сроком</li>
              <li>Фото, видео и документы в одной сетке</li>
              <li>Русский и английский интерфейс</li>
            </ul>
          </div>
        </div>
      </section>

      {full && (
        <>
          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="library"
              head="Сетка, в&nbsp;которой видно сами файлы"
              pic={
                <div className={base.page}>
                  <Img
                    file="library"
                    m={["library-m", 1140, 1050]}
                    w={2400}
                    h={1333}
                    alt="Медиатека: слева коллекции, справа сетка файлов, сверху поиск и сортировка"
                  />
                </div>
              }
            >
              Главный экран отдан файлам. Плитки идут плотными рядами, на&nbsp;каждой формат,
              а&nbsp;коллекции и&nbsp;настройки вида держатся по&nbsp;краям. Файлы здесь тестовые,
              поэтому такие разноцветные.
            </Block>
            <Block
              name="open"
              head="Файл открывается на&nbsp;месте"
              pic={
                <div className={base.page}>
                  <Img
                    file="open"
                    m={["open-m", 1040, 1120]}
                    w={2400}
                    h={1605}
                    alt="Под рядом плиток открыта тёмная полоса: свойства, теги, просмотр, кнопки «Скачать» и «Похожие изображения»"
                  />
                </div>
              }
            >
              Нажатие не&nbsp;уводит на&nbsp;другую страницу: под рядом раскрывается тёмная полоса
              с&nbsp;просмотром, свойствами и&nbsp;файлами. Соседние снимки остаются на&nbsp;экране,
              а&nbsp;от&nbsp;файла один шаг до&nbsp;скачивания и&nbsp;до&nbsp;похожих изображений.
            </Block>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <div className={base.line}>
              <Block
                name="search"
                head="Два поиска в&nbsp;одной строке"
                pic={
                  <div className={base.page}>
                    <Img
                      file="search-m"
                      w={1200}
                      h={510}
                      alt="Строка поиска с открытым меню: классический и умный поиск"
                    />
                  </div>
                }
              >
                Режим переключается прямо в&nbsp;поле. Классический ищет по&nbsp;свойствам файла,
                умный по&nbsp;смыслу и&nbsp;визуалу: находит снимки, даже если название файла
                забылось.
              </Block>
              <Block
                name="collections"
                head="Коллекции сбоку"
                pic={
                  <div className={base.page}>
                    <Img
                      file="collections"
                      w={1212}
                      h={1170}
                      alt="Панель коллекций: поиск по коллекциям, названия и число файлов в каждой"
                    />
                  </div>
                }
              >
                У&nbsp;панели свой поиск, рядом с&nbsp;названием число файлов. Выбранная коллекция
                сразу сужает сетку, а&nbsp;сама панель прячется одной кнопкой.
              </Block>
            </div>
            <Block
              name="filter"
              head="Фильтры на&nbsp;весь архив"
              pic={
                <div className={base.page}>
                  <Img
                    file="filter"
                    w={1572}
                    h={2466}
                    alt="Панель фильтров: коллекция, персоны, название, описание, теги, «Не заполнено», статус оригинала"
                  />
                </div>
              }
            >
              Значок в&nbsp;конце строки открывает панель с&nbsp;двумя вкладками: по&nbsp;активам
              и&nbsp;по&nbsp;коллекциям. Коллекция, персоны, название, описание, теги, статус
              оригинала и&nbsp;отдельное поле «Не&nbsp;заполнено». Условия собираются вместе
              и&nbsp;сбрасываются одной кнопкой.
            </Block>
            <div className={base.line}>
              <Block
                name="view"
                head="Вид и&nbsp;масштаб"
                pic={
                  <div className={base.page}>
                    <Img
                      file="view"
                      w={1320}
                      h={480}
                      alt="Меню вида: три раскладки и ползунок масштаба"
                    />
                  </div>
                }
              >
                Три раскладки и&nbsp;ползунок масштаба. Рядом сортировка и&nbsp;«Выбрать все»:
                настройка вида всегда в&nbsp;одном углу.
              </Block>
              <Block
                name="select"
                head="Выбор"
                pic={
                  <div className={base.page}>
                    <Img
                      file="select"
                      w={1938}
                      h={984}
                      alt="Две выбранные плитки с малиновой рамкой и галочкой, ниже панель «Выбрано: 3 из 50»"
                    />
                  </div>
                }
              >
                Выбранные плитки получают рамку и&nbsp;галочку, снизу выезжает панель со&nbsp;счётом
                и&nbsp;общим скачиванием.
              </Block>
            </div>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="phones"
              head="На&nbsp;телефоне своя раскладка"
              pic={
                <div className={styles.pair}>
                  <figure className={styles.device}>
                    <Img
                      file="phone-grid"
                      w={1170}
                      h={2532}
                      alt="Сетка на телефоне: три плитки в ряд и переключатель активов и коллекций"
                    />
                  </figure>
                  <figure className={styles.device}>
                    <Img
                      file="phone-open"
                      w={1170}
                      h={2532}
                      alt="Открытый файл на телефоне: просмотр на всю ширину, ниже свойства и кнопки"
                    />
                  </figure>
                </div>
              }
            >
              Сетка сжимается до&nbsp;трёх плиток в&nbsp;ряду, а&nbsp;активы и&nbsp;коллекции
              становятся вкладками. Файл открывается так&nbsp;же, на&nbsp;месте: сверху просмотр
              и&nbsp;стрелки к&nbsp;соседним файлам, снизу свойства.
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
                Сам интерфейс серый, чтобы не&nbsp;спорить с&nbsp;файлами. Малиновый только
                у&nbsp;действий и&nbsp;выбора, тёмный у&nbsp;просмотра файла.
              </Block>
              <Block
                name="kit"
                head="Шрифт и&nbsp;детали"
                pic={
                  <div className={base.page}>
                    <Img
                      file="kit"
                      w={1560}
                      h={870}
                      alt="Детали интерфейса: плитки с форматом, вкладки, теги, кнопки «Скачать» и «Похожие изображения»"
                    />
                  </div>
                }
              >
                PT Root UI и&nbsp;четыре размера: от&nbsp;10 до&nbsp;16. Плитки, теги, метки формата
                и&nbsp;кнопки повторяются на&nbsp;всех экранах.
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
