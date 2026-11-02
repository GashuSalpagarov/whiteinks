import type { ReactNode } from "react";
import type { CaseData } from "@/components/scenes/Scene3";
import caseStyles from "../Case.module.css";
import { type CaseActions, End } from "../CaseView";
import { Duo } from "../memoridian/Duo";
import base from "../memoridian/Showcase.module.css";
import styles from "./CheckPlease.module.css";

// Страница приложения «Чек плиз» (docs/12-case-page.md): идёт за гостем от выбора «на стол или самому» до
// статуса заказа и ошибок. Снимки — макеты с данными из самого макета. Ссылок нет. Карточки на главной
// нет, вход — из списка работ.

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function Img(p: { file: string; w: number; h: number; alt: string }) {
  return (
    // biome-ignore lint/performance/noImgElement: статический экспорт, файлы из public как есть
    <img
      src={`${BASE}/works/check-please/${p.file}.webp`}
      width={p.w}
      height={p.h}
      alt={p.alt}
      decoding="async"
    />
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
  ["#CBE4A3", "#141414"],
  ["#2D2926", "#FFFFFF"],
  ["#E57486", "#141414"],
  ["#F1F0EC", "#141414"],
  ["#F9F9F9", "#141414"],
  ["#BBBBBB", "#141414"],
];

export function CheckPlease(p: { c: CaseData; act: CaseActions; full: boolean }) {
  const { c, act, full } = p;
  return (
    <>
      <section className={`${base.shot} ${base.intro}`}>
        <h1 className={base.title} id="case-title" data-hi>
          Чек плиз
        </h1>
        <p className={`${base.text} ${base.lead}`} data-hi>
          Приложение для заказа в&nbsp;кафе: на&nbsp;стол или самому забрать, от&nbsp;меню
          до&nbsp;статуса заказа.
        </p>
        <Duo
          slug="check-please"
          className={base.duo}
          data-cover=""
          alts={[
            "Фото салата на большой тарелке из карточки блюда",
            "Меню на телефоне: раздел «Комбо», плитки блюд и зелёная полоса заказа с суммой",
            "Статус «Заказ №1234 готов, можете забирать»: четыре значка в ряд, последний выделен зелёным",
          ]}
        />
        <div className={base.facts} data-hi>
          <div>
            <p className={base.text}>Что входило в работу</p>
            <ul className={`${base.note} ${base.list}`}>
              <li>Начало заказа и номер стола</li>
              <li>Меню и карточка блюда</li>
              <li>Заказ и его статусы</li>
              <li>Окна ошибок</li>
              <li>Боковое меню</li>
            </ul>
          </div>
          <div>
            <p className={base.text}>Что есть в приложении</p>
            <ul className={`${base.note} ${base.list}`}>
              <li>Заказ на стол или самому забрать</li>
              <li>Добавки, соусы и пожелания</li>
              <li>Комментарий к заказу</li>
              <li>Связь с заведением</li>
            </ul>
          </div>
        </div>
      </section>

      {full && (
        <>
          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="start"
              head="На&nbsp;стол или самому"
              pic={
                <div className={base.page}>
                  <Img
                    file="new"
                    w={647}
                    h={465}
                    alt="Экран «Новый заказ»: «Заказать на стол» и «Забрать самому», у каждого пояснение и круглая зелёная кнопка со стрелкой"
                  />
                </div>
              }
            >
              Заказ начинается с&nbsp;одного вопроса. На&nbsp;стол заказ принесёт официант. Если
              забрать самому, гость покажет сотруднику номер заказа в&nbsp;приложении. Оба варианта
              объяснены прямо на&nbsp;экране.
            </Block>
            <Block
              name="table"
              head="Номер стола с&nbsp;наклейки"
              pic={
                <div className={base.page}>
                  <Img
                    file="table"
                    w={647}
                    h={620}
                    alt="Экран «Введите номер стола»: поле с символом №, раскрытая подсказка «Где его найти?» и три строки со значками"
                  />
                </div>
              }
            >
              На&nbsp;экране одно поле. Подсказка «Где его найти?» раскрывается под ним
              и&nbsp;в&nbsp;три строки объясняет: на&nbsp;столе есть наклейка с&nbsp;номером
              и&nbsp;QR-кодом, номер вводят в&nbsp;форму и&nbsp;нажимают «Далее».
            </Block>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <div className={base.line}>
              <Block
                name="menu"
                head="Меню одной лентой"
                pic={
                  <div className={styles.frame}>
                    <Img
                      file="menu"
                      w={646}
                      h={1398}
                      alt="Меню: фото ягод, «Пока горячее», вкладки разделов, раздел «Комбо» с плитками блюд и полоса «Заказ 895 ₽»"
                    />
                  </div>
                }
              >
                Сверху фото и&nbsp;название заведения, под ними вкладки разделов: комбо, сеты,
                завтрак, ланч, салаты. Блюда идут плитками в&nbsp;два столбца: фото, название, вес
                и&nbsp;цена на&nbsp;кнопке. У&nbsp;выбранного блюда вместо цены стоит счётчик.
              </Block>
              <Block
                name="bar"
                head="Сумма на&nbsp;виду"
                pic={
                  <div className={base.page}>
                    <Img
                      file="bar"
                      w={646}
                      h={348}
                      alt="Низ меню: плитки блюд и поверх них зелёная полоса «Заказ 895 ₽»"
                    />
                  </div>
                }
              >
                Когда в&nbsp;заказе уже что-то есть, зелёная полоса с&nbsp;суммой лежит поверх ленты
                у&nbsp;нижнего края экрана.
              </Block>
            </div>
            <div className={base.line}>
              <Block
                name="add"
                head="Счётчик рядом с&nbsp;кнопкой"
                pic={
                  <div className={base.page}>
                    <Img
                      file="add"
                      w={647}
                      h={265}
                      alt="Низ карточки блюда: название, цена 250 ₽, счётчик и кнопка «Добавить»"
                    />
                  </div>
                }
              >
                В&nbsp;конце карточки блюда название и&nbsp;цена, ниже счётчик и&nbsp;кнопка
                «Добавить». Они идут после всех опций.
              </Block>
              <Block
                name="options"
                head="Соус нельзя пропустить"
                pic={
                  <div className={base.page}>
                    <Img
                      file="options"
                      w={647}
                      h={460}
                      alt="Опции блюда: «Добавки» с квадратными отметками, «Соус» красным с подписью «Выберите соус, чтобы продолжить» и круглыми отметками"
                    />
                  </div>
                }
              >
                Опции разложены группами, у&nbsp;каждой подпись с&nbsp;правилом: добавок
                до&nbsp;двух, особых пожеланий до&nbsp;четырёх. Цена опции стоит рядом
                с&nbsp;названием. Если соус не&nbsp;выбран, его группа становится красной,
                а&nbsp;подпись объясняет, что сделать.
              </Block>
            </div>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <div className={base.line}>
              <Block
                name="order"
                head="Заказ с&nbsp;опциями"
                pic={
                  <div className={styles.frame}>
                    <Img
                      file="order"
                      w={647}
                      h={1399}
                      alt="Экран «Заказ»: два блюда с опциями и счётчиками, счётчик со значком человека, поле комментария, сумма 500 ₽ и кнопка «Далее»"
                    />
                  </div>
                }
              >
                Под названием блюда серым идут выбранные опции, рядом его счётчик. Ниже счётчик
                со&nbsp;значком человека и&nbsp;поле «Ваш комментарий к&nbsp;заказу». Сумма
                и&nbsp;кнопка «Далее» стоят в&nbsp;самом низу, вверху справа значок корзины.
              </Block>
              <Block
                name="status"
                head="Четыре шага заказа"
                pic={
                  <div className={base.page}>
                    <Img
                      file="status"
                      w={647}
                      h={400}
                      alt="Статус «Заказ №1234 готов, можете забирать»: часы, карта, колпак и пакет в ряд, пакет выделен зелёным, ниже «Связаться с нами» и «Подробности заказа»"
                    />
                  </div>
                }
              >
                Часы, карта, колпак и&nbsp;пакет стоят в&nbsp;один ряд, текущий шаг залит зелёным.
                Над ними одна фраза, которая меняется вместе с&nbsp;шагом. Сейчас на&nbsp;снимке:
                заказ готов, можно забирать.
              </Block>
            </div>
            <Block
              name="thanks"
              head="После заказа"
              pic={
                <div className={base.page}>
                  <Img
                    file="thanks"
                    w={647}
                    h={380}
                    alt="Экран «Спасибо за заказ!»: «Ваш заказ №1234 выполнен!» и кнопки «Заказать ещё» и «Связаться с нами»"
                  />
                </div>
              }
            >
              Когда заказ выполнен, остаются два действия: заказать ещё или связаться
              с&nbsp;заведением. Зелёной стоит только первая кнопка.
            </Block>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <div className={base.line}>
              <Block
                name="modal"
                head="Блюда нет в&nbsp;наличии"
                pic={
                  <div className={base.page}>
                    <Img
                      file="stock"
                      w={582}
                      h={405}
                      alt="Окно «Извините, выбранного вами блюда нет в наличии»: блюдо серым, цена и кнопка «Вернуться в меню»"
                    />
                  </div>
                }
              >
                Окно показывает, какого именно блюда нет. Единственная кнопка возвращает
                в&nbsp;меню.
              </Block>
              <Block
                name="modal"
                head="Неизвестная ошибка"
                pic={
                  <div className={base.page}>
                    <Img
                      file="oops"
                      w={583}
                      h={468}
                      alt="Окно с облачком «Упс...», подпись «Произошла неизвестная ошибка» и кнопка «Попробовать ещё раз»"
                    />
                  </div>
                }
              >
                На&nbsp;непонятную ошибку есть облачко «Упс...» и&nbsp;одно действие: попробовать
                ещё раз.
              </Block>
            </div>
            <div className={base.line}>
              <Block
                name="side"
                head="Знак и&nbsp;поддержка"
                pic={
                  <div className={base.page}>
                    <Img
                      file="side"
                      w={443}
                      h={384}
                      alt="Боковое меню: знак «чек плиз» с зелёным узором как QR-код, «Условия пользования», «Поддержка» и два круглых значка"
                    />
                  </div>
                }
              >
                В&nbsp;знаке между словами «чек» и&nbsp;«плиз» стоит зелёный узор, похожий
                на&nbsp;QR-код. В&nbsp;боковом меню только условия и&nbsp;поддержка.
              </Block>
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
                Один зелёный для главного действия и&nbsp;текущего шага, красный для ошибки
                в&nbsp;опциях. Остальное тёмный текст и&nbsp;светлые плашки. Цвета подобраны
                по&nbsp;снимкам.
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
