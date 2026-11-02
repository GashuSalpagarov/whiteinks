import type { ReactNode } from "react";
import type { CaseData } from "@/components/scenes/Scene3";
import caseStyles from "../Case.module.css";
import { type CaseActions, End } from "../CaseView";
import { Duo } from "../memoridian/Duo";
import base from "../memoridian/Showcase.module.css";
import styles from "./Gbz.module.css";

// Страница медиабанка Городской базы знаний (docs/12-case-page.md): альбомы, файлы, фильтр и загрузка в
// три шага. Снимки — макеты; страница первого экрана собрана из настоящих кусков, кадры с людьми не взяты.
// Карточки на главной нет, вход — из списка работ.

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function Img(p: { file: string; w: number; h: number; alt: string }) {
  return (
    // biome-ignore lint/performance/noImgElement: статический экспорт, файлы из public как есть
    <img
      src={`${BASE}/works/gbz/${p.file}.webp`}
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
  ["#020624", "#FFFFFF"],
  ["#121930", "#FFFFFF"],
  ["#242C40", "#FFFFFF"],
  ["#343A4C", "#FFFFFF"],
  ["#0092FB", "#141414"],
  ["#93C1E8", "#141414"],
];

export function Gbz(p: { c: CaseData; act: CaseActions; full: boolean }) {
  const { c, act, full } = p;
  return (
    <>
      <section className={`${base.shot} ${base.intro}`}>
        <h1 className={base.title} id="case-title" data-hi>
          Городская <br />
          база знаний
        </h1>
        <p className={`${base.text} ${base.lead}`} data-hi>
          Медиабанк Ситуационного центра города Москвы (Инцидент-центра): фото и&nbsp;видео города
          в&nbsp;альбомах, поиск по&nbsp;ним и&nbsp;загрузка новых материалов.
        </p>
        <Duo
          slug="gbz"
          className={base.duo}
          data-cover=""
          alts={[
            "Страница медиабанка: меню слева, альбомы сверху и плитки файлов под ними",
            "Настройка публикации: превью альбома и четыре загруженных снимка",
            "Фильтр: категория, подкатегория, дата добавления и кнопки «Найти» и «Сбросить»",
          ]}
        />
        <div className={base.facts} data-hi>
          <div>
            <p className={base.text}>Что входило в работу</p>
            <ul className={`${base.note} ${base.list}`}>
              <li>Раздел «Медиабанк»: альбомы и файлы</li>
              <li>Фильтр и поиск</li>
              <li>Загрузка материалов в три шага</li>
              <li>Превью к видео и настройка публикации</li>
            </ul>
          </div>
          <div>
            <p className={base.text}>Что есть в разделе</p>
            <ul className={`${base.note} ${base.list}`}>
              <li>Фото и видео с датой</li>
              <li>Скачивание и ссылка на файл</li>
              <li>Постраничный показ</li>
            </ul>
          </div>
        </div>
      </section>

      {full && (
        <>
          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="albums"
              head="Сначала альбомы"
              pic={
                <Img
                  file="albums"
                  w={1086}
                  h={186}
                  alt="Три карточки альбомов: обложка, название, дата, число файлов и две кнопки"
                />
              }
            >
              Лента альбомов стоит над файлами. У&nbsp;каждого обложка, название и&nbsp;дата,
              в&nbsp;углу число файлов, а&nbsp;справа две кнопки: скачивание и&nbsp;ссылка.
            </Block>
            <div className={base.line}>
              <Block
                name="tiles"
                head="Файлы плитками"
                pic={
                  <Img
                    file="tiles"
                    w={854}
                    h={228}
                    alt="Три плитки файлов: снимок, значок воспроизведения, название и дата"
                  />
                }
              >
                Снимок занимает большую часть плитки, поэтому файл узнают по&nbsp;картинке. Под ней
                название и&nbsp;дата, у&nbsp;видео по&nbsp;центру значок воспроизведения.
              </Block>
              <Block
                name="hover"
                head="Вес при наведении"
                pic={
                  <Img
                    file="hover"
                    w={360}
                    h={302}
                    alt="Плитка файла при наведении: синяя кнопка с весом 15,6 МБ и форматом .MOV"
                  />
                }
              >
                Кнопка скачивания раскрывается и&nbsp;показывает вес и&nbsp;формат файла, ещё
                до&nbsp;нажатия.
              </Block>
            </div>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <div className={base.line}>
              <Block
                name="menu"
                head="Раздел большой системы"
                pic={
                  <Img
                    file="menu"
                    w={290}
                    h={714}
                    alt="Меню системы: новости, заявки, мероприятия, календарь, база знаний, задачи, сценарии и другие разделы"
                  />
                }
              >
                База знаний стоит в&nbsp;общем меню рядом с&nbsp;заявками, мероприятиями, календарём
                и&nbsp;сценариями. Открытый раздел отмечен полосой слева и&nbsp;белым названием.
              </Block>
              <Block
                name="filter"
                head="Фильтр поверх страницы"
                pic={
                  <Img
                    file="filter"
                    w={546}
                    h={431}
                    alt="Панель фильтра: категория «Памятники», подкатегория, дата добавления, кнопки «Найти» и «Сбросить»"
                  />
                }
              >
                Панель раскрывается под строкой поиска: категория, подкатегория и&nbsp;дата
                добавления. Внизу две кнопки: найти и&nbsp;сбросить.
              </Block>
            </div>
          </section>

          <section className={`${base.shot} ${base.chapter}`}>
            <Block
              name="steps"
              head="Загрузка в&nbsp;три шага"
              pic={
                <Img
                  file="steps"
                  w={792}
                  h={362}
                  alt="Шкала из трёх шагов, заголовок «Добавление медиа-контента», вкладки «Изображения» и «Видео», поле для файлов"
                />
              }
            >
              Новый материал добавляют в&nbsp;боковой панели: общая информация, медиа-контент,
              настройки публикации. Шкала сверху показывает шаг, а&nbsp;файлы перетаскивают прямо
              в&nbsp;поле, где сразу написаны подходящие форматы.
            </Block>
            <div className={base.line}>
              <Block
                name="video"
                head="Своё превью у&nbsp;видео"
                pic={
                  <Img
                    file="video"
                    w={758}
                    h={250}
                    alt="Строка загрузки: файл видео слева и поле превью справа, в которое перетаскивают снимок"
                  />
                }
              >
                Рядом с&nbsp;каждым видео отдельное поле для его картинки. Снимок перетаскивают
                на&nbsp;место, а&nbsp;поле подсвечивается пунктиром.
              </Block>
              <Block
                name="publish"
                head="Превью альбома"
                pic={
                  <Img
                    file="publish"
                    w={798}
                    h={630}
                    alt="Панель «Превью альбома»: переключатели, поле для файлов и четыре снимка города"
                  />
                }
              >
                На&nbsp;последнем шаге альбому собирают превью. Есть переключатели для медиа
                прошедших мероприятий и&nbsp;видеофайла, а&nbsp;подпись снизу напоминает, сколько
                снимков загрузить.
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
              Основа почти чёрная с&nbsp;синевой, панели светлее на&nbsp;шаг, поэтому снимки города
              выходят вперёд. Ярко-синий для действий. Цвета подобраны по&nbsp;снимкам.
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
