"use client";

import { useEffect, useRef } from "react";
import { BriefModal } from "@/components/ui/BriefModal";
import { Envelope, type EnvelopeParts } from "@/components/ui/Envelope";
import { BRIEF_CONFIG, type BriefStatus, clearBrief, setBrief, useBrief } from "@/lib/brief";
import { formatPhone } from "@/lib/phone";
import { phoneLayout } from "@/lib/phoneLayout";
import { pathHandoff, phoneHold } from "@/lib/scroll/handoff";
import { onScroll, viewportH } from "@/lib/scroll/onScroll";
import styles from "./Scene6.module.css";

// Точка пути идёт по сцене всё время, пока её прокручивают, — без остановок; позади неё —
// чернила, впереди — пунктир. Конверт собирается из неё: дошла до его верхнего края — из неё
// расходятся две линии и обегают контур, проступают поле и бумага, клапан ложится и открывается,
// выезжает письмо, поля — по одному.
// Стоянка (с мышью, если сцена влезает в экран): сцена — экран, ещё RUN экрана она стоит
// (sticky). Без стоянки (сенсорный или низкий экран) сцена едет как обычно.
// Телефонная раскладка (lib/phoneLayout.ts) — без стоянки и со своей сборкой: по ходу точки из неё
// рисуется лежачий конверт — контур, подложка, бумага (по высоте ничего не ходит). Бумага легла
// (PLAY) — конверт доигрывает сам переходами CSS (data-play): пологий клапан ложится и открывается,
// карман опускается на место, письмо выходит на всю высоту формы, поля — по одному, кнопка. Дальше
// он к прокрутке не привязан: назад не складывается, поле под клавиатурой не двигается, рывков от
// прокрутки пальцем нет. Складывается заново, только когда сцена целиком ушла под экран (этого не
// видно), — на следующем проходе (и на новом круге пути) играет снова. Точка и линия — как всегда.
const RUN = 1.1;
// Стык со Сценой 5: её точка сливается с этой у нижнего края экрана и сразу идёт дальше; если
// каталог выше экрана (телефон) — на высоте phoneHold.y (lib/scroll/handoff.ts), а не у края.
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
// Телефон: доли того же хода (без стоянки) — до сигнала PLAY, дальше конверт доигрывает сам.
const PH = {
  edge: [0, 0.35], // контур лежачего конверта из точки
  edgeOut: [0.37, 0.45],
  tint: [0.12, 0.35],
  fill: [0.25, 0.42], // спинка и карман
} satisfies Record<string, Span>;
const PLAY = 0.45;

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

