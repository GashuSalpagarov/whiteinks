"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { type RefObject, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { getTier } from "@/lib/perf";
import { generateTextSDF } from "@/lib/sdfText";
import { INK_CLOUD_FRAGMENT, INK_FRAGMENT, INK_VERTEX } from "./inkShader";

// Тайминг (доли q), общий с Scene4.tsx: там по нему падает и гаснет CSS-точка.
export const IMPACT_Q = 0.12; // капля касается воды — дальше эстафету берут чернила
export const IMPACT_Y = 0.58; // точка удара по вертикали, доля высоты экрана (x — центр)
export const DROP_FADE = 0.012; // за столько q CSS-точка гаснет поверх ядра чернил

// Слово этапа: шрифт сайта, кегль от ширины экрана, но не больше доли высоты.
// Базовая линия слова — на точке удара: капля «встаёт на строку».
const WORD = "Бриф";
const WORD_VW = 0.2;
const WORD_VH = 0.36;
const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const SDF_FONT = 128; // px, кегль растра для SDF (внутри — суперсэмплинг ×2)
const SDF_PAD = 60; // px поля вокруг букв: облако берёт расстояния и за ними
// Облако мягкое и дорогое — считаем его в половине CSS-пикселя, независимо от DPR
// (на слабых устройствах, lib/perf, — ещё грубее).
const CLOUD_SCALE = 0.5;
const CLOUD_SCALE_LOW = 0.35;

type Props = {
  progressRef: RefObject<number>;
};

// Слово этапа — SDF-текстура и метрики. Дорого: 50–95 мс главного потока на десктопе.
function buildWord() {
  const sdf = generateTextSDF(WORD, SDF_FONT, FONT, 500, -0.02, 1.25, SDF_PAD, 2);
  // Half float фильтруется линейно в любом WebGL2 (float32 — только с расширением).
  const half = new Uint16Array(sdf.sdf.length);
  for (let i = 0; i < half.length; i++) half[i] = THREE.DataUtils.toHalfFloat(sdf.sdf[i]);
  const texture = new THREE.DataTexture(
    half,
    sdf.width,
    sdf.height,
    THREE.RedFormat,
    THREE.HalfFloatType,
  );
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  // Слово стоит в растре по textBaseline = middle; низ «и» — базовая линия строки.
  const ctx = document.createElement("canvas").getContext("2d");
  let baseline = 0;
  if (ctx) {
    ctx.font = `500 ${SDF_FONT}px ${FONT}`;
    ctx.textBaseline = "middle";
    baseline = ctx.measureText("и").actualBoundingBoxDescent;
  }
  return { texture, baseline, width: sdf.worldWidth, height: sdf.worldHeight };
}

