import type { ReactNode } from "react";
import type { CaseData } from "@/components/scenes/Scene3";
import caseStyles from "../Case.module.css";
import { type CaseActions, End } from "../CaseView";
import { Duo } from "../memoridian/Duo";
import base from "../memoridian/Showcase.module.css";
import styles from "./EdgeCenter.module.css";

// Страница личного кабинета EdgeЦентр (docs/12-case-page.md): тот же вид, что у Memoridian и проката.
// Снимки только открытые: страница входа, снимки кабинета с сайта провайдера и его базы знаний с
// демо-данными. В кабинет не входили, экранов не рисовали. Лендинг работой студии не показан, ссылок нет.

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const src = (file: string) => `${BASE}/works/edgecenter/${file}.webp`;

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
      <div className={base.pic}>
        <div className={base.page}>{p.pic}</div>
      </div>
      <div className={base.copy}>
        <h2 className={base.head}>{p.head}</h2>
        <p className={base.text}>{p.children}</p>
      </div>
    </div>
  );
}

function Lead(p: { head: string; children: ReactNode }) {
  return (
    <div className={base.copy} data-rise>
      <h2 className={base.head}>{p.head}</h2>
      <p className={base.text}>{p.children}</p>
    </div>
  );
}

const SWATCHES = [
  ["#196CFC", "#FFFFFF"],
  ["#2E2E2E", "#FFFFFF"],
  ["#F0F0F0", "#141414"],
  ["#E2F6E6", "#141414"],
  ["#6B80B6", "#FFFFFF"],
  ["#77B39C", "#141414"],
];

