import type { ReactNode } from "react";
import type { CaseData } from "@/components/scenes/Scene3";
import caseStyles from "../Case.module.css";
import { type CaseActions, End } from "../CaseView";
import { Duo } from "../memoridian/Duo";
import base from "../memoridian/Showcase.module.css";
import styles from "./GlobaldrivePortal.module.css";

// Страница корпоративного портала Globaldrive (docs/12-case-page.md): тот же вид, что у Memoridian и
// проката. Идёт от меню к карточке сотрудника и её вкладкам. Снимки — макеты: имя, дата рождения,
// контакты и руководители в кадр не взяты, карточка собрана из оставшихся строк. Ссылок нет. Карточки на
// главной нет, вход — из списка работ.

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function Img(p: { file: string; w: number; h: number; alt: string }) {
  return (
    // biome-ignore lint/performance/noImgElement: статический экспорт, файлы из public как есть
    <img
      src={`${BASE}/works/globaldrive-portal/${p.file}.webp`}
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
  ["#3168FF", "#FFFFFF"],
  ["#2A3A5C", "#FFFFFF"],
  ["#9340E6", "#FFFFFF"],
  ["#FF8B52", "#141414"],
  ["#F3F3F5", "#141414"],
  ["#D9DADE", "#141414"],
];

export function GlobaldrivePortal(p: { c: CaseData; act: CaseActions; full: boolean }) {
  const { c, act, full } = p;
  return (
    <>
      <section className={`${base.shot} ${base.intro}`}>
        <h1 className={base.title} id="case-title" data-hi>
          Портал <br />
          Globaldrive
        </h1>
        <p className={`${base.text} ${base.lead}`} data-hi>
          Корпоративный портал: личный кабинет сотрудника, обучение, график работы и&nbsp;продажи
          на&nbsp;одной странице.
        </p>
        <Duo
          slug="globaldrive-portal"
          className={base.duo}
          data-cover=""
          alts={[
            "Вкладка «Результаты тестов»: фильтры, плитки с прогрессом и месяцы",
            "Вкладка «График работы»: календарь на месяц с серыми выходными",
            "Боковое меню портала со знаком компании и рисунком внизу",
          ]}
        />
        <div className={base.facts} data-hi>
          <div>
            <p className={base.text}>Что входило в работу</p>
            <ul className={`${base.note} ${base.list}`}>
              <li>Личный кабинет сотрудника</li>
              <li>Карточка сотрудника и меню</li>
              <li>Тесты, уроки и прогресс грейдов</li>
              <li>График, посещаемость и продажи</li>
              <li>Страница для себя, администратора и коллеги</li>
              <li>Версия для телефона</li>
            </ul>
          </div>
          <div>
            <p className={base.text}>Разделы портала</p>
            <ul className={`${base.note} ${base.list}`}>
              <li>Пульс и структура компании</li>
              <li>Адаптация и обучение</li>
              <li>Инструментарий и база данных</li>
              <li>Отчёты, планы, аналитика</li>
              <li>Найм и управление</li>
            </ul>
          </div>
        </div>
      </section>

      {full && (
        <>
          <section className={`${base.shot} ${base.chapter}`}>
            <div className={base.line}>
              <Block
                name="menu"
                head="Весь портал в&nbsp;одном меню"
                pic={
                  <div className={base.page}>
                    <Img
                      file="menu-top"
                      w={264}
                      h={548}
                      alt="Меню: пульс компании, структура, адаптация и обучение с раскрытым списком, инструментарий, база данных, отчёты, найм, выход"
                    />
                  </div>
                }
              >
                Семь разделов собраны в&nbsp;колонку слева, у&nbsp;каждого свой значок
                в&nbsp;плитке. Раздел раскрывается на&nbsp;месте: у&nbsp;«Адаптации и&nbsp;обучения»
                это регламенты, план адаптации и&nbsp;аттестация. Открытый раздел залит синим,
                поэтому видно, где находишься.
              </Block>
              <Block
                name="flag"
                head="Рисунок под меню"
                pic={
                  <div className={base.page}>
                    <Img
                      file="flag"
                      w={264}
                      h={210}
                      alt="Рисунок: девушка с флагом со знаком компании поднимается по синему склону"
                    />
                  </div>
                }
              >
                Девушка с&nbsp;флагом поднимается в&nbsp;гору, на&nbsp;флаге знак компании. Синий
                склон того&nbsp;же цвета, что кнопки и&nbsp;открытый раздел.
              </Block>
            </div>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <div className={base.line}>
              <Block
                name="profile"
                head="Карточка всегда рядом"
                pic={
                  <div className={base.page}>
                    <Img
                      file="profile"
                      w={284}
                      h={477}
                      alt="Карточка сотрудника: рисованный аватар, статус, ранг, канал связи, округ, филиал, подразделение, направления и кнопка настроек"
                    />
                  </div>
                }
              >
                Слева от&nbsp;вкладок стоит карточка сотрудника: рисованный аватар, оранжевый статус
                и&nbsp;фиолетовый ранг со&nbsp;звёздами. Ниже канал связи, округ, филиал,
                подразделение и&nbsp;направления. На&nbsp;снимке мы&nbsp;убрали имя, дату рождения,
                контакты и&nbsp;руководителей.
              </Block>
              <Block
                name="tests"
                head="Семь вкладок об&nbsp;одном человеке"
                pic={
                  <div className={base.page}>
                    <Img
                      file="tests"
                      w={900}
                      h={640}
                      alt="Вкладка «Результаты тестов»: фильтры по виду обучения, разделу и месяцу, три плитки с кольцом прогресса, список месяцев"
                    />
                  </div>
                }
              >
                Тесты, график, посещаемость, грейды, уроки, продажи и&nbsp;интересы лежат
                в&nbsp;одной строке вкладок. В&nbsp;«Результатах тестов» сверху фильтры
                и&nbsp;переключатель «Группировать по&nbsp;месяцам», ниже плитки с&nbsp;кольцом
                прогресса и&nbsp;месяцы, которые раскрываются.
              </Block>
            </div>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="schedule"
              head="График на&nbsp;месяц"
              pic={
                <div className={base.page}>
                  <Img
                    file="schedule"
                    w={915}
                    h={582}
                    alt="Календарь на декабрь: бледная подпись на днях ноября, серые выходные, текущий день в синем кружке, стрелки и кнопка «Сегодня»"
                  />
                </div>
              }
            >
              Обычный календарь на&nbsp;месяц: дни соседнего месяца подписаны бледно, выходные
              залиты серым, сегодняшнее число стоит в&nbsp;синем кружке. Стрелки листают месяцы,
              кнопка «Сегодня» возвращает назад.
            </Block>
            <div className={base.line}>
              <Block
                name="visits"
                head="Посещаемость"
                pic={
                  <div className={base.page}>
                    <Img
                      file="visits"
                      w={915}
                      h={430}
                      alt="Период «от и до», таблица с колонками «Действие», «Время», «Источник данных», пустое состояние и постраничный переход"
                    />
                  </div>
                }
              >
                Период и&nbsp;таблица: действие, время, источник данных. Для пустого списка есть
                свой значок и&nbsp;подпись, внизу постраничный переход с&nbsp;выбором числа строк.
              </Block>
              <Block
                name="sales"
                head="Продажи"
                pic={
                  <div className={base.page}>
                    <Img
                      file="sales"
                      w={915}
                      h={155}
                      alt="Выбор года и месяца, справа объём продаж за год"
                    />
                  </div>
                }
              >
                Год и&nbsp;месяц выбираются слева, справа стоит объём продаж за&nbsp;год. Числа
                здесь из&nbsp;макета.
              </Block>
            </div>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <div className={base.line}>
              <Block
                name="interests"
                head="Коллега видит другое"
                pic={
                  <div className={base.page}>
                    <Img
                      file="interests"
                      w={335}
                      h={342}
                      alt="Две вкладки, «Интересы» и «График работы»; увлечения, спорт, музыка, фильм и книга"
                    />
                  </div>
                }
              >
                Страница нарисована отдельно для самого сотрудника, администратора и&nbsp;другого
                пользователя. Администратор видит семь вкладок, коллега только две: интересы
                и&nbsp;график. Увлечения, спорт, музыка, фильм и&nbsp;книга помогают познакомиться.
              </Block>
              <Block
                name="phone"
                head="На&nbsp;телефоне своя раскладка"
                pic={
                  <div className={styles.frame}>
                    <Img
                      file="phone"
                      w={293}
                      h={520}
                      alt="Телефон: знак и уведомления, аватар, вкладки, расширенный поиск и плитки с материалами, тестами и средним результатом"
                    />
                  </div>
                }
              >
                Меню уходит под кнопку в&nbsp;шапке, карточка встаёт сверху, вкладки идут
                в&nbsp;одну строку. Фильтры спрятаны в&nbsp;«Расширенный поиск», а&nbsp;плитки стоят
                столбиком: материалы, тесты и&nbsp;средний результат. У&nbsp;каждой цифры свой цвет.
              </Block>
            </div>
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
                Синий для действий, тёмно-синий для текста, два серых для плиток и&nbsp;фона.
                Фиолетовый и&nbsp;оранжевый оставлены для ранга и&nbsp;статуса.
              </Block>
              <Block
                name="kit"
                head="Детали"
                pic={
                  <div className={base.page}>
                    <Img
                      file="kit"
                      w={760}
                      h={210}
                      alt="Вкладки, выпадающий список, выбор даты, переключатель, ранг, статус, плитка с прогрессом и кнопка настроек"
                    />
                  </div>
                }
              >
                Вкладки, списки, выбор даты, переключатель, плитка с&nbsp;кольцом и&nbsp;кнопка
                повторяются на&nbsp;всех вкладках, поэтому страница читается как одно целое.
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
