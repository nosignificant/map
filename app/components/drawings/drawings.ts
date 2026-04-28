import type p5 from "p5";
import { GRID } from "../Util/constant";
import { dilate } from "../Util/edgeAndCorner";

//occupied 된거 +1 해서 그리기
export function drawOffsetOccupied(p: p5, src: boolean[][]) {
  const dil = dilate(src);

  p.stroke(255, 0, 0);
  p.strokeWeight(1);
  p.noFill();

  for (let r = 0; r < dil.length; r++) {
    for (let c = 0; c < dil[r].length; c++) {
      if (!dil[r][c]) continue; // dil 셀만

      const x = c * GRID;
      const y = r * GRID;

      // dil 바깥 면에 선
      if (!dil[r - 1]?.[c]) p.line(x, y, x + GRID, y);
      if (!dil[r + 1]?.[c]) p.line(x, y + GRID, x + GRID, y + GRID);
      if (!dil[r]?.[c - 1]) p.line(x, y, x, y + GRID);
      if (!dil[r]?.[c + 1]) p.line(x + GRID, y, x + GRID, y + GRID);
    }
  }
}

// draw small things
export function drawTwoCircle(p: p5, x: number, y: number, r: number) {
  p.noFill();
  p.stroke(255, 220, 0);
  p.strokeWeight(1);
  p.circle(x, y, r);
  p.circle(x, y, r / 2);
}

export function drawCircleCross(p: p5, x: number, y: number, r: number) {
  p.noFill();
  p.strokeWeight(1);
  p.circle(x, y, r);

  const startX = x - GRID / 4;
  const startY = y - GRID / 4;
  p.line(startX, y, startX + GRID / 2, y);
  p.line(x, startY, x, startY + GRID / 2);
}
