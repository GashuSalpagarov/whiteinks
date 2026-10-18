"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { type RefObject, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { getTier } from "@/lib/perf";
import { generateTextSDF } from "@/lib/sdfText";
import { INK_CLOUD_FRAGMENT, INK_FRAGMENT, INK_VERTEX } from "./inkShader";
import {
  cloudFrame,
  FONT,
  IMPACT_Q,
  IMPACT_Y,
  LETTER_SPACING,
  STAGES,
  stageAt,
  wordFit,
  wordLineY,
} from "./stages";

const SDF_FONT = 128; // px, кегль растра для SDF (внутри — суперсэмплинг ×2)
const SDF_PAD = 60; // px поля вокруг букв: облако берёт расстояния и за ними
// Облако мягкое и дорогое — считаем его в половине CSS-пикселя, независимо от DPR
// (на слабых устройствах, lib/perf, — ещё грубее).
const CLOUD_SCALE = 0.5;
const CLOUD_SCALE_LOW = 0.35;

type Props = {
  progressRef: RefObject<number>;
  releaseRef: RefObject<number>; // на сколько CSS px кадр уехал вверх после отпускания sticky
};

type Word = { texture: THREE.DataTexture; width: number; height: number };

// Слово этапа — SDF-текстура и её размер в px растра. Дорого: 50–80 мс главного потока
// на слово, поэтому строим по одному в простое (прогрев ниже) или когда слово нужно в кадре.
function buildWord(word: string): Word {
  const sdf = generateTextSDF(word, SDF_FONT, FONT, 500, LETTER_SPACING, 1.25, SDF_PAD, 2);
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
  return { texture, width: sdf.worldWidth, height: sdf.worldHeight };
}

// Слова стоят в растре по textBaseline = middle; низ «и» — базовая линия строки.
function measureBaseline(): number {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return 0;
  ctx.font = `500 ${SDF_FONT}px ${FONT}`;
  ctx.textBaseline = "middle";
  return ctx.measureText("и").actualBoundingBoxDescent;
}

