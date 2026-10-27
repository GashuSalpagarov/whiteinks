"use client";

import { invalidate, useFrame, useThree } from "@react-three/fiber";
import { type RefObject, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useLenis } from "@/app/providers";

// Поток частиц из точки: точки и штрихи летят из ядра к камере и за спину. Карточки кейсов —
// HTML поверх канваса (Scene3.tsx), здесь только поток.
const PARTICLE_COUNT = 330;
const STREAK_COUNT = 70;
const STREAK_LENGTH = 0.3;
const SCROLL_DRIVE_FACTOR = 10; // путь частицы за всю сцену (p 0 → 1)
// Поток уже идёт, когда сцена началась: сдвиг больше самого длинного пути — каждая частица на своём
// месте ровного потока. Сколько его видно, решает reveal (Scene3.tsx): доля пути от точки.
const PREWARM = 8;
const CONE_HALF_ANGLE = Math.PI / 3;
const RESPAWN_PAST_CAMERA = 0.5;
// Частица растёт к камере, но не больше 6px экрана — вдвое меньше точки пути (12px), чтобы глаз
// их не путал. В шейдере size — размер материала × DPR, в px экрана — size × (высота / 2) / глубина.
const PARTICLE_SIZE = 0.015;
const PARTICLE_MAX_PX = 6;
function capParticle(shader: THREE.WebGLProgramParametersWithUniforms) {
  shader.vertexShader = shader.vertexShader.replace(
    "#include <logdepthbuf_vertex>",
    `gl_PointSize = min(gl_PointSize, size * ${(PARTICLE_MAX_PX / PARTICLE_SIZE).toFixed(1)});
#include <logdepthbuf_vertex>`,
  );
}

// Камера стоит: летят только частицы.
const CAMERA_Z = 3.5;
const CAMERA_FOV = 95;

// Реакция на скорость скролла. v — скорость Lenis, приведённая к −1..1 и сглаженная пружиной.
// В покое v = 0, и сцена выглядит ровно как без этой реакции.
const VELOCITY_MAX = 60; // px за кадр (при 60 fps), которые считаем резким броском → |v| = 1
const VELOCITY_STIFFNESS = 80; // жёсткость пружины: выше — быстрее догоняет скорость скролла
const VELOCITY_DAMPING = 7; // затухание: ниже — заметнее перелёт через 0 при остановке
const STREAK_STRETCH = 2; // при |v| = 1 штрих длиннее в (1 + STREAK_STRETCH) раз

interface Props {
  progressRef: RefObject<number>; // p: 0 — сцена началась, 1 — закончилась
  // Поток: прозрачность и reveal — до какой доли пути от точки он уже виден (0 — только точка,
  // 1 — весь, до камеры). Ведёт Scene3.tsx.
  streamRef: RefObject<{ opacity: number; reveal: number }>;
}

function forwardConeRandom(out: { x: number; y: number; z: number }) {
  const azimuth = Math.random() * 2 * Math.PI;
  const phi = Math.random() * CONE_HALF_ANGLE;
  const sinPhi = Math.sin(phi);
  out.x = sinPhi * Math.cos(azimuth);
  out.y = sinPhi * Math.sin(azimuth);
  out.z = Math.cos(phi);
}

function createCircleTexture(): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.beginPath();
  ctx.arc(32, 32, 30, 0, Math.PI * 2);
  ctx.fillStyle = "white";
  ctx.fill();
  return new THREE.CanvasTexture(canvas);
}

