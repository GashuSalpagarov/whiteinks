# 01. Технический стек

> 2026-10-18: из зависимостей удалены `gsap`, `@gsap/react`, `@react-three/drei`, `@react-three/postprocessing`, `@14islands/r3f-scroll-rig`, `web-vitals`, `stats-gl`, `clsx` — в коде они не использовались.

## TL;DR
Next.js 16 (App Router) + React 19 + TypeScript 6 strict; Lenis 1.3 для скролла; React Three Fiber 9.6 + three.js r184 для 3D. Менеджер пакетов — pnpm 10.x. Стили — CSS Modules + design tokens (без Tailwind). Линт/формат — Biome 2.4. Хостинг — Cloudflare Pages + R2 + Stream/Images.

## Выбор фреймворка: Next.js 16 vs Astro 5

Оба варианта валидны под промо-сайт студии с тяжёлым WebGL. Исследовательский разбор:

| Критерий | Next.js 16 (App Router) | Astro 5 + React island |
|---|---|---|
| Bundle initial load | Больше базы (RSC + client runtime) | Минимальный HTML, JS только в островах |
| Time-to-interactive (heavy 3D) | Сравнимо: WebGL всё равно лидирует в TTI | Лучше при множестве статических секций |
| Расширение в каталог услуг и кейсов | Нативно: file-based routing, RSC, ISR, dynamic segments | Тоже умеет, но React-only острова теряют RSC-преимущества |
| Server actions / форма контактов | Из коробки | Нужен бэкенд-эндпоинт или Cloudflare Workers |
| Edge-deploy на Cloudflare Pages | OK через `@cloudflare/next-on-pages` | Нативно через `@astrojs/cloudflare` |
| Persistent GlobalCanvas через route changes | Нативно (canvas в layout, RSC переживает навигацию) | Между Island-перерендерами теряется WebGL-контекст без обвязки |
| Опыт команды R3F | Mainstream | Меньше публичных кейсов |

**Решение: Next.js 16 (App Router).**
Причины: (а) у нас есть multi-page структура (главная + услуги + кейсы + подход + контакты, см. [00-overview.md](./00-overview.md)) — RSC-роутинг и динамические сегменты `[slug]` нативны; (б) `r3f-scroll-rig` и persistent GlobalCanvas в Next.js — отлаженный паттерн; (в) server actions упростят форму обратной связи без отдельного Worker.

Astro 5 — fallback, если в течение проекта концепт сожмётся до строго статической одной страницы без планов на расширение (что не наш случай).

## Сводная таблица: layer → выбор → версия

Версии — фактические из `package.json` на момент Этапа 0.

| Layer | Выбор | Версия | Причина |
|---|---|---|---|
| Framework | Next.js | 16.2.4 | RSC, file-routing, готовность к multi-page |
| UI runtime | React | 19.2.5 | Совместимость с R3F 9, новые хуки, transitions |
| Язык | TypeScript strict | 6.0.3 | Шейдеры, uniforms, geometry — всё типизировано |
| Менеджер пакетов | pnpm | 10.33.x | Быстрый install, строгий lockfile, hoist-discipline |
| Smooth scroll | Lenis | 1.3.23 | Один источник скролла, дружит с GSAP RAF и `useFrame` |
| Animation | GSAP + ScrollTrigger + SplitText | удалён 2026-10-18 | Бесплатно после покупки Webflow в 2024; де-факто стандарт |
| GSAP в React | `@gsap/react` (`useGSAP`) | удалён 2026-10-18 | Корректная очистка контекста в R3F-окружении |
| 3D | three.js | 0.184.x | База |
| 3D в React | React Three Fiber | 9.6.1 | Декларативный граф, useFrame, suspense |
| 3D утилиты | drei | удалён 2026-10-18 | `<View>`, `useTexture`, `Html`, `Text` |
| Постпроцессинг | `@react-three/postprocessing` | удалён 2026-10-18 | Bloom, ChromaticAberration, Vignette, EffectComposer |
| DOM↔WebGL bridge | `@14islands/r3f-scroll-rig` | удалён 2026-10-18 | GlobalCanvas, `<UseCanvas>`, scroll-tracker |
| Текст в 3D | troika-three-text (через drei `<Text>`) | удалён вместе с drei | SDF-шрифты, anti-alias на любом z |
| GPU detect | `detect-gpu` | удалён 2026-10-22 | Tier-разбивка: все устройства получают полную версию |
| Метрики | `web-vitals` | удалён 2026-10-18 | INP/LCP/CLS в prod |
| Dev FPS overlay | `stats-gl` | удалён 2026-10-18 | FPS, memory, draw calls |
| Стили | CSS Modules + design tokens | — | Без Tailwind, см. ниже |
| Линт/формат | Biome | 2.4.x | Один тул вместо ESLint+Prettier |
| Тесты | Playwright | latest | Visual regression на ключевых scroll-кадрах |
| Ассеты | `gltf-transform` + Draco + KTX2 | latest | Сжатие GLB, mesh-quantization, GPU-friendly текстуры |
| Хостинг | Cloudflare Pages + R2 + Stream/Images | — | Edge SSR/SSG, дешёвый storage для GLB/KTX2 |