export function EdgeCenter({ c, act, full }: { c: CaseData; act: CaseActions; full: boolean }) {
  return (
    <>
      <section className={`${base.shot} ${base.intro}`}>
        <h1 className={base.title} id="case-title" data-hi>
          Личный кабинет <br />
          EdgeЦентр
        </h1>
        <p className={`${base.text} ${base.lead}`} data-hi>
          Один кабинет для сервисов облачного провайдера: CDN, облако, стриминг, защита, DNS
          и&nbsp;хранилище.
        </p>
        <Duo
          slug="edgecenter"
          className={base.duo}
          data-cover=""
          alts={[
            "Раздел «Веб-защита» за другими окнами кабинета",
            "Раздел CDN за дашбордом",
            "Дашборд кабинета: карточки сервисов с графиками, справа баланс и тарифы",
          ]}
        />
        <div className={base.facts} data-hi>
          <div>
            <p className={base.text}>Что входило в работу</p>
            <ul className={`${base.note} ${base.list}`}>
              <li>Личный кабинет</li>
              <li>Вход в аккаунт</li>
              <li>Дашборд и разделы сервисов</li>
              <li>Пользователи, роли и уведомления</li>
            </ul>
          </div>
          <div>
            <p className={base.text}>Что есть в кабинете</p>
            <ul className={`${base.note} ${base.list}`}>
              <li>Отчёты, CDN, облако, стриминг, веб-защита</li>
              <li>Защита инфраструктуры, хранилище, DNS, Colocation</li>
              <li>Двухфакторная защита и API-токены</li>
              <li>Русский и английский</li>
            </ul>
          </div>
        </div>
      </section>

      {full && (
        <>
          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="dash"
              head="Все сервисы на&nbsp;одном экране"
              pic={
                <Img
                  file="dashboard"
                  m={["dashboard-m", 585, 348]}
                  w={1166}
                  h={618}
                  alt="Дашборд: карточки CDN, хранилища и DNS с графиками, справа баланс и подключённые сервисы"
                />
              }
            >
              Дашборд собирает сервисы карточками: общий трафик CDN, использование хранилища,
              запросы DNS, просмотры в&nbsp;стриминге. У&nbsp;каждой карточки свой период
              и&nbsp;сравнение с&nbsp;прошлым. Справа баланс и&nbsp;подключённые сервисы
              с&nbsp;тарифами.
            </Block>
            <Block
              name="signin"
              head="Вход"
              pic={
                <Img
                  file="signin"
                  m={["signin-phone", 780, 1288]}
                  w={1800}
                  h={1125}
                  alt="Страница входа: слева карточка о сервисах, справа форма входа"
                />
              }
            >
              Почта и&nbsp;пароль, SAML SSO, Яндекс и&nbsp;Госуслуги. Рядом с&nbsp;формой меняются
              карточки: страница входа заодно рассказывает, что ещё можно подключить.
              На&nbsp;телефоне форма стоит первой, карточки уходят под неё.
            </Block>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <div className={base.line}>
              <Lead head="У&nbsp;каждого сервиса свой раздел">
                Устроены разделы одинаково. Слева полоса значков для перехода между сервисами, рядом
                меню раздела, сверху статус и&nbsp;баланс. Освоив один, легко найти нужное
                в&nbsp;другом.
              </Lead>
              <Block
                name="cdn"
                head="Статистика CDN"
                pic={
                  <Img
                    file="cdn"
                    m={["cdn-m", 654, 301]}
                    w={914}
                    h={477}
                    alt="Раздел CDN: меню раздела, фильтр ресурсов и столбики трафика за три месяца"
                  />
                }
              >
                Сверху выбор ресурсов, ниже графики трафика и&nbsp;запросов. В&nbsp;меню рядом
                SSL-сертификаты, очистка, загрузка и&nbsp;логи.
              </Block>
            </div>
            <Block
              name="quotas"
              head="Квоты облака"
              pic={
                <Img
                  file="quotas"
                  m={["quotas-m", 412, 278]}
                  w={914}
                  h={477}
                  alt="Раздел квот: регионы и ресурсы слева, форма запроса справа"
                />
              }
            >
              Слева выбирают регион и&nbsp;ресурс, справа собирается запрос на&nbsp;изменение. Прямо
              в&nbsp;форме сказано, сколько его рассматривают, и&nbsp;зачем просят описать задачу.
            </Block>
            <Block
              name="codes"
              head="Коды ответов"
              pic={
                <Img
                  file="codes"
                  m={["codes-m", 646, 306]}
                  w={914}
                  h={477}
                  alt="График кодов ответа в разделе «Веб-защита»: четыре линии и фильтры над ними"
                />
              }
            >
              Успешные ответы, перенаправления и&nbsp;ошибки идут четырьмя линиями на&nbsp;одном
              графике. Над ним ресурсы, период, даты и&nbsp;часовой пояс.
            </Block>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <div className={base.line}>
              <Block
                name="roles"
                head="Роли"
                pic={
                  <Img
                    file="roles"
                    w={624}
                    h={412}
                    alt="Роли при приглашении пользователя: от администратора до только просмотра"
                  />
                }
              >
                В&nbsp;аккаунт приглашают людей с&nbsp;разными правами: от&nbsp;администратора
                до&nbsp;только просмотра. Для очистки кеша CDN есть свои узкие роли.
              </Block>
              <Block
                name="notify"
                head="Уведомления"
                pic={
                  <Img
                    file="notify"
                    w={651}
                    h={425}
                    alt="Настройка уведомлений CDN: у каждого события две отметки, почта и Telegram"
                  />
                }
              >
                У&nbsp;каждого события две отметки: на&nbsp;почту и&nbsp;в&nbsp;Telegram. Для
                трафика можно задать объём, после которого придёт уведомление.
              </Block>
            </div>
            <div className={base.line}>
              <Block
                name="account"
                head="Несколько аккаунтов"
                pic={
                  <Img
                    file="account"
                    w={537}
                    h={450}
                    alt="Форма создания нового аккаунта с одним полем"
                  />
                }
              >
                Между аккаунтами переключаются без повторного входа. Новый создаётся одним полем:
                названием компании.
              </Block>
              <Block
                name="log"
                head="Что изменилось"
                pic={
                  <Img
                    file="log"
                    w={535}
                    h={352}
                    alt="Запись журнала действий: старое значение красным, новое зелёным"
                  />
                }
              >
                Действия пишутся в&nbsp;журнал с&nbsp;фильтрами по&nbsp;времени, сервису
                и&nbsp;пользователю. В&nbsp;записи видно, какое значение было и&nbsp;какое стало.
              </Block>
            </div>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <div className={base.line}>
              <Lead head="Один набор деталей">
                Те&nbsp;же поля, кнопки, карточки и&nbsp;плашки статуса повторяются во&nbsp;всех
                разделах, шрифт один: Inter. Поэтому разные сервисы выглядят одним продуктом.
              </Lead>
              <div className={`${base.block} ${styles.colors}`} data-rise>
                <div className={base.pic}>
                  <div className={base.swatches}>
                    {SWATCHES.map(([hex, ink]) => (
                      <i key={hex} className="no-invert" style={{ background: hex, color: ink }}>
                        <span>{hex}</span>
                      </i>
                    ))}
                  </div>
                </div>
                <div className={base.copy}>
                  <h2 className={base.head}>Цвета</h2>
                  <p className={base.text}>
                    Синий для действий и&nbsp;ссылок, основа нейтральная. Статус отмечен светлой
                    зелёной плашкой, а&nbsp;свои оттенки есть у&nbsp;графиков.
                  </p>
                </div>
              </div>
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
