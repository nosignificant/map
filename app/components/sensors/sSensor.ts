import p5 from "p5";
import { SSensor } from "../Util/types";

export const ANGLE_STEP = 3;
const CELL_CM = 100; // 1 grid cell = 1m
export const MAX_CM = 600;
export const PX_PER_CELL = 150; // 1 cell의 픽셀 반경
const MAX_CELLS = MAX_CM / CELL_CM; // = 6
const DOT_SIZE = PX_PER_CELL * 0.3;

export const SONAR_R = MAX_CELLS * PX_PER_CELL;

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

export type SonarItem = { pos: [number, number]; image: p5.Image };

export function updateSSensorImage(data: SSensor[], dir: -1 | 1, sUnits: Map<string, p5.Image>, scale: number): SonarItem[] {
  const items: SonarItem[] = [];
  for (const s of data) {
    if (s.angle < 0 || s.angle > 180) continue;
    if (s.distance < 15 || s.distance > MAX_CM) continue;
    const snapAngle = Math.round(s.angle / ANGLE_STEP) * ANGLE_STEP;
    const img = getSSensorImage(snapAngle, s.distance, sUnits);
    if (!img) continue;
    const rad = (s.angle * Math.PI) / 180;
    const radius = (s.distance / CELL_CM) * PX_PER_CELL * scale;
    items.push({ pos: [-Math.cos(rad) * radius, dir * Math.sin(rad) * radius], image: img });
  }
  return items;
}

function randomUnit(sUnits: Map<string, p5.Image>, folder: string, prefix: string, count: number): p5.Image | null {
  const idx = Math.floor(Math.random() * count) + 1;
  return sUnits.get(`/units/sSensor/${folder}/${prefix}_${idx}.png`) ?? null;
}

//거리 별 이미지
export function getSSensorImage(angle: number, distance: number, sUnits: Map<string, p5.Image>): p5.Image | null {
  if (distance >= 405 && distance <= 600) return randomUnit(sUnits, "a", "A", 15);
  if (distance >= 210 && distance <= 404) return randomUnit(sUnits, "b", "B", 15);
  if (distance >= 15 && distance <= 209) {
    const seed = Math.floor(angle / 3);
    const bar = seed % 2;
    const flag = (seed + 1) % 3;
    const variation = Math.floor(Math.random() * 6);
    return sUnits.get(`/units/sSensor/c/d${pad2(seed)}_b${bar}_f${flag}_v${variation}.png`) ?? null;
  }
  return null;
}
