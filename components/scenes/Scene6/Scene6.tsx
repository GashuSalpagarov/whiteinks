"use client";

import Link from "next/link";
import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { BRIEF_CONFIG, submitBrief } from "@/lib/brief";
import { caretAt, formatPhone, PHONE_MASK, PHONE_PREFIX, phoneEdit } from "@/lib/phone";
import { pathHandoff } from "@/lib/scroll/handoff";
import { onScroll, viewportH } from "@/lib/scroll/onScroll";
import styles from "./Scene6.module.css";

const NEEDS = ["Сайт", "Магазин", "Приложение", "ИИ и автоматизация", "Другое"];

type Errors = { phone?: string; consent?: string; form?: string };

// Точка пути идёт по сцене всё время, пока её прокручивают, — без остановок; позади неё —
// чернила, впереди — пунктир. Конверт собирается из неё: дошла до его верхнего края — из неё
// расходятся две линии и обегают контур, проступают поле и бумага, клапан ложится и открывается,
// выезжает письмо, поля — по одному.
// Стоянка (с мышью, если сцена влезает в экран): сцена — экран, ещё RUN экрана она стоит
// (sticky). Без стоянки (сенсорный или низкий экран) сцена едет как обычно.
const RUN = 1.1;
// Стык со Сценой 5: её точка сливается с этой у нижнего края экрана и сразу идёт дальше.
// Со стоянкой — доходит до верхнего края конверта, когда сцена въехала на MEET экрана, и к концу
// стоянки проходит конверт до места над низом сцены (END от низа экрана); сборка — по её ходу
// сквозь конверт. Без стоянки — поднимается со скоростью RISE (доля прокрутки) до высоты передачи
// футеру и стоит на ней, сцена уезжает мимо; сборка — от верхнего края за SPAN экрана её хода.
const MEET = 0.7;
const RISE = 0.6;
const END = 40;
const SPAN = 0.28;
// Шаги сборки — доли её прогресса (0..1; с 1 всё как в покое).
type Span = readonly [number, number];
const T = {
  edge: [0, 0.35], // контур из точки
  edgeOut: [0.5, 0.56], // уступает рамкам бумаги
  tint: [0.28, 0.48],
  fill: [0.36, 0.5], // спинка и карман
  flapIn: [0.44, 0.56], // клапан ложится…
  flapAway: [0.64, 0.71], // …уходит…
  flapOpen: [0.69, 0.79], // …и открывается вверх
  letter: [0.72, 0.9], // письмо выезжает из кармана
  field: [0.8, 0.92], // поля — по одному, через 0,04
  act: [0.9, 1], // согласие и кнопка
} satisfies Record<string, Span>;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const seg = (p: number, [a, b]: Span) => ease(clamp01((p - a) / (b - a)));

// Точка Сцены 5 (12px) — её чернила продолжает линия этой сцены, пока точка падает сюда.
const scene5Dot = () =>
  [
    ...document.querySelectorAll<HTMLElement>('[data-scene="scene5"] span[aria-hidden="true"]'),
  ].find((el) => el.offsetWidth === 12 && el.offsetHeight === 12) ?? null;

// Высота точки футера на экране, когда он встал (как g.dy в Footer.tsx): на ней точка без
// стоянки переходит в футер и остаётся на месте.
const footerHome = (section: HTMLElement) => {
  const stage = section.nextElementSibling?.firstElementChild as HTMLElement | null | undefined;
  const dot = stage
    ? [...stage.querySelectorAll<HTMLElement>("span")].find(
        (el) => el.offsetWidth === 12 && el.offsetHeight === 12,
      )
    : null;
  return stage && dot
    ? window.innerHeight - stage.offsetHeight + dot.offsetTop + dot.offsetHeight / 2
    : 0.65 * window.innerHeight;
};

