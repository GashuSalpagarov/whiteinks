import { useEffect } from "react";
import { Fine } from "@/components/scenes/Footer/Fine";
import { CASES, type CaseData } from "@/components/scenes/Scene3/cases";
import { Envelope } from "@/components/ui/Envelope";
import { BRIEF_CONFIG, clearBrief, getBrief, setBrief, useBrief } from "@/lib/brief";
import { formatPhone } from "@/lib/phone";
import styles from "./Case.module.css";

// Конец пути — заявка прямо на странице: глава «дальше» с вопросом и строкой (после отправки — что
// с заявкой, как над конвертом Сцены 6), ниже — тот же конверт, что на главной (components/ui/
// Envelope), уже собранный; отправили — он доигрывает сам: письмо в конверт, клапан, «от: …»,
// марка. Данные общие — lib/brief.ts. Засечка конца пути тянется от линии до подложки, в конце
// прокрутки точка ждёт у поля «телефон» (Case.module.css, .end). «Что нужно» — по кейсу (need в
// cases.ts), пока посетитель не выбрал сам. Под конвертом — неброско «ещё проект →» (переход через
// точку — CaseLayer).
const ASK: Record<string, string> = {
  Сайт: "ваш сайт",
  Магазин: "ваш магазин",
  Приложение: "ваше приложение",
  "ИИ и автоматизация": "вашу автоматизацию",
};
let autoNeed = ""; // «что нужно», подставленное кейсом, а не выбранное посетителем

// Страница «Наши работы» зовёт его без act: там нет «ещё проект →» и нет кейса (need).
export function End({ c, act }: { c?: Pick<CaseData, "need">; act?: { next: () => void } }) {
  const need = c?.need;
  const { status, phone } = useBrief();
  const sent = status === "sent";
  useEffect(() => {
    const s = getBrief();
    if (!need || s.status !== "idle" || (s.need && s.need !== autoNeed)) return;
    autoNeed = need;
    setBrief({ need });
  }, [need]);
  return (
    <>
      <section className={`${styles.sec} ${styles.ch}`}>
        <div className={styles.l}>
          <p className={styles.word}>дальше</p>
        </div>
        <div className={styles.r}>
          <p className={`${styles.h2} ${styles.bt}`} data-rise>
            Обсудим {ASK[need ?? ""] ?? "ваш проект"}?
          </p>
          <div className={`${styles.p} ${styles.bt} ${styles.said}`} role="status" data-rise>
            {sent ? (
              <>
                <p>
                  <strong>Заявка отправлена.</strong> Перезвоним на{" "}
                  <span className={styles.nw}>{formatPhone(phone)}</span> {BRIEF_CONFIG.replyIn} в
                  рабочее время.
                </p>
                <button type="button" className={styles.again} onClick={() => clearBrief()}>
                  отправить ещё одну
                </button>
              </>
            ) : status === "mail" ? (
              <>
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
                <button
                  type="button"
                  className={styles.again}
                  onClick={() => setBrief({ status: "idle" })}
                >
                  вернуться к форме
                </button>
              </>
            ) : (
              <p>
                Оставьте телефон — перезвоним {BRIEF_CONFIG.replyIn} в рабочее время, уточним задачу
                и в тот же день назовём срок и цену.
              </p>
            )}
          </div>
        </div>
      </section>
      <section className={`${styles.sec} ${styles.end}`}>
        <div className={styles.l} />
        <div className={styles.r}>
          <div className={styles.letter} data-rise data-letter>
            <Envelope />
          </div>
          {/* Кейс один — «ещё проект» вёл бы в него же */}
          {act && CASES.length > 1 && (
            <p className={`${styles.more} ${styles.bt}`} data-rise>
              <button type="button" className={styles.moreLink} onClick={act.next}>
                {sent ? "пока ждёте звонка — ещё проект →" : "ещё проект →"}
              </button>
            </p>
          )}
        </div>
      </section>
      <Fine className={styles.fine} />
    </>
  );
}
