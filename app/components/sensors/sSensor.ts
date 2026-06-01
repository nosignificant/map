import { ImgSet, Saccumulate, Ssensor, Tentacle, CheckerGrid } from "../Util/types";
import { GRID } from "../Util/constant";
import { makeTentacle, sTentacleAlert, stepStentacle } from "../drawings/tentacles";
import { sSensorImgSets } from "../Util/imageStore";

export const ANGLE_STEP = 3;
export const CMtoPX = 100; // 1 cell = 1m
export const MAX_CM = 500; // 측정 최대 거리 (5m)
export const PX_PER_CELL = GRID * 3; // 한칸당 크기
const MAX_CELLS = MAX_CM / CMtoPX; // 칸 개수(5칸)

export const SONAR_R = MAX_CELLS * PX_PER_CELL; // 지름 1200px 반지름 600px

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

const MAX_IMAGES = 60; // 안전 상한: 화면당 이미지 최대 개수
const ALERT_GAP = 50; // 이미지가 이만큼 움직이면 발 뿌리 따라옴(px)
const TRAIL_GAP = 30; // 궤적 점 간 최소 거리(px)
const TRAIL_MAX = 4000; // 궤적 점 최대 개수 (상한, 전체 공유) — 오래 남김

// sSensor 전체 공유 궤적 — 이미지가 사라져도 유지됨 (이미지로 그림)
export const sTrail: { pos: [number, number]; imgSet: ImgSet }[] = [];

function pushTrail(pos: [number, number], imgSet: ImgSet) {
  const last = sTrail[sTrail.length - 1];
  if (last && Math.hypot(pos[0] - last.pos[0], pos[1] - last.pos[1]) <= TRAIL_GAP) return;
  sTrail.push({ pos: [pos[0], pos[1]], imgSet });
  if (sTrail.length > TRAIL_MAX) sTrail.shift();
}

export function updateSSensorImage(sacc: Saccumulate[], sSensor: Ssensor[], fg: CheckerGrid[], TIME: number) {
  // 상한 넘으면 가장 오래된 것부터 제거 (메모리 안전망)
  while (sSensor.length > MAX_IMAGES) sSensor.shift();

  for (let i = sSensor.length - 1; i >= 0; i--) {
    const s = sSensor[i];

    const next = calculateNextPos(sacc, s);
    if (next) {
      s.pos[0] += (next[0] - s.pos[0]) * 0.01; // lerp
      s.pos[1] += (next[1] - s.pos[1]) * 0.01;

      // 반지름을 자기 band(거리대) 안으로 제한 — 각도는 자유, 거리만 묶음
      const r = Math.hypot(s.pos[0], s.pos[1]) || 1;
      const rCm = (r / PX_PER_CELL) * CMtoPX;
      const clampedCm = Math.min(Math.max(rCm, s.band.min), s.band.max);
      if (clampedCm !== rCm) {
        const k = ((clampedCm / CMtoPX) * PX_PER_CELL) / r;
        s.pos[0] *= k;
        s.pos[1] *= k;
      }

      s.angle = (Math.atan2(s.pos[1], s.pos[0]) * 180) / Math.PI;
    }

    // 궤적 기록 — 전체 공유 배열에 (이미지 사라져도 유지)
    pushTrail(s.pos, s.imgSet);

    // sSensor가 일정 거리(ALERT_GAP) 이상 움직였을 때만 발 뿌리 이동 + 새 위치 딛기
    const root = s.tentacles[0]?.startPos;
    const noTarget = s.tentacles[0]?.target == null; // 첫 생성 직후엔 한 번 딛게
    if (!root || noTarget || Math.hypot(s.pos[0] - root[0], s.pos[1] - root[1]) > ALERT_GAP) {
      sTentacleAlert(s.pos, s.tentacles); // 뿌리 이동
      stepStentacle(s, fg); // 발끝 새로 딛기
    }

    s.t -= TIME;
    if (s.t <= 0) {
      // 발/이미지 제거 — 자취는 sTrail이 오래 남김
      sSensor.splice(i, 1);
    }
  }
}

const STEP_DEG = 30; // 한 번에 좌/우로 도는 각도
const WANDER = 30; // 랜덤 흔들림
const RADIAL = 120; // 안/바깥(반지름 방향) 랜덤 폭

