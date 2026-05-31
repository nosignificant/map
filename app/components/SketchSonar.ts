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
      for (const i of currentSsensor1IMG) {
        for (const [ci, ri] of i.imgSet.edgeResult.drawn) {
          const px = i.pos[0] + ci * 10;
          const py = i.pos[1] + ri * 10; //imageStore쪽에 변수 있어!!
          p.noStroke();
          p.fill(249, 99, 28);
          p.rect(px - 100, py - 100, 10, 10);
        }

        p.image(i.imgSet.img, i.pos[0] - SONAR_IMG_SIZE / 2, i.pos[1] - SONAR_IMG_SIZE / 2, SONAR_IMG_SIZE, SONAR_IMG_SIZE);
      }
      for (const i of currentSsensor2IMG) {
        for (const [ci, ri] of i.imgSet.edgeResult.drawn) {
          const px = i.pos[0] + ci * 10;
          const py = i.pos[1] + ri * 10; //imageStore쪽에 변수 있어!!
          p.noStroke();
          p.fill(249, 99, 28);
          p.rect(px - 100, py - 100, 10, 10);
        }
        p.image(i.imgSet.img, i.pos[0] - SONAR_IMG_SIZE / 2, i.pos[1] - SONAR_IMG_SIZE / 2, SONAR_IMG_SIZE, SONAR_IMG_SIZE);
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
}
