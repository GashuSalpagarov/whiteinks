import type { ReactNode } from "react";
import type { CaseData } from "@/components/scenes/Scene3";
import caseStyles from "../Case.module.css";
import { type CaseActions, End } from "../CaseView";
import { Duo } from "../memoridian/Duo";
import base from "../memoridian/Showcase.module.css";
import styles from "./Prokat.module.css";

// Страница горного проката (docs/12-case-page.md): тот же вид, что у Memoridian. Стили текста и общие
// правила — из Showcase.module.css, здесь только свои блоки, их ширины и места. Снимки — настоящий
// сайт проката; ссылок на него на странице нет, панели /app/ нет.

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const src = (file: string) => `${BASE}/works/prokat/${file}.webp`;

// m — снимок для телефона [файл, ширина, высота]: мобильная раскладка сайта, на 350 px она читается,
// а снимок компьютера нет.
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
  ["#E3241B", "#FFFFFF"],
  ["#FF3B30", "#0B0B0B"],
  ["#0B0B0B", "#FFFFFF"],
  ["#FFFFFF", "#0B0B0B"],
  ["#ECECE8", "#0B0B0B"],
  ["#4A4A4A", "#FFFFFF"],
];

export function Prokat({ c, act, full }: { c: CaseData; act: CaseActions; full: boolean }) {
  return (
    <>
      <section className={`${base.shot} ${base.intro}`}>
        <h1 className={base.title} id="case-title" data-hi>
          Горный прокат <br />
          «Адреналин»
        </h1>
        <p className={`${base.text} ${base.lead}`} data-hi>
          Бренд и сайт для самого первого проката в&nbsp;истории Архыза.
        </p>
        <Duo
          slug="prokat"
          className={base.duo}
          data-cover=""
          alts={[
            "Главная сайта в окне браузера: красный первый экран, заголовок с лентой «в Архызе», чёрно-белое фото сноубордиста",
          ]}
        />
        <div className={base.facts} data-hi>
          <div>
            <p className={base.text}>Что входило в работу</p>
            <ul className={`${base.note} ${base.list}`}>
              <li>Бренд: знак-молния, цвета, шрифты</li>
              <li>Сайт: главная, цены, вопросы, контакты</li>
              <li>Бронь снаряжения в четыре шага</li>
              <li>Страницы услуг: лыжи, сноуборды, одежда, детский прокат, доставка</li>
              <li>Версия для телефона</li>
            </ul>
          </div>
        </div>
      </section>

      {full && (
        <>
          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="task"
              head="Сайт первого проката в Архызе"
              pic={
                <Img
                  file="first"
                  w={1080}
                  h={636}
                  alt="Чёрная плашка с сайта: №1, самый первый прокат в истории Архыза, три точки на улице Ленина"
                />
              }
            >
              Прокат открылся в&nbsp;Архызе раньше всех и&nbsp;сегодня держит три точки
              на&nbsp;улице Ленина. Человек едет в&nbsp;горы и&nbsp;хочет сразу понять, что взять,
              где забрать и&nbsp;как забронировать. Сайт отвечает на&nbsp;это по&nbsp;порядку,
              сверху вниз.
            </Block>
            <div className={base.line}>
              <Block
                name="mark"
                head="Знак-молния"
                pic={
                  <div className={base.page}>
                    <Img
                      file="brand-mark"
                      w={2200}
                      h={1520}
                      alt="Логотип «Адреналин» с молнией на белом, как в шапке сайта, и на чёрном, как в подвале"
                    />
                  </div>
                }
              >
                В&nbsp;шапке молния с&nbsp;красным переходом, на&nbsp;чёрном подвале сплошная.
                Название набрано узкими заглавными буквами и&nbsp;читается как вывеска,
                а&nbsp;в&nbsp;подвале занимает всю ширину страницы.
              </Block>
              <Block
                name="parts"
                head="Лента, штамп и жёсткая тень"
                pic={
                  <div className={base.page}>
                    <Img
                      file="brand-parts"
                      w={2200}
                      h={1520}
                      alt="Детали на красном: лента-наклейка, круглый штамп, билет скипаса, кнопки с жёсткой тенью, метка"
                    />
                  </div>
                }
              >
                Бренд собран как плакат: наклейка на&nbsp;заголовке, круглый штамп, нарисованный
                билет. У&nbsp;карточек и&nbsp;кнопок рамка 3&nbsp;px и&nbsp;тень без размытия,
                скруглений нет. Из&nbsp;этих деталей сложены все страницы.
              </Block>
            </div>
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
                Красный, почти чёрный и&nbsp;белый, для тихих блоков серый. На&nbsp;чёрном красный
                светлее: фирменный там теряется.
              </Block>
              <Block
                name="type"
                head="Шрифт"
                pic={
                  <div className={base.ink}>
                    <Img
                      file="brand-type"
                      w={1720}
                      h={880}
                      alt="Образцы шрифтов: Oswald для заголовков и цифр, Golos Text для обычного текста"
                    />
                  </div>
                }
              >
                Oswald для заголовков, цен и&nbsp;номеров домов: узкий и&nbsp;жирный, поэтому
                крупная цифра занимает мало места. Обычный текст набран Golos Text.
              </Block>
            </div>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="screen"
              head="Красный экран и наклонная строка"
              pic={
                <div className={base.page}>
                  <Img
                    file="hero-low"
                    m={["screen-m", 1170, 780]}
                    w={2880}
                    h={1060}
                    alt="Низ первого экрана: кнопка, фото в рамке с жёсткой тенью и наклонная чёрная бегущая строка"
                  />
                </div>
              }
            >
              Первый экран залит красным целиком, фото чёрно-белое. Снизу его режет наклонная
              бегущая строка с&nbsp;выгодами. При загрузке лента и&nbsp;штамп прихлопываются
              к&nbsp;странице, как настоящие наклейки.
            </Block>
            <Block
              name="kits"
              head="Комплекты по цвету"
              pic={
                <Img
                  file="kits"
                  m={["kits-m", 1298, 1088]}
                  w={1958}
                  h={1088}
                  alt="Три карточки комплектов: белая «Комфорт», красная «Премиум», чёрная «Эксперт»"
                />
              }
            >
              Четыре уровня, от&nbsp;детского до&nbsp;«Эксперта». Карточка меняет цвет вместе
              с&nbsp;уровнем: белая, красная, чёрная. Кнопка на&nbsp;карточке открывает бронь
              с&nbsp;уже выбранным комплектом.
            </Block>
            <Block
              name="bonus"
              head="Плитки бонусов"
              pic={
                <Img
                  file="bonus"
                  m={["bonus-m", 1068, 1503]}
                  w={2632}
                  h={1244}
                  alt="Плитки бонусов: большая красная «Скипасы без очередей» с нарисованным билетом и четыре малые плитки с крупными цифрами"
                />
              }
            >
              Главная плитка отдана скипасам без очереди, на&nbsp;ней нарисован билет. Остальные
              начинаются с&nbsp;крупной цифры: трансфер, доставка в&nbsp;отель и&nbsp;скидки
              клиентам проката.
            </Block>
            <Block
              name="faq"
              head="Вопросы"
              pic={
                <Img
                  file="faq"
                  m={["faq-m", 1068, 1262]}
                  w={2036}
                  h={1136}
                  alt="Раздел вопросов: чёрная карточка с огромным знаком вопроса и раскрытый ответ со всеми комплектами"
                />
              }
            >
              Ответы раскрываются на&nbsp;месте, ответ о&nbsp;ценах сразу показывает все комплекты.
              Рядом чёрная карточка с&nbsp;огромным знаком вопроса ведёт в&nbsp;WhatsApp или
              на&nbsp;звонок. Все 19&nbsp;вопросов собраны на&nbsp;отдельной странице.
            </Block>
            <Block
              name="footer"
              head="Подвал с номерами домов"
              pic={
                <div className={base.page}>
                  <Img
                    file="footer"
                    w={2768}
                    h={1444}
                    alt="Чёрный подвал: три точки на улице Ленина, часы работы и огромные номера домов 1А, 3А и 25"
                  />
                </div>
              }
            >
              Все точки стоят на&nbsp;одной улице, поэтому в&nbsp;подвале главное: номера домов,
              огромные, как на&nbsp;табличках. Основная точка красная, у&nbsp;каждой своя кнопка
              маршрута.
            </Block>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="steps"
              head="Бронь за четыре шага"
              pic={
                <div className={base.page}>
                  <Img
                    file="book-1"
                    m={["steps-m", 1170, 1880]}
                    w={2464}
                    h={1766}
                    alt="Первый шаг брони: четыре шага сверху, комплекты и размеры первого человека, справа чёрная карточка с итогом"
                  />
                </div>
              }
            >
              Снаряжение, даты, где забрать, контакты. У&nbsp;каждого человека свой комплект, рост,
              вес и&nbsp;размер обуви: по&nbsp;ним снаряжение подбирают заранее. Пройденный шаг
              отмечен, к&nbsp;нему можно вернуться и&nbsp;поправить.
            </Block>
            <div className={base.line}>
              <Block
                name="dates"
                head="Даты"
                pic={
                  <Img
                    file="book-dates"
                    m={["dates-m", 1080, 1863]}
                    w={1564}
                    h={1220}
                    alt="Календарь из двух месяцев с выделенным диапазоном и подписью о числе дней"
                  />
                }
              >
                Календарь считает дни катания, а&nbsp;не&nbsp;сутки. Человек отмечает первый
                и&nbsp;последний день, и&nbsp;под календарём сразу виден срок. Красной точкой
                помечены дни, когда доставка в&nbsp;отель платная.
              </Block>
              <Block
                name="sum"
                head="Итог на всю компанию"
                pic={
                  <Img
                    file="book-sum"
                    w={740}
                    h={1158}
                    alt="Чёрная карточка «Ваша бронь»: даты, точка, снаряжение двух человек, сумма за день и итог"
                  />
                }
              >
                Чёрная карточка всегда рядом: кто что берёт, сумма за&nbsp;день и&nbsp;итог.
                Считается сразу. Это заявка, а&nbsp;не&nbsp;оплата: предоплаты нет, прокат сам
                связывается и&nbsp;подтверждает бронь.
              </Block>
            </div>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="phones"
              head="Версия для телефона"
              pic={
                <div className={styles.pair}>
                  <figure className={styles.device}>
                    <Img
                      file="phone-kits"
                      w={780}
                      h={1688}
                      alt="Комплекты на телефоне: переключатель цен над лентой карточек, которую листают пальцем"
                    />
                  </figure>
                  <figure className={styles.device}>
                    <Img
                      file="phone-book"
                      w={780}
                      h={1688}
                      alt="Бронь на телефоне: комплекты плитками, снизу закреплены сумма и кнопка «Далее»"
                    />
                  </figure>
                </div>
              }
            >
              На&nbsp;телефоне своя раскладка, а&nbsp;не&nbsp;уменьшенная копия. Комплекты листаются
              пальцем, а&nbsp;цены вынесены в&nbsp;переключатель над лентой. В&nbsp;брони сумма
              и&nbsp;кнопка «Далее» закреплены внизу экрана, поэтому итог виден всё время.
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
