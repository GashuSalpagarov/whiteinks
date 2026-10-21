import { getGPUTier, type ModelEntry } from "detect-gpu";

// Уровень устройства для 3D. "low" — телефон/планшет или слабый GPU по бенчмаркам detect-gpu:
// меньше частиц и штрихов в потоке Сцены 3, DPR канваса не выше 1.5. Определяется один раз
// при старте.
export type Tier = "low" | "high";

// Столько ждём detect-gpu, дальше — по эвристике.
const DETECT_TIMEOUT_MS = 3000;

// Таблицы бенчмарков detect-gpu — в сборке сайта отдельными чанками, без запроса на unpkg:
// грузится только таблица своего типа GPU.
const BENCHMARKS: Record<string, () => Promise<{ default: unknown[] }>> = {
  "d-adreno.json": () => import("detect-gpu/dist/benchmarks/d-adreno.json"),
  "d-amd.json": () => import("detect-gpu/dist/benchmarks/d-amd.json"),
  "d-apple.json": () => import("detect-gpu/dist/benchmarks/d-apple.json"),
  "d-geforce.json": () => import("detect-gpu/dist/benchmarks/d-geforce.json"),
  "d-intel.json": () => import("detect-gpu/dist/benchmarks/d-intel.json"),
  "d-nvidia.json": () => import("detect-gpu/dist/benchmarks/d-nvidia.json"),
  "d-radeon.json": () => import("detect-gpu/dist/benchmarks/d-radeon.json"),
  "m-adreno.json": () => import("detect-gpu/dist/benchmarks/m-adreno.json"),
  "m-apple.json": () => import("detect-gpu/dist/benchmarks/m-apple.json"),
  "m-apple-ipad.json": () => import("detect-gpu/dist/benchmarks/m-apple-ipad.json"),
  "m-intel.json": () => import("detect-gpu/dist/benchmarks/m-intel.json"),
  "m-mali.json": () => import("detect-gpu/dist/benchmarks/m-mali.json"),
  "m-mali-t.json": () => import("detect-gpu/dist/benchmarks/m-mali-t.json"),
  "m-nvidia.json": () => import("detect-gpu/dist/benchmarks/m-nvidia.json"),
  "m-powervr.json": () => import("detect-gpu/dist/benchmarks/m-powervr.json"),
  "m-samsung.json": () => import("detect-gpu/dist/benchmarks/m-samsung.json"),
};

// Как штатная загрузка detect-gpu: первый элемент таблицы — версия формата, его отрезаем.
// Нет таблицы — ошибка, и detect-gpu отвечает FALLBACK (тогда верим эвристике).
async function loadBenchmarks(file: string): Promise<ModelEntry[]> {
  const load = BENCHMARKS[file];
  if (!load) throw new Error(`detect-gpu: нет таблицы ${file}`);
  return (await load()).default.slice(1) as ModelEntry[];
}

let tier: Tier = "high";

export function getTier(): Tier {
  return tier;
}

async function detect(): Promise<Tier> {
  // До ответа detect-gpu (и без него) — эвристика: телефон по UA и небольшой экран.
  const phone = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  tier = phone && Math.min(screen.width, screen.height) < 768 ? "low" : "high";
  const timeout = new Promise<null>((resolve) => setTimeout(resolve, DETECT_TIMEOUT_MS, null));
  const gpu = await Promise.race([
    getGPUTier({ override: { loadBenchmarks } }).catch(() => null),
    timeout,
  ]);
  // FALLBACK — GPU нет в таблице (например, слишком новый): его tier 1 ничего не значит.
  if (gpu) tier = gpu.isMobile || (gpu.type !== "FALLBACK" && gpu.tier < 2) ? "low" : "high";
  return tier;
}

// GlobalCanvas монтирует канвас после этого промиса: сцены внутри читают getTier() при монтировании.
export const tierReady: Promise<Tier> =
  typeof window === "undefined" ? Promise.resolve(tier) : detect();
