import p5 from "p5";
import { GRID, CANVAS } from "./Util/constant";
import { updateVsensorImage } from "./sensors/vSensor";
import { vSensor } from "./Arduino";

export function SketchUnit(container: HTMLElement) {
  const myP = new p5((p: p5) => {
    p.setup = () => {
      p.createCanvas(CANVAS, CANVAS);
      p.pixelDensity(1);
    };

    p.draw = () => {
      p.clear();

      // vSensor 단계 이미지 (units-3pt-yl) — 현재 stage까지 누적
      const nearImgs = updateVsensorImage(vSensor);
      for (const n of nearImgs) {
        for (const [x, y] of n.pos) {
          p.image(n.image, x - GRID / 2, y - GRID / 2, GRID, GRID);
        }
      }
    };
  }, container);

  return myP;
}
