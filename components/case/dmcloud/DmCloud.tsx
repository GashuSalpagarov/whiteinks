import type { ReactNode } from "react";
import type { CaseData } from "@/components/scenes/Scene3";
import caseStyles from "../Case.module.css";
import { type CaseActions, End } from "../CaseView";
import { Duo } from "../memoridian/Duo";
import base from "../memoridian/Showcase.module.css";
import styles from "./DmCloud.module.css";

// Страница сервиса контроля качества DMCloud (docs/12-case-page.md): экран сравнения, допуски, замеры, окно
// создания проекта, компоненты и Storybook. Снимки — кадры видео о продукте: шапка с именем файлов и
// профилем, почта и список людей в замечаниях обрезаны. Ссылок нет. Карточки на главной нет, вход — из
// списка работ.

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function Img(p: { file: string; w: number; h: number; alt: string }) {
  return (
    // biome-ignore lint/performance/noImgElement: статический экспорт, файлы из public как есть
    <img
      src={`${BASE}/works/dmcloud/${p.file}.webp`}
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

export function DmCloud(p: { c: CaseData; act: CaseActions; full: boolean }) {
  const { c, act, full } = p;
  return (
    <>
      <section className={`${base.shot} ${base.intro}`}>
        <h1 className={base.title} id="case-title" data-hi>
          Контроль качества <br />
          DMCloud
        </h1>
        <p className={`${base.text} ${base.lead}`} data-hi>
          Веб-сервис для контроля качества в промышленности: план сравнивается с фактом, отклонения
          видны на 3D-модели и сверяются с допусками.
        </p>
        <Duo
          slug="dmcloud"
          className={base.duo}
          data-cover=""
          alts={[
            "Экран сравнения: панели снимков и свойств слева, 3D-модель в цветах отклонений и гистограмма в центре, замечания справа",
            "Две модели в окне создания проекта: плановая и результат сканирования",
            "Панель свойств: максимум, минимум и средние отклонения, границы шкалы и допуск в микрометрах",
          ]}
        />
        <div className={base.facts} data-hi>
          <div>
            <p className={base.text}>Что входило в работу</p>
            <ul className={`${base.note} ${base.list}`}>
              <li>Новый интерфейс с нуля</li>
              <li>Единые компоненты и тёмная тема</li>
              <li>Окно создания проекта с 3D-превью</li>
              <li>Новые элементы управления</li>
              <li>Каталог компонентов в Storybook</li>
            </ul>
          </div>
          <div>
            <p className={base.text}>Что есть в продукте</p>
            <ul className={`${base.note} ${base.list}`}>
              <li>Сравнение плана и результата</li>
              <li>Гистограмма отклонений и допуски</li>
              <li>Снимки вида, замеры и замечания</li>
              <li>Доступ по приглашению и ссылке</li>
            </ul>
          </div>
        </div>
      </section>

      {full && (
        <>
          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="main"
              head="План, факт и&nbsp;допуски на&nbsp;одном экране"
              pic={
                <div className={base.page}>
                  <Img
                    file="main"
                    w={1920}
                    h={919}
                    alt="Экран сравнения: слева снимки, состав сцены и свойства, в центре 3D-модель с подписями отклонений и гистограмма, справа замечания"
                  />
                </div>
              }
            >
              Плановая модель и&nbsp;результат сканирования совмещены, цвет показывает, где
              результат ушёл от&nbsp;плана. Слева снимки вида, состав сцены и&nbsp;свойства,
              в&nbsp;центре модель и&nbsp;гистограмма, справа замечания.
            </Block>
            <Block
              name="props"
              head="Сводка и&nbsp;границы рядом с&nbsp;моделью"
              pic={
                <div className={base.page}>
                  <Img
                    file="props"
                    w={398}
                    h={478}
                    alt="Панель Properties: режим сравнения, Max, Min, Standard, Mean и Median, кнопка Full report, поля Scope и Permissible deviation"
                  />
                </div>
              }
            >
              Максимум, минимум и&nbsp;средние отклонения собраны в&nbsp;одной панели, под ними
              полный отчёт. Границы шкалы и&nbsp;допустимое отклонение задаются числом
              в&nbsp;микрометрах.
            </Block>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="dev"
              head="Допуск сдвинули, модель перекрасилась"
              pic={
                <div className={styles.pair}>
                  <div className={base.page}>
                    <Img
                      file="dev-a"
                      w={860}
                      h={640}
                      alt="Допуск от −100 до 100 микрометров: зелёная зона на модели и гистограмме, выше неё оранжевый участок"
                    />
                  </div>
                  <div className={base.page}>
                    <Img
                      file="dev-b"
                      w={860}
                      h={640}
                      alt="Допуск от −50 до 100 микрометров: на модели появился синий участок, зелёная зона на гистограмме стала уже"
                    />
                  </div>
                </div>
              }
            >
              Зелёная зона на&nbsp;гистограмме и&nbsp;есть допуск. Стоит изменить границу, как
              и&nbsp;шкала, и&nbsp;модель показывают, какие участки теперь выходят за&nbsp;него.
            </Block>
            <div className={base.line}>
              <Block
                name="gray"
                head="Две палитры"
                pic={
                  <div className={base.page}>
                    <Img
                      file="gray"
                      w={860}
                      h={640}
                      alt="Палитра RedGrayBlue: участки вне допуска чистым красным и синим, внутри допуска зелёный"
                    />
                  </div>
                }
              >
                Rainbow показывает отклонение плавно, в&nbsp;RedGrayBlue границы резче: сразу видно,
                что вышло за&nbsp;допуск.
              </Block>
              <Block
                name="visual"
                head="Как показать модель"
                pic={
                  <div className={base.page}>
                    <Img
                      file="visual"
                      w={398}
                      h={287}
                      alt="Панель Visualization: стиль сравнения Rainbow, переключатель максимумов на сцене, стиль моделей Plan и Result"
                    />
                  </div>
                }
              >
                Стиль сравнения, подписи максимумов на&nbsp;сцене и&nbsp;вид каждой модели
                настраиваются отдельно.
              </Block>
            </div>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <div className={base.line}>
              <Block
                name="measure"
                head="Замеры прямо на&nbsp;модели"
                pic={
                  <div className={base.page}>
                    <Img
                      file="measure"
                      w={840}
                      h={680}
                      alt="Модель с подписями: расстояние 5,275 миллиметра, разница в отмеченных точках, максимальные отклонения в обе стороны"
                    />
                  </div>
                }
              >
                Линейка измеряет расстояние в&nbsp;миллиметрах, а&nbsp;точка на&nbsp;поверхности
                показывает разницу с&nbsp;планом в&nbsp;микрометрах. Подписи остаются на&nbsp;сцене,
                когда модель поворачивают.
              </Block>
              <Block
                name="snapshot"
                head="Снимок вида"
                pic={
                  <div className={base.page}>
                    <Img
                      file="snapshot"
                      w={578}
                      h={228}
                      alt="Меню снимка: Make public, Copy link, Rename snapshot и Delete snapshot"
                    />
                  </div>
                }
              >
                Вид сохраняют снимком, чтобы быстро к&nbsp;нему вернуться. Снимок можно открыть для
                всех и&nbsp;отправить ссылкой.
              </Block>
            </div>
            <Block
              name="share"
              head="Разобрать вместе"
              pic={
                <div className={base.page}>
                  <Img
                    file="share"
                    w={862}
                    h={270}
                    alt="Окно доступа к проекту: поле почты, роль Reviewer, кнопка Invite и переключатель начала с выбранного снимка"
                  />
                </div>
              }
            >
              Коллегу приглашают по&nbsp;почте с&nbsp;нужной ролью, а&nbsp;открыть проект можно
              сразу на&nbsp;выбранном снимке. Замечания собираются в&nbsp;панели справа, рядом
              с&nbsp;ними поиск и&nbsp;фильтр.
            </Block>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="empty"
              head="Новое окно создания проекта"
              pic={
                <div className={base.page}>
                  <Img
                    file="empty"
                    w={1512}
                    h={826}
                    alt="Окно New project: две области загрузки, Plan model (CAD) и Result model (scan), кнопка перехода к автовыравниванию"
                  />
                </div>
              }
            >
              Цель обновления — снизить порог входа, поэтому проект начинается с&nbsp;понятного
              шага: две области и&nbsp;две модели, план и&nbsp;результат сканирования.
            </Block>
            <Block
              name="models"
              head="Модель видна сразу"
              pic={
                <div className={base.page}>
                  <Img
                    file="models"
                    w={1427}
                    h={463}
                    alt="Две загруженные модели в окне: плановая гладкая и результат сканирования с неровной поверхностью"
                  />
                </div>
              }
            >
              После загрузки в&nbsp;окне появляется 3D-превью: файл можно проверить ещё
              до&nbsp;создания проекта.
            </Block>
            <Block
              name="align"
              head="Автовыравнивание до&nbsp;старта"
              pic={
                <div className={base.page}>
                  <Img
                    file="align"
                    w={1426}
                    h={655}
                    alt="Шаг Auto-alignment: выбор опорной модели, кнопка запуска, модель в цветах отклонений и гистограмма"
                  />
                </div>
              }
            >
              Следующим шагом модели совмещаются автоматически, опору выбирают из&nbsp;списка.
              Результат виден в&nbsp;цвете и&nbsp;на&nbsp;гистограмме ещё в&nbsp;этом окне.
            </Block>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <div className={base.line}>
              <Block
                name="fields"
                head="Единые компоненты"
                pic={
                  <div className={base.page}>
                    <Img
                      file="fields"
                      w={776}
                      h={880}
                      alt="Набор полей на тёмном фоне: подсказка, значение, единицы измерения, выбор, поиск и значение со значком"
                    />
                  </div>
                }
              >
                Интерфейс собран заново на&nbsp;одном наборе элементов в&nbsp;тёмной теме. Поля,
                подсказки и&nbsp;единицы измерения выглядят одинаково на&nbsp;всех экранах.
              </Block>
              <Block
                name="search"
                head="Поиск"
                pic={
                  <div className={base.page}>
                    <Img
                      file="search"
                      w={760}
                      h={290}
                      alt="Поле поиска отдельно и вместе с кнопкой фильтра"
                    />
                  </div>
                }
              >
                Отдельно и&nbsp;вместе с&nbsp;кнопкой фильтра.
              </Block>
            </div>
            <Block
              name="dialogs"
              head="Окна одного вида"
              pic={
                <div className={base.page}>
                  <Img
                    file="dialogs"
                    w={915}
                    h={303}
                    alt="Окна переименования и удаления проекта: заголовок, крестик, поле или вопрос и две кнопки"
                  />
                </div>
              }
            >
              Заголовок, крестик и&nbsp;две кнопки справа внизу. Опасное действие выделено красным.
            </Block>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="storybook"
              head="Каталог компонентов"
              pic={
                <div className={base.page}>
                  <Img
                    file="sb-button"
                    w={1920}
                    h={976}
                    alt="Storybook: дерево компонентов слева, страница кнопки с примером, описанием и таблицей свойств"
                  />
                </div>
              }
            >
              Все элементы лежат в&nbsp;Storybook с&nbsp;документацией: пример вживую, описание
              и&nbsp;таблица свойств на&nbsp;русском.
            </Block>
            <Block
              name="icons"
              head="51 иконка с&nbsp;поиском"
              pic={
                <div className={base.page}>
                  <Img
                    file="sb-icons"
                    w={1318}
                    h={596}
                    alt="Галерея иконок в Storybook: поле поиска, счётчик найденных и плитки иконок с названиями"
                  />
                </div>
              }
            >
              Значки собраны в&nbsp;галерею: нужный находится по&nbsp;названию.
            </Block>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="old"
              head="Как было"
              pic={
                <div className={base.page}>
                  <Img
                    file="old"
                    w={1920}
                    h={676}
                    alt="Прежний экран сравнения: светлые панели по краям и модель на сине-сером фоне"
                  />
                </div>
              }
            >
              Так экран сравнения выглядел до&nbsp;обновления. Теперь продукт готов к&nbsp;показу
              и&nbsp;внутреннему использованию.
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
