import type { ReactNode } from "react";
import type { CaseData } from "@/components/scenes/Scene3";
import caseStyles from "../Case.module.css";
import { type CaseActions, End } from "../CaseView";
import { Duo } from "../memoridian/Duo";
import base from "../memoridian/Showcase.module.css";
import styles from "./Arm.module.css";

// Страница рабочего места сценариста (docs/12-case-page.md): идёт от зала к ленте времени и окнам. Снимки —
// макеты: название мероприятия, зал, дата и имена докладчиков в кадр не взяты. Ссылок нет. Карточки на
// главной нет, вход — из списка работ.

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function Img(p: { file: string; w: number; h: number; alt: string }) {
  return (
    // biome-ignore lint/performance/noImgElement: статический экспорт, файлы из public как есть
    <img
      src={`${BASE}/works/arm/${p.file}.webp`}
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
  ["#000417", "#FFFFFF"],
  ["#0A8BFF", "#FFFFFF"],
  ["#8DCCFD", "#141414"],
  ["#D8DE77", "#141414"],
  ["#FFA68A", "#141414"],
  ["#BD8BFB", "#141414"],
];

export function Arm(p: { c: CaseData; act: CaseActions; full: boolean }) {
  const { c, act, full } = p;
  return (
    <>
      <section className={`${base.shot} ${base.intro}`}>
        <h1 className={base.title} id="case-title" data-hi>
          АРМ <br />
          сценариста
        </h1>
        <p className={`${base.text} ${base.lead}`} data-hi>
          Рабочее место, где сценарий мероприятия собирают по&nbsp;минутам: экраны зала, материалы,
          свет и&nbsp;звук на&nbsp;одной ленте.
        </p>
        <Duo
          slug="arm"
          className={base.duo}
          data-cover=""
          alts={[
            "Рабочее место: источники слева, схема экранов зала и лента времени с цветными строками",
            "Окно «Содержимое экрана»: название, описание, тип содержимого и адрес",
          ]}
        />
        <div className={base.facts} data-hi>
          <div>
            <p className={base.text}>Что входило в работу</p>
            <ul className={`${base.note} ${base.list}`}>
              <li>Схема экранов зала</li>
              <li>Раскладки и источники</li>
              <li>Шаблоны раскладок</li>
              <li>Лента времени</li>
              <li>Окна содержимого и ошибки</li>
            </ul>
          </div>
          <div>
            <p className={base.text}>Что есть на ленте</p>
            <ul className={`${base.note} ${base.list}`}>
              <li>Раскладки и материал</li>
              <li>Пункты и тезисы повестки</li>
              <li>Докладчики</li>
              <li>Свет, звук и механика зала</li>
              <li>Действия оператора</li>
            </ul>
          </div>
        </div>
      </section>

      {full && (
        <>
          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="stage"
              head="Зал на&nbsp;одном экране"
              pic={
                <div className={base.page}>
                  <Img
                    file="stage"
                    w={1195}
                    h={360}
                    alt="Схема зала: три больших экрана в ряд с подписями источников, четвёртый экран перед ними и синие полосы «ограниченное пространство»"
                  />
                </div>
              }
            >
              Верх рабочего места занимает схема: три больших экрана и&nbsp;четвёртый перед ними.
              На&nbsp;каждом подпись источника, поэтому видно, что куда выведено. Синими полосами
              отмечено ограниченное пространство.
            </Block>
            <div className={base.line}>
              <Block
                name="sources"
                head="Источники внутри раскладки"
                pic={
                  <div className={base.page}>
                    <Img
                      file="sources"
                      w={274}
                      h={417}
                      alt="Панель «Источники»: две раскладки с переключателем, под каждой четыре источника с карандашом"
                    />
                  </div>
                }
              >
                Слева панель с&nbsp;раскладками. Одна выбрана круглым переключателем, под каждой
                свой список источников с&nbsp;карандашом для правки. В&nbsp;заголовке панели плюс
                и&nbsp;стрелка.
              </Block>
              <Block
                name="picker"
                head="Раскладка из&nbsp;шаблона"
                pic={
                  <div className={base.page}>
                    <Img
                      file="picker"
                      w={785}
                      h={442}
                      alt="Окно «Выберите шаблон раскладки»: лента шаблонов с третьим выбранным, ниже крупная схема экранов и кнопка «Выбрать шаблон»"
                    />
                  </div>
                }
              >
                Раскладку не&nbsp;рисуют заново. Сверху лента шаблонов с&nbsp;маленькими схемами
                экранов, выбранный залит синим. Ниже та&nbsp;же схема крупно, с&nbsp;подписями
                источников, чтобы проверить её до&nbsp;нажатия «Выбрать шаблон».
              </Block>
            </div>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="timeline"
              head="Всё мероприятие на&nbsp;одной ленте"
              pic={
                <div className={base.page}>
                  <Img
                    file="timeline"
                    w={1207}
                    h={284}
                    alt="Лента времени на два часа: цветные полосы раскладок, материала, пунктов повестки, докладчиков и света, ниже пустые строки"
                  />
                </div>
              }
            >
              Внизу шкала на&nbsp;два часа с&nbsp;шагом десять минут. Раскладки, материал, повестка,
              докладчики и&nbsp;свет идут полосами одна под другой, поэтому видно, что происходит
              в&nbsp;зале в&nbsp;любую минуту. Имена на&nbsp;снимке мы&nbsp;убрали.
            </Block>
            <div className={base.line}>
              <Block
                name="rows"
                head="Своя строка у&nbsp;каждого"
                pic={
                  <div className={base.page}>
                    <Img
                      file="rows"
                      w={277}
                      h={284}
                      alt="Подписи строк ленты со значками: время, раскладки, материал, пункты и тезисы повестки, докладчики, свет, звук, механика зала, действие оператора"
                    />
                  </div>
                }
              >
                У&nbsp;строки значок и&nbsp;подпись, у&nbsp;полос на&nbsp;ленте свой цвет. Рядом
                с&nbsp;подписью плюс, а&nbsp;внизу кнопка «Скрыть».
              </Block>
              <Block
                name="actions"
                head="Согласование в&nbsp;шапке"
                pic={
                  <div className={base.page}>
                    <Img
                      file="actions"
                      w={352}
                      h={42}
                      alt="Кнопка «Согласовать сценарий», значок настроек и «Сохранить»"
                    />
                  </div>
                }
              >
                Справа вверху две команды: «Согласовать сценарий» и&nbsp;«Сохранить», между ними
                значок настроек.
              </Block>
            </div>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <div className={base.line}>
              <Block
                name="modal"
                head="Что показать на&nbsp;экране"
                pic={
                  <div className={styles.window}>
                    <Img
                      file="modal"
                      w={310}
                      h={398}
                      alt="Окно «Содержимое экрана»: название, описание, тип содержимого URL, адрес, кнопки «Добавить» и «Отменить»"
                    />
                  </div>
                }
              >
                Содержимое экрана задают в&nbsp;коротком окне: название, описание и&nbsp;тип. Для
                типа URL ниже появляется поле адреса источника.
              </Block>
              <Block
                name="modal"
                head="Ошибка прямо у&nbsp;поля"
                pic={
                  <div className={styles.window}>
                    <Img
                      file="modal-error"
                      w={311}
                      h={413}
                      alt="То же окно с красной рамкой у поля адреса и подписью «Поле обязательное для заполнения»"
                    />
                  </div>
                }
              >
                Пустое обязательное поле получает красную рамку и&nbsp;подпись под собой. Остальное
                окно остаётся как было.
              </Block>
            </div>
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
              Фон почти чёрный, на&nbsp;нём читаются светлые полосы и&nbsp;схема. Синий для действий
              и&nbsp;выбранного, у&nbsp;полос на&nbsp;ленте свои светлые цвета. Цвета подобраны
              по&nbsp;снимкам.
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
