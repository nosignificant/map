import p5 from "p5";
import { currentSsensor1IMG, currentSsensor2IMG } from "./Arduino";
import { PX_PER_CELL } from "./sensors/sSensor";
import { CANVAS } from "./Util/constant";

export function SketchSonar(container: HTMLElement) {
  const myP = new p5((p: p5) => {
    p.setup = () => {
      p.createCanvas(CANVAS, CANVAS);
      p.pixelDensity(1);
    };

    p.draw = () => {
      p.clear();
      p.translate(CANVAS / 2, CANVAS / 2);

      for (const img of currentSsensor1IMG) {
        p.image(img.image, img.pos[0] - PX_PER_CELL / 2, img.pos[1] - PX_PER_CELL / 2, PX_PER_CELL, PX_PER_CELL);
      }
      for (const img of currentSsensor2IMG) {
        p.image(img.image, img.pos[0] - PX_PER_CELL / 2, img.pos[1] - PX_PER_CELL / 2, PX_PER_CELL, PX_PER_CELL);
      }
    };
  }, container);

  return myP;
}
