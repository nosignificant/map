import { ImgSet, Ssensor } from "../Util/types";
import { GRID } from "../Util/constant";
import { sSensorImgSets } from "../Util/imageStore";

export const ANGLE_STEP = 3;
export const CMtoPX = 100; // 1 cell = 1m
export const MAX_CM = 500; // 측정 최대 거리 (5m)
export const PX_PER_CELL = GRID * 3; // 한칸당 크기
const MAX_CELLS = MAX_CM / CMtoPX;
export const SONAR_R = MAX_CELLS * PX_PER_CELL; // 반지름 600px

export const SLOT_DEG = 30; // 슬롯 각도 간격
export const SLOTS = Math.round(180 / SLOT_DEG); // 한쪽당 슬롯 수 (6: 0,30,60,90,120,150)


function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

// 각도+거리 → 화면 위치 (center-origin)
function angleToPos(angle: number, distance: number, dir: -1 | 1): [number, number] {
  const rad = (angle * Math.PI) / 180;
  const radius = (distance / CMtoPX) * PX_PER_CELL;
  return [Math.floor(-Math.cos(rad) * radius), Math.floor(dir * Math.sin(rad) * radius)];
}

// 고정 슬롯 세트 생성 (위/아래 각 SLOTS개)
export function initSsensorSet(dir: -1 | 1): Ssensor[] {
  const set: Ssensor[] = [];
  for (let i = 0; i < SLOTS; i++) {
    const angle = i * SLOT_DEG;
    set.push({ angle, dir, pos: [0, 0], targetPos: [0, 0], imgSet: null, dist: 0 });
  }
  return set;
}

// 측정값 들어오면 해당 각도 슬롯의 거리→pos·이미지 갱신
export function updateSlot(set: Ssensor[], angle: number, distance: number): Ssensor | null {
  if (distance < 15 || distance > MAX_CM) return null;
  const idx = Math.min(Math.round(angle / SLOT_DEG), SLOTS - 1);
  const slot = set[idx];
  if (!slot) return null;
  const imgSet = getSSensorImgSet(slot.angle, distance, sSensorImgSets);
  if (!imgSet) return null;
  slot.imgSet = imgSet;
  slot.dist = distance;
  slot.targetPos = angleToPos(slot.angle, distance, slot.dir); // 목표만 갱신 (점진 이동은 매 프레임)
  return slot;
}

const LERP = 0.08; // 점진 이동 속도
const NOISE = 1.5; // 떨림 노이즈(px)

// 매 프레임: targetPos로 점진 이동(+노이즈)
export function updateSSensor(set: Ssensor[]) {
  for (const s of set) {
    if (!s.imgSet) continue;
    // 목표로 점진 이동 + 떨림
    s.pos[0] += (s.targetPos[0] - s.pos[0]) * LERP + (Math.random() - 0.5) * NOISE;
    s.pos[1] += (s.targetPos[1] - s.pos[1]) * LERP + (Math.random() - 0.5) * NOISE;
  }
}

// ===== 이미지 선택 (거리 band별) =====
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
