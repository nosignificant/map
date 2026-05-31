import p5 from "p5";
import { Ssensor1, Ssensor2 } from "./Arduino";
import { CANVAS } from "./Util/constant";
import { drawFABRIK } from "./drawings/tentacles";
import { sTrail } from "./sensors/sSensor";

const SONAR_IMG_SIZE = 100;
const TRAIL_RECT = 10; // 궤적 rect 크기

// sSensor 전체 공유 궤적을 rect로 그림 (이미지 사라져도 유지)
function drawTrail(p: p5) {
  p.noStroke();
  p.fill(85, 150, 188);
  for (const [tx, ty] of sTrail) {
    p.rect(tx - TRAIL_RECT / 2, ty - TRAIL_RECT / 2, TRAIL_RECT, TRAIL_RECT);
  }
}
const color: [number, number, number][] = [
  [249, 99, 28],
  [214, 103, 101],
  [85, 150, 188],
];
export function SketchSonar(container: HTMLElement) {
  const myP = new p5((p: p5) => {
    p.setup = () => {
      p.createCanvas(CANVAS, CANVAS);
      p.pixelDensity(1);
    };

    p.draw = () => {
      p.clear();
      p.translate(CANVAS / 2, CANVAS / 2);

      // 공유 궤적 먼저 (이미지 뒤에 깔림)
      drawTrail(p);

      // 기존 sSensor 이미지
      for (const i of Ssensor1) {
        for (const [ci, ri] of i.imgSet.edgeResult.drawn) {
          const px = i.pos[0] + ci * 5;
          const py = i.pos[1] + ri * 5; //imageStore쪽에 변수 있어!!
          p.noStroke();
          //const c = color[Math.floor(Math.random() * 3)];
          p.fill(249, 99, 28);

          //p.fill(...c);
          //p.rect(px - 70, py - 70, 10, 10);
        }
        p.image(i.imgSet.img, i.pos[0] - SONAR_IMG_SIZE / 2, i.pos[1] - SONAR_IMG_SIZE / 2, SONAR_IMG_SIZE, SONAR_IMG_SIZE);
        for (const t of i.tentacles) drawFABRIK(p, t, undefined, false);
      }
      for (const i of Ssensor2) {
        for (const [ci, ri] of i.imgSet.edgeResult.drawn) {
          const px = i.pos[0] + ci * 5;
          const py = i.pos[1] + ri * 5; //imageStore쪽에 변수 있어!!
          p.noStroke();
          //const c = color[Math.floor(Math.random() * 3)];
          p.fill(249, 99, 28);
          //p.rect(px - 70, py - 70, 10, 10);
        }
        p.image(i.imgSet.img, i.pos[0] - SONAR_IMG_SIZE / 2, i.pos[1] - SONAR_IMG_SIZE / 2, SONAR_IMG_SIZE, SONAR_IMG_SIZE);
        for (const t of i.tentacles) drawFABRIK(p, t, undefined, false);
      }
    };
  }, container);

  return myP;
}
