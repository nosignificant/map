import p5 from "p5";
import { currentSsensor1IMG, currentSsensor2IMG, sSensor1Accumulate, sSensor2Accumulate } from "./Arduino";
import { CANVAS } from "./Util/constant";
import { Saccumulate } from "./Util/types";

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

// 누적 점들을 angle 순으로 정렬해서 segment마다 bezier curve로 잇기
// 각 segment의 freq 평균에 따라 휨(bulge) 정도 달라짐
function drawAccumCurve(p: p5, acc: Saccumulate[]) {
  if (acc.length < 2) return;

  const sorted = [...acc].sort((a, b) => a.angle - b.angle);

  p.noFill();
  p.stroke(255, 255, 255, 200);
  p.strokeWeight(2);

  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];

    // 가드 — pos 없거나 손상된 항목 스킵
    if (!a.pos || !b.pos) continue;
    const [x1, y1] = a.pos;
    const [x2, y2] = b.pos;
    if (!Number.isFinite(x1) || !Number.isFinite(y1) || !Number.isFinite(x2) || !Number.isFinite(y2)) continue;

    // segment 방향과 그에 수직인 방향
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    if (len < 0.001) continue; // 두 점 같은 위치 → NaN 방지
    const perpX = -dy / len;
    const perpY = dx / len;

    // freq 평균 → 휨 크기 (bulge)
    const segFreq = (a.freq + b.freq) / 2;
    const bulge = segFreq * 5; // freq 10 → 50px 휨

    // 두 점의 중점에서 수직 방향으로 bulge만큼 밀어낸 control point
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const cx = mx + perpX * bulge;
    const cy = my + perpY * bulge;

    // 최종 가드 — cx/cy가 NaN이면 스킵 (freq undefined 같은 경우)
    if (!Number.isFinite(cx) || !Number.isFinite(cy)) {
      console.warn("[drawAccumCurve] NaN cx/cy, skip", { a, b, bulge });
      continue;
    }

    // bezier — start, control1, control2, end (control 동일 = quadratic 효과)
    p.bezier(x1, y1, cx, cy, cx, cy, x2, y2);
  }
}