// Чернила — два полноэкранных квада. Облако рендерится в текстуру пониженного разрешения
// и только когда сменился q (картинка — чистая функция q). Сборка рисуется на экран
// последней и непрозрачно — только пока есть чернила (q ≥ IMPACT_Q). Оба квада пишут
// clip space напрямую, поэтому камера, которой каждый кадр управляет Scene3R3F, не влияет.
export function Scene4R3F({ progressRef }: Props) {
  const meshRef = useRef<THREE.Mesh>(null);
  const cloudQ = useRef(-1); // q, для которого облако уже лежит в текстуре
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);
  const invalidate = useThree((s) => s.invalidate);
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const scene = useThree((s) => s.scene);

  // Материалы создаём сами: uniforms, которые пишем в кадре, — ровно те, что у шейдеров.
  // Общие uniforms — одни и те же объекты у обоих проходов.
  const ink = useMemo(() => {
    const target = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false });
    const common = {
      uQ: { value: 0 },
      uImpactQ: { value: IMPACT_Q },
      uView: { value: new THREE.Vector2(1, 1) },
      uImpact: { value: new THREE.Vector2() },
      uWord: { value: new THREE.Vector4() },
      uSdfScale: { value: 1 },
      uSdf: { value: null as THREE.Texture | null },
    };
    const material = (fragmentShader: string, own: Record<string, THREE.IUniform>) =>
      new THREE.ShaderMaterial({
        vertexShader: INK_VERTEX,
        fragmentShader,
        uniforms: { ...common, ...own },
        depthTest: false,
        depthWrite: false,
      });
    const cloudScale = getTier() === "low" ? CLOUD_SCALE_LOW : CLOUD_SCALE;
    const cloud = material(INK_CLOUD_FRAGMENT, { uDpr: { value: cloudScale } });
    const screen = material(INK_FRAGMENT, {
      uDpr: { value: 1 },
      uCloud: { value: target.texture },
    });
    screen.transparent = true; // в общий проход прозрачных — после всего остального
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), cloud);
    quad.frustumCulled = false;
    const cloudScene = new THREE.Scene().add(quad);

    // Слово — по первому требованию: в простое (прогрев ниже) или прямо в кадре удара.
    // Его прямоугольник — от размера канваса, он уже лежит в uView.
    let word: ReturnType<typeof buildWord> | null = null;
    const placeWord = () => {
      if (!word) return;
      const { x: w, y: h } = common.uView.value;
      const k = Math.min(WORD_VW * w, WORD_VH * h) / SDF_FONT;
      const y = IMPACT_Y * h - word.baseline * k;
      common.uWord.value.set(w / 2, y, word.width * k, word.height * k);
      common.uSdfScale.value = k;
    };
    const ensureWord = () => {
      if (word) return;
      word = buildWord();
      common.uSdf.value = word.texture;
      placeWord();
    };
    return {
      target,
      common,
      cloud,
      screen,
      quad,
      cloudScene,
      camera: new THREE.Camera(),
      cloudScale,
      placeWord,
      ensureWord,
    };
  }, []);

  useEffect(
    () => () => {
      ink.target.dispose();
      ink.cloud.dispose();
      ink.screen.dispose();
      ink.quad.geometry.dispose();
      ink.common.uSdf.value?.dispose();
    },
    [ink],
  );

  // Прогрев — в простое: на обычной загрузке это интро Hero, пока скролл заблокирован.
  // Слово строится здесь, а шейдеры чернил компилируются параллельно
  // (KHR_parallel_shader_compile) — иначе первый кадр удара ждал бы компиляцию.
  useEffect(() => {
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 200));
    let alive = true;
    idle(() => {
      if (!alive) return;
      ink.ensureWord();
      gl.setRenderTarget(ink.target); // облако рисуется в текстуру — и компилируем под неё
      gl.compileAsync(ink.cloudScene, ink.camera);
      gl.setRenderTarget(null);
      if (meshRef.current) gl.compileAsync(meshRef.current, camera, scene);
    });
    return () => {
      alive = false;
    };
  }, [gl, camera, scene, ink]);

  // Раскладка — от размера канваса (= viewport: Scene4 держит --canvas-y = 0).
  useEffect(() => {
    const { width: w, height: h } = size;
    const u = ink.common;
    u.uView.value.set(w, h);
    u.uImpact.value.set(w / 2, IMPACT_Y * h);
    ink.placeWord();
    ink.screen.uniforms.uDpr.value = dpr;
    ink.target.setSize(Math.round(w * ink.cloudScale), Math.round(h * ink.cloudScale));
    cloudQ.current = -1;
    invalidate(); // облако перерисовать в новую текстуру (канвас рисует по запросу)
  }, [size, dpr, ink, invalidate]);

  useFrame(({ gl }) => {
    const q = progressRef.current;
    const visible = q >= IMPACT_Q;
    if (meshRef.current) meshRef.current.visible = visible;
    if (!visible) return;
    ink.ensureWord(); // прогрев не успел — строим в этом же кадре: кадра без слова нет
    ink.common.uQ.value = q;
    // Облако — чистая функция q: пока скролл стоит, текстура уже верная.
    if (q !== cloudQ.current) {
      cloudQ.current = q;
      gl.setRenderTarget(ink.target);
      gl.render(ink.cloudScene, ink.camera);
      gl.setRenderTarget(null);
    }
  });

  return (
    <mesh
      ref={meshRef}
      material={ink.screen}
      frustumCulled={false}
      renderOrder={10}
      visible={false}
    >
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}
