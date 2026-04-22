import type p5 from "p5";
import { GRID, CANVAS, rows, cols } from "../Util/constant";

export function backGroundSetup(p: p5) {
  p.fill(255, 255, 255);
  p.stroke(0);
  p.strokeWeight(2);
  p.rect(0, 0, CANVAS, CANVAS);
}

export function backGrid(p: p5) {
  const split = 5;

  const spacingH = CANVAS / split;
  const spacingW = CANVAS / split;
  for (let i = 0; i < split; i++) {
    const x = spacingW * i + spacingW;
    const y = spacingH * i + spacingH;

    p.strokeWeight(1);
    p.stroke(0);

    p.line(x, 0, x, CANVAS);
    p.line(0, y, CANVAS, y);
  }
}

export function backMiniGrid(p: p5) {
  for (let ri = 0; ri < rows; ri++) {
    for (let ci = 0; ci < cols; ci++) {
      const x = ci * GRID;
      const y = ri * GRID;

      p.strokeWeight(0);
      p.fill(100, 100, 100);
      p.circle(x, y, 2);
    }
  }
}
