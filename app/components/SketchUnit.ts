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

      // v 센서 이미지 그리기 (stage 변화 감지 + history 추가는 updateVsensorImage 내부에서 자동)
      const nearImgs = updateVsensorImage(vSensor);

      for (const n of nearImgs) {
        for (const pos of n.pos) {
          const [x, y] = pos;
          p.image(n.image, x - GRID / 2, y - GRID / 2, GRID, GRID);
        }
      }
    };
  }, container);

  return myP;
}
