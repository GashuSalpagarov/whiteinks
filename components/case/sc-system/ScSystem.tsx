import type { ReactNode } from "react";
import type { CaseData } from "@/components/scenes/Scene3";
import caseStyles from "../Case.module.css";
import { type CaseActions, End } from "../CaseView";
import { Duo } from "../memoridian/Duo";
import base from "../memoridian/Showcase.module.css";
import styles from "./ScSystem.module.css";

// Страница системы Ситуационного центра (docs/12-case-page.md): сайт, заявка, бронирование и календарь,
// подготовка мероприятия. Снимки — куски трёх макетов, имена, названия, даты и знак закрыты строками в цвет
// интерфейса; ширины --p в модуле подобраны под ширину файлов, менять вместе. Ссылок нет. Карточки на главной
// нет, вход — из списка работ.

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function Img(p: { file: string; w: number; h: number; alt: string }) {
  return (
    // biome-ignore lint/performance/noImgElement: статический экспорт, файлы из public как есть
    <img
      src={`${BASE}/works/sc-system/${p.file}.webp`}
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

const Shot = (p: { file: string; w: number; h: number; alt: string }) => (
  <div className={base.page}>
    <Img {...p} />
  </div>
);

const SWATCHES = [
  ["#0C0E1F", "#FFFFFF"],
  ["#192438", "#FFFFFF"],
  ["#0090FF", "#141414"],
  ["#FF9459", "#141414"],
  ["#9F0000", "#FFFFFF"],
  ["#69FFD0", "#141414"],
];

export function ScSystem(p: { c: CaseData; act: CaseActions; full: boolean }) {
  const { c, act, full } = p;
  return (
    <>
      <section className={`${base.shot} ${base.intro}`}>
        <h1 className={base.title} id="case-title" data-hi>
          Система <br />
          Ситуационного центра
        </h1>
        <p className={`${base.text} ${base.lead}`} data-hi>
          Единая система Ситуационного центра города Москвы (Инцидент-центра): сайт для горожан,
          заявки и&nbsp;бронирование залов для ведомств, календарь и&nbsp;подготовка мероприятий для
          сотрудников центра.
        </p>
        <Duo
          slug="sc-system"
          className={base.duo}
          data-cover=""
          alts={[
            "Главная сайта: меню, бегущая строка, название центра и яркое сообщение на всю ширину",
            "Окно «Рабочая встреча согласована» с кнопкой «К мероприятиям»",
            "Календарь мероприятий: месяц, в клетках дней карточки с временем и типом",
            "Бронирование: зал, число гостей, время начала и конца и шкала дня по часам",
            "Шкала шагов подготовки мероприятия, последний шаг — материалы",
          ]}
        />
        <div className={base.facts} data-hi>
          <div>
            <p className={base.text}>Что входило в работу</p>
            <ul className={`${base.note} ${base.list}`}>
              <li>Сайт: главная и новости, от 1920 до 320 px</li>
              <li>Заявки: список, статусы и форма</li>
              <li>Бронирование зала и времени</li>
              <li>Календарь мероприятий</li>
              <li>Подготовка мероприятия в шесть шагов</li>
            </ul>
          </div>
          <div>
            <p className={base.text}>Кому что</p>
            <ul className={`${base.note} ${base.list}`}>
              <li>Горожанам — сайт и важные сообщения</li>
              <li>Ведомствам — заявка и бронь</li>
              <li>Центру — согласование и календарь</li>
            </ul>
          </div>
        </div>
      </section>

      {full && (
        <>
          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="site"
              head="Сайт: срочное наверху"
              pic={
                <Shot
                  file="site"
                  w={1302}
                  h={545}
                  alt="Первый экран сайта: меню, бегущая строка, заголовок и яркий блок со значком тревоги и кнопкой «Подробнее»"
                />
              }
            >
              Главная начинается с&nbsp;того, что важно сейчас: бегущая строка под меню
              и&nbsp;красно-оранжевый блок на&nbsp;всю ширину. В&nbsp;нём сообщение, номер горячей
              линии и&nbsp;кнопка «Подробнее».
            </Block>
            <div className={base.line}>
              <Block
                name="news"
                head="Новости строками"
                pic={
                  <Shot
                    file="news"
                    w={780}
                    h={284}
                    alt="Раздел «Новости»: белая карточка со снимком слева, временем, заголовком и тегами справа"
                  />
                }
              >
                Белая карточка на&nbsp;тёмной странице: снимок, время, заголовок и&nbsp;теги.
              </Block>
              <Block
                name="phone"
                head="На телефоне"
                pic={
                  <Shot
                    file="site-m"
                    w={400}
                    h={500}
                    alt="Сайт на телефоне: меню, бегущая строка, заголовок в две строки и блок сообщения"
                  />
                }
              >
                Те&nbsp;же блоки в&nbsp;один столбец. Значок в&nbsp;сообщении встаёт над текстом,
                меню прячется в&nbsp;кнопку.
              </Block>
            </div>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="table"
              head="Заявки одним списком"
              pic={
                <Shot
                  file="table"
                  w={1499}
                  h={596}
                  alt="Таблица заявок: вкладки «Все заявки» и «Мои заявки», кнопка «Создать заявку», фильтр, строки со статусами «На согласовании», «Черновик», «Зарегистрирована»"
                />
              }
            >
              Две вкладки, поиск с&nbsp;фильтром и&nbsp;кнопка «Создать заявку». В&nbsp;строке
              номер, мероприятие, инициатор, аккаунт-менеджер, председатель и&nbsp;дата,
              а&nbsp;справа статус своим цветом: на&nbsp;согласовании, черновик
              или&nbsp;зарегистрирована.
            </Block>
            <div className={base.line}>
              <Block
                name="form"
                head="Заявка сбоку от&nbsp;списка"
                pic={
                  <Shot
                    file="form"
                    w={748}
                    h={823}
                    alt="Панель «Заявка на проведение мероприятия»: подсказка у типа заявки, поля названия, инициатора, аккаунт-менеджера и координатора, шкала времени"
                  />
                }
              >
                Форма открывается панелью поверх списка. Обязательные поля отмечены звёздочкой,
                у&nbsp;типа заявки есть подсказка, а&nbsp;шкала времени приглушена, пока не выбрана
                дата.
              </Block>
              <Block
                name="modal"
                head="Ответ сразу"
                pic={
                  <Shot
                    file="modal"
                    w={491}
                    h={422}
                    alt="Окно «Рабочая встреча согласована»: значок с галочкой, текст и кнопка «К мероприятиям»"
                  />
                }
              >
                Согласованная встреча уходит в&nbsp;календарь центра, окно говорит об&nbsp;этом
                и&nbsp;ведёт к&nbsp;мероприятиям. Для&nbsp;доработки окно такое&nbsp;же.
              </Block>
            </div>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="booking"
              head="Зал и&nbsp;время"
              pic={
                <Shot
                  file="booking"
                  w={776}
                  h={711}
                  alt="Бронирование: зал и вместимость, число гостей, начало и конец с техническим временем, шкала дня и подписи занято, свободно, техническое время и время мероприятия"
                />
              }
            >
              Зал выбирают вместе с&nbsp;его вместимостью. Шкала показывает день по&nbsp;часам:
              занято, свободно и&nbsp;выбранное время. До&nbsp;и&nbsp;после мероприятия идёт
              техническое время, оно отмечено светлым.
            </Block>
            <Block
              name="calendar"
              head="Всё в&nbsp;календаре"
              pic={
                <Shot
                  file="calendar"
                  w={1290}
                  h={788}
                  alt="Календарь на месяц: сетка дней и карточки мероприятий с цветной полосой, временем и типом"
                />
              }
            >
              Месяц целиком: в&nbsp;клетке дня карточка с&nbsp;организатором, названием, залом
              и&nbsp;временем. Полоса слева и&nbsp;подпись показывают тип: мероприятие, репетиция
              или&nbsp;рабочая встреча. Если в&nbsp;день их несколько, под карточкой «Ещё&nbsp;2».
            </Block>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <div className={base.line}>
              <Block
                name="steps"
                head="Мероприятие по&nbsp;шагам"
                pic={
                  <Shot
                    file="steps"
                    w={1188}
                    h={404}
                    alt="Шкала из шести шагов: заявка, требования, сценарий, участники, репетиция, материалы; ниже заголовок и файлы мероприятия"
                  />
                }
              >
                Заявка, требования, сценарий, участники, репетиция и&nbsp;материалы. Шкала сверху
                показывает, где сейчас мероприятие, а&nbsp;на&nbsp;последнем шаге собирают общие
                файлы.
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
                Тёмно-синяя основа на&nbsp;всю систему, синий для действий, тревожный красный
                с&nbsp;оранжевым для срочного. Цвета подобраны по&nbsp;снимкам.
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
