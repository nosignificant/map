import p5 from "p5";
import { Ssensor, SsensorImagePos } from "../Util/types";
import { GRID } from "../Util/constant";
import { MakeImgSet } from "../Util/edgeAndCorner";

export const ANGLE_STEP = 3;
export const CMtoPX = 100; // 1 cell = 1m
export const MAX_CM = 500; // 측정 최대 거리 (5m)
export const PX_PER_CELL = GRID * 3; // 한칸당 크기
const MAX_CELLS = MAX_CM / CMtoPX; // 칸 개수(5칸)

export const SONAR_R = MAX_CELLS * PX_PER_CELL; // 지름 1200px 반지름 600px

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

export function updateSSensorImage(sIMG: SsensorImagePos[], TIME: number) {
  for (let i = sIMG.length - 1; i >= 0; i--) {
    sIMG[i].t -= TIME;
    if (sIMG[i].t <= 0) sIMG.splice(i, 1);
  }
}

export function initSsensorIMGpos(angle: number, distance: number, time: number, dir: -1 | 1, sUnits: Map<string, p5.Image>): SsensorImagePos | null {
  if (angle < 0 || angle > 180) return null;
  if (distance < 15 || distance > MAX_CM) return null;

  const snapAngle = Math.round(angle / ANGLE_STEP) * ANGLE_STEP;
  const img = getSSensorImage(snapAngle, distance, sUnits);
  if (!img) return null;

  const rad = (angle * Math.PI) / 180;
  const radius = (distance / CMtoPX) * PX_PER_CELL;
  const x = Math.floor(-Math.cos(rad) * radius);
  const y = Math.floor(dir * Math.sin(rad) * radius);

  return { pos: [x, y], image: img, t: time };
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
