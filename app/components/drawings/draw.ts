import type p5 from "p5";
import { ImgSet } from "../Util/types";
import { GRID, CANVAS, rows, cols } from "../Util/constant";
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
export function drawCross(p: p5, x: number, y: number, len: number = GRID / 2) {
  const h = len / 2;
  p.line(x - h, y, x + h, y);
  p.line(x, y - h, x, y + h);
}

// × 표 (45도 돌린 십자) — connection 전용
export function drawX(p: p5, x: number, y: number) {
  const h = GRID / 4;
  p.line(x - h, y - h, x + h, y + h); // ↘
  p.line(x - h, y + h, x + h, y - h); // ↗
}