// Сцена 6 — заявка конвертом. Точка идёт по линии с прокруткой, конверт (components/ui/Envelope)
// собирается из неё: контур, поле и бумага, клапан, письмо с полями (телефон, имя, что нужно), на
// кармане — согласие и «Отправить заявку». Отправили — письмо уходит в конверт, клапан
// закрывается, на конверте — «от: …»; ушло на сервер (sent) — ложится марка. Открыли письмо в почте
// (mail) — марки нет: отправит сам посетитель. Точку отправка не трогает — она там, куда её довела
// прокрутка, и в футер переходит тоже по прокрутке (lib/scroll/handoff.ts).
export function Scene6() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const railInkRef = useRef<HTMLSpanElement>(null);
  const dropRef = useRef<HTMLSpanElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const leadRef = useRef<HTMLDivElement>(null);
  const partsRef = useRef<EnvelopeParts>(null); // части конверта — для сборки
  const handRef = useRef<HTMLSpanElement>(null);
  const engagedRef = useRef(false);
  const closedRef = useRef(false);
  const updateRef = useRef<() => void>(() => {});

  // Статус и номер — общие с конвертом и окном заявки (lib/brief.ts).
  const { phone, status } = useBrief();
  const setStatus = (v: BriefStatus) => setBrief({ status: v });
  const closed = status === "sent" || status === "mail";
  const phoneText = formatPhone(phone);
  // Заявка уходит или ушла — конверт раскрыт целиком, что бы ни делала прокрутка. Введённое его
  // не держит: конверт складывается и раскладывается, значения остаются в полях.
  const engaged = status !== "idle";
  engagedRef.current = engaged;
  closedRef.current = closed;

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
    const parts = partsRef.current;
    const hand = handRef.current;
    if (!section || !stage || !railInk || !drop || !head || !lead || !parts || !hand) return;
    const { root: letter, tint, env, outline: svg, edge, edgeUse, flapOpen, back } = parts;
    const { sheet, pocket, cut, act, flapClosed, fields } = parts;
    if (!letter || !tint || !env || !svg || !edge || !edgeUse || !flapOpen || !back) return;
    if (!sheet || !pocket || !cut || !act || !flapClosed || fields.length < 3) return;
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
    let railH = 0; // высота линии без округления — от неё доля чернил (scaleY)
    let apex = 0; // вершина открытого клапана, в координатах сцены
    let rim = 0; // верхний край конверта — тут из точки выходит контур
    let bottom = 0; // низ конверта
    let end = 0; // где точка на экране после стоянки (и без неё) — там она уходит в футер
    let edgeL = 0; // длина половины контура
    let slide = 0; // письмо до выезда — в кармане
    let low = 0; // телефон: на сколько карман лежачего конверта выше своего места
    let plateH = 0; // высота подложки — от неё её доля у лежачего конверта
    let played = false; // телефон: конверт доиграл (или играет) и к прокрутке не привязан
    // Строка «Другое» открыта — письмо выдвинуто на lift (одна строка) и ещё на line за каждую
    // следующую, если они идут вверх (absorb), до max строк; как в CSS у .sheet[data-other].
    let lift = 0;
    let line = 0;
    let absorb = 0;
    let max = 1;
    let folded = true; // поля сложены (пока сцену не мерили — считаем, что да)
    let s5: HTMLElement | null = null;
    let s5Scene: Element | null = null;

    const layout = (h: number) => {
      // Конверт закрыт — раскладку не трогаем: подводка выросла, но сцена не сдвигается.
      if (!closedRef.current) {
        // Закрепляем, если сцена целиком влезает в экран (под шапкой 72px); без анимаций и в
        // телефонной раскладке — нет.
        const contentH = head.offsetHeight + letter.offsetHeight;
        pinned = !reduced && !phoneLayout() && fine && contentH + 96 <= h;
        section.toggleAttribute("data-pin", pinned);
        stage.style.paddingTop = pinned ? `${Math.max(72, Math.round((h - contentH) / 2))}px` : "";
        const W = env.offsetWidth;
        const H = env.offsetHeight;
        const F = Number.parseFloat(getComputedStyle(env).getPropertyValue("--flap"));
        apex = letter.offsetTop + env.offsetTop;
        rim = apex + F;
        bottom = apex + H;
        // Телефон: лежачий конверт — ширина × 0,7 (не ниже кармана с запасом); его карман выше
        // своего места на low. На планшете он и так лежачий — low = 0.
        const phone = phoneLayout();
        const body = Math.min(H - F, Math.max(pocket.offsetHeight + 30, Math.round(0.7 * W)));
        low = phone ? H - F - body : 0;
        const B = H - low;
        // Контур — по рамке спинки (её середина в 0,75px от края): половина — из точки на верхнем
        // крае вбок, вниз и по дну до середины, вторая — её зеркало. На телефоне — до дна лежачего.
        svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
        edge.setAttribute("d", `M${W / 2} ${F + 0.75}H0.75V${B - 0.75}H${W / 2}`);
        edgeUse.setAttribute("transform", `matrix(-1 0 0 1 ${W} 0)`);
        edgeL = W + B - F - 3;
        // Глубина клапана, когда конверт доигрывает (доля высоты закрытого из CSS): 0,45 лежачего.
        if (phone) env.style.setProperty("--lid", ((0.45 * body) / (0.6 * (H - F))).toFixed(3));
        plateH = tint.offsetHeight;
        edge.style.strokeDasharray = `${edgeL}`;
        slide = Math.max(0, H - pocket.offsetHeight - sheet.offsetTop + 12);
        const cs = getComputedStyle(sheet);
        const num = (name: string) => Number.parseFloat(cs.getPropertyValue(name)) || 0;
        lift = num("--lift");
        line = num("--line");
        absorb = num("--absorb");
        max = num("--max") || 1;
      }
      stageH = stage.offsetHeight;
      railH = railInk.parentElement?.getBoundingClientRect().height ?? stageH;
      end = pinned
        ? Math.min(stageH - 12, Math.max(bottom + 24, stageH - END))
        : footerHome(section);
      pathHandoff.y = end;
      // Без стоянки — высота, на которой подъём точки проходит верхний край конверта: на ней её
      // ведут Сцены 4–5, когда каталог выше экрана (lib/scroll/handoff.ts), и здесь она подхватывает
      // точку, а со своим подъёмом сливается ровно у края конверта — сборка идёт как прежде.
      phoneHold.y = pinned ? Number.NaN : Math.max(h + 6 - ((1 - RISE) * (rim - 6)) / RISE, end);
      // «Связаться» приводит к собранному конверту (u — прокрутка от входа сцены). Без стоянки —
      // ещё и так, чтобы подпись над ним стояла под шапкой (верх — на 88px): что будет после
      // заявки, видно сразу. Где конверт собирается позже (низкий экран, телефон боком), подпись
      // уходит вверх: собранный конверт и кнопка важнее.
      let u: number;
      if (pinned) {
        u = MEET * h + ((bottom + 8 - rim) / (end - rim)) * ((1 + RUN - MEET) * h) + 0.04 * h;
        u = Math.min(u, (1 + RUN) * h);
      } else {
        const at = rim + SPAN * h;
        u = (at - 6) / RISE;
        if (h + 6 - (1 - RISE) * u < end) u = at + h - end;
        u = Math.max(u + 4, h + head.offsetTop - 88); // собран (запас 4px), подпись под шапкой
        // Конверт выше экрана (низкий телефон) — ниже, чтобы была видна кнопка, но письмо не уходит
        // под шапку дальше своего поля.
        u = Math.max(u, Math.min(bottom + 12, h + apex + sheet.offsetTop - 60));
      }
      section.style.scrollMarginTop = `${Math.round(Math.min(0, h - u))}px`;
      s5 = scene5Dot();
      s5Scene = s5?.closest("section") ?? null;
    };

    // Точка на экране по верху сцены (top). Со стоянкой: от нижнего края — к верхнему краю
    // конверта (MEET экрана), дальше сквозь конверт к end к концу стоянки, потом стоит на end.
    // Без стоянки: поднимается со скоростью RISE до end и стоит на нём; если Сцена 5 держит точку
    // на высоте (каталог выше экрана) — не ниже этой высоты: на ней и подхватывает.
    const dotOnScreen = (h: number, top: number) => {
      const u = h - top;
      if (!pinned) {
        const y = u <= 0 ? top + 6 : Math.max(h + 6 - (1 - RISE) * u, end);
        return Number.isFinite(phoneHold.low) ? Math.min(y, phoneHold.y) : y;
      }
      if (u <= 0) return top + 6;
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
      // Выдвинутое письмо (translate из CSS) уходит в карман на столько же глубже.
      const n = Math.min(Number(sheet.style.getPropertyValue("--n")) || 1, max);
      const deep = slide + (sheet.hasAttribute("data-other") ? lift + absorb * (n - 1) * line : 0);
      put(sheet, "transform", `translateY(${((1 - out) * deep).toFixed(1)}px)`);
      for (const [i, f] of fields.entries()) {
        rise(f, seg(p, [T.field[0] + 0.04 * i, T.field[1] + 0.04 * i]), 14);
      }
      rise(act, seg(p, T.act), 10);
    };

    // Телефон до сигнала: лежачий конверт по ходу точки — контур, подложка, бумага. Форма поднята
    // на low, всё в ней, кроме кармана, — опущено обратно: обрезка формы (overflow: clip) идёт по
    // низу кармана и прячет письмо ниже него. Клапан, письмо, поля и кнопка ждут сигнала. Подводка
    // не проявляется: она над линией, и полупрозрачная пропустила бы линию по буквам.
    const fold = (p: number) => {
      clean = false;
      put(edge, "stroke-dashoffset", (edgeL * (1 - seg(p, PH.edge))).toFixed(1));
      put(svg, "opacity", p > 0 ? (1 - seg(p, PH.edgeOut)).toFixed(3) : "0");
      fade(tint, seg(p, PH.tint));
      put(tint, "transform", `scaleY(${plateH > 0 ? ((plateH - low) / plateH).toFixed(4) : 1})`);
      const fill = seg(p, PH.fill);
      fade(back, fill);
      fade(pocket, fill);
      put(env, "transform", `translateY(${-low}px)`);
      for (const el of [back, sheet, svg]) put(el, "transform", `translateY(${low}px)`);
      // Клапаны — свойством translate: оно снаружи их scale, и сдвиг не масштабируется.
      put(flapOpen, "translate", `0 ${low}px`);
      put(flapClosed, "translate", `0 ${low}px`);
      put(flapOpen, "scale", "1 0");
      fade(cut, 0);
      put(sheet, "opacity", "0");
      put(sheet, "pointer-events", "none");
      for (const f of fields) rise(f, 0, 14);
      rise(act, 0, 10);
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
      // без неё — за SPAN экрана. Отправил — всё как в покое.
      const phone = phoneLayout();
      const final = reduced || engagedRef.current || closedRef.current;
      const p = final ? 1 : (at - rim) / (pinned ? bottom + 8 - rim : SPAN * h);
      const u = (h - rect.top) / h;
      // Телефон: на PLAY конверт доигрывает сам — стили сборки сняты, к покою ведут переходы CSS
      // (data-play на конверте). Складывается заново, только когда сцена целиком под экраном.
      const play = phone && !final;
      if (play && rect.top >= h && played) {
        played = false;
        letter.removeAttribute("data-play");
      } else if (play && rect.top < h && p >= PLAY && !played) {
        played = true;
        letter.setAttribute("data-play", "");
      }
      if (play && !played) fold(p);
      else apply(phone ? 1 : p, u);
      // Поля сложились — фокус из них уходит: печать не попадёт в невидимое поле и не потянет к
      // нему страницу. Введённое остаётся.
      folded = play ? !played : p < T.field[0];
      if (folded && env.contains(document.activeElement))
        (document.activeElement as HTMLElement).blur();
      // Над конвертом точка — поверх подводки. В конверте — под бумагой, как и линия: поля и
      // кнопку не пересекает. Пока бумага не проявилась, точка видна сквозь неё и ведёт сборку.
      // В телефонной раскладке подводка уже на месте — точка уходит под неё вместе с линией,
      // иначе была бы над текстом, а линия под ним — оторванной.
      const drawing = !phone && at < apex - 6;
      if (drawing !== section.hasAttribute("data-drawing"))
        section.toggleAttribute("data-drawing", drawing);

      // Чернила — от верха сцены до точки. Пока точка этой сцены под экраном, сверху падает
      // точка Сцены 5: чернила — до неё, а ниже края Сцены 5 её же показывает эта сцена. Так же —
      // пока точка Сцены 5 на высоте стыка выше этой сцены (каталог выше экрана).
      let ink = Math.max(0, Math.min(stageH, at));
      let hold = "";
      if (!reduced && (y > h || at < 0)) {
        ink = 0;
        if (s5?.style.opacity === "1") {
          const y5 = s5.getBoundingClientRect().top + 6;
          ink = Math.max(0, Math.min(stageH, y5 - stageTop));
          const edge5 = s5Scene?.getBoundingClientRect().bottom ?? h;
          if (y5 + 6 > edge5) hold = `translateY(${(y5 - 6 - stageTop).toFixed(1)}px)`;
        }
      }
      // Чернила — своим слоем, долей высоты (scaleY от верха): clip-path на каждом кадре
      // перерисовывал линию, а это главная работа видеокарты в сцене. Длина — та же, что давала
      // обрезка снизу на округлённые px.
      const inkLen = railH - Math.round(stageH - ink);
      put(railInk, "transform", `scaleY(${railH > 0 ? clamp01(inkLen / railH).toFixed(5) : 0})`);
      // До низа сцены и ещё на радиус: пока верх футера проходит через точку, её верх — здесь, над
      // футером, а низ уже рисует футер (он ловит её, когда его верх дошёл до её низа).
      const show = !reduced && at >= 0 && at <= stageH + 6;
      // У нижнего края, пока точка не поднялась в экран целиком: если точка Сцены 5 ещё ждёт там —
      // не видна; если уже слилась с этой — стоит на краю, а не наполовину за ним.
      const waits = s5?.style.opacity === "1";
      put(drop, "opacity", show && (y <= h - 6 || !waits) ? "1" : "0");
      const drawn = waits ? at : Math.min(at, h - 6 - stageTop);
      if (show) put(drop, "transform", `translateY(${(drawn - 6).toFixed(1)}px)`);
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
    // Tab в сложенный конверт — страница к собранному (scroll-margin-top, как «Связаться»): фокус
    // попадает в видимое поле, а не снимается.
    const onFocusIn = () => {
      if (folded) section.scrollIntoView();
    };
    env.addEventListener("focusin", onFocusIn);
    // Телефон: доиграл (письмо дождалось конца) — переходы больше не нужны: дальше всё как в покое,
    // и закрытие после отправки идёт своими переходами.
    const onPlayed = (e: AnimationEvent) => {
      if (e.target === sheet) letter.removeAttribute("data-play");
    };
    section.addEventListener("animationend", onPlayed);
    const off = onScroll(section, update);
    return () => {
      off();
      env.removeEventListener("focusin", onFocusIn);
      section.removeEventListener("animationend", onPlayed);
      letter.removeAttribute("data-play");
      ro.disconnect();
      updateRef.current = () => {};
    };
  }, []);

  // «Отправить ещё одну» — чистая форма; «вернуться к форме» после письма в почте — те же данные.
  const reopen = (clear: boolean) => {
    if (clear) clearBrief();
    setStatus("idle");
  };

  return (
    <section ref={sectionRef} className={styles.scene6} data-scene="scene6" aria-label="Заявка">
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
                  <span className={styles.nw}>{phoneText}</span> {BRIEF_CONFIG.replyIn}{" "}
                  в рабочее время.
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
              // «В тот же день» — ЗАГЛУШКА владельца, как и часы (BRIEF_CONFIG.hours).
              <p>
                Перезвоним {BRIEF_CONFIG.replyIn} в рабочее время{" "}
                <span className={styles.nw}>({BRIEF_CONFIG.hours})</span>, уточним задачу и в тот же
                день назовём срок и цену.
              </p>
            )}
          </div>
        </div>

        <Envelope ref={partsRef} onShift={() => updateRef.current()} />
        {/* Точка Сцены 5 ниже её края — её место на стыке (после точки конверта: Сцена 5 ищет
            первую 12px точку этой сцены). */}
        <span ref={handRef} className={styles.handoff} aria-hidden="true" />
      </div>
      {/* Окно заявки — быстрая версия этого конверта для кнопок по всему сайту; рисуется в body. */}
      <BriefModal />
    </section>
  );
}
