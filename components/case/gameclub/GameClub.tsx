import type { ReactNode } from "react";
import type { CaseData } from "@/components/scenes/Scene3";
import caseStyles from "../Case.module.css";
import { type CaseActions, End } from "../CaseView";
import { Duo } from "../memoridian/Duo";
import base from "../memoridian/Showcase.module.css";
import styles from "./GameClub.module.css";

// Страница системы для игровых клубов GameClub (docs/12-case-page.md): тот же вид, что у Memoridian, наш
// продукт. Идёт от оператора к владельцу и гостям. Снимки — настоящий интерфейс gmclb.ru и book.gmclb.ru,
// данные демо-клуба выдуманные: один субботний вечер на всех снимках, клиентских клубов в кадре нет.

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const src = (file: string) => `${BASE}/works/gameclub/${file}.webp`;

// m — снимок для телефона [файл, ширина, высота]: снимок компьютера на 350 px не читается.
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
  ["#030711", "#FFFFFF"],
  ["#00B8DB", "#141414"],
  ["#9AE600", "#141414"],
  ["#21C45D", "#141414"],
  ["#FFB900", "#141414"],
  ["#6E5CFF", "#FFFFFF"],
];

const link = (href: string, label: string) => (
  <a href={href} target="_blank" rel="noopener noreferrer">
    {label}
  </a>
);

