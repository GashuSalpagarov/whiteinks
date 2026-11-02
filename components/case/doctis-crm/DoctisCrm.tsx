import type { ReactNode } from "react";
import type { CaseData } from "@/components/scenes/Scene3";
import caseStyles from "../Case.module.css";
import { type CaseActions, End } from "../CaseView";
import { Duo } from "../memoridian/Duo";
import base from "../memoridian/Showcase.module.css";
import styles from "./DoctisCrm.module.css";

// Страница CRM Doctis (docs/12-case-page.md): тот же вид, что у Memoridian и проката. Идёт от входа
// к задачам, формам и статистике. Снимки — макеты интерфейса: строки с именами в кадр не взяты, в
// задачах оставлены строки без них. Ссылок на систему нет. Карточки на главной нет, вход — из списка работ.

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const src = (file: string) => `${BASE}/works/doctis-crm/${file}.webp`;

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
  ["#4B62C1", "#FFFFFF"],
  ["#6E88F3", "#141414"],
  ["#323232", "#FFFFFF"],
  ["#F3F3F3", "#141414"],
  ["#219653", "#FFFFFF"],
  ["#EB5757", "#141414"],
];

export function DoctisCrm({ c, act, full }: { c: CaseData; act: CaseActions; full: boolean }) {
  return (
    <>
      <section className={`${base.shot} ${base.intro}`}>
        <h1 className={base.title} id="case-title" data-hi>
          CRM <br />
          Doctis
        </h1>
        <p className={`${base.text} ${base.lead}`} data-hi>
          Рабочее место сотрудников телемедицины: задачи, страховые программы, клиники, врачи
          и&nbsp;статистика.
        </p>
        <Duo
          slug="doctis-crm"
          className={base.duo}
          data-cover=""
          alts={[
            "Страница статистики: график обращений и активных пользователей по дням",
            "Окно «Расписание врача»: дни недели и сетка времени с шагом 15 минут",
            "Список задач: дата, событие и цветная метка",
          ]}
        />
        <div className={base.facts} data-hi>
          <div>
            <p className={base.text}>Что входило в работу</p>
            <ul className={`${base.note} ${base.list}`}>
              <li>Вход и выбор раздела</li>
              <li>Задачи и поиск пациента</li>
              <li>Страховые программы и гарантийные письма</li>
              <li>Клиники, врачи и расписание</li>
              <li>Сообщения и статистика</li>
              <li>Набор интерфейса: цвета, кнопки, шрифт, шапка</li>
            </ul>
          </div>
          <div>
            <p className={base.text}>Кто работает в системе</p>
            <ul className={`${base.note} ${base.list}`}>
              <li>Оператор</li>
              <li>Администратор</li>
              <li>Медицинский ассистанс</li>
              <li>Доктор</li>
            </ul>
          </div>
        </div>
      </section>

      {full && (
        <>
          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="roles"
              head="Два раздела сразу после входа"
              pic={
                <div className={base.page}>
                  <Img
                    file="roles"
                    w={712}
                    h={368}
                    alt="Две карточки: «Медицинский ассистанс» со значком гарнитуры и «Для доктора» со стетоскопом"
                  />
                </div>
              }
            >
              Сотрудник выбирает, с&nbsp;чем будет работать. «Медицинский ассистанс» ведёт
              к&nbsp;страховым программам, клиникам и&nbsp;пациентам в&nbsp;программах ДМС. «Для
              доктора» ведёт к&nbsp;обращениям, специалистам, пользователям приложения
              и&nbsp;промокодам. Большой рисунок и&nbsp;одна кнопка: ошибиться негде.
            </Block>
            <Block
              name="signin"
              head="Вход и&nbsp;ошибка"
              pic={
                <div className={styles.pair}>
                  <div className={base.page}>
                    <Img
                      file="login"
                      w={336}
                      h={401}
                      alt="Форма входа: логин, пароль, галочка сохранения, кнопка «Войти» и вход через Google"
                    />
                  </div>
                  <div className={base.page}>
                    <Img
                      file="login-error"
                      w={336}
                      h={255}
                      alt="Состояние ошибки: красная рамка поля и строка «Логин или пароль введены неверно» над кнопкой"
                    />
                  </div>
                </div>
              }
            >
              Логин, пароль, галочка «сохранить» и&nbsp;вход через Google. При ошибке поля получают
              красную рамку, а&nbsp;строка с&nbsp;причиной встаёт прямо над кнопкой, и&nbsp;искать
              её не&nbsp;приходится.
            </Block>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="tasks"
              head="Задачи на&nbsp;главной"
              pic={
                <div className={base.page}>
                  <Img
                    file="tasks"
                    m={["tasks-m", 620, 240]}
                    w={969}
                    h={240}
                    alt="Список задач: галочка, дата, событие и цветная метка; выполненная задача перечёркнута"
                  />
                </div>
              }
            >
              Дата, событие и&nbsp;метка в&nbsp;одну строку. Выполненная задача перечёркивается
              и&nbsp;остаётся в&nbsp;списке. Ниже поиск по&nbsp;имени пациента или номеру полиса
              и&nbsp;кнопка «Добавить пациента».
            </Block>
            <div className={base.line}>
              <Block
                name="labels"
                head="Три метки"
                pic={
                  <div className={base.page}>
                    <Img
                      file="labels"
                      m={["labels-m", 150, 125]}
                      w={150}
                      h={322}
                      alt="Меню «Метка»: критично, важно, не срочно; ниже те же метки цветом в столбце"
                    />
                  </div>
                }
              >
                Критично, важно, не&nbsp;срочно. Красный, оранжевый и&nbsp;зелёный читаются раньше
                текста, а&nbsp;выбор метки живёт в&nbsp;меню прямо в&nbsp;заголовке столбца.
              </Block>
              <Block
                name="schedule"
                head="Расписание врача"
                pic={
                  <div className={base.page}>
                    <Img
                      file="schedule"
                      w={390}
                      h={494}
                      alt="Окно расписания: семь дней кружками, сетка времени с шагом 15 минут и карточка обращения внизу"
                    />
                  </div>
                }
              >
                Неделя кружками, под ней сетка времени с&nbsp;шагом 15&nbsp;минут. Отдельные ячейки
                выделены цветом, ниже карточка обращения со&nbsp;специальностью. Всё помещается
                в&nbsp;одно окно поверх списка врачей.
              </Block>
            </div>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="program"
              head="Страховая программа на&nbsp;одном экране"
              pic={
                <div className={base.page}>
                  <Img
                    file="program"
                    m={["program-m", 490, 420]}
                    w={1124}
                    h={799}
                    alt="Форма создания страховой программы: название, страховщик, договор, срок, возраст и специальности врачей"
                  />
                </div>
              }
            >
              Название, страховщик, описание, договор, срок действия, ограничение по&nbsp;возрасту
              и&nbsp;специальности врачей по&nbsp;телемедицине. Поля идут двумя столбцами, рядом
              с&nbsp;выбором специальностей виден их&nbsp;счёт. В&nbsp;пустой форме кнопка
              «Продолжить» неактивна.
            </Block>
            <Block
              name="clinic"
              head="Новая клиника"
              pic={
                <div className={base.page}>
                  <Img
                    file="clinic"
                    m={["clinic-m", 500, 392]}
                    w={968}
                    h={480}
                    alt="Окно добавления клиники: вкладки «Данные клиники» и «Врачи клиники», поля и кнопка «Загрузить списком»"
                  />
                </div>
              }
            >
              Две вкладки: данные клиники и&nbsp;её врачи. Сеть, название, руководитель, город,
              адрес, координаты и&nbsp;реквизиты, обязательные поля отмечены звёздочкой. Вверху окна
              есть кнопка «Загрузить списком».
            </Block>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="stats"
              head="Статистика"
              pic={
                <div className={base.page}>
                  <Img
                    file="stats"
                    m={["stats-m", 760, 462]}
                    w={1107}
                    h={738}
                    alt="Панель администратора: выбор периода, выгрузка в Excel и график обращений и активных пользователей"
                  />
                </div>
              }
            >
              График обращений и&nbsp;активных пользователей по&nbsp;месяцам, неделям или дням.
              Период для графика задаётся отдельно от&nbsp;периода выгрузки, рядом «Скачать Excel».
              Ниже второй график: время ответа дежурных врачей. Числа здесь из&nbsp;макета.
            </Block>
            <Block
              name="heads"
              head="Своя шапка у&nbsp;каждой роли"
              pic={
                <div className={styles.stack}>
                  <div className={base.page}>
                    <Img
                      file="head-operator"
                      m={["head-operator-m", 640, 79]}
                      w={1124}
                      h={79}
                      alt="Шапка оператора: список врачей, консультации, статистика, клиника"
                    />
                  </div>
                  <div className={base.page}>
                    <Img
                      file="head-admin"
                      m={["head-admin-m", 640, 114]}
                      w={1124}
                      h={114}
                      alt="Шапка администратора: главная, список клиник, сотрудники, администраторы клиник, страховые программы, панель"
                    />
                  </div>
                </div>
              }
            >
              Оператор видит список врачей, консультации, статистику и&nbsp;клинику. Администратор
              видит клиники, сотрудников, страховые программы и&nbsp;свою панель. Активный раздел
              отмечен полосой.
            </Block>
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
                Два синих для действий и&nbsp;заголовков, серые для текста и&nbsp;фона. Зелёный,
                красный и&nbsp;другие яркие цвета оставлены для состояний и&nbsp;меток.
              </Block>
              <Block
                name="kit"
                head="Кнопки и&nbsp;шрифт"
                pic={
                  <div className={base.page}>
                    <Img
                      file="kit"
                      w={450}
                      h={532}
                      alt="Набор кнопок: основная, второстепенная, третьестепенная, неактивная, кнопки с иконкой и специальные"
                    />
                  </div>
                }
              >
                Основная, второстепенная и&nbsp;третьестепенная кнопки, неактивная, с&nbsp;иконкой,
                три размера. Шрифт один, Montserrat. Новому экрану хватает этого набора.
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