// 가장 가까운 accumulate의 freq (없으면 0)
function freqAtPos(Sacc: Saccumulate[], pos: [number, number]): number {
  let best = 0;
  let bestD = Infinity;
  for (const s of Sacc) {
    const d = Math.hypot(pos[0] - s.pos[0], pos[1] - s.pos[1]);
    if (d < bestD) {
      bestD = d;
      best = s.freq;
    }
  }
  return best;
}

// 현재 위치를 중심 기준 a(rad)만큼 회전 (반지름 유지)
function rotate(pos: [number, number], a: number): [number, number] {
  return [pos[0] * Math.cos(a) - pos[1] * Math.sin(a), pos[0] * Math.sin(a) + pos[1] * Math.cos(a)];
}

function calculateNextPos(Sacc: Saccumulate[], sSensor: Ssensor): [number, number] | null {
  const step = (STEP_DEG * Math.PI) / 180;
  const currentFreq = freqAtPos(Sacc, sSensor.pos);

  // 좌 또는 우 30° 회전
  const dir = Math.random() < 0.5 ? 1 : -1;
  let target = rotate(sSensor.pos, dir * step);

  // 그쪽 freq가 이전보다 낮으면 반대로 돌기
  if (freqAtPos(Sacc, target) < currentFreq) {
    target = rotate(sSensor.pos, -dir * step);
  }

  // 안/바깥(반지름 방향) 랜덤 — band-clamp가 범위 잡아줌
  const r = Math.hypot(target[0], target[1]) || 1;
  const radial = (Math.random() - 0.5) * RADIAL;
  target = [target[0] + (target[0] / r) * radial, target[1] + (target[1] / r) * radial];

  return [target[0] + (Math.random() - 0.5) * WANDER, target[1] + (Math.random() - 0.5) * WANDER];
}

export function initSsensor(angle: number, distance: number, time: number, dir: -1 | 1): Ssensor | null {
  if (angle < 0 || angle > 180) return null;
  if (distance < 15 || distance > MAX_CM) return null;

  const snapAngle = Math.round(angle / ANGLE_STEP) * ANGLE_STEP;
  const imgSet = getSSensorImgSet(snapAngle, distance, sSensorImgSets); // 캐시에서 꺼냄
  if (!imgSet) return null;

  const band = getBand(distance);
  if (!band) return null;

  const rad = (angle * Math.PI) / 180;
  const radius = (distance / CMtoPX) * PX_PER_CELL;
  const x = Math.floor(-Math.cos(rad) * radius);
  const y = Math.floor(dir * Math.sin(rad) * radius);
  const tens: Tentacle[] = [];
  for (let i = 0; i < 3; i++) {
    tens.push(makeTentacle([x, y], 150, 8, 70));
  }
  return { pos: [x, y], angle: angle, tentacles: tens, imgSet: imgSet, t: time, settle: false, band };
}

// 거리대(band) 정의 — min/max(cm)와 band 이름
export const BANDS = [
  { name: "a", min: 405, max: 600 },
  { name: "b", min: 210, max: 404 },
  { name: "c", min: 15, max: 209 },
];

// 거리(cm) → 해당 band (없으면 null)
export function getBand(distance: number): { min: number; max: number } | null {
  for (const b of BANDS) {
    if (distance >= b.min && distance <= b.max) return { min: b.min, max: b.max };
  }
  return null;
}

function randomUnit(sUnits: Map<string, ImgSet>, folder: string, prefix: string, count: number): ImgSet | null {
  const idx = Math.floor(Math.random() * count) + 1;
  return sUnits.get(`/units/sSensor/${folder}/${prefix}_${idx}.png`) ?? null;
}

export function getSSensorImgSet(angle: number, distance: number, imgSet: Map<string, ImgSet>): ImgSet | null {
  if (distance >= 405 && distance <= 600) return randomUnit(imgSet, "a", "A", 15);
  if (distance >= 210 && distance <= 404) return randomUnit(imgSet, "b", "B", 15);
  if (distance >= 15 && distance <= 209) {
    const seed = Math.floor(angle / 3);
    const bar = seed % 2;
    const flag = (seed + 1) % 3;
    const variation = Math.floor(Math.random() * 6);
    return imgSet.get(`/units/sSensor/c/d${pad2(seed)}_b${bar}_f${flag}_v${variation}.png`) ?? null;
  }
  return null;
}