// Чернила — два полноэкранных квада. Облако рендерится в текстуру пониженного разрешения
// и только когда сменился q (картинка — чистая функция q). Сборка рисуется на экран
// последней и непрозрачно — только пока есть чернила. Оба квада пишут clip space
// напрямую, поэтому камера, которой каждый кадр управляет Scene3R3F, не влияет.
// В шейдер одновременно привязаны два слова: тающее (A, прошлое) и собирающееся (B).
export function Scene4R3F({ progressRef, releaseRef }: Props) {
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
      uStage: { value: 0 },
      uQ: { value: 0 },
      uImpactQ: { value: IMPACT_Q },
      uView: { value: new THREE.Vector2(1, 1) },
      uImpact: { value: new THREE.Vector2() },
      uDrop: { value: new THREE.Vector2() },
      uSdfA: { value: null as THREE.Texture | null },
      uWordA: { value: new THREE.Vector4() },
      uSdfScaleA: { value: 1 },
      uSdfB: { value: null as THREE.Texture | null },
      uWordB: { value: new THREE.Vector4() },
      uSdfScaleB: { value: 1 },
      uStretch: { value: new THREE.Vector2(1, 1) },
      uDilate: { value: 0.16 },
      uTr: { value: STAGES[1].into }, // этап 0 перехода не читает
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
      uScroll: { value: 0 },
    });
    screen.transparent = true; // в общий проход прозрачных — после всего остального
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), cloud);
    quad.frustumCulled = false;
    const cloudScene = new THREE.Scene().add(quad);

    // Слова — по первому требованию: в простое (прогрев ниже) или прямо в кадре этапа.
    const words: (Word | null)[] = STAGES.map(() => null);
    let baseline = 0;
    const ensureWord = (i: number): Word => {
      if (!words[i]) {
        if (!baseline) baseline = measureBaseline();
        words[i] = buildWord(STAGES[i].word);
      }
      return words[i] as Word;
    };
    // Прямоугольник слова — от размера канваса (он уже лежит в uView) и кегля этапа.
    const place = (i: number, rect: THREE.Vector4, scale: { value: number }) => {
      const { x: w, y: h } = common.uView.value;
      const word = ensureWord(i);
      const k = wordFit(STAGES[i].word, w, h).size / SDF_FONT;
      rect.set(w / 2, common.uImpact.value.y - baseline * k, word.width * k, word.height * k);
      scale.value = k;
      return word.texture;
    };
    // Этап → A = прошлое слово (на этапе 0 — то же), B = слово этапа, параметры перехода.
    let bound = -1;
    const bind = (stage: number) => {
      if (stage === bound) return;
      bound = stage;
      const a = Math.max(0, stage - 1);
      common.uSdfA.value = place(a, common.uWordA.value, common.uSdfScaleA);
      common.uSdfB.value = place(stage, common.uWordB.value, common.uSdfScaleB);
      const { x: w, y: h } = common.uView.value;
      const frame = cloudFrame(a, stage, w, h);
      common.uStretch.value.set(frame.stretch[0], frame.stretch[1]);
      common.uDilate.value = frame.dilate;
      const into = STAGES[stage].into;
      if (into) common.uTr.value = into;
      common.uStage.value = stage;
    };
    const unbind = () => {
      bound = -1;
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
      words,
      ensureWord,
      bind,
      unbind,
    };
  }, []);

  useEffect(
    () => () => {
      ink.target.dispose();
      ink.cloud.dispose();
      ink.screen.dispose();
      ink.quad.geometry.dispose();
      for (const word of ink.words) word?.texture.dispose();
    },
    [ink],
  );

  // Прогрев — в простое: на обычной загрузке это интро Hero, пока скролл заблокирован.
  // Слова строятся по одному на простой — без длинной задачи на все пять. Шейдеры чернил
  // компилируются параллельно (KHR_parallel_shader_compile) после первого слова —
  // иначе первый кадр удара ждал бы компиляцию.
  useEffect(() => {
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 200));
    let alive = true;
    let next = 0;
    const step = () => {
      if (!alive) return;
      ink.ensureWord(next);
      if (next === 0) {
        gl.setRenderTarget(ink.target); // облако рисуется в текстуру — и компилируем под неё
        gl.compileAsync(ink.cloudScene, ink.camera);
        gl.setRenderTarget(null);
        if (meshRef.current) gl.compileAsync(meshRef.current, camera, scene);
      }
      if (++next < STAGES.length) idle(step);
    };
    idle(step);
    return () => {
      alive = false;
    };
  }, [gl, camera, scene, ink]);

  // Раскладка — от размера канваса (= viewport: Scene4 держит --canvas-y = 0; высота —
  // общая высота экрана сцен, --ih). Строка слов и точка удара капли совпадают на десктопе,
  // на телефоне строка — выше, по центру.
  useEffect(() => {
    const { width: w, height: h } = size;
    const u = ink.common;
    u.uView.value.set(w, h);
    u.uImpact.value.set(w / 2, wordLineY(w) * h);
    u.uDrop.value.set(w / 2, IMPACT_Y * h);
    ink.unbind(); // прямоугольники слов пересчитаются в кадре
    ink.screen.uniforms.uDpr.value = dpr;
    ink.target.setSize(Math.round(w * ink.cloudScale), Math.round(h * ink.cloudScale));
    cloudQ.current = -1;
    invalidate(); // облако перерисовать в новую текстуру (канвас рисует по запросу)
  }, [size, dpr, ink, invalidate]);

  useFrame(({ gl }) => {
    const q = progressRef.current;
    const { index, local } = stageAt(q);
    // Кадр целиком уехал за верх экрана — дальше уже Сцена 5, рисовать нечего.
    const release = releaseRef.current;
    const visible = (index > 0 || local >= IMPACT_Q) && release < ink.common.uView.value.y;
    if (meshRef.current) meshRef.current.visible = visible;
    if (!visible) return;
    ink.screen.uniforms.uScroll.value = release;
    // Слова этапа ещё нет (прогрев не успел) — строится в этом же кадре: кадра без слова нет.
    ink.bind(index);
    ink.common.uQ.value = local;
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