// Сцена 6 — заявка конвертом. Точка идёт по линии с прокруткой, конверт собирается из неё:
// контур, поле и бумага, клапан, письмо с полями (телефон, имя, что нужно), на кармане —
// согласие и «Отправить заявку». Отправили — письмо уходит в конверт, клапан закрывается, на
// конверте — «от: …»; ушло на сервер (sent) — ложится марка. Открыли письмо в почте (mail) —
// марки нет: отправит сам посетитель. Точку отправка не трогает — она там, куда её довела
// прокрутка, и в футер переходит тоже по прокрутке (lib/scroll/handoff.ts).
export function Scene6() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const railInkRef = useRef<HTMLSpanElement>(null);
  const dropRef = useRef<HTMLSpanElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const leadRef = useRef<HTMLDivElement>(null);
  const letterRef = useRef<HTMLDivElement>(null);
  const tintRef = useRef<HTMLSpanElement>(null);
  const envRef = useRef<HTMLFormElement>(null);
  const outlineRef = useRef<SVGSVGElement>(null);
  const edgeRef = useRef<SVGPathElement>(null);
  const edgeUseRef = useRef<SVGUseElement>(null);
  const flapOpenRef = useRef<SVGSVGElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const phoneFieldRef = useRef<HTMLDivElement>(null);
  const nameFieldRef = useRef<HTMLDivElement>(null);
  const needsRef = useRef<HTMLDivElement>(null);
  const pocketRef = useRef<HTMLDivElement>(null);
  const cutRef = useRef<SVGSVGElement>(null);
  const actRef = useRef<HTMLDivElement>(null);
  const flapClosedRef = useRef<SVGSVGElement>(null);
  const handRef = useRef<HTMLSpanElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);
  const shownAt = useRef(0); // когда показали форму — для отсечки ботов
  const engagedRef = useRef(false);
  const caretRef = useRef<number | null>(null); // цифр левее каретки после правки номера
  const updateRef = useRef<() => void>(() => {});
  const ids = useId();

  const [phone, setPhone] = useState(""); // 10 цифр после +7
  const [focused, setFocused] = useState(false); // поле телефона в фокусе — маска с «+7 (»
  const [inside, setInside] = useState(false); // фокус где-то в форме
  const [name, setName] = useState("");
  const [need, setNeed] = useState("");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "mail">("idle");
  const closed = status === "sent" || status === "mail";
  const shown = phone ? formatPhone(phone) : focused ? "+7 (" : "";
  const phoneText = formatPhone(phone);
  // Человек уже в форме — конверт раскрыт целиком, что бы ни делала прокрутка.
  const engaged = inside || Boolean(phone || name || need || consent) || status !== "idle";
  engagedRef.current = engaged;

  useEffect(() => {
    shownAt.current = Date.now();
  }, []);

  useEffect(() => {
    if (engaged) updateRef.current();
  }, [engaged]);

  // Точка и сборка по прокрутке. Замеры — на смену экрана и размеров; на кадре — только высота
  // точки, прогресс и запись изменившихся стилей на самих элементах.
  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const railInk = railInkRef.current;
    const drop = dropRef.current;
    const head = headRef.current;
    const lead = leadRef.current;
    const letter = letterRef.current;
    const tint = tintRef.current;
    const env = envRef.current;
    const svg = outlineRef.current;
    const edge = edgeRef.current;
    const edgeUse = edgeUseRef.current;
    const flapOpen = flapOpenRef.current;
    const back = backRef.current;
    const sheet = sheetRef.current;
    const pocket = pocketRef.current;
    const cut = cutRef.current;
    const act = actRef.current;
    const flapClosed = flapClosedRef.current;
    const hand = handRef.current;
    const fields = [phoneFieldRef.current, nameFieldRef.current, needsRef.current].filter(
      (el): el is HTMLDivElement => el !== null,
    );
    if (!section || !stage || !railInk || !drop || !head || !lead || !letter || !tint) return;
    if (!env || !svg || !edge || !edgeUse || !flapOpen || !back || !sheet || !pocket) return;
    if (!cut || !act || !flapClosed || !hand || fields.length < 3) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Стоянка — только с мышью: на сенсорном экране клавиатура закрыла бы кнопку под стоящей
    // сценой.
    const fine = matchMedia("(pointer: fine)").matches;

    type El = HTMLElement | SVGElement;
    const written = new Map<El, Map<string, string>>();
    const put = (el: El, prop: string, value: string) => {
      let props = written.get(el);
      if (!props) {
        props = new Map();
        written.set(el, props);
      }
      if (props.get(prop) === value) return;
      props.set(prop, value);
      el.style.setProperty(prop, value);
    };
    // Стили сборки снимаются целиком, когда конверт собран, — в покое их нет. Точку, линию и
    // точку Сцены 5 это не трогает.
    const keep = new Set<El>([railInk, drop, hand]);
    let clean = true;
    const clear = () => {
      if (clean) return;
      clean = true;
      for (const [el, props] of written) {
        if (keep.has(el)) continue;
        for (const prop of props.keys()) el.style.removeProperty(prop);
        written.delete(el);
      }
    };
    const fade = (el: El, k: number) => {
      put(el, "opacity", k.toFixed(3));
      put(el, "pointer-events", k < 0.6 ? "none" : "");
    };
    const rise = (el: El, k: number, dy: number) => {
      fade(el, k);
      put(el, "transform", `translateY(${((1 - k) * dy).toFixed(1)}px)`);
    };

    let key = "";
    let dirty = true;
    let pinned = false;
    let stageH = 0; // линия идёт по всей сцене
    let apex = 0; // вершина открытого клапана, в координатах сцены
    let rim = 0; // верхний край конверта — тут из точки выходит контур
    let bottom = 0; // низ конверта
    let end = 0; // где точка на экране после стоянки (и без неё) — там она уходит в футер
    let edgeL = 0; // длина половины контура
    let slide = 0; // письмо до выезда — в кармане
    let s5: HTMLElement | null = null;
    let s5Scene: Element | null = null;

    const layout = (h: number) => {
      // Конверт закрыт — раскладку не трогаем: подводка выросла, но сцена не сдвигается.
      if (!section.classList.contains(styles.closed)) {
        // Закрепляем, если сцена целиком влезает в экран (под шапкой 72px); без анимаций — нет.
        const contentH = head.offsetHeight + letter.offsetHeight;
        pinned = !reduced && fine && contentH + 96 <= h;
        section.toggleAttribute("data-pin", pinned);
        stage.style.paddingTop = pinned ? `${Math.max(72, Math.round((h - contentH) / 2))}px` : "";
        const W = env.offsetWidth;
        const H = env.offsetHeight;
        const F = Number.parseFloat(getComputedStyle(env).getPropertyValue("--flap"));
        apex = letter.offsetTop + env.offsetTop;
        rim = apex + F;
        bottom = apex + H;
        // Контур — по рамке спинки (её середина в 0,75px от края): половина — из точки на верхнем
        // крае вбок, вниз и по дну до середины, вторая — её зеркало.
        svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
        edge.setAttribute("d", `M${W / 2} ${F + 0.75}H0.75V${H - 0.75}H${W / 2}`);
        edgeUse.setAttribute("transform", `matrix(-1 0 0 1 ${W} 0)`);
        edgeL = W + H - F - 3;
        edge.style.strokeDasharray = `${edgeL}`;
        slide = Math.max(0, H - pocket.offsetHeight - sheet.offsetTop + 12);
      }
      stageH = stage.offsetHeight;
      end = pinned
        ? Math.min(stageH - 12, Math.max(bottom + 24, stageH - END))
        : footerHome(section);
      pathHandoff.y = end;
      // «Связаться» приводит к собранному конверту (u — прокрутка от входа сцены); без стоянки —
      // ещё и не выше вершины клапана под шапкой.
      let u: number;
      if (pinned) {
        u = MEET * h + ((bottom + 8 - rim) / (end - rim)) * ((1 + RUN - MEET) * h) + 0.04 * h;
        u = Math.min(u, (1 + RUN) * h);
      } else {
        const at = rim + SPAN * h;
        u = (at - 6) / RISE;
        if (h + 6 - (1 - RISE) * u < end) u = at + h - end;
        u = Math.max(u + 0.03 * h, h + apex - 88);
      }
      section.style.scrollMarginTop = `${Math.round(Math.min(0, h - u))}px`;
      s5 = scene5Dot();
      s5Scene = s5?.closest("section") ?? null;
    };

    // Точка на экране по верху сцены (top). Со стоянкой: от нижнего края — к верхнему краю
    // конверта (MEET экрана), дальше сквозь конверт к end к концу стоянки, потом стоит на end.
    // Без стоянки: поднимается со скоростью RISE до end и стоит на нём.
    const dotOnScreen = (h: number, top: number) => {
      const u = h - top;
      if (u <= 0) return top + 6;
      if (!pinned) return Math.max(h + 6 - (1 - RISE) * u, end);
      const meet = MEET * h;
      if (u < meet) return top + 6 + ((rim - 6) * u) / meet;
      return Math.max(top, 0) + rim + (end - rim) * clamp01((u - meet) / ((1 + RUN) * h - meet));
    };

    // Сборка по прогрессу p; u — сколько экранов сцена въехала (для подводки).
    const apply = (p: number, u: number) => {
      if (p >= 1) return clear();
      clean = false;
      rise(lead, ease(clamp01((u - 0.4) / 0.3)), 16);
      put(edge, "stroke-dashoffset", (edgeL * (1 - seg(p, T.edge))).toFixed(1));
      put(svg, "opacity", p > 0 ? (1 - seg(p, T.edgeOut)).toFixed(3) : "0");
      fade(tint, seg(p, T.tint));
      const fill = seg(p, T.fill);
      fade(back, fill);
      fade(pocket, fill);
      const lid = seg(p, T.flapIn) * (1 - seg(p, T.flapAway));
      put(flapClosed, "scale", `1 ${lid.toFixed(3)}`);
      const open = seg(p, T.flapOpen);
      put(flapOpen, "scale", `1 ${open.toFixed(3)}`);
      fade(cut, open);
      const out = seg(p, T.letter);
      put(sheet, "opacity", p >= T.letter[0] ? "1" : "0");
      put(sheet, "pointer-events", out < 0.6 ? "none" : "");
      put(sheet, "transform", `translateY(${((1 - out) * slide).toFixed(1)}px)`);
      for (const [i, f] of fields.entries()) {
        rise(f, seg(p, [T.field[0] + 0.04 * i, T.field[1] + 0.04 * i]), 14);
      }
      rise(act, seg(p, T.act), 10);
    };

    const update = () => {
      const h = viewportH();
      const k = `${window.innerWidth}x${h}`;
      if (k !== key || dirty) {
        key = k;
        dirty = false;
        layout(h);
      }
      const rect = section.getBoundingClientRect();
      if (rect.top > 2 * h || rect.bottom < -h) return;
      const stageTop = stage.getBoundingClientRect().top;
      const y = dotOnScreen(h, rect.top);
      const at = reduced ? stageH : y - stageTop; // точка в координатах сцены

      // Сборка — по ходу точки от верхнего края конверта: со стоянкой — сквозь весь конверт,
      // без неё — за SPAN экрана. Человек в форме или отправил — всё как в покое.
      const final = reduced || engagedRef.current || section.classList.contains(styles.closed);
      const p = final ? 1 : (at - rim) / (pinned ? bottom + 8 - rim : SPAN * h);
      apply(p, (h - rect.top) / h);
      // Над конвертом точка — поверх подводки. В конверте — под бумагой, как и линия: поля и
      // кнопку не пересекает. Только на стоянке, пока он собирается из неё, она над ним (поля и
      // кнопка на её пути ещё не проявлены).
      const drawing = at < apex - 6 || (pinned && !final && at < bottom + 8);
      if (drawing !== section.hasAttribute("data-drawing"))
        section.toggleAttribute("data-drawing", drawing);

      // Чернила — от верха сцены до точки. Пока точка этой сцены под экраном, сверху падает
      // точка Сцены 5: чернила — до неё, а ниже края Сцены 5 её же показывает эта сцена.
      let ink = Math.max(0, Math.min(stageH, at));
      let hold = "";
      if (!reduced && y > h) {
        ink = 0;
        if (s5?.style.opacity === "1") {
          const y5 = s5.getBoundingClientRect().top + 6;
          ink = Math.max(0, Math.min(stageH, y5 - stageTop));
          const edge5 = s5Scene?.getBoundingClientRect().bottom ?? h;
          if (y5 + 6 > edge5) hold = `translateY(${(y5 - 6 - stageTop).toFixed(1)}px)`;
        }
      }
      put(railInk, "clip-path", `inset(0 0 ${Math.round(stageH - ink)}px 0)`);
      const show = !reduced && at >= 0 && at < stageH;
      put(drop, "opacity", show ? "1" : "0");
      if (show) put(drop, "transform", `translateY(${(at - 6).toFixed(1)}px)`);
      put(hand, "opacity", hold ? "1" : "0");
      if (hold) put(hand, "transform", hold);
    };
    updateRef.current = update;

    // Раскладка внутри сменилась без смены экрана (шрифты, подводка после отправки) — перемеряем.
    const ro = new ResizeObserver(() => {
      dirty = true;
      update();
    });
    ro.observe(head);
    ro.observe(letter);
    const off = onScroll(section, update);
    return () => {
      off();
      ro.disconnect();
      updateRef.current = () => {};
    };
  }, []);

  // Закрыли конверт — один замер: высота письма-обёртки замирает (ничего под ней не прыгнет), а
  // конверт садится до обычной пропорции (переход высоты — в CSS). Вернулись к форме — снимаем.
  useLayoutEffect(() => {
    const letter = letterRef.current;
    const env = envRef.current;
    if (!letter || !env) return;
    if (!closed) {
      letter.style.minHeight = "";
      env.style.height = "";
      return;
    }
    letter.style.minHeight = `${letter.offsetHeight}px`;
    const flap = Number.parseFloat(getComputedStyle(env).getPropertyValue("--flap"));
    const from = env.offsetHeight;
    const to = Math.min(
      from,
      Math.round(flap + env.offsetWidth * (env.offsetWidth < 500 ? 0.62 : 0.46)),
    );
    env.style.height = `${from}px`;
    void env.offsetHeight;
    env.style.height = `${to}px`;
  }, [closed]);

  const clearError = (key: keyof Errors) =>
    setErrors((e) => (e[key] || e.form ? { ...e, [key]: undefined, form: undefined } : e));

  // Номер — из того, что в поле, с учётом каретки; каретка потом — за той же цифрой.
  const onPhone = (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const type = (e.nativeEvent as InputEvent).inputType ?? "";
    const caret = input.selectionStart ?? input.value.length;
    const { digits, left } = phoneEdit(input.value, caret, phone, type);
    caretRef.current = left;
    setPhone(digits);
    clearError("phone");
  };

  // Каретка — никогда внутри «+7 (»: ни щелчком, ни выделением, ни Home и стрелками.
  const keepPrefix = (input: HTMLInputElement) => {
    const n = PHONE_PREFIX.length;
    if (!input.value.startsWith(PHONE_PREFIX)) return;
    const a = input.selectionStart ?? n;
    const b = input.selectionEnd ?? n;
    if (a < n || b < n) input.setSelectionRange(Math.max(n, a), Math.max(n, b));
  };

  useLayoutEffect(() => {
    const input = phoneRef.current;
    if (!input || !focused || document.activeElement !== input) return;
    const left = caretRef.current;
    caretRef.current = null;
    if (left === null && phone) return; // щёлкнули в номер — каретка там, где щёлкнули
    const at = caretAt(input.value, left ?? 0);
    input.setSelectionRange(at, at);
  }, [phone, focused]);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trap = String(new FormData(e.currentTarget).get("website") ?? "");
    const next: Errors = {};
    if (phone.length < 10)
      next.phone = phone
        ? "Номер неполный — нужно 10 цифр после +7"
        : "Оставьте телефон — по нему и перезвоним";
    if (!consent) next.consent = "Отметьте согласие — без него не сможем перезвонить";
    setErrors(next);
    if (next.phone) return phoneRef.current?.focus();
    if (next.consent) return consentRef.current?.focus();

    setStatus("sending");
    try {
      const result = await submitBrief(
        {
          phone: `+7${phone}`,
          name: name.trim() || undefined,
          need: need || undefined,
          time: new Date().toISOString(),
        },
        { trap, startedAt: shownAt.current },
      );
      setStatus(result);
    } catch {
      setStatus("idle");
      setErrors({
        form: `Не получилось отправить. Позвоните ${BRIEF_CONFIG.phone} или напишите в Telegram ${BRIEF_CONFIG.telegram}`,
      });
    }
  };

  // «Отправить ещё одну» — чистая форма; «вернуться к форме» после письма в почте — те же данные.
  const reopen = (clear: boolean) => {
    if (clear) {
      setPhone("");
      setName("");
      setNeed("");
      setConsent(false);
    }
    setErrors({});
    setStatus("idle");
  };

  const cls = [styles.scene6, closed && styles.closed, status === "sent" && styles.sent];

  return (
    <section
      ref={sectionRef}
      className={cls.filter(Boolean).join(" ")}
      data-scene="scene6"
      aria-label="Заявка"
    >
      <div ref={stageRef} className={styles.stage}>
        {/* Линия пути через всю сцену: пунктир, поверх — чернила до точки. Точка — первая 12px
            в сцене: по размеру её находит Сцена 5. */}
        <span className={styles.rail} aria-hidden="true">
          <span ref={railInkRef} />
        </span>
        <span ref={dropRef} className={styles.drop} aria-hidden="true" />

        {/* Название сцены — общей подписью в шапке (components/ui/SceneLabel); здесь — тихая
            строка у конверта: обещание, после отправки — что с заявкой. */}
        <div ref={headRef} className={styles.head}>
          <div ref={leadRef} className={styles.lead}>
            {status === "sent" ? (
              <div role="status">
                <p>
                  <strong>Заявка отправлена.</strong> Перезвоним на{" "}
                  <span className={styles.nw}>{phoneText}</span> {BRIEF_CONFIG.replyIn}.
                </p>
                <button type="button" className={styles.link} onClick={() => reopen(true)}>
                  отправить ещё одну
                </button>
              </div>
            ) : status === "mail" ? (
              <div role="status">
                <p>
                  <strong>Осталось отправить.</strong> Письмо открыто в вашей почте — отправьте его.
                  Или позвоните{" "}
                  <a href={`tel:+${BRIEF_CONFIG.phone.replace(/\D/g, "")}`} className={styles.nw}>
                    {BRIEF_CONFIG.phone}
                  </a>
                  , Telegram{" "}
                  <a
                    href={`https://t.me/${BRIEF_CONFIG.telegram.replace(/^@/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {BRIEF_CONFIG.telegram}
                  </a>
                  .
                </p>
                <button type="button" className={styles.link} onClick={() => reopen(false)}>
                  вернуться к форме
                </button>
              </div>
            ) : (
              <p>Перезвоним {BRIEF_CONFIG.replyIn} и обсудим задачу.</p>
            )}
          </div>
        </div>

        <div ref={letterRef} className={styles.letter}>
          <div className={styles.plate}>
            {/* Сиреневый слой — отдельно: на втором круге он в своём цвете, а конверт — в общем. */}
            <span ref={tintRef} className={`${styles.tint} no-invert`} aria-hidden="true" />
            <form
              ref={envRef}
              className={styles.env}
              noValidate
              onSubmit={submit}
              inert={closed}
              onFocus={() => setInside(true)}
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setInside(false);
              }}
            >
              <svg
                ref={flapOpenRef}
                className={styles.flapOpen}
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <polygon points="0,100 50,0 100,100" vectorEffect="non-scaling-stroke" />
              </svg>
              <div ref={backRef} className={styles.back} aria-hidden="true" />

              <div ref={sheetRef} className={styles.sheet}>
                <div className={styles.row}>
                  <div ref={phoneFieldRef} className={styles.field}>
                    <label className={styles.label} htmlFor={`${ids}-phone`}>
                      телефон
                    </label>
                    <span className={styles.mask}>
                      <input
                        ref={phoneRef}
                        id={`${ids}-phone`}
                        className={styles.input}
                        name="phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        value={shown}
                        onChange={onPhone}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        onSelect={(e) => keepPrefix(e.currentTarget)}
                        onKeyDown={(e) => {
                          const input = e.currentTarget;
                          const n = PHONE_PREFIX.length;
                          if (!input.value.startsWith(PHONE_PREFIX)) return;
                          const a = input.selectionStart ?? n;
                          const home = e.key === "Home" || e.key === "ArrowUp";
                          if (home || (e.key === "ArrowLeft" && a <= n && !e.shiftKey)) {
                            e.preventDefault();
                            input.setSelectionRange(n, e.shiftKey ? (input.selectionEnd ?? n) : n);
                          }
                        }}
                        required
                        aria-invalid={Boolean(errors.phone)}
                        aria-describedby={errors.phone ? `${ids}-phone-error` : undefined}
                      />
                      {/* Остаток маски — бледным за набранным. */}
                      <span className={styles.ghostMask} aria-hidden="true">
                        <i>{shown}</i>
                        {PHONE_MASK.slice(shown.length)}
                      </span>
                    </span>
                    {errors.phone && (
                      <p id={`${ids}-phone-error`} className={styles.error}>
                        {errors.phone}
                      </p>
                    )}
                  </div>
                  <div ref={nameFieldRef} className={styles.field}>
                    <label className={styles.label} htmlFor={`${ids}-name`}>
                      имя — по желанию
                    </label>
                    <input
                      id={`${ids}-name`}
                      className={styles.input}
                      name="name"
                      autoComplete="given-name"
                      autoCapitalize="words"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>

                <div ref={needsRef} role="radiogroup" aria-labelledby={`${ids}-need`}>
                  <span id={`${ids}-need`} className={styles.label}>
                    что нужно — по желанию
                  </span>
                  <div className={styles.pills}>
                    {NEEDS.map((v) => (
                      <label key={v} className={styles.pill}>
                        {/* Повторный щелчок по выбранной — снять выбор: поле необязательное. */}
                        <input
                          type="radio"
                          name="need"
                          value={v}
                          checked={need === v}
                          onChange={() => setNeed(v)}
                          onClick={() => need === v && setNeed("")}
                        />
                        <span>{v}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Карман: верхний край галочкой; на нём — согласие и кнопка. */}
              <div ref={pocketRef} className={styles.pocket}>
                <svg
                  ref={cutRef}
                  className={styles.cut}
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <polyline points="0,0 50,100 100,0" vectorEffect="non-scaling-stroke" />
                </svg>
                <div ref={actRef} className={styles.act}>
                  <div>
                    <label className={styles.consent}>
                      <input
                        ref={consentRef}
                        type="checkbox"
                        className={styles.check}
                        checked={consent}
                        onChange={(e) => {
                          setConsent(e.target.checked);
                          clearError("consent");
                        }}
                        required
                        aria-invalid={Boolean(errors.consent)}
                        aria-describedby={errors.consent ? `${ids}-consent-error` : undefined}
                      />
                      <span>
                        согласен на{" "}
                        <Link href="/consent" target="_blank">
                          обработку персональных данных
                        </Link>{" "}
                        ·{" "}
                        <Link href="/privacy" target="_blank">
                          политика
                        </Link>
                      </span>
                    </label>
                    {errors.consent && (
                      <p id={`${ids}-consent-error`} className={styles.error}>
                        {errors.consent}
                      </p>
                    )}
                  </div>
                  <button type="submit" className={styles.send} disabled={status === "sending"}>
                    {status === "sending" ? "Отправляем…" : "Отправить заявку"}
                  </button>
                </div>
              </div>

              {/* Клапан: ложится при сборке и при отправке. */}
              <svg
                ref={flapClosedRef}
                className={styles.flapClosed}
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <polygon points="0,0 50,100 100,0" vectorEffect="non-scaling-stroke" />
              </svg>
              <span className={`${styles.stamp} no-invert`} aria-hidden="true" />
              <p className={styles.from} aria-hidden="true">
                <b>White Inks</b>
                <br />
                от: {name.trim() ? `${name.trim()}, ` : ""}
                <span className={styles.nw}>{phoneText}</span>
              </p>
              {/* Контур сборки: две линии из точки обегают конверт; в покое его нет. */}
              <svg ref={outlineRef} className={styles.outline} aria-hidden="true">
                <path
                  ref={edgeRef}
                  id="scene6-edge"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <use ref={edgeUseRef} href="#scene6-edge" />
              </svg>
              {/* Ловушка для ботов: людям не видна и недоступна с клавиатуры. */}
              <input
                className={styles.trap}
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />
            </form>
            {errors.form && (
              <p className={`${styles.error} ${styles.formError}`} role="alert">
                {errors.form}
              </p>
            )}
          </div>
        </div>
        {/* Точка Сцены 5 ниже её края — её место на стыке (после точки конверта: Сцена 5 ищет
            первую 12px точку этой сцены). */}
        <span ref={handRef} className={styles.handoff} aria-hidden="true" />
      </div>
    </section>
  );
}
