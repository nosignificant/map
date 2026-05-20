import p5 from "p5";
import { CheckerGrid, VSensor } from "./Util/types";
import { GRID, CANVAS } from "./Util/constant";
import { fullGrid } from "./drawings/checkerboard";
import { updateDistStep } from "./sensors/vSensor";
import { initVSensorStore } from "./Util/vSensorStore";
import { computePos4Shader } from "./Util/shaderUtil";

export function SketchUnit(container: HTMLElement) {
  let fg: CheckerGrid[];
  let vSensor: VSensor[];
  const units: p5.Image[] = [];

  const myP = new p5((p: p5) => {
    p.setup = async () => {
      p.createCanvas(CANVAS / 4, CANVAS / 4, p.WEBGL);
      p.pixelDensity(1);

      fg = fullGrid();
      vSensor = initVSensorStore(fg);

      fetch("/api/img")
        .then((res) => res.json())
        .then((urls: string[]) => {
          urls.forEach((url) => {
            p.loadImage(url, (loadedImg) => {
              units.push(loadedImg);
            });
          });
        });
    };

    p.draw = () => {
      if (!vSensor) return;
      p.background(0);
      p.resetShader();

      // 테두리 (scale 적용 전, WEBGL 캔버스 엣지 = ±CANVAS/8)
      p.noFill();
      p.stroke(255);
      p.strokeWeight(2);
      p.rect(-CANVAS / 8, -CANVAS / 8, CANVAS / 4, CANVAS / 4);

      // 내부 좌표는 CANVAS 기준 → 1/4 캔버스에 맞추려고 0.25 스케일
      p.scale(0.25);

      const nearImgs = updateDistStep(vSensor, units);
      for (const n of nearImgs) {
        for (const pos of n.pos) {
          const [x, y] = computePos4Shader(pos);
          p.image(n.image, x - GRID / 2, y - GRID / 2, GRID, GRID);
        }
      }
    };
  }, container);

  return myP;
}
