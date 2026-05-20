import p5 from "p5";
import { CheckerGrid, VSensor } from "./Util/types";
import { GRID, CANVAS } from "./Util/constant";
import { fullGrid } from "./drawings/checkerboard";
import { updateDistStep } from "./sensors/vSensor";
import { initVSensorStore } from "./Util/vSensorStore";
import { computePos4Shader } from "./Util/shaderUtil";
import { recordImage } from "./Util/imageHistoryStore";

const UNIT_SIZE = CANVAS / 3;

export function SketchUnit(container: HTMLElement) {
  let fg: CheckerGrid[];
  let vSensor: VSensor[];
  const units: p5.Image[] = [];
  const unitUrls: string[] = [];

  const myP = new p5((p: p5) => {
    p.setup = async () => {
      p.createCanvas(UNIT_SIZE, UNIT_SIZE, p.WEBGL);
      p.pixelDensity(1);

      fg = fullGrid();
      vSensor = initVSensorStore(fg);

      fetch("/api/img")
        .then((res) => res.json())
        .then((urls: string[]) => {
          urls.forEach((url) => {
            p.loadImage(url, (loadedImg) => {
              units.push(loadedImg);
              unitUrls.push(url);
            });
          });
        });
    };

    p.draw = () => {
      if (!vSensor) return;
      p.background(0);
      p.resetShader();

      p.noFill();
      p.stroke(255);
      p.strokeWeight(2);
      p.rect(-UNIT_SIZE / 2, -UNIT_SIZE / 2, UNIT_SIZE, UNIT_SIZE);

      p.scale(1 / 3);

      const nearImgs = updateDistStep(vSensor, units);
      const seenUrls = new Set<string>();
      for (const n of nearImgs) {
        const idx = units.indexOf(n.image);
        const url = unitUrls[idx];
        if (idx >= 0 && url && !seenUrls.has(url)) {
          seenUrls.add(url);
          recordImage(url);
        }
        for (const pos of n.pos) {
          const [x, y] = computePos4Shader(pos);
          p.image(n.image, x - GRID / 2, y - GRID / 2, GRID, GRID);
        }
      }
    };
  }, container);

  return myP;
}
