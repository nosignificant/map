import type p5 from "p5";
import { Pos } from "../Util/types";
import { ImgSet } from "../Util/edgeAndCorner";
import { GRID, CANVAS, rows, cols } from "../Util/constant";
import { dilate } from "../Util/edgeAndCorner";

//이미지 외곽 그리기
export function drawOutline(p: p5, set: ImgSet[], occupied: boolean[][]) {
  p.fill(0);
  p.noStroke();

  for (const img of set) {
    const outline = img.edgeResult.outline; // [ci, ri][]

    for (const pl of img.PlacedImage) {
      for (const [ci, ri] of outline) {
        const cellX = pl.pos.x + (ci - 1) * GRID;
        const cellY = pl.pos.y + (ri - 1) * GRID;

        const outRow = Math.floor(cellY / GRID);
        const outCol = Math.floor(cellX / GRID);
        if (occupied[outRow]?.[outCol]) continue;
        //drawCircleCross(p, cellX, cellY);
      }
    }
  }
}

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
export function drawTwoCircle(p: p5, pos: Pos, r: number) {
  p.noFill();
  p.stroke(255, 220, 0);
  p.strokeWeight(1);
  p.circle(pos.x, pos.y, r);
  p.circle(pos.x, pos.y, r / 2);
}

export function drawCross(p: p5, x: number, y: number) {
  const startX = x - GRID / 4;
  const startY = y - GRID / 4;
  p.line(startX, y, startX + GRID / 2, y);
  p.line(x, startY, x, startY + GRID / 2);
}
