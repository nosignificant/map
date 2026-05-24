import p5 from "p5";
import { SSensor } from "../Util/types";

export const ANGLE_STEP = 10; // 각도 10° 간격
const CELL_CM = 100; // 1 grid cell = 1m
export const MAX_CM = 600; // vSensor 6단계에 맞춰 6개 ring
const PX_PER_CELL = 150; // 1 cell의 픽셀 반경
const MAX_CELLS = MAX_CM / CELL_CM; // = 6
const DOT_SIZE = PX_PER_CELL * 0.3;

export const SONAR_R = MAX_CELLS * PX_PER_CELL;

export function drawSonarHalf(p: p5, data: SSensor[], flip: boolean) {
  const dir = flip ? 1 : -1;

  // 1) 폴라 그리드 — 테두리만 (흰색 ring)
  p.noFill();
  p.stroke(255);
  p.strokeWeight(1);
  for (let a = 0; a <= 180; a += ANGLE_STEP) {
    const rad = (a * Math.PI) / 180;
    for (let r = 1; r <= MAX_CELLS; r++) {
      const radius = r * PX_PER_CELL;
      p.circle(radius * Math.cos(rad), dir * radius * Math.sin(rad), DOT_SIZE);
    }
  }

  // 3) 측정점 — 그리드 위치에 초록 채워진 원
  p.noStroke();
  p.fill(0, 255, 0);
  for (const s of data) {
    const snapAngle = Math.round(s.angle / ANGLE_STEP) * ANGLE_STEP;
    const cells = Math.round(s.distance / CELL_CM);
    if (cells < 1 || cells > MAX_CELLS) continue;
    if (snapAngle < 0 || snapAngle > 180) continue;

    const rad = (snapAngle * Math.PI) / 180;
    const radius = cells * PX_PER_CELL;
    p.circle(radius * Math.cos(rad), dir * radius * Math.sin(rad), DOT_SIZE);
  }
}
