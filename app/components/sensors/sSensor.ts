import { ImgSet, Saccumulate, Ssensor, Tentacle } from "../Util/types";
import { GRID } from "../Util/constant";
import { makeTentacle, sTentacleAlert } from "../drawings/tentacles";
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
const TRAIL_GAP = 8; // 궤적 점 간 최소 거리(px)
const TRAIL_MAX = 400; // 궤적 점 최대 개수 (상한, 전체 공유)

// sSensor 전체 공유 궤적 — 이미지가 사라져도 유지됨
export const sTrail: [number, number][] = [];

function pushTrail(pos: [number, number]) {
  const last = sTrail[sTrail.length - 1];
  if (last && Math.hypot(pos[0] - last[0], pos[1] - last[1]) <= TRAIL_GAP) return;
  sTrail.push([pos[0], pos[1]]);
  if (sTrail.length > TRAIL_MAX) sTrail.shift();
}

export function updateSSensorImage(sacc: Saccumulate[], sSensor: Ssensor[], TIME: number) {
  // 상한 넘으면 가장 오래된 것부터 제거 (메모리 안전망)
  while (sSensor.length > MAX_IMAGES) sSensor.shift();

  for (let i = sSensor.length - 1; i >= 0; i--) {
    const s = sSensor[i];

    const next = calculateNextPos(sacc, s);
    if (next) {
      s.pos[0] += (next[0] - s.pos[0]) * 0.1; // lerp
      s.pos[1] += (next[1] - s.pos[1]) * 0.1;
      s.angle = (Math.atan2(s.pos[1], s.pos[0]) * 180) / Math.PI;
    }

    // 궤적 기록 — 전체 공유 배열에 (이미지 사라져도 유지)
    pushTrail(s.pos);

    // 발 뿌리를 이미지 현재 위치로 따라오게
    sTentacleAlert(s.pos, s.tentacles);

    s.t -= TIME;
    if (s.t <= 0) sSensor.splice(i, 1);
  }
}

function calculateNextPos(Sacc: Saccumulate[], sSensor: Ssensor): [number, number] | null {
  // 현재 각도 freq
  const current = Sacc.find((s) => Math.abs(s.angle - sSensor.angle) < ANGLE_STEP);
  const currentFreq = current?.freq ?? 0;

  let totalX = 0;
  let totalY = 0;
  let totalFreq = 0;
  let count = 0;
  for (const s of Sacc) {
    if (Math.abs(s.angle - sSensor.angle) > 30) continue;
    totalX += s.pos[0];
    totalY += s.pos[1];
    totalFreq += s.freq;
    count++;
  }
  const WANDER = 60; // 랜덤 떠돌기 크기
  const wander = (): [number, number] => [sSensor.pos[0] + (Math.random() - 0.5) * WANDER, sSensor.pos[1] + (Math.random() - 0.5) * WANDER];

  // 주변에 누적 데이터 없으면 사방으로 랜덤 워크
  if (count === 0) return wander();

  const avgFreq = totalFreq / count;
  const prob = (avgFreq - currentFreq) / avgFreq;

  // freq 높은 쪽으로 끌릴지 결정 — 실패해도 멈추지 말고 랜덤 워크
  if (Math.random() > prob) return wander();

  // 가중 평균 쪽으로 가되 큰 랜덤 흔들림 추가
  return [totalX / count + (Math.random() - 0.5) * WANDER, totalY / count + (Math.random() - 0.5) * WANDER];
}

export function initSsensor(angle: number, distance: number, time: number, dir: -1 | 1): Ssensor | null {
  if (angle < 0 || angle > 180) return null;
  if (distance < 15 || distance > MAX_CM) return null;

  const snapAngle = Math.round(angle / ANGLE_STEP) * ANGLE_STEP;
  const imgSet = getSSensorImgSet(snapAngle, distance, sSensorImgSets); // 캐시에서 꺼냄
  if (!imgSet) return null;

  const rad = (angle * Math.PI) / 180;
  const radius = (distance / CMtoPX) * PX_PER_CELL;
  const x = Math.floor(-Math.cos(rad) * radius);
  const y = Math.floor(dir * Math.sin(rad) * radius);
  const tens: Tentacle[] = [];
  for (let i = 0; i < 3; i++) {
    tens.push(makeTentacle([x, y], 100, 4));
  }
  return { pos: [x, y], angle: angle, tentacles: tens, imgSet: imgSet, t: time, settle: false };
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
