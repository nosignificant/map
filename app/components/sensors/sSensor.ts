import { ImgSet, SsensorImagePos } from "../Util/types";
import { GRID } from "../Util/constant";
import { makeTentacle } from "../drawings/tentacles";
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

export function updateSSensorImage(sIMG: SsensorImagePos[], TIME: number) {
  for (let i = sIMG.length - 1; i >= 0; i--) {
    sIMG[i].t -= TIME;
    if (sIMG[i].t <= 0) sIMG.splice(i, 1);
  }
}

export function initSsensorIMGpos(angle: number, distance: number, time: number, dir: -1 | 1): SsensorImagePos | null {
  if (angle < 0 || angle > 180) return null;
  if (distance < 15 || distance > MAX_CM) return null;

  const snapAngle = Math.round(angle / ANGLE_STEP) * ANGLE_STEP;
  const imgSet = getSSensorImgSet(snapAngle, distance, sSensorImgSets); // 캐시에서 꺼냄
  if (!imgSet) return null;

  const rad = (angle * Math.PI) / 180;
  const radius = (distance / CMtoPX) * PX_PER_CELL;
  const x = Math.floor(-Math.cos(rad) * radius);
  const y = Math.floor(dir * Math.sin(rad) * radius);

  return { pos: [x, y], tentacle: makeTentacle([x, y], 200, 6), imgSet: imgSet, t: time };
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
