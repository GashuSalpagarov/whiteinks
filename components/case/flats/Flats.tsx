import type { ReactNode } from "react";
import type { CaseData } from "@/components/scenes/Scene3";
import caseStyles from "../Case.module.css";
import { type CaseActions, End } from "../CaseView";
import { Duo } from "../memoridian/Duo";
import base from "../memoridian/Showcase.module.css";
import styles from "./Flats.module.css";

// Страница площадки курортной недвижимости flats (docs/12-case-page.md): тот же вид, что у Memoridian,
// наш продукт. Идёт от витрины для покупателя к калькуляторам, кабинету застройщика, CRM менеджеров
// и кабинету покупателя. Сайт снят с тестового сервера, кабинеты — с локальной копии с тестовыми данными.

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const src = (file: string) => `${BASE}/works/flats/${file}.webp`;

// m — снимок для телефона [файл, ширина, высота]: мобильный вид сайта или кусок снимка кабинета.
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
  ["#0A1210", "#FFFFFF"],
  ["#17443A", "#FFFFFF"],
  ["#DD8F5A", "#111614"],
  ["#F2C79C", "#111614"],
  ["#EFEADF", "#111614"],
  ["#F7F4EE", "#111614"],
];

export function Flats({ c, act, full }: { c: CaseData; act: CaseActions; full: boolean }) {
  return (
    <>
      <section className={`${base.shot} ${base.intro}`}>
        <h1 className={base.title} id="case-title" data-hi>
          Курортная <br />
          недвижимость flats
        </h1>
        <p className={`${base.text} ${base.lead}`} data-hi>
          Площадка продажи апартаментов на&nbsp;курортах Кавказа: витрина с&nbsp;отбором объектов
          для покупателей и&nbsp;кабинет для застройщиков. Наш продукт.
        </p>
        <Duo
          slug="flats"
          className={base.duo}
          data-cover=""
          alts={[
            "Первый экран сайта: «Дом в горах, который зарабатывает», фото горы на закате и цифры — рост цены метра, аэропорт 2029, 214-ФЗ",
            "Карточка отеля COSMOS Selection Arkhyz Hotel 5* на телефоне: цена от 18 850 000 ₽, сдача в декабре 2025, доходность до 12,1%",
          ]}
        />
        <div className={base.facts} data-hi>
          <div>
            <p className={base.text}>Что входило в работу</p>
            <ul className={`${base.note} ${base.list}`}>
              <li>Сайт с каталогом и карточками объектов</li>
              <li>Шахматка номеров с заявкой на конкретный номер</li>
              <li>Калькуляторы рассрочки, доходности и налогового вычета</li>
              <li>Кабинет застройщика: номера, цены, заявки</li>
              <li>CRM менеджеров: заявки, сделки, вычеты</li>
              <li>Личный кабинет покупателя</li>
            </ul>
          </div>
          <div>
            <p className={base.text}>Для кого</p>
            <ul className={`${base.note} ${base.list}`}>
              <li>Покупатели апартаментов</li>
              <li>Застройщики курортных объектов</li>
              <li>Менеджеры и риелторы площадки</li>
            </ul>
          </div>
        </div>
      </section>

      {full && (
        <>
          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="catalog"
              head="Только проверенные объекты"
              pic={
                <div className={base.page}>
                  <Img
                    file="catalog"
                    m={["catalog-m", 1170, 1900]}
                    w={2160}
                    h={1150}
                    alt="Карточка в каталоге: COSMOS Selection Arkhyz Hotel 5* строится, сдача в декабре 2025, рядом блок «Не уверены, какой объект ваш?»"
                  />
                </div>
              }
            >
              Объект попадает на&nbsp;сайт после юридической и&nbsp;инвестиционной проверки.
              У&nbsp;каждого видно застройщика, цену, площади и&nbsp;расчётную доходность.
            </Block>
            <Block
              name="chess"
              head="Номер выбирают по&nbsp;окнам"
              pic={
                <div className={base.page}>
                  <Img
                    file="chess"
                    m={["chess-m", 1170, 2050]}
                    w={2160}
                    h={1730}
                    alt="Шахматка «Выберите своё окно»: фасад отеля из 121 окна по этажам, свободные светятся, фильтры по категориям и статусу"
                  />
                </div>
              }
            >
              Фасад отеля, где каждое окно&nbsp;— номер. Свет горит&nbsp;— свободен. Нажал
              на&nbsp;окно и видишь цену, планировку и&nbsp;заявку именно на&nbsp;этот номер. Рядом
              фильтры по&nbsp;категориям и&nbsp;вид списком.
            </Block>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="installment"
              head="Рассрочка без процентов"
              pic={
                <div className={base.page}>
                  <Img
                    file="installment"
                    m={["installment-m", 1170, 1780]}
                    w={1280}
                    h={1180}
                    alt="Калькулятор рассрочки: категория номера, первый взнос 20%, срок 36 месяцев и ежемесячный платёж 418 889 ₽"
                  />
                </div>
              }
            >
              Покупатель выбирает категорию номера, первый взнос и&nbsp;срок и&nbsp;сразу видит
              платёж в&nbsp;месяц по&nbsp;условиям застройщика.
            </Block>
            <Block
              name="deduction"
              head="Налоговый вычет"
              pic={
                <div className={base.page}>
                  <Img
                    file="deduction"
                    m={["deduction-m", 1170, 2480]}
                    w={2160}
                    h={1424}
                    alt="Блок «Государство вернёт до 650 000 ₽»: калькулятор по стоимости квартиры, процентам по ипотеке и доходу"
                  />
                </div>
              }
            >
              Калькулятор считает, сколько вернёт государство по&nbsp;статье 220 Налогового кодекса,
              до&nbsp;650&nbsp;000&nbsp;₽. Оформить вычет помогают юристы площадки.
            </Block>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="devHero"
              head="Отдельный вход для застройщиков"
              pic={
                <div className={base.page}>
                  <Img
                    file="dev-hero"
                    m={["dev-hero-m", 1170, 1800]}
                    w={2160}
                    h={1350}
                    alt="Страница для застройщиков: «Кабинет, который продаёт за вас», кнопки «Попробовать кабинет» и «Запросить демо»"
                  />
                </div>
              }
            >
              Своя страница: что даёт кабинет, сколько стоит и&nbsp;как начать. После регистрации
              сразу открывается песочница, а&nbsp;публикация на&nbsp;сайте&nbsp;— после проверки
              документов.
            </Block>
            <Block
              name="units"
              head="Шахматка и&nbsp;цены в&nbsp;кабинете"
              pic={
                <div className={base.page}>
                  <Img
                    file="dev-units"
                    m={["dev-units-m", 1100, 1150]}
                    w={1920}
                    h={1290}
                    alt="Кабинет застройщика: номера COSMOS по этажам — категория, площадь, цена и статус, сверху свободно 121, бронь 0, продано 0"
                  />
                </div>
              }
            >
              Номера по&nbsp;этажам с&nbsp;ценами и&nbsp;статусами, загрузка из&nbsp;Excel. Цену
              меняют прямо в&nbsp;таблице: до&nbsp;±5% применяется сразу, больше уходит
              на&nbsp;согласование площадке.
            </Block>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="board"
              head="Канбан заявок"
              pic={
                <div className={base.page}>
                  <Img
                    file="board"
                    m={["board-m", 1100, 900]}
                    w={2160}
                    h={1200}
                    alt="Канбан лидов: колонки «Новые», «В работе», «Квалиф.», «Просмотр», «Переговоры», «Сделка», «Потерян» с карточками заявок"
                  />
                </div>
              }
            >
              Заявки с&nbsp;сайта и&nbsp;от&nbsp;партнёров попадают в&nbsp;канбан менеджеров. Если
              на&nbsp;заявку не&nbsp;ответили больше часа, в&nbsp;рабочий чат в&nbsp;Telegram
              приходит напоминание.
            </Block>
            <Block
              name="refunds"
              head="Кабинет покупателя"
              pic={
                <div className={base.page}>
                  <Img
                    file="refunds"
                    m={["refunds-m", 1500, 900]}
                    w={1920}
                    h={1200}
                    alt="Личный кабинет: налоговый вычет по «Таукель Архыз», к возврату 260 000 ₽, шаги — документы, 3-НДФЛ, подача, ФНС, готово"
                  />
                </div>
              }
            >
              Купленные апартаменты, документы по&nbsp;сделке и&nbsp;возврат налога по&nbsp;шагам:
              документы, 3-НДФЛ, подача, ФНС, готово.
            </Block>
            <Block
              name="colors"
              head="Цвета и&nbsp;шрифты"
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
              Хвойная ночь, снег и&nbsp;тёплый свет в&nbsp;окне: тёмные секции с&nbsp;бронзой
              и&nbsp;светлые песочные. Заголовки&nbsp;— Noto Serif Display с&nbsp;курсивом,
              текст&nbsp;— Geist, подписи&nbsp;— Geist Mono.
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
