import type { ReactNode } from "react";
import type { CaseData } from "@/components/scenes/Scene3";
import caseStyles from "../Case.module.css";
import { type CaseActions, End } from "../CaseView";
import { Duo } from "../memoridian/Duo";
import base from "../memoridian/Showcase.module.css";
import styles from "./ArmListener.module.css";

// Страница рабочего места слушателя (docs/12-case-page.md): рассадка, планы залов, меню, таймер и слайды.
// Снимки — куски макета при большом зуме, плотность не ниже 2 на 1440: ширины --p в модуле подобраны под
// ширину файлов, менять вместе. Ссылок нет. Карточки на главной нет, вход — из списка работ.

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
          Рабочее место участника: где он сидит, кто рядом, сколько идёт текущий тезис и какие
          материалы открыть.
        </p>
        <Duo
          slug="arm-listener"
          className={base.duo}
          data-cover=""
          alts={[
            "Рассадка рядами: пронумерованные места, часть залита сиреневым",
            "План зала: длинный оранжевый стол, вокруг него пронумерованные места",
            "Таймер «До следующего тезиса»",
            "Меню: повестка, участники, программа и материалы",
          ]}
        />
        <div className={base.facts} data-hi>
          <div>
            <p className={base.text}>Что входило в работу</p>
            <ul className={`${base.note} ${base.list}`}>
              <li>Список участников и рассадка</li>
              <li>Планы залов и легенда мест</li>
              <li>Меню разделов</li>
              <li>Таймер до следующего тезиса</li>
              <li>Графики для слайдов</li>
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
              name="seats"
              head="Рассадка вместо списка"
              pic={
                <div className={base.page}>
                  <Img
                    file="seats"
                    w={1440}
                    h={823}
                    alt="Раздел «Список участников», вкладка «Рассадка»: полоса экрана и пять рядов с номерами мест, часть мест залита сиреневым, часть без номера"
                  />
                </div>
              }
            >
              В «Списке участников» две вкладки, вторая показывает зал. Сверху полоса экрана, ниже
              пять рядов, расходятся трапецией. Залитые и обведённые места с номером видны сразу,
              ячейки без номера остаются приглушёнными.
            </Block>
            <div className={base.line}>
              <Block
                name="tall"
                head="План зала"
                pic={
                  <div className={base.page}>
                    <Img
                      file="table-tall"
                      w={751}
                      h={1049}
                      alt="План: длинный стол с местами по краям, два ряда мест вдоль стен, серые свободные места и жёлто-зелёное место 42"
                    />
                  </div>
                }
              >
                Стол с местами по краям, вокруг него номера. Цвет номера совпадает с легендой, место
                42 подсвечено жёлто-зелёным.
              </Block>
              <Block
                name="legend"
                head="Легенда из пяти цветов"
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
                стоит слева от плана.
              </Block>
            </div>
            <div className={base.line}>
              <Block
                name="wide"
                head="Длинный стол"
                pic={
                  <div className={base.page}>
                    <Img
                      file="table-wide"
                      w={960}
                      h={446}
                      alt="План: широкий стол, места сверху, снизу и по бокам"
                    />
                  </div>
                }
              >
                Другой зал: стол лежит вдоль экрана, номера идут по кругу.
              </Block>
              <Block
                name="u"
                head="Стол буквой П"
                pic={
                  <div className={base.page}>
                    <Img
                      file="table-u"
                      w={750}
                      h={399}
                      alt="План: стол буквой П, под ним два ряда мест и два зелёных места оператора"
                    />
                  </div>
                }
              >
                Два ряда сзади, зелёным два места оператора. Набор значков тот&nbsp;же.
              </Block>
            </div>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <div className={base.line}>
              <Block
                name="menu"
                head="Четыре раздела"
                pic={
                  <div className={base.page}>
                    <Img
                      file="menu"
                      w={524}
                      h={447}
                      alt="Меню: повестка, участники (выбрано), программа, материалы, у каждого синий значок"
                    />
                  </div>
                }
              >
                Повестка, участники, программа и&nbsp;материалы стоят крупно, выбранный раздел
                подсвечен полосой на всю ширину меню.
              </Block>
              <Block
                name="timer"
                head="Таймер"
                pic={
                  <div className={base.page}>
                    <Img
                      file="timer"
                      w={572}
                      h={335}
                      alt="Плашка «До следующего тезиса»: 00:05:45, нули приглушены, минуты и секунды белые"
                    />
                  </div>
                }
              >
                Отсчёт до следующего тезиса. Незначащие нули приглушены, поэтому минуты
                и&nbsp;секунды читаются первыми.
              </Block>
            </div>
            <Block
              name="chart"
              head="Графики на&nbsp;экранах зала"
              pic={
                <div className={base.page}>
                  <Img
                    file="chart"
                    w={1442}
                    h={322}
                    alt="Линейный график по годам: бирюзовая и оранжевая линии со светящимися точками, подсказка у точки 2020 года"
                  />
                </div>
              }
            >
              Две светящиеся линии на синем, у выбранной точки подсказка с годом и числом. Числа
              здесь из&nbsp;макета.
            </Block>
            <div className={base.line}>
              <Block
                name="donut"
                head="Кольца"
                pic={
                  <div className={base.page}>
                    <Img
                      file="donut"
                      w={710}
                      h={387}
                      alt="Карточка «По видам работ»: бирюзово-оранжевое кольцо, слева подписи с числами"
                    />
                  </div>
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
