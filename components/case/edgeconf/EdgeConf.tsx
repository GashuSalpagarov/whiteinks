import type { ReactNode } from "react";
import type { CaseData } from "@/components/scenes/Scene3";
import caseStyles from "../Case.module.css";
import { type CaseActions, End } from "../CaseView";
import { Duo } from "../memoridian/Duo";
import base from "../memoridian/Showcase.module.css";
import styles from "./EdgeConf.module.css";

// Страница видеоплатформы (docs/12-case-page.md): тот же вид, что у Memoridian и проката. Снимки — только
// то, что открыто без входа: стартовый экран edgeconf.ru/new, экран подготовки к встрече и снимок кабинета
// с лендинга платформы. Экранов самой встречи нет: их не снимали и не рисовали. Цифры в тексте — из
// описания сервиса.
// Ссылок на сайт клиента нет. Карточки на главной нет, вход — из списка работ.

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function Img(p: { file: string; w: number; h: number; alt: string }) {
  return (
    // biome-ignore lint/performance/noImgElement: статический экспорт, файлы из public как есть
    <img
      src={`${BASE}/works/edgeconf/${p.file}.webp`}
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

// Заголовок и абзац без картинки: стоит в ряду рядом с блоком.
function Lead(p: { head: string; children: ReactNode }) {
  return (
    <div className={base.copy} data-rise>
      <h2 className={base.head}>{p.head}</h2>
      <p className={base.text}>{p.children}</p>
    </div>
  );
}

const SWATCHES = [
  ["#131315", "#FFFFFF"],
  ["#1B1A1F", "#FFFFFF"],
  ["#2A2A2C", "#FFFFFF"],
  ["#FFFFFF", "#141414"],
  ["#F8F8F8", "#141414"],
  ["#346AF3", "#FFFFFF"],
];

export function EdgeConf({ c, act, full }: { c: CaseData; act: CaseActions; full: boolean }) {
  return (
    <>
      <section className={`${base.shot} ${base.intro}`}>
        <h1 className={base.title} id="case-title" data-hi>
          Видеоплатформа <br />
          EdgeConf
        </h1>
        <p className={`${base.text} ${base.lead}`} data-hi>
          Платформа, которую мы построили: видеозвонки, вебинары и&nbsp;стриминг для бизнеса.
        </p>
        <Duo
          slug="edgeconf"
          className={base.duo}
          data-cover=""
          alts={[
            "Тёмный стартовый экран: заголовок о видеоконференциях для бизнеса, плитки «Создать конференцию» и «Создать вебинар»",
            "Светлый кабинет стриминга: меню разделов и настройки плеера",
          ]}
        />
        <div className={base.facts} data-hi>
          <div>
            <p className={base.text}>Что входило в работу</p>
            <ul className={`${base.note} ${base.list}`}>
              <li>Конференции и вебинары</li>
              <li>Вход без регистрации и скачивания</li>
              <li>Подготовка: камера, микрофон, настройки</li>
              <li>Кабинет: видеохостинг, live-стриминг, статистика</li>
              <li>Настройка плеера</li>
            </ul>
          </div>
        </div>
      </section>

      {full && (
        <>
          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="start"
              head="Два варианта на старте"
              pic={
                <div className={base.page}>
                  <Img
                    file="cards"
                    w={760}
                    h={290}
                    alt="Две тёмные плитки со значками: создать конференцию и создать вебинар"
                  />
                </div>
              }
            >
              Экран начинается с&nbsp;выбора. Конференция нужна для разговора с&nbsp;друзьями или
              коллегами, вебинар для онлайн-мероприятия. У&nbsp;каждого варианта своя плитка, значок
              и&nbsp;одна строка подписи.
            </Block>
            <div className={base.line}>
              <Block
                name="free"
                head="Без регистрации и скачивания"
                pic={
                  <div className={base.page}>
                    <Img
                      file="head"
                      w={760}
                      h={116}
                      alt="Заголовок стартового экрана и строка под ним: создайте комнату, поделитесь ею и начните без регистрации и скачивания"
                    />
                  </div>
                }
              >
                Человек создаёт свою комнату, делится ею с&nbsp;участниками и&nbsp;начинает встречу.
                Ни&nbsp;аккаунт, ни&nbsp;установка для этого не&nbsp;нужны, и&nbsp;экран говорит об
                этом сразу, в&nbsp;первой строке.
              </Block>
              <Block
                name="prejoin"
                head="Проверка перед входом"
                pic={
                  <div className={base.page}>
                    <Img
                      file="prejoin"
                      w={1120}
                      h={1280}
                      alt="Экран подготовки: окно превью камеры, кнопки микрофона, камеры и настроек, поле имени и синяя кнопка входа"
                    />
                  </div>
                }
              >
                Перед встречей человек видит окно камеры, под ним кнопки микрофона, камеры
                и&nbsp;настроек, дальше поле для имени и&nbsp;большую кнопку входа. Выключенная
                камера отмечена красным значком, а&nbsp;в&nbsp;окне вместо картинки стоит силуэт.
              </Block>
            </div>
            <div className={base.line}>
              <Block
                name="ready"
                head="Тот же экран на телефоне"
                pic={
                  <div className={styles.device}>
                    <Img
                      file="phone-ready"
                      w={1170}
                      h={2532}
                      alt="Экран подготовки на телефоне: сообщение, что нет доступа к камере, кнопки, поле имени и кнопка входа во всю ширину"
                    />
                  </div>
                }
              >
                Всё встаёт в&nbsp;одну колонку, поле имени и&nbsp;кнопка входа занимают всю ширину.
                Здесь в&nbsp;окне камеры сообщение: доступа к&nbsp;камере нет, рядом ссылка
                с&nbsp;объяснением, как его получить.
              </Block>
              <Block
                name="blocked"
                head="Если камера заблокирована"
                pic={
                  <div className={base.page}>
                    <Img
                      file="blocked"
                      w={860}
                      h={645}
                      alt="Окно с двумя шагами, как разрешить камеру и микрофон в браузере, и кнопками «Понятно» и «Нужна помощь»"
                    />
                  </div>
                }
              >
                Окно объясняет в&nbsp;два шага, что сделать: нажать значок устройства
                в&nbsp;адресной строке и&nbsp;сменить его статус. Если не&nbsp;получилось, рядом
                кнопка помощи.
              </Block>
            </div>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="cabinet"
              head="Кабинет стриминга"
              pic={
                <div className={base.page}>
                  <Img
                    file="duo-cabinet"
                    w={912}
                    h={516}
                    alt="Кабинет: значки сервисов слева, меню раздела «Стриминг», форма настроек плеера и его превью"
                  />
                </div>
              }
            >
              В&nbsp;личном кабинете управляют сервисами и&nbsp;смотрят статистику. Слева значки
              сервисов и&nbsp;меню раздела, в&nbsp;середине форма, рядом превью плеера.
            </Block>
            <div className={base.line}>
              <Block
                name="toggles"
                head="Поведение плеера"
                pic={
                  <div className={base.page}>
                    <Img
                      file="toggles"
                      w={322}
                      h={182}
                      alt="Переключатели: автоплей, без звука, отключение скина, поделиться видео, управление скоростью, пауза при клике"
                    />
                  </div>
                }
              >
                Автоплей, запуск без звука, кнопка «поделиться», скорость и&nbsp;пауза по&nbsp;клику
                на&nbsp;экран. Каждая настройка отдельным переключателем, рядом значок подсказки.
              </Block>
              <Block
                name="player"
                head="Плеер со своим логотипом"
                pic={
                  <div className={base.page}>
                    <Img
                      file="player"
                      w={312}
                      h={334}
                      alt="Превью плеера с кнопкой запуска, поле загрузки логотипа и выбор его расположения"
                    />
                  </div>
                }
              >
                Плееру дают название, загружают логотип в&nbsp;PNG до&nbsp;1&nbsp;МБ, выбирают его
                угол и&nbsp;цвет фона. Настройки можно поставить по&nbsp;умолчанию для видео или для
                live.
              </Block>
            </div>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <div className={base.line}>
              <Lead head="На всех устройствах">
                По&nbsp;описанию сервиса видео работает на&nbsp;iOS и&nbsp;Android, на&nbsp;ПК
                с&nbsp;Windows, Linux и&nbsp;macOS, на&nbsp;Set Top Box, игровых приставках
                и&nbsp;Smart TV. На&nbsp;сайт или в&nbsp;приложение трансляцию вставляют через API
                и&nbsp;SDK.
              </Lead>
              <Block
                name="colors"
                head="Тёмный старт, светлый кабинет"
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
                Стартовый экран почти чёрный, плитки на&nbsp;нём чуть светлее фона. Кабинет белый,
                а&nbsp;синий в&nbsp;нём отмечает включённое.
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
