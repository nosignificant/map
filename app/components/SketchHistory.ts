import p5 from "p5";
import { IMAGE_HISTORY_MAX } from "./Util/constant";

const CELL = 40;

export const historyImages: p5.Image[] = [];

export function SketchHistory(container: HTMLElement) {
  const myP = new p5((p: p5) => {
    p.setup = () => {
      p.createCanvas(CELL, CELL * IMAGE_HISTORY_MAX);
      p.pixelDensity(1);
    };

    p.draw = () => {
      p.background(0);
      for (let i = 0; i < historyImages.length; i++) {
        p.image(historyImages[i], 0, i * CELL, CELL, CELL);
      }
    };
  }, container);

  return myP;
}
