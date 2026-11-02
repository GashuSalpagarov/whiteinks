import type { ReactNode } from "react";
import type { CaseData } from "@/components/scenes/Scene3";
import caseStyles from "../Case.module.css";
import { type CaseActions, End } from "../CaseView";
import { Duo } from "../memoridian/Duo";
import base from "../memoridian/Showcase.module.css";
import styles from "./Goroddorog.module.css";

// Страница автошколы «Город Дорог» (docs/12-case-page.md): тот же вид, что у Memoridian. Стили текста и
// общие правила — из Showcase.module.css, здесь только свои блоки, их ширины и места. Фото людей,
// телефоны и реквизиты в кадр не взяты. Ссылок на сайт на странице нет.

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const src = (file: string) => `${BASE}/works/goroddorog/${file}.webp`;

// m — снимок для телефона [файл, ширина, высота]: на 350 px снимок компьютера не читается.
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
  ["#FF1E48", "#FFFFFF"],
  ["#EF002A", "#FFFFFF"],
  ["#161A25", "#FFFFFF"],
  ["#FFFFFF", "#161A25"],
  ["#DAF6F8", "#161A25"],
  ["#F5F8FD", "#161A25"],
];

export function Goroddorog({ c, act, full }: { c: CaseData; act: CaseActions; full: boolean }) {
  return (
    <>
      <section className={`${base.shot} ${base.intro}`}>
        <h1 className={base.title} id="case-title" data-hi>
          Автошкола <br />
          «Город&nbsp;Дорог»
        </h1>
        <p className={`${base.text} ${base.lead}`} data-hi>
          Сайт автошколы с&nbsp;онлайн-обучением и&nbsp;своей страницей у&nbsp;каждого филиала.
        </p>
        <Duo
          slug="goroddorog"
          className={base.duo}
          data-cover=""
          alts={[
            "Плитка раздела «Обучение вождению МКПП»: рычаг коробки передач на чёрном",
            "Плитка раздела «Обучение»: конус на учебной площадке",
            "Плитка раздела «Цены»: красная машина на дороге",
            "Плитка раздела «Обучение онлайн»: ноутбук в руках",
          ]}
        />
        <div className={base.facts} data-hi>
          <div>
            <p className={base.text}>Что входило в работу</p>
            <ul className={`${base.note} ${base.list}`}>
              <li>Сайт: главная и внутренние страницы</li>
              <li>Страницы филиалов как отдельные лендинги</li>
              <li>Функционал для онлайн-обучения</li>
              <li>Промо-видео для страниц филиалов</li>
              <li>Баннеры и иконки</li>
              <li>Адаптивная версия: 768 и 320 px</li>
            </ul>
          </div>
        </div>
      </section>

      {full && (
        <>
          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="programs"
              head="Разделы на главной"
              pic={
                <Img
                  file="programs"
                  m={["programs-m", 1000, 1203]}
                  w={776}
                  h={361}
                  alt="Шесть плиток с тёмными фотографиями: обучение, МКПП, АКПП, практические занятия, обучение онлайн и цены"
                />
              }
            >
              Аналитика прошлого сайта подсказала, какие разделы вызывают интерес, и&nbsp;мы вынесли
              их на&nbsp;главную. Каждая плитка стала ярким баннером: тёмная фотография, название
              и&nbsp;кнопка.
            </Block>
            <div className={base.line}>
              <Block
                name="icons"
                head="Иконки"
                pic={
                  <div className={base.page}>
                    <Img
                      file="icons"
                      w={1040}
                      h={640}
                      alt="Объёмные значки: дорожный знак с машиной, калькулятор, красный ноль с процентом, метка на карте"
                    />
                  </div>
                }
              >
                Отличия школы мы показали объёмными значками: занятия без привязки к&nbsp;месту,
                фиксированная цена, рассрочка, классы рядом. Они усиливают эмоцию раньше, чем
                человек дочитает текст.
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
                Красный для кнопок и&nbsp;акцентов, тёмно-синий для тёмных блоков, между ними
                холодные светлые фоны.
              </Block>
            </div>
            <Block
              name="classes"
              head="Учебные классы"
              pic={
                <div className={base.page}>
                  <Img
                    file="classes"
                    m={["classes-m", 780, 1060]}
                    w={2200}
                    h={1238}
                    alt="Тёмный блок с вечерним городом: кнопки с названиями станций метро, у каждой цветная метка, внизу «Все филиалы»"
                  />
                </div>
              }
            >
              Филиалы стоят прямо на&nbsp;главной. Кнопка со&nbsp;станцией метро сразу ведёт
              в&nbsp;нужный учебный класс, к&nbsp;его условиям и&nbsp;графику. У&nbsp;каждой станции
              своя цветная метка, а&nbsp;«Все филиалы» открывают полный список.
            </Block>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="branch"
              head="Филиал как отдельный сайт"
              pic={
                <div className={base.page}>
                  <Img
                    file="branch"
                    w={824}
                    h={650}
                    alt="Страница филиала: описание и машина школы, ниже вкладки «Что входит в любую программу» и пустая форма записи на пробный урок"
                  />
                </div>
              }
            >
              У&nbsp;каждого филиала своя маркетинговая воронка: страницу можно оформить как
              независимый сайт с&nbsp;уникальными предложениями. На&nbsp;каждой стоит промо-видео:
              мы записали его, чтобы показать процессы обучения и&nbsp;инструкторов.
            </Block>
            <div className={base.line}>
              <Block
                name="schedule"
                head="План и расписание"
                pic={
                  <div className={base.page}>
                    <Img
                      file="schedule"
                      w={563}
                      h={168}
                      alt="Расписание занятий: три цветные плитки — утренние группы, вечерние группы и выходные дни"
                    />
                  </div>
                }
              >
                На&nbsp;странице филиала подробно описаны этапы и&nbsp;часы. Группы разложены
                по&nbsp;времени суток: утро, вечер и&nbsp;выходные, у&nbsp;каждой своя цветная
                плитка.
              </Block>
              <Block
                name="metro"
                head="Площадки на схеме метро"
                pic={
                  <div className={base.page}>
                    <Img
                      file="metro"
                      w={392}
                      h={286}
                      alt="Схема московского метро: станции с площадками школы отмечены чёрными подписями"
                    />
                  </div>
                }
              >
                Площадки отмечены прямо на&nbsp;схеме метро, поэтому свой класс легко найти рядом
                с&nbsp;домом или работой.
              </Block>
            </div>
            <Block
              name="fleet"
              head="Автопарк"
              pic={
                <div className={base.page}>
                  <Img
                    file="fleet"
                    w={328}
                    h={508}
                    alt="Страница автопарка: машины школы на голубом фоне, отдельно с механикой и с автоматом"
                  />
                </div>
              }
            >
              Машины разложены по&nbsp;коробке передач: отдельно механика, отдельно автомат. Рядом
              с&nbsp;дополнительной информацией о&nbsp;площадках такая презентация усиливает желание
              прийти именно в&nbsp;эту автошколу.
            </Block>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="road"
              head="Чем отличается школа"
              pic={
                <div className={base.page}>
                  <Img
                    file="road"
                    w={478}
                    h={314}
                    alt="Отличия школы вдоль нарисованной извилистой дороги с метками на поворотах"
                  />
                </div>
              }
            >
              На&nbsp;внутренних страницах отличия школы стоят вдоль нарисованной дороги: извилистая
              трасса с&nbsp;метками ведёт взгляд от&nbsp;одного довода к&nbsp;другому.
            </Block>
            <Block
              name="steps"
              head="Десять шагов до прав"
              pic={
                <Img
                  file="steps"
                  m={["steps-m", 1072, 1368]}
                  w={2200}
                  h={1380}
                  alt="Десять карточек с номерами: заявка, договор, оплата, доступ к платформе, видео-уроки, зачёт, практика, экзамен, документы и удостоверение"
                />
              }
            >
              Этапы сняли главное возражение: что получить права сложно. Весь путь разложен
              на&nbsp;десять карточек, от&nbsp;заявки и&nbsp;договора онлайн до&nbsp;зачёта,
              вождения и&nbsp;экзамена. У&nbsp;каждого шага крупный номер и&nbsp;своя картинка.
            </Block>
            <Block
              name="table"
              head="Скрытые платежи таблицей"
              pic={
                <div className={base.page}>
                  <Img
                    file="table"
                    m={["table-m", 740, 1100]}
                    w={2200}
                    h={634}
                    alt="Таблица: пять видов доплат и их цена в других автошколах, справа цветной столбец «входит в стоимость»"
                  />
                </div>
              }
            >
              Таблица перечисляет, за&nbsp;что в&nbsp;других автошколах просят доплату: вождение
              вечером и&nbsp;в&nbsp;выходные, вебинары, литература, пересдача, документы для ГИБДД.
              Столбец самой школы залит цветным переходом, и&nbsp;в&nbsp;каждой его строке одно:
              входит в&nbsp;стоимость.
            </Block>
            <Block
              name="gift"
              head="Что подарить"
              pic={
                <div className={base.page}>
                  <Img
                    file="gift"
                    m={["gift-m", 780, 1372]}
                    w={2200}
                    h={701}
                    alt="Тёмный блок «Не знаете, что подарить?»: красные круги по краям и открытый красный конверт с сертификатом"
                  />
                </div>
              }
            >
              Обучение можно подарить, и&nbsp;главная говорит об&nbsp;этом отдельным тёмным блоком:
              вопрос, короткий абзац и&nbsp;красный конверт с&nbsp;сертификатом. Цвет конверта
              повторяет кнопку рядом.
            </Block>
            <Block
              name="phones"
              head="Адаптивная версия"
              pic={
                <div className={styles.pair}>
                  <figure className={styles.device}>
                    <Img
                      file="phone-programs"
                      w={640}
                      h={1385}
                      alt="Программы на телефоне: плитки идут одна под другой"
                    />
                  </figure>
                  <figure className={styles.device}>
                    <Img
                      file="phone-classes"
                      w={640}
                      h={1385}
                      alt="Учебные классы на телефоне: станции метро списком"
                    />
                  </figure>
                </div>
              }
            >
              Вёрстка рассчитана на&nbsp;все устройства: планшет от&nbsp;768&nbsp;px, телефон
              от&nbsp;320&nbsp;px. Плитки программ идут столбцом, учебные классы становятся списком.
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
