import type { ReactNode } from "react";
import type { CaseData } from "@/components/scenes/Scene3";
import caseStyles from "../Case.module.css";
import { type CaseActions, End } from "../CaseView";
import { Duo } from "../memoridian/Duo";
import base from "../memoridian/Showcase.module.css";
import styles from "./ArmListener.module.css";

// Страница рабочего места слушателя (docs/12-case-page.md): главный экран, слайд, повестка, материалы,
// рассадка и планы залов. Снимки — куски макета при большом зуме, плотность не ниже 2 на 1440: ширины --p в
// модуле подобраны под ширину файлов, менять вместе. Ссылок нет. Карточки на главной нет, вход — из списка
// работ.

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function Img(p: { file: string; w: number; h: number; alt: string }) {
  return (
    // biome-ignore lint/performance/noImgElement: статический экспорт, файлы из public как есть
    <img
      src={`${BASE}/works/arm-listener/${p.file}.webp`}
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
  ["#00206B", "#FFFFFF"],
  ["#6C5BE0", "#FFFFFF"],
  ["#C766F2", "#141414"],
  ["#CD7B4A", "#141414"],
  ["#36A38F", "#141414"],
  ["#00E5D0", "#141414"],
];

export function ArmListener(p: { c: CaseData; act: CaseActions; full: boolean }) {
  const { c, act, full } = p;
  return (
    <>
      <section className={`${base.shot} ${base.intro}`}>
        <h1 className={base.title} id="case-title" data-hi>
          АРМ <br />
          слушателя
        </h1>
        <p className={`${base.text} ${base.lead}`} data-hi>
          Автоматизированное рабочее место участника заседаний в&nbsp;Ситуационном центре города
          Москвы (Инцидент-центре): что сейчас на&nbsp;экранах, что идёт дальше, какие материалы
          открыть и&nbsp;где кто сидит.
        </p>
        <Duo
          slug="arm-listener"
          className={base.duo}
          data-cover=""
          alts={[
            "Главный экран слушателя: слайды с графиками в ряд, волна из светящихся точек, внизу программа",
            "План зала: длинный оранжевый стол, вокруг него пронумерованные места",
            "Таймер «До следующего тезиса»",
          ]}
        />
        <div className={base.facts} data-hi>
          <div>
            <p className={base.text}>Что входило в работу</p>
            <ul className={`${base.note} ${base.list}`}>
              <li>Главный экран со слайдами и программой</li>
              <li>Повестка и материалы</li>
              <li>Просмотр документа</li>
              <li>Список участников и рассадка</li>
              <li>Планы залов и легенда мест</li>
              <li>Таймер и графики для слайдов</li>
            </ul>
          </div>
          <div>
            <p className={base.text}>Какие бывают залы</p>
            <ul className={`${base.note} ${base.list}`}>
              <li>Ряды перед экраном</li>
              <li>Длинный стол</li>
              <li>Стол буквой П с рядами сзади</li>
            </ul>
          </div>
        </div>
      </section>

      {full && (
        <>
          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="main"
              head="Экран заседания"
              pic={
                <Shot
                  file="main"
                  w={1480}
                  h={842}
                  alt="Главный экран: три группы слайдов с кольцами и графиками, волна из светящихся точек, внизу программа по времени и блок «Следующий пункт мероприятия», вверху повестка, участники и часы"
                />
              }
            >
              Мероприятия центра идут в&nbsp;зале с&nbsp;видеостеной, а&nbsp;на&nbsp;этом экране
              участник следит за&nbsp;ними со&nbsp;своего места. Слайды стоят в&nbsp;ряд на&nbsp;всю
              ширину, под ними волна из&nbsp;светящихся точек. Внизу программа по времени
              и&nbsp;блок «Следующий пункт мероприятия». Вверху справа повестка, участники
              и&nbsp;часы.
            </Block>
            <div className={base.line}>
              <Block
                name="slide"
                head="Слайд выходит вперёд"
                pic={
                  <Shot
                    file="slide"
                    w={791}
                    h={444}
                    alt="Тот же экран: один слайд стал крупным, соседние видны за ним по краям"
                  />
                }
              >
                Один слайд становится крупным, соседние остаются за ним по краям. На самом слайде
                есть «Назад» и&nbsp;кнопка «Результаты».
              </Block>
              <Block
                name="timer"
                head="Таймер"
                pic={
                  <Shot
                    file="timer"
                    w={572}
                    h={335}
                    alt="Плашка «До следующего тезиса»: 00:05:45, нули приглушены, минуты и секунды белые"
                  />
                }
              >
                Отсчёт до следующего тезиса. Незначащие нули приглушены, поэтому минуты
                и&nbsp;секунды читаются первыми.
              </Block>
            </div>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="agenda"
              head="Повестка с материалами"
              pic={
                <Shot
                  file="agenda"
                  w={1063}
                  h={398}
                  alt="Раздел «Повестка мероприятия»: сворачиваемый блок «Материалы» с файлами, ниже первый пункт по номеру и кнопка «Перейти к трансляции»"
                />
              }
            >
              В начале блок «Материалы», он сворачивается. Ниже пункты по&nbsp;номерам. Кнопка
              «Перейти к&nbsp;трансляции» стоит справа вверху и&nbsp;возвращает на&nbsp;главный
              экран.
            </Block>
            <Block
              name="materials"
              head="Все файлы одним списком"
              pic={
                <Shot
                  file="materials"
                  w={1437}
                  h={350}
                  alt="Раздел «Материалы»: меню слева с выбранным пунктом, справа список файлов со значками картинки и документа"
                />
              }
            >
              Слева меню, справа файлы. Значок отличает картинку от документа, полоса справа
              показывает, сколько ещё в&nbsp;списке.
            </Block>
            <div className={base.line}>
              <Block
                name="doc"
                head="Документ прямо в&nbsp;окне"
                pic={
                  <Shot
                    file="doc"
                    w={763}
                    h={362}
                    alt="Окно просмотра: название файла, значок разворота, крестик и белая страница документа со строками"
                  />
                }
              >
                Файл открывается панелью поверх экрана. Рядом с&nbsp;названием значок разворота,
                справа крестик.
              </Block>
              <Block
                name="menu"
                head="Четыре раздела"
                pic={
                  <Shot
                    file="menu"
                    w={524}
                    h={447}
                    alt="Меню: повестка, участники (выбрано), программа, материалы, у каждого синий значок"
                  />
                }
              >
                Повестка, участники, программа и&nbsp;материалы стоят крупно, выбранный раздел
                подсвечен полосой на&nbsp;всю ширину меню.
              </Block>
            </div>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="seats"
              head="Рассадка вместо списка"
              pic={
                <Shot
                  file="seats"
                  w={1440}
                  h={823}
                  alt="Раздел «Список участников», вкладка «Рассадка»: полоса экрана и пять рядов с номерами мест, часть мест залита сиреневым, часть без номера"
                />
              }
            >
              В «Списке участников» две вкладки, вторая показывает зал. Сверху полоса экрана, ниже
              пять рядов, расходятся трапецией. Залитые и&nbsp;обведённые места с&nbsp;номером видны
              сразу, ячейки без номера приглушены.
            </Block>
            <div className={base.line}>
              <Block
                name="tall"
                head="План зала"
                pic={
                  <Shot
                    file="table-tall"
                    w={751}
                    h={1049}
                    alt="План: длинный стол с местами по краям, два ряда мест вдоль стен, серые свободные места и жёлто-зелёное место 42"
                  />
                }
              >
                Стол с&nbsp;местами по&nbsp;краям, вокруг него номера. Цвет номера совпадает
                с&nbsp;легендой, место 42 подсвечено жёлто-зелёным.
              </Block>
              <Block
                name="legend"
                head="Легенда из&nbsp;пяти цветов"
                pic={
                  <Img
                    file="legend"
                    w={370}
                    h={370}
                    alt="Легенда на синем: участник, председатель, оператор мероприятия, свободное место, вы"
                  />
                }
              >
                Участник, председатель, оператор мероприятия, свободное место и&nbsp;«вы». Легенда
                стоит слева от&nbsp;плана.
              </Block>
            </div>
            <div className={base.line}>
              <Block
                name="wide"
                head="Длинный стол"
                pic={
                  <Shot
                    file="table-wide"
                    w={960}
                    h={446}
                    alt="План: широкий стол, места сверху, снизу и по бокам"
                  />
                }
              >
                Другой зал: стол лежит вдоль экрана, номера идут по&nbsp;кругу.
              </Block>
              <Block
                name="u"
                head="Стол буквой П"
                pic={
                  <Shot
                    file="table-u"
                    w={750}
                    h={399}
                    alt="План: стол буквой П, под ним два ряда мест и два зелёных места оператора"
                  />
                }
              >
                Два ряда сзади, зелёным два места оператора. Набор значков тот&nbsp;же.
              </Block>
            </div>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="chart"
              head="Графики на&nbsp;экранах зала"
              pic={
                <Shot
                  file="chart"
                  w={1442}
                  h={322}
                  alt="Линейный график по годам: бирюзовая и оранжевая линии со светящимися точками, подсказка у точки 2020 года"
                />
              }
            >
              Две светящиеся линии на&nbsp;синем, у&nbsp;выбранной точки подсказка с&nbsp;годом
              и&nbsp;числом. Числа здесь из&nbsp;макета.
            </Block>
            <div className={base.line}>
              <Block
                name="donut"
                head="Кольца"
                pic={
                  <Shot
                    file="donut"
                    w={710}
                    h={387}
                    alt="Карточка «По видам работ»: бирюзово-оранжевое кольцо, слева подписи с числами"
                  />
                }
              >
                Доли показаны кольцом, подписи слева в&nbsp;тех&nbsp;же цветах.
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
                Синяя основа. Фиолетовый и&nbsp;сиреневый для мест, оранжевый для столов, бирюзовый
                для оператора и&nbsp;графиков. Цвета подобраны по&nbsp;снимкам.
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
