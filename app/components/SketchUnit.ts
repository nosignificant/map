import p5 from "p5";
import { GRID, CANVAS, IMAGE_HISTORY_MAX } from "./Util/constant";
import { updateVsensorImage } from "./sensors/vSensor";
import { vSensor } from "./Arduino";
import { computePos4Shader } from "./Util/shaderUtil";
import { historyImages } from "./SketchHistory";
import { vSensorUnits } from "./Util/imageStore";

const UNIT_SIZE = CANVAS / 3;

export function SketchUnit(container: HTMLElement) {
  let currentIndex = 0;

  const myP = new p5((p: p5) => {
    p.setup = () => {
      p.createCanvas(UNIT_SIZE, UNIT_SIZE, p.WEBGL);
      p.pixelDensity(1);
    };

    p.draw = () => {
      p.background(0);
      p.resetShader();

      p.noFill();
      p.rect(-UNIT_SIZE / 2, -UNIT_SIZE / 2, UNIT_SIZE, UNIT_SIZE);

      p.scale(1 / 3);

      const nearImgs = updateVsensorImage(vSensor, vSensorUnits);
      for (const n of nearImgs) {
        if (n.stage > currentIndex) currentIndex = n.stage;
      }

      for (const n of nearImgs) {
        for (const pos of n.pos) {
          const [x, y] = computePos4Shader(pos);
          p.image(n.image, x - GRID / 2, y - GRID / 2, GRID, GRID);
        }
      }
    };

    p.mousePressed = () => {
      for (let i = 0; i < currentIndex; i++) {
        historyImages.unshift(vSensorUnits[i]);
      }
      if (historyImages.length > IMAGE_HISTORY_MAX) historyImages.length = IMAGE_HISTORY_MAX;
    };
  }, container);

  return myP;
}
