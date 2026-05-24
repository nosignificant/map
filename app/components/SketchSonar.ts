import p5 from "p5";
import { sSensor, initSSensor, randomizeSSensor } from "./Util/sSensorStore";
import { drawSonarHalf, SONAR_R, ANGLE_STEP, MAX_CM } from "./sensors/sSensor";
import { CANVAS } from "./Util/constant";

const SIZE = CANVAS / 3;

export function SketchSonar(container: HTMLElement) {
  const myP = new p5((p: p5) => {
    p.setup = () => {
      p.createCanvas(SIZE, SIZE);
      p.pixelDensity(1);
      initSSensor();
    };

    p.draw = () => {
      p.background(0);

      // 테두리 (translate 전, P2D 원점 = 좌상단)
      p.noFill();
      p.stroke(255);
      p.strokeWeight(2);
      p.rect(0, 0, SIZE, SIZE);

      p.translate(SIZE / 2, SIZE / 2);
      p.scale(SIZE / (SONAR_R * 2));
      drawSonarHalf(p, sSensor, false);
      drawSonarHalf(p, sSensor, true);
    };

    p.mousePressed = () => {
      if (p.mouseButton === p.RIGHT) randomizeSSensor(ANGLE_STEP, MAX_CM);
    };
  }, container);

  return myP;
}
