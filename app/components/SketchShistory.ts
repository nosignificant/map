import p5 from "p5";
import { IMAGE_HISTORY_MAX, GRID } from "./Util/constant";
import { vSensorUnits } from "./Util/imageStore";

export const historyImages: p5.Image[] = [];

export function updateHistoryArr(stage: number) {
  if (vSensorUnits.length === 0) return;
  const img = vSensorUnits[(stage - 1) % vSensorUnits.length];
  if (!img) return;
  historyImages.unshift(img);
  if (historyImages.length > IMAGE_HISTORY_MAX) {
    historyImages.pop();
  }
}

export function SketchHistory(container: HTMLElement) {
  const myP = new p5((p: p5) => {
    p.setup = () => {
      p.createCanvas(GRID, GRID * IMAGE_HISTORY_MAX);
      p.pixelDensity(1);
    };

    p.draw = () => {
      p.clear();
      for (let i = 0; i < historyImages.length; i++) {
        p.image(historyImages[i], 0, i * GRID, GRID, GRID);
      }
    };
  }, container);

  return myP;
}
