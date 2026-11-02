import type { ReactNode } from "react";
import type { CaseData } from "@/components/scenes/Scene3";
import caseStyles from "../Case.module.css";
import { type CaseActions, End } from "../CaseView";
import { Duo } from "../memoridian/Duo";
import base from "../memoridian/Showcase.module.css";
import styles from "./Kanban.module.css";

// Страница таск-трекера Shortcut (docs/12-case-page.md): доска, таймлайн, список, страница задачи и версия
// для телефона. Снимки — макеты с данными из самого макета, аватары и столбец с людьми убраны. Ссылок
// нет. Карточки на главной нет, вход — из списка работ.

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function Img(p: { file: string; w: number; h: number; alt: string }) {
  return (
    // biome-ignore lint/performance/noImgElement: статический экспорт, файлы из public как есть
    <img
      src={`${BASE}/works/kanban/${p.file}.webp`}
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
  ["#21212B", "#FFFFFF"],
  ["#292933", "#FFFFFF"],
  ["#02D3AC", "#141414"],
  ["#8A69F8", "#141414"],
  ["#F9C500", "#141414"],
  ["#FF7900", "#141414"],
];

export function Kanban(p: { c: CaseData; act: CaseActions; full: boolean }) {
  const { c, act, full } = p;
  return (
    <>
      <section className={`${base.shot} ${base.intro}`}>
        <h1 className={base.title} id="case-title" data-hi>
          Таск-трекер <br />
          Shortcut
        </h1>
        <p className={`${base.text} ${base.lead}`} data-hi>
          Сервис для работы над задачами в&nbsp;команде: доска, таймлайн, список и&nbsp;страница
          задачи.
        </p>
        <Duo
          slug="kanban"
          className={base.duo}
          data-cover=""
          alts={[
            "Таймлайн: шкала дней и цветные полосы задач в двух проектах",
            "Цвета пространства в ряд",
            "Карточка задачи в наклоне, как при перетаскивании: номер, название, теги и флаг",
          ]}
        />
        <div className={base.facts} data-hi>
          <div>
            <p className={base.text}>Что входило в работу</p>
            <ul className={`${base.note} ${base.list}`}>
              <li>Доска, таймлайн и список</li>
              <li>Страница задачи</li>
              <li>Профиль и раздел «Люди»</li>
              <li>Окна: пространство, проект, спринт, доступ</li>
              <li>Версия для телефона</li>
              <li>Вход и регистрация</li>
            </ul>
          </div>
          <div>
            <p className={base.text}>Что есть в сервисе</p>
            <ul className={`${base.note} ${base.list}`}>
              <li>Пространства, проекты и спринты</li>
              <li>Теги, флаги, оценка и факт</li>
              <li>Чат и история в задаче</li>
            </ul>
          </div>
        </div>
      </section>

      {full && (
        <>
          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="board"
              head="Доска по&nbsp;спринтам"
              pic={
                <div className={base.page}>
                  <Img
                    file="board"
                    w={1460}
                    h={750}
                    alt="Доска отдела: столбцы «Новая задача», «В работе» и «Завершено», в каждом по две карточки с тегами и флагами"
                  />
                </div>
              }
            >
              У&nbsp;каждого проекта свой спринт и&nbsp;свои столбцы статусов. На&nbsp;карточке
              номер, название, теги, флаг и&nbsp;оценка. Над доской группы, фильтр
              и&nbsp;сортировка, а&nbsp;ползунок меняет размер карточек.
            </Block>
            <Block
              name="drag"
              head="Карточка в&nbsp;руке"
              pic={
                <Img
                  file="drag-flat"
                  w={524}
                  h={467}
                  alt="Карточка задачи: номер SD-595, название, теги и жёлтый флаг"
                />
              }
            >
              Задачу берут и&nbsp;переносят в&nbsp;другой столбец. На&nbsp;месте, куда её можно
              положить, появляется пустая рамка.
            </Block>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="timeline"
              head="Те&nbsp;же задачи на&nbsp;шкале дней"
              pic={
                <div className={base.page}>
                  <Img
                    file="timeline"
                    w={1480}
                    h={1070}
                    alt="Таймлайн: два проекта, шкала дней месяца и цветные полосы задач с номерами, комментариями и вложениями"
                  />
                </div>
              }
            >
              На&nbsp;таймлайне срок виден сразу: полоса лежит на&nbsp;шкале дней, на&nbsp;ней номер
              задачи, комментарии и&nbsp;вложения. Список слева можно скрыть, а&nbsp;у&nbsp;проекта
              есть переключатель Auto-mode.
            </Block>
            <Block
              name="list"
              head="И&nbsp;таблицей"
              pic={
                <div className={base.page}>
                  <Img
                    file="list"
                    w={1655}
                    h={320}
                    alt="Список задач строками: номер и название, статус, теги и эпик"
                  />
                </div>
              }
            >
              Третий вид для тех, кому важны строки: номер и&nbsp;название, статус, исполнитель,
              теги, эпик и&nbsp;ревью.
            </Block>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="task"
              head="Страница задачи"
              pic={
                <div className={base.page}>
                  <Img
                    file="task"
                    w={1342}
                    h={640}
                    alt="Страница задачи: заголовок, поля оценки, факта, тегов, эпика, даты и приоритета, зелёная кнопка «Выполнено» и меню действий"
                  />
                </div>
              }
            >
              Поля идут одним столбцом: оценка, факт, теги, эпик, дата и&nbsp;приоритет, снизу можно
              добавить своё. Статус стоит зелёной кнопкой наверху, а&nbsp;переименовать, клонировать
              или перенести в&nbsp;следующий спринт можно из&nbsp;меню рядом.
            </Block>
            <div className={base.line}>
              <Block
                name="space"
                head="Свой цвет у&nbsp;пространства"
                pic={
                  <Img
                    file="space"
                    w={890}
                    h={435}
                    alt="Окно «Добавить пространство»: значок, поле имени, десять цветов и поле приглашения по почте или имени"
                  />
                }
              >
                Новому пространству дают имя, значок и&nbsp;один из&nbsp;десяти цветов, а&nbsp;людей
                приглашают прямо здесь.
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
                Основа тёмная, цвет только у&nbsp;полос и&nbsp;тегов. Цвета подобраны
                по&nbsp;снимкам.
              </Block>
            </div>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <div className={base.line}>
              <Block
                name="phones"
                head="На&nbsp;телефоне"
                pic={
                  <div className={styles.pair}>
                    <Img
                      file="phone-board"
                      w={586}
                      h={1270}
                      alt="Доска на телефоне: столбцы карточек и кнопки групп, фильтра и сортировки"
                    />
                    <Img
                      file="phone-timeline"
                      w={586}
                      h={1270}
                      alt="Таймлайн на телефоне: шкала дней и цветные полосы задач"
                    />
                  </div>
                }
              >
                Те&nbsp;же доска и&nbsp;таймлайн в&nbsp;узком экране: столбцы уходят вбок,
                а&nbsp;группы, фильтр и&nbsp;сортировка стоят над ними тремя кнопками. Карточки
                короче: номер, название, флаг и&nbsp;оценка.
              </Block>
              <Block
                name="tabs"
                head="Разделы внизу"
                pic={
                  <Img
                    file="tabs"
                    w={546}
                    h={94}
                    alt="Нижняя панель телефона с четырьмя значками разделов, первый выделен"
                  />
                }
              >
                Вкладки из&nbsp;шапки на&nbsp;телефоне спущены в&nbsp;нижнюю панель.
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