## React Compiler

В Next.js 16 React Compiler перенесён из `experimental.reactCompiler` на top-level `reactCompiler` в `next.config`. В нашем `next.config.*` опция **закомментирована**: планируется включить позже, после установки `babel-plugin-react-compiler` и обкатки на Сцене 1. До этого — обычный React 19 без оптимизатора.

## Стили: CSS Modules + design tokens (без Tailwind)

Принято: Tailwind не используем. Причины:
- Чёрно-белый минимализм с очень узкой цветовой системой не выигрывает от utility-first;
- Сцены требуют сложной координации DOM-CSS-анимаций с GSAP — лаконичные именованные классы читаются легче, чем длинные `class=...` цепочки;
- CSS Modules дают локальные имена без ESLint-плагинов;
- Глобальные дизайн-токены (`--bg`, `--fg`, `--accent`, размеры, скорости анимаций) живут в `app/globals.css` и переключаются под инверсию через `@property`.

## Что НЕ берём и почему

| Технология | Причина отказа |
|---|---|
| **Tailwind CSS** | См. выше — не наш случай. |
| **GSAP ScrollSmoother** | Дублирует Lenis. Lenis лучше интегрируется с R3F `useFrame`. |
| **Theatre.js** | Проект практически не развивается с 2024; для нашего нарратива достаточно GSAP-таймлайнов с лейблами. |
| **Locomotive Scroll** | С 2024 является обёрткой над Lenis — нет смысла добавлять прокси. |
| **R3F `<ScrollControls>`** | Конфликтует с Lenis (две системы скролла). |
| **CSS Scroll-Driven Animations (`animation-timeline`)** | На май 2026 ещё неполная поддержка в Safari/Firefox-стабильных версиях; для критичной анимации полагаемся на GSAP. |
| **Three.js + vanilla** (без R3F) | Теряем декларативность и экосистему drei/postprocessing. |
| **Babylon.js** | Лишний размер бандла под наш сценарий. |
| **Three.js `WebGPURenderer`** | Стабилизация в r184 ещё неровная по драйверам; держим как опциональный апгрейд. |

## Ассет-pipeline (коротко)

1. Blender / DCC → GLB.
2. `gltf-transform optimize` (Draco для геометрии, KTX2 для текстур, mesh-quantization).
3. Бюджет: см. [05-performance.md](./05-performance.md).

## Источники
- Lenis: <https://github.com/darkroomengineering/lenis>, <https://lenis.darkroom.engineering/>
- GSAP в React: <https://gsap.com/resources/React/>, <https://www.npmjs.com/package/@gsap/react>
- R3F Canvas: <https://r3f.docs.pmnd.rs/api/canvas>
- `r3f-scroll-rig`: <https://github.com/14islands/r3f-scroll-rig>
- Postprocessing: <https://github.com/pmndrs/react-postprocessing>, <https://github.com/pmndrs/postprocessing>
- React Compiler: <https://react.dev/learn/react-compiler>
