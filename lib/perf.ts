import { getGPUTier } from "detect-gpu";

// Уровень устройства для 3D. "low" — телефон/планшет или слабый GPU по бенчмаркам detect-gpu:
// меньше частиц и пыли, облако Сцены 4 грубее, канвас в DPR 1. Определяется один раз при старте.
export type Tier = "low" | "high";

// Столько ждём detect-gpu (таблицу бенчмарков он берёт с unpkg), дальше — по эвристике.
const DETECT_TIMEOUT_MS = 3000;

let tier: Tier = "high";

export function getTier(): Tier {
  return tier;
}

async function detect(): Promise<Tier> {
  // До ответа detect-gpu (и без него) — эвристика: телефон по UA и небольшой экран.
  const phone = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  tier = phone && Math.min(screen.width, screen.height) < 768 ? "low" : "high";
  const timeout = new Promise<null>((resolve) => setTimeout(resolve, DETECT_TIMEOUT_MS, null));
  const gpu = await Promise.race([getGPUTier().catch(() => null), timeout]);
  // FALLBACK — GPU нет в таблице (например, слишком новый): его tier 1 ничего не значит.
  if (gpu) tier = gpu.isMobile || (gpu.type !== "FALLBACK" && gpu.tier < 2) ? "low" : "high";
  return tier;
}

// GlobalCanvas монтирует канвас после этого промиса: сцены внутри читают getTier() при монтировании.
export const tierReady: Promise<Tier> =
  typeof window === "undefined" ? Promise.resolve(tier) : detect();
