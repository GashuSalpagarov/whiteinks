// Телефон РФ в форме заявки: храним 10 цифр после +7, показываем по маске +7 (___) ___-__-__.

export const PHONE_MASK = "+7 (___) ___-__-__";
export const PHONE_PREFIX = "+7 ("; // каретка в него не заходит

// 10 цифр → «+7 (916) 555-12-34»; неполный номер — по мере набора, со скобкой и дефисами.
export function formatPhone(d: string): string {
  let s = PHONE_PREFIX;
  if (!d) return s;
  s += d.slice(0, 3);
  if (d.length < 3) return s;
  s += `) ${d.slice(3, 6)}`;
  if (d.length < 6) return s;
  s += `-${d.slice(6, 8)}`;
  if (d.length < 8) return s;
  return `${s}-${d.slice(8, 10)}`;
}

// Правка поля: что в нём сейчас и где каретка → цифры номера и сколько их левее каретки.
// prev — цифры до правки, inputType — из InputEvent.
export function phoneEdit(
  value: string,
  caret: number,
  prev: string,
  inputType = "",
): { digits: string; left: number } {
  let v = value;
  let c = caret;
  // «7» маски — не цифра номера, где бы ни оказалась рядом с ней новая цифра.
  const seven = v.indexOf("7");
  if (/^\s*\+/.test(v) && seven >= 0 && seven <= 3) {
    v = v.slice(0, seven) + v.slice(seven + 1);
    if (seven < c) c--;
  }
  let digits = v.replace(/\D/g, "");
  let left = v.slice(0, c).replace(/\D/g, "").length;
  // Вставили или подставили номер с кодом страны («8 916…», «7916…»).
  const whole = inputType === "insertFromPaste" || !prev || !/^\s*\+/.test(value);
  if (whole && digits.length > 10 && /^[78]/.test(digits)) {
    digits = digits.slice(1);
    left = Math.max(0, left - 1);
  }
  // Первая 8 или 7 в пустом поле — привычка «8 916…»: это код страны, он уже стоит.
  if (!prev && digits.length === 1 && /^[78]$/.test(digits)) {
    digits = "";
    left = 0;
  }
  // Стёрли знак маски — цифр столько же: стираем цифру рядом с ним.
  if (inputType.startsWith("delete") && digits === prev && prev) {
    const k = inputType === "deleteContentForward" ? left : left - 1;
    if (k >= 0 && k < prev.length) {
      digits = prev.slice(0, k) + prev.slice(k + 1);
      left = k;
    }
  }
  digits = digits.slice(0, 10);
  return { digits, left: Math.min(left, digits.length) };
}

// Каретка в отформатированном номере — сразу после left-й цифры, не раньше «+7 (».
export function caretAt(formatted: string, left: number): number {
  if (left <= 0) return PHONE_PREFIX.length;
  let n = 0;
  for (let k = PHONE_PREFIX.length; k < formatted.length; k++) {
    if (/\d/.test(formatted[k]) && ++n === left) return k + 1;
  }
  return formatted.length;
}
