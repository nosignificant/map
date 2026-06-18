import p5 from "p5";
import { CANVAS } from "./Util/constant";
import { drawCross } from "./drawings/draw";
import { vSensorAccumulate, sSensor1Accumulate, sSensor2Accumulate, fg } from "./Arduino";
import { Saccumulate } from "./Util/types";
import { snapToCheck } from "./drawings/checkerboard";

const KEEP = 7;

// sSensor(center-origin) → top-left + fullGrid 스냅 / vSensor는 그대로
function conv(pos: [number, number], sSensor: boolean): [number, number] {
  if (!sSensor) return [pos[0], pos[1]];
  return snapToCheck([pos[0] + CANVAS / 2, pos[1] + CANVAS / 2], fg);
}

// 최근 15개 위치
function recent(acc: { pos: [number, number] }[], sSensor = false): [number, number][] {
  return acc.slice(-KEEP).map((a) => conv(a.pos, sSensor));
}

// freq 높은 순 15개 위치
function topFreq(acc: { pos: [number, number]; freq: number }[], sSensor = false): [number, number][] {
  return [...acc]
    .sort((a, b) => b.freq - a.freq)
    .slice(0, KEEP)
    .map((a) => conv(a.pos, sSensor));
}

const MARK = 50; // 마커 크기

// 한 그룹: 베지어로 잇고 + 마커(원/네모, 채움/테두리) + 십자(흰/검)
function drawGroup(p: p5, pts: [number, number][], shape: "circle" | "rect", filled: boolean, crossWhite: boolean) {
  if (pts.length === 0) return;

  // 베지어 곡선 (점 사이 연결)
  p.noFill();
  p.stroke(0);
  p.strokeWeight(2);
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? pts[i + 1];
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    p.bezier(p1[0], p1[1], cp1x, cp1y, cp2x, cp2y, p2[0], p2[1]);
  }

  for (const [x, y] of pts) {
    // 마커
    if (filled) {
      p.fill(0);
      p.noStroke();
    } else {
      p.noFill();
      p.stroke(0);
      p.strokeWeight(2);
    }
    if (shape === "circle") p.circle(x, y, MARK);
    else p.rect(x - MARK / 2, y - MARK / 2, MARK, MARK);

    // 십자
    p.stroke(crossWhite ? 255 : 0);
    p.strokeWeight(2);
    drawCross(p, x, y);
  }
}

export function SketchPrint(container: HTMLElement) {
  const myP = new p5((p: p5) => {
    p.setup = () => {
      p.createCanvas(CANVAS, CANVAS);
      p.pixelDensity(1);
    };

    p.draw = () => {
      p.clear();

      const sAcc: Saccumulate[] = [...sSensor1Accumulate, ...sSensor2Accumulate];

      // old = freq 상위 15 (뒤에), current = 최근 15 (위에)
      drawGroup(p, topFreq(vSensorAccumulate), "rect", true, true); //  vSensor old: 검은 네모 + 흰 십자
      drawGroup(p, topFreq(sAcc, true), "rect", false, false); //       sSensor old: 검은 테두리 네모 + 검은 십자
      drawGroup(p, recent(vSensorAccumulate), "circle", true, true); // vSensor: 검은 동그라미 + 흰 십자
      drawGroup(p, recent(sAcc, true), "circle", false, false); //      sSensor: 검은 테두리 동그라미 + 검은 십자
    };
  }, container);

  return myP;
}
