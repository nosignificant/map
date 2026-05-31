import p5 from "p5";
import { currentSsensor1IMG, currentSsensor2IMG, sSensor1Accumulate, sSensor2Accumulate } from "./Arduino";
import { CANVAS } from "./Util/constant";
import { Saccumulate } from "./Util/types";
import { sSensorUnits } from "./Util/imageStore";

// 곡선 따라 찍을 이미지 개수 / 크기
const STAMP_PER_SEGMENT = 8;
const STAMP_SIZE = 40;

const SONAR_IMG_SIZE = 200;

export function SketchSonar(container: HTMLElement) {
  const myP = new p5((p: p5) => {
    p.setup = () => {
      p.createCanvas(CANVAS, CANVAS);
      p.pixelDensity(1);
    };

    p.draw = () => {
      p.clear();
      p.translate(CANVAS / 2, CANVAS / 2);

      // 누적 점들을 잇는 bezier curve (freq별 휨)
      drawAccumCurve(p, sSensor1Accumulate);
      drawAccumCurve(p, sSensor2Accumulate);

      // 기존 sSensor 이미지
      for (const img of currentSsensor1IMG) {
        p.image(img.image, img.pos[0] - SONAR_IMG_SIZE / 2, img.pos[1] - SONAR_IMG_SIZE / 2, SONAR_IMG_SIZE, SONAR_IMG_SIZE);
      }
      for (const img of currentSsensor2IMG) {
        p.image(img.image, img.pos[0] - SONAR_IMG_SIZE / 2, img.pos[1] - SONAR_IMG_SIZE / 2, SONAR_IMG_SIZE, SONAR_IMG_SIZE);
      }
    };
  }, container);

  return myP;
}

const TARGET_POINTS = 4; // 누적 점들을 N개 대표점으로 압축

// 누적 점들을 angle 순으로 정렬 → TARGET_POINTS개 그룹으로 평균
// 각 그룹의 평균 위치 + 평균 freq로 bezier 그림
function drawAccumCurve(p: p5, acc: Saccumulate[]) {
  if (acc.length < 2) return;

  // 1) angle 순 정렬 + 가드
  const sorted = [...acc].sort((a, b) => a.angle - b.angle).filter((a) => a.pos && Number.isFinite(a.pos[0]) && Number.isFinite(a.pos[1]));
  if (sorted.length < 2) return;

  // 2) 그룹 크기 계산 + 그룹별 평균 (pos, freq)
  const groupSize = Math.max(1, Math.ceil(sorted.length / TARGET_POINTS));
  const groups: { pos: [number, number]; avgFreq: number }[] = [];
  for (let i = 0; i < sorted.length; i += groupSize) {
    const slice = sorted.slice(i, i + groupSize);
    let sumX = 0,
      sumY = 0,
      sumFreq = 0;
    for (const a of slice) {
      sumX += a.pos[0];
      sumY += a.pos[1];
      sumFreq += a.freq;
    }
    groups.push({
      pos: [sumX / slice.length, sumY / slice.length],
      avgFreq: sumFreq / slice.length,
    });
  }
  if (groups.length < 2) return;

  // 3) 대표점들을 bezier로 잇기
  p.noFill();
  p.stroke(255, 255, 255, 200);
  p.strokeWeight(2);

  for (let i = 0; i < groups.length - 1; i++) {
    const a = groups[i];
    const b = groups[i + 1];
    const [x1, y1] = a.pos;
    const [x2, y2] = b.pos;

    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    if (len < 0.001) continue;
    const perpX = -dy / len;
    const perpY = dx / len;

    // 두 그룹의 평균 freq → 휨 (최소 segment 길이의 30%, 더 커질수록 휨 증가)
    const segFreq = (a.avgFreq + b.avgFreq) / 2;
    const bulge = Math.max(len * 0.3, segFreq * 20);

    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const cx = mx + perpX * bulge;
    const cy = my + perpY * bulge;

    if (!Number.isFinite(cx) || !Number.isFinite(cy)) continue;

    // bezier 곡선 따라 이미지 stamp (회전 포함)
    stampImagesOnCurve(p, x1, y1, cx, cy, x2, y2);
  }
}

// quadratic bezier 곡선 따라 N개 이미지를 회전시켜 stamp
function stampImagesOnCurve(p: p5, x1: number, y1: number, cx: number, cy: number, x2: number, y2: number) {
  if (sSensorUnits.size === 0) return;
  const imgs = Array.from(sSensorUnits.values());

  for (let s = 0; s <= STAMP_PER_SEGMENT; s++) {
    const t = s / STAMP_PER_SEGMENT;
    const mt = 1 - t;

    // bezier 위의 점 (quadratic)
    const bx = mt * mt * x1 + 2 * mt * t * cx + t * t * x2;
    const by = mt * mt * y1 + 2 * mt * t * cy + t * t * y2;

    // 접선 (방향) — 회전용
    const tanX = 2 * mt * (cx - x1) + 2 * t * (x2 - cx);
    const tanY = 2 * mt * (cy - y1) + 2 * t * (y2 - cy);
    const angle = Math.atan2(tanY, tanX);

    // 이미지 선택 (순환)
    const img = imgs[s % imgs.length];
    if (!img) continue;

    p.push();
    p.translate(bx, by);
    p.rotate(angle);
    p.image(img, -STAMP_SIZE / 2, -STAMP_SIZE / 2, STAMP_SIZE, STAMP_SIZE);
    p.pop();
  }
}