// Направления, длины путей и фазы потока. Фазы — равномерно по всему пути: поток ровный, без волн.
// Путь — до камеры и чуть за неё: respawnZ / dir.z, при конусе 60° — не длиннее 2·respawnZ.
function createStream(count: number, vertices: number) {
  const positions = new Float32Array(count * vertices * 3).fill(0);
  const directions = new Float32Array(count * 3);
  const pathLengths = new Float32Array(count);
  const phases = new Float32Array(count);
  const dir = { x: 0, y: 0, z: 0 };
  const respawnZ = CAMERA_Z + RESPAWN_PAST_CAMERA;
  for (let i = 0; i < count; i++) {
    forwardConeRandom(dir);
    directions[i * 3] = dir.x;
    directions[i * 3 + 1] = dir.y;
    directions[i * 3 + 2] = dir.z;
    pathLengths[i] = respawnZ / dir.z;
    phases[i] = Math.random() * pathLengths[i];
    for (let v = 0; v < vertices; v++) positions[(i * vertices + v) * 3 + 2] = 1e6;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return { positions, directions, pathLengths, phases, geometry };
}

export function Scene3R3F({ progressRef, streamRef }: Props) {
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const prevPRef = useRef<number>(-1);
  const prevStreakLengthRef = useRef<number>(STREAK_LENGTH);
  const springRef = useRef({ v: 0, dv: 0 }); // v — сглаженная скорость, dv — её скорость
  const { camera } = useThree();
  // Контекст Lenis доходит сюда через мост контекстов R3F-канваса (GlobalCanvas внутри Providers).
  const lenis = useLenis();

  useEffect(() => {
    const persp = camera as THREE.PerspectiveCamera;
    persp.position.set(0, 0, CAMERA_Z);
    persp.fov = CAMERA_FOV;
    persp.updateProjectionMatrix();
    invalidate();
  }, [camera]);

  const particleTexture = useMemo(() => createCircleTexture(), []);
  const pointsData = useMemo(() => createStream(PARTICLE_COUNT, 1), []);
  const streaksData = useMemo(() => createStream(STREAK_COUNT, 2), []);

  useFrame((_, delta) => {
    if (!pointsRef.current || !linesRef.current) return;
    const p = progressRef.current;
    const inScene = p > 0 && p < 1 ? 1 : 0;

    // Скорость Lenis (px за кадр, со знаком) → −1..1. Делим на dt·60, чтобы на 120 Гц
    // (вдвое меньше px за кадр) отклик был тем же. Сглаживаем пружиной, а не lerp:
    // при остановке v чуть перелетает через 0 и успокаивается.
    const dt = Math.min(delta, 1 / 30); // после простоя канваса и возврата во вкладку delta огромный
    const rawV = (lenis?.velocity ?? 0) / (Math.max(dt, 1 / 240) * 60 * VELOCITY_MAX);
    const targetV = Math.max(-1, Math.min(1, rawV));
    const spring = springRef.current;
    spring.dv += (VELOCITY_STIFFNESS * (targetV - spring.v) - VELOCITY_DAMPING * spring.dv) * dt;
    spring.v += spring.dv * dt;
    const v = spring.v;
    // Канвас рисует по запросу (frameloop="demand"): пока пружина не успокоилась — ещё кадр.
    // Только в сцене и пока это видно: остаток меньше 0.001 — доля пикселя у штрихов.
    if (inScene && (targetV !== 0 || Math.abs(v) + Math.abs(spring.dv) > 1e-3)) invalidate();

    // alphaTest масштабируем вместе с opacity, иначе при opacity < 0.5 частицы (жёсткий диск
    // в текстуре) пропадали бы скачком.
    const opacity = inScene * streamRef.current.opacity;
    const pointsMaterial = pointsRef.current.material as THREE.PointsMaterial;
    pointsMaterial.opacity = opacity;
    pointsMaterial.alphaTest = Math.max(0.01, 0.5 * opacity);
    (linesRef.current.material as THREE.LineBasicMaterial).opacity = opacity;

    if (!inScene) return;
    // Пересчёт, если сдвинулся p или ещё меняется длина штрихов (скорость затухает после остановки).
    const streakLength = STREAK_LENGTH * (1 + Math.abs(v) * STREAK_STRETCH);
    const pSame = Math.abs(p - prevPRef.current) < 1e-6;
    if (pSame && Math.abs(streakLength - prevStreakLengthRef.current) < 1e-4) return;
    prevPRef.current = p;
    prevStreakLengthRef.current = streakLength;

    const acc = p * SCROLL_DRIVE_FACTOR + PREWARM;
    const reveal = streamRef.current.reveal;

    {
      const { positions, directions, pathLengths, phases } = pointsData;
      for (let i = 0; i < phases.length; i++) {
        const ix = i * 3;
        const pl = pathLengths[i];
        const t = ((acc - phases[i]) % pl) / pl;
        if (t > reveal) {
          positions[ix + 2] = 1e6;
          continue;
        }
        // Ускорение к камере: далеко медленно, близко быстро.
        const along = pl * t * t;
        positions[ix] = directions[ix] * along;
        positions[ix + 1] = directions[ix + 1] * along;
        positions[ix + 2] = directions[ix + 2] * along;
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }

    {
      const { positions, directions, pathLengths, phases } = streaksData;
      for (let i = 0; i < phases.length; i++) {
        const ix = i * 6;
        const pl = pathLengths[i];
        const t = ((acc - phases[i]) % pl) / pl;
        if (t > reveal) {
          positions[ix + 2] = 1e6;
          positions[ix + 5] = 1e6;
          continue;
        }
        const front = pl * t * t;
        const back = Math.max(0, front - streakLength);
        const dirX = directions[i * 3];
        const dirY = directions[i * 3 + 1];
        const dirZ = directions[i * 3 + 2];
        positions[ix] = dirX * back;
        positions[ix + 1] = dirY * back;
        positions[ix + 2] = dirZ * back;
        positions[ix + 3] = dirX * front;
        positions[ix + 4] = dirY * front;
        positions[ix + 5] = dirZ * front;
      }
      linesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <>
      <points ref={pointsRef} geometry={pointsData.geometry} frustumCulled={false}>
        <pointsMaterial
          color="#0a0a0a"
          size={PARTICLE_SIZE}
          sizeAttenuation
          transparent
          map={particleTexture}
          alphaTest={0.5}
          onBeforeCompile={capParticle}
        />
      </points>
      <lineSegments ref={linesRef} geometry={streaksData.geometry} frustumCulled={false}>
        <lineBasicMaterial color="#0a0a0a" transparent />
      </lineSegments>
    </>
  );
}
