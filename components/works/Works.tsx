"use client";

import { type MouseEvent, useEffect, useRef } from "react";
import { End } from "@/components/case/End";
import { Duo } from "@/components/case/memoridian/Duo";
import { openBrief } from "@/lib/brief";
import { caseHref, goPage, HOME_HREF, openCase } from "@/lib/caseRoute";
import { RISE_FROM, rise } from "@/lib/scroll/rise";
import styles from "./Works.module.css";
import { WORKS, type WorkItem } from "./works.data";

// Страница «Наши работы» (docs/13-works-page.md): список кейсов на оси, как старая страница кейса.
// Слева от оси номер, название и тип, справа карточка и описание; всё едет со страницей. Закреплены
// шапка и точка: пунктир впереди едет в координатах страницы, а сплошной участок стоит на экране от
// верха до точки, поэтому линия растёт сама, без записи на каждый кадр. Прокрутку ведёт общий Lenis.
// Блоки [data-rise] ниже первого экрана всплывают один раз: верх дошёл до 90% экрана.

// Кейс открывается поверх списка: группа летит из карточки на первый экран, как с плитки главной (CaseLayer).
const toCase = (slug: string) => (e: MouseEvent<HTMLAnchorElement>) =>
  openCase(e, {
    slug,
    card: e.currentTarget.closest("section")?.querySelector<HTMLElement>("[data-case]") ?? null,
    caption: null,
  });

function Card({ c, first }: { c: WorkItem; first: boolean }) {
  const inner = (
    <div className={styles.pv}>
      <i className={`${styles.field} no-invert`} style={{ background: c.color }} />
      {c.duo ? (
        <Duo slug={c.slug} className={styles.duo} lazy={!first} />
      ) : (
        // biome-ignore lint/performance/noImgElement: статический экспорт, файлы из public как есть
        <img
          className={styles.shot}
          src={c.image}
          width={1200}
          height={900}
          alt={c.title}
          loading={first ? "eager" : "lazy"}
          decoding="async"
        />
      )}
    </div>
  );
  // nofollow — роботам страницы кейсов не показываем (docs/12-case-page.md).
  return c.slug ? (
    <a
      className={`${styles.card} ${styles.link}`}
      href={caseHref(c.slug)}
      rel="nofollow"
      aria-label={`Кейс: ${c.title}`}
      data-case={c.slug}
      onClick={toCase(c.slug)}
      data-rise
    >
      {inner}
    </a>
  ) : (
    <figure className={styles.card} data-rise>
      {inner}
    </figure>
  );
}

export function Works() {
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const { isIntersecting, target } of entries) {
          if (!isIntersecting) continue;
          io.unobserve(target);
          const el = target as HTMLElement;
          el.style.opacity = "";
          el.style.transform = "";
          rise(el, Number(el.dataset.d) || 0);
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    for (const el of pageRef.current?.querySelectorAll<HTMLElement>("[data-rise]") ?? []) {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.9) continue;
      el.style.opacity = "0";
      el.style.transform = RISE_FROM;
      io.observe(el);
    }
    return () => io.disconnect();
  }, []);

  return (
    <div ref={pageRef} className={styles.page}>
      <a className={styles.logo} href={HOME_HREF} onClick={(e) => goPage(e, null)}>
        White Inks.
      </a>
      <button type="button" className={styles.cta} onClick={(e) => openBrief(e.currentTarget)}>
        Обсудить проект
      </button>
      {/* biome-ignore lint/a11y/useAnchorContent: крестик нарисован в CSS, подпись в aria-label */}
      <a
        className={styles.close}
        href={HOME_HREF}
        onClick={(e) => goPage(e, null)}
        aria-label="На главную"
      />
      <div className={styles.ink} />
      <div className={styles.dot} />

      <main className={styles.content}>
        <div className={styles.ghost} />

        <header className={styles.top}>
          <a className={styles.back} href={HOME_HREF} onClick={(e) => goPage(e, null)}>
            ← на главную
          </a>
          <h1 className={styles.title}>Наши работы</h1>
        </header>

        {WORKS.map((c, i) => (
          <section key={c.title} className={styles.item}>
            <div className={styles.l} data-rise>
              <p className={styles.n}>{String(i + 1).padStart(2, "0")}</p>
              <h2 className={styles.name}>
                {c.slug ? (
                  <a href={caseHref(c.slug)} rel="nofollow" onClick={toCase(c.slug)}>
                    {c.title}
                  </a>
                ) : (
                  c.title
                )}
              </h2>
              <p className={styles.kind}>{c.kind}</p>
            </div>
            <div className={styles.r} data-i={i + 1}>
              <Card c={c} first={i === 0} />
              <div className={styles.tx} data-rise data-d={90}>
                <p className={styles.text}>{c.text}</p>
                {c.slug && (
                  <a
                    className={styles.more}
                    href={caseHref(c.slug)}
                    rel="nofollow"
                    onClick={toCase(c.slug)}
                  >
                    Смотреть кейс <span>→</span>
                  </a>
                )}
              </div>
            </div>
          </section>
        ))}

        <div className={styles.finish}>
          <End />
        </div>
      </main>
    </div>
  );
}
