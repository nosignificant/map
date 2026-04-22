import type p5 from "p5";
import { ImgSet } from "../Util/types";
import { GRID } from "../Util/constant";
import { dilate } from "../Util/edgeAndCorner";

//이미지 외곽 그리기
export function drawOutline(p: p5, set: ImgSet[], occupied: boolean[][]) {
  p.fill(0);
  p.noStroke();

  for (const img of set) {
    const offsetMap = img.edgeResult.outline;

    for (const pl of img.PlacedImage) {
      for (let ri = 0; ri < offsetMap.length; ri++) {
        for (let ci = 0; ci < offsetMap[0].length; ci++) {
          if (!offsetMap[ri][ci]) continue; // 테두리 셀만

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
