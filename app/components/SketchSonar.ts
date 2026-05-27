import p5 from "p5";
import { sSensor1, sSensor2, randomizeSSensor } from "./Arduino";
import { SONAR_R, updateSSensorImage, PX_PER_CELL } from "./sensors/sSensor";
import { CANVAS } from "./Util/constant";
import { sSensorUnits } from "./Util/imageStore";

const SIZE = CANVAS / 3;

export function SketchSonar(container: HTMLElement) {
  const myP = new p5((p: p5) => {
    p.setup = () => {
      p.createCanvas(SIZE, SIZE);
      p.pixelDensity(1);
    };

    p.draw = () => {
      p.background(0);
      p.noFill();
      p.rect(0, 0, SIZE, SIZE);
      const scale = SIZE / (SONAR_R * 2);

      p.translate(SIZE / 2, SIZE / 2);
      p.scale(scale);
      p.resetMatrix();

      // 이미지: scale 적용된 좌표에 그리기
      p.translate(SIZE / 2, SIZE / 2);
      const cellPx = PX_PER_CELL * scale;
      for (const item of updateSSensorImage(sSensor1, -1, sSensorUnits, scale))
        p.image(item.image, item.pos[0] - cellPx / 2, item.pos[1] - cellPx / 2, cellPx, cellPx);
      for (const item of updateSSensorImage(sSensor2, 1, sSensorUnits, scale))
        p.image(item.image, item.pos[0] - cellPx / 2, item.pos[1] - cellPx / 2, cellPx, cellPx);
    };

    p.mousePressed = () => {
      if (p.mouseButton === p.RIGHT) randomizeSSensor();
    };
  }, container);

  return myP;
}