export function GameClub({ c, act, full }: { c: CaseData; act: CaseActions; full: boolean }) {
  return (
    <>
      <section className={`${base.shot} ${base.intro}`}>
        <h1 className={base.title} id="case-title" data-hi>
          Система для клубов <br />
          GameClub
        </h1>
        <p className={`${base.text} ${base.lead}`} data-hi>
          Сеансы, бар, брони и&nbsp;отчёты для клубов с&nbsp;PlayStation и&nbsp;Xbox. Наш продукт.
        </p>
        <Duo
          slug="gameclub"
          className={base.duo}
          data-cover=""
          alts={[
            "Панель оператора: десять кабинок, у занятых таймер и сумма бара, у пакета обратный отсчёт",
            "Экран сеанса на телефоне гостя: осталось 27:45, кнопки «Бар», «Продлить», «Позвать» и текущий счёт",
          ]}
        />
        <div className={base.facts} data-hi>
          <div>
            <p className={base.text}>Что входило в работу</p>
            <ul className={`${base.note} ${base.list}`}>
              <li>Сайт продукта</li>
              <li>Панель оператора и кабинет владельца</li>
              <li>Приложение для гостей GMCLB: каталог, бронь, экран сеанса</li>
              <li>Отчёты владельцу в Telegram</li>
              <li>Две версии: для России и для остального мира</li>
            </ul>
          </div>
          <div>
            <p className={base.text}>Где найти</p>
            <ul className={`${base.note} ${base.list}`}>
              <li>Россия: {link("https://gmclb.ru", "gmclb.ru")}</li>
              <li>Мир: {link("https://gameclub.work", "gameclub.work")}</li>
              <li>Гостям: {link("https://book.gmclb.ru", "book.gmclb.ru")}</li>
            </ul>
          </div>
        </div>
      </section>

      {full && (
        <>
          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="tiles"
              head="Весь зал на&nbsp;одном экране"
              pic={
                <div className={base.page}>
                  <Img
                    file="tiles"
                    w={1696}
                    h={422}
                    alt="Три плитки кабинок: почасовой сеанс 01:12:10, пакет с обратным отсчётом 00:27:45, предоплата за пять минут до конца на красном"
                  />
                </div>
              }
            >
              Каждая кабинка&nbsp;— плитка с&nbsp;таймером. Почасовой сеанс считает вверх, пакет
              и&nbsp;предоплата&nbsp;— вниз до&nbsp;конца оплаченного времени, а&nbsp;за&nbsp;пять
              минут до&nbsp;него плитка краснеет. Сумма бара видна в&nbsp;углу.
            </Block>
            <div className={base.line}>
              <Block
                name="pay"
                head="Счёт без калькулятора"
                pic={
                  <div className={base.page}>
                    <Img
                      file="pay"
                      w={896}
                      h={1548}
                      alt="Окно оплаты: время сеанса, сумма за игру, кнопки акций, бар, итог, округление и выбор наличных или карты"
                    />
                  </div>
                }
              >
                Оператор жмёт «Завершить», и&nbsp;время с&nbsp;баром уже в&nbsp;счёте. Акции
                включаются кнопками и&nbsp;складываются, итог можно округлить, оплата наличными или
                картой.
              </Block>
              <Block
                name="quick"
                head="Бар в&nbsp;одно касание"
                pic={
                  <div className={base.page}>
                    <Img
                      file="quick"
                      w={1360}
                      h={992}
                      alt="Окно быстрого добавления: вкладки «Бар» и «Джойстики», разделы «Напитки» и «Кухня», кнопки с ценами"
                    />
                  </div>
                }
              >
                Плюс на&nbsp;плитке открывает бар этой кабинки. В&nbsp;быстром режиме кнопка&nbsp;—
                это цена: нажал, и&nbsp;заказ уже в&nbsp;счёте сеанса. Рядом вкладка
                с&nbsp;геймпадами напрокат.
              </Block>
            </div>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="owner"
              head="Кабинет владельца"
              pic={
                <div className={base.page}>
                  <Img
                    file="owner"
                    m={["owner-m", 1092, 1740]}
                    w={2000}
                    h={1021}
                    alt="Главная кабинета: смена, кабинки, шаблоны, брони, приложение для гостей, телевизоры, акции, карты, отчёты, бар, сотрудники и клиенты"
                  />
                </div>
              }
            >
              Всё, что настраивают один раз: кабинки, сотрудники, меню бара, скидочные карты
              и&nbsp;база клиентов. Отсюда открывают смену, а&nbsp;телевизоры в&nbsp;кабинках
              блокируются, пока сеанс не&nbsp;начат.
            </Block>
            <Block
              name="presets"
              head="Цена часа и&nbsp;пакеты"
              pic={
                <div className={base.page}>
                  <Img
                    file="presets"
                    m={["presets-m", 1044, 978]}
                    w={2000}
                    h={527}
                    alt="Шаблоны кабинок PS5, PS5 VIP и Xbox Series X: цена часа, пакеты на три и пять часов, число кабинок и сеансов"
                  />
                </div>
              }
            >
              Шаблон задаёт цену часа и&nbsp;пакеты. Кабинка берёт шаблон, поэтому цены всего зала
              меняются в&nbsp;одном месте.
            </Block>
            <Block
              name="promos"
              head="Акции по&nbsp;правилам"
              pic={
                <div className={base.page}>
                  <Img
                    file="promos"
                    w={2000}
                    h={523}
                    alt="Таблица акций: будни днём −20%, каждый третий час бесплатно, день рождения −15%, ночь на выходных −30%"
                  />
                </div>
              }
            >
              Скидка в&nbsp;процентах или каждый третий час бесплатно, по&nbsp;дням недели
              и&nbsp;часам. Условия не&nbsp;надо держать в&nbsp;голове: в&nbsp;окне оплаты акция
              включается кнопкой, расчёт делает система.
            </Block>
            <Block
              name="reports"
              head="Выручка без звонка администратору"
              pic={
                <div className={base.page}>
                  <Img
                    file="reports"
                    m={["reports-m", 1092, 1176]}
                    w={2000}
                    h={813}
                    alt="Отчёт за день: сеансы, выручка с разбивкой на бар, наличные и карту, игровые часы, скидки, график выручки по дням и сравнение с прошлым периодом"
                  />
                </div>
              }
            >
              Сеансы, бар, наличные и&nbsp;карта, игровые часы и&nbsp;скидки, график по&nbsp;дням
              и&nbsp;сравнение с&nbsp;прошлым периодом. Сводку за&nbsp;день владелец получает
              и&nbsp;в&nbsp;Telegram.
            </Block>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="qr"
              head="QR на&nbsp;входе и&nbsp;на&nbsp;каждой кабинке"
              pic={
                <div className={base.page}>
                  <Img
                    file="qr"
                    m={["qr-m", 1092, 1830]}
                    w={1600}
                    h={1678}
                    alt="Страница «Приложение для гостей»: QR клуба с кнопками скачивания и печати постера, ниже наклейки на десять кабинок"
                  />
                </div>
              }
            >
              Постер ведёт на&nbsp;страницу клуба с&nbsp;бронью, наклейка&nbsp;— на&nbsp;экран
              своего сеанса: сколько осталось и&nbsp;сколько стоит. Наклейки печатаются листами
              по&nbsp;шесть, ссылку любой можно перевыпустить.
            </Block>
            <Block
              name="phones"
              head="Приложение для гостей GMCLB"
              pic={
                <div className={styles.pair}>
                  <figure className={styles.device}>
                    <Img
                      file="club"
                      w={1170}
                      h={2532}
                      alt="Страница клуба на телефоне: 2 из 10 кабинок свободны, у занятых время до освобождения, у VIP #2 бронь с 20:30"
                    />
                  </figure>
                  <figure className={styles.device}>
                    <Img
                      file="book"
                      w={1170}
                      h={2532}
                      alt="Бронь, шаг 3 из 5: длительность и свободное время с ценой"
                    />
                  </figure>
                </div>
              }
            >
              У&nbsp;гостей своё имя и&nbsp;свой вид. Видно, сколько кабинок свободно прямо сейчас
              и&nbsp;когда освободятся занятые, а&nbsp;бронь собирается за&nbsp;пять шагов: дата,
              кабинка, время, данные, итог.
            </Block>
            <Block
              name="site"
              head="Сайт продукта"
              pic={
                <div className={base.page}>
                  <Img
                    file="site"
                    m={["site-m", 1170, 2532]}
                    w={2400}
                    h={1500}
                    alt="Первый экран сайта gmclb.ru: «Программа для PlayStation-клуба и Xbox-лаунжа», кнопки пробного периода и демо"
                  />
                </div>
              }
            >
              Первый экран говорит, для кого программа, и&nbsp;пускает в&nbsp;демо-клуб без
              регистрации. Дальше&nbsp;— кому подойдёт, возможности, тарифы и&nbsp;вопросы,
              а&nbsp;у&nbsp;разных типов клубов свои страницы.
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
              Тёмный зал и&nbsp;цвет по&nbsp;смыслу: голубой у&nbsp;действий, лаймовый&nbsp;— идёт
              игра, зелёный&nbsp;— свободно, жёлтый&nbsp;— время оплачено. У&nbsp;гостей свой
              фиолетовый. Шрифт панели&nbsp;— Outfit, у&nbsp;приложения&nbsp;— Unbounded
              и&nbsp;Onest.
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
